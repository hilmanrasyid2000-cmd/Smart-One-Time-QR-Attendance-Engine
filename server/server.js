import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import crypto from 'crypto';
import { db } from './db.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const QR_ROTATION_INTERVAL = 10; // seconds

// --- Dynamic Rolling Token Manager ---
class TokenEngine {
  constructor(intervalSeconds = 10) {
    this.intervalSeconds = intervalSeconds;
    this.validTokens = new Map(); // token -> { createdAt, expiresAt }
    this.currentToken = null;
    this.expiresAt = Date.now() + intervalSeconds * 1000;
    this.rotate();

    // Loop to rotate tokens
    setInterval(() => {
      this.rotate();
    }, intervalSeconds * 1000);

    // Housekeeping expired tokens (grace period 25s)
    setInterval(() => {
      const now = Date.now();
      for (const [tok, data] of this.validTokens.entries()) {
        if (now > data.expiresAt + 20000) {
          this.validTokens.delete(tok);
        }
      }
    }, 5000);
  }

  generateToken() {
    const session = db.getSession();
    const secret = 'JAMAL-QR-SECURE-' + session.id;
    const randomSalt = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    const raw = `${session.id}|${timestamp}|${randomSalt}`;
    const hash = crypto.createHmac('sha256', secret).update(raw).digest('hex').substring(0, 12).toUpperCase();
    return `JAMAL-${hash}`;
  }

  rotate() {
    const session = db.getSession();
    if (session.status !== 'ACTIVE') return;

    const token = this.generateToken();
    const now = Date.now();
    const expiresAt = now + this.intervalSeconds * 1000;

    this.currentToken = token;
    this.expiresAt = expiresAt;

    this.validTokens.set(token, {
      createdAt: now,
      expiresAt: expiresAt,
    });

    // Broadcast to connected Admin screens
    io.emit('qr_rotated', {
      token: this.currentToken,
      intervalSeconds: this.intervalSeconds,
      expiresAt: this.expiresAt,
      timestamp: now,
    });
  }

  getCurrentTokenData() {
    const remaining = Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1000));
    return {
      token: this.currentToken,
      intervalSeconds: this.intervalSeconds,
      expiresAt: this.expiresAt,
      remainingSeconds: remaining,
      timestamp: Date.now(),
    };
  }

  isValid(token) {
    if (!token) return false;
    let cleanToken = String(token).trim();
    // Extract token if a full URL was scanned
    if (cleanToken.includes('token=')) {
      try {
        const url = new URL(cleanToken.startsWith('http') ? cleanToken : `http://localhost/${cleanToken}`);
        const extracted = url.searchParams.get('token');
        if (extracted) cleanToken = extracted.trim();
      } catch (e) {
        const match = cleanToken.match(/token=([A-Za-z0-9_-]+)/);
        if (match) cleanToken = match[1];
      }
    }
    if (!this.validTokens.has(cleanToken)) {
      return false;
    }
    const data = this.validTokens.get(cleanToken);
    // Allow up to 15s grace period for slow camera scans
    const now = Date.now();
    return now <= data.expiresAt + 15000;
  }
}

const tokenEngine = new TokenEngine(QR_ROTATION_INTERVAL);

// Helper: Get Local Network IP
function getLocalNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ interface: name, address: iface.address });
      }
    }
  }
  return addresses;
}

// --- REST API Endpoints ---

// Get Server & Network Info
app.get('/api/network-info', (req, res) => {
  const ips = getLocalNetworkIPs();
  res.json({
    port: PORT,
    clientPort: 5173,
    localIps: ips,
    primaryIp: ips.length > 0 ? ips[0].address : 'localhost',
  });
});

// Get Active Session
app.get('/api/session', (req, res) => {
  const session = db.getSession();
  const attendance = db.getAttendance();
  const roster = db.getRoster();
  const visitors = db.getVisitors();

  // Match roster with attendance to count status
  const attendedNames = new Set(attendance.map(a => a.name.toLowerCase()));
  const rosterCount = roster.length;
  const presentCount = attendance.length;
  const absentCount = Math.max(0, rosterCount - attendance.filter(a => roster.some(r => r.name.toLowerCase() === a.name.toLowerCase())).length);
  const percentage = rosterCount > 0 ? Math.round((presentCount / rosterCount) * 100) : 100;

  res.json({
    session,
    qr: tokenEngine.getCurrentTokenData(),
    stats: {
      totalRoster: rosterCount,
      presentCount,
      absentCount,
      visitorsCount: visitors.length,
      percentage,
    },
  });
});

// Reset or Create New Session
app.post('/api/session/reset', (req, res) => {
  const { name, room, instructor } = req.body;
  const newSession = db.resetSession(name, room, instructor);
  tokenEngine.rotate();
  io.emit('session_updated', {
    session: newSession,
    attendance: [],
    visitors: [],
  });
  res.json({ success: true, session: newSession });
});

// Get Current Rolling QR Code
app.get('/api/qr/current', (req, res) => {
  res.json(tokenEngine.getCurrentTokenData());
});

// Get Attendance List
app.get('/api/attendance', (req, res) => {
  res.json({
    attendance: db.getAttendance(),
    total: db.getAttendance().length,
  });
});

// Get Visitor Logs
app.get('/api/visitors', (req, res) => {
  res.json({
    visitors: db.getVisitors(),
    total: db.getVisitors().length,
  });
});

// Get Master Roster with Live Attendance Checkmarks
app.get('/api/roster', (req, res) => {
  const roster = db.getRoster();
  const attendance = db.getAttendance();

  // Enhance roster with attendance status
  const rosterWithStatus = roster.map(person => {
    const record = attendance.find(
      a => a.name.toLowerCase() === person.name.toLowerCase() ||
           (person.identifier !== '-' && a.identifier === person.identifier)
    );
    return {
      ...person,
      attended: !!record,
      attendanceRecord: record || null,
    };
  });

  // Also include unregistered guests/attendees
  const guestAttendees = attendance.filter(
    att => !roster.some(r => r.name.toLowerCase() === att.name.toLowerCase())
  );

  res.json({
    roster: rosterWithStatus,
    guests: guestAttendees,
    totalRoster: roster.length,
    presentCount: attendance.length,
  });
});

// Add Member to Master Roster
app.post('/api/roster', (req, res) => {
  const { name, identifier, role, division } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nama peserta wajib diisi' });
  }
  const member = db.addRosterMember({ name, identifier, role, division });
  io.emit('roster_updated');
  res.json({ success: true, member });
});

// Delete Roster Member
app.delete('/api/roster/:id', (req, res) => {
  db.deleteRosterMember(req.params.id);
  io.emit('roster_updated');
  res.json({ success: true });
});

// Log Visitor Entry (When user inputs their name upon entering site)
app.post('/api/visitor/entry', (req, res) => {
  const { name, identifier, deviceFingerprint, deviceInfo } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  const visitor = db.logVisitor({
    name: name || 'Tamu Web',
    identifier: identifier || '-',
    deviceFingerprint,
    deviceInfo,
    ip: clientIp,
  });

  // Notify admin dashboard in real-time
  io.emit('visitor_new', visitor);

  res.json({ success: true, visitor });
});

// Submit Attendance Check-In (with QR Token and Device Fingerprint validation)
app.post('/api/attendance/check-in', (req, res) => {
  const { token, name, identifier, deviceFingerprint, deviceInfo, scanMethod } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'NAME_REQUIRED',
      message: 'Nama lengkap wajib diisi untuk melakukan absensi.',
    });
  }

  // 1. Validate QR Token
  if (!tokenEngine.isValid(token)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_OR_EXPIRED_TOKEN',
      message: '⚠️ Kode QR Tidak Valid atau Sudah Kadaluarsa! Silakan scan ulang QR yang tampil di layar proyektor.',
    });
  }

  // 2. Validate and Record Attendance in DB (Checks 1-device-1-scan fingerprint)
  const result = db.recordAttendance({
    name,
    identifier,
    deviceFingerprint,
    deviceInfo,
    ip: clientIp,
    scanMethod: scanMethod || 'CAMERA_QR',
  });

  if (!result.success) {
    // Return appropriate error (e.g. DEVICE_ALREADY_USED or ALREADY_CHECKED_IN)
    return res.status(400).json(result);
  }

  // 3. Broadcast Real-Time Verified Attendance to Admin Dashboard with Sound Signal
  io.emit('attendance_new', {
    record: result.record,
    stats: {
      presentCount: db.getAttendance().length,
      totalRoster: db.getRoster().length,
    },
  });

  res.json({
    success: true,
    message: '✅ Absensi Berhasil Terverifikasi!',
    record: result.record,
  });
});

// Export Attendance Data as CSV
app.get('/api/export/csv', (req, res) => {
  const attendance = db.getAttendance();
  const session = db.getSession();

  let csvContent = `SESI PRESENSI: ${session.name}\n`;
  csvContent += `LOKASI / RUANG: ${session.room}\n`;
  csvContent += `PENGAWAS: ${session.instructor}\n`;
  csvContent += `WAKTU MULAI: ${new Date(session.startedAt).toLocaleString('id-ID')}\n`;
  csvContent += `TOTAL HADIR: ${attendance.length}\n\n`;

  csvContent += `No,ID Presensi,Nama Lengkap,NIM / NIK / ID,Waktu Absen (WIB),Status,Metode Scan,Device Fingerprint,Kode Verifikasi\n`;

  attendance.forEach((att, idx) => {
    const timeStr = new Date(att.timestamp).toLocaleString('id-ID');
    csvContent += `${idx + 1},"${att.id}","${att.name}","${att.identifier}","${timeStr}","${att.status}","${att.scanMethod}","${att.deviceFingerprint}","${att.verificationCode}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=Presensi_${session.id}_${Date.now()}.csv`);
  res.send('\uFEFF' + csvContent); // UTF-8 BOM for Excel compatibility
});

// --- Socket.IO Handling ---
io.on('connection', (socket) => {
  // Send initial state on connection
  socket.emit('init_state', {
    session: db.getSession(),
    qr: tokenEngine.getCurrentTokenData(),
    attendance: db.getAttendance(),
    visitors: db.getVisitors(),
  });

  // Client requests fresh QR token
  socket.on('request_qr', () => {
    socket.emit('qr_rotated', tokenEngine.getCurrentTokenData());
  });

  socket.on('disconnect', () => {
    // Handle socket disconnect
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart One-Time QR Attendance Engine Server Running!`);
  console.log(`📡 Local URL:   http://localhost:${PORT}`);
  const ips = getLocalNetworkIPs();
  ips.forEach(ip => {
    console.log(`📱 Network URL: http://${ip.address}:${PORT}`);
  });
  console.log(`=======================================================`);
});
