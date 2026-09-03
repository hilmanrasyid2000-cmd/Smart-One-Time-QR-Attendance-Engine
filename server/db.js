import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'attendance_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Mock Master Roster
const DEFAULT_ROSTER = [
  { id: 'R-001', name: 'Ahmad Faisal', identifier: '202401001', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-002', name: 'Budi Santoso', identifier: '202401002', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-003', name: 'Citra Dewi', identifier: '202401003', role: 'Mahasiswa', division: 'Sistem Informasi' },
  { id: 'R-004', name: 'Dian Permata', identifier: '202401004', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-005', name: 'Eko Prasetyo', identifier: '202401005', role: 'Mahasiswa', division: 'Teknik Komputer' },
  { id: 'R-006', name: 'Farah Salsabila', identifier: '202401006', role: 'Mahasiswa', division: 'Sistem Informasi' },
  { id: 'R-007', name: 'Gilang Ramadhan', identifier: '202401007', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-008', name: 'Hana Anindita', identifier: '202401008', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-009', name: 'Irfan Maulana', identifier: '202401009', role: 'Mahasiswa', division: 'Teknik Elektro' },
  { id: 'R-010', name: 'Jamaluddin Rasyid', identifier: '202401010', role: 'Mahasiswa', division: 'Informatika' },
  { id: 'R-011', name: 'Kurnia Putri', identifier: '202401011', role: 'Mahasiswa', division: 'Sistem Informasi' },
  { id: 'R-012', name: 'Lukman Hakim', identifier: '202401012', role: 'Mahasiswa', division: 'Informatika' },
];

const DEFAULT_STATE = {
  currentSession: {
    id: 'SES-' + Date.now().toString().slice(-6),
    name: 'Kuliah Umum & Presensi Praktikum (Sesi Utama)',
    room: 'Lab Komputer 3 / Hybrid Online',
    instructor: 'Ir. Jamaluddin, M.Kom',
    startedAt: new Date().toISOString(),
    status: 'ACTIVE',
    qrIntervalSeconds: 10,
    allowGuestRegistration: true, // Allow people not in master roster to register & attend
  },
  roster: DEFAULT_ROSTER,
  attendance: [],
  visitors: [],
  deviceFingerprints: {}, // Map fingerprint -> attendanceId to enforce 1-device-1-scan
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing default:', err);
    }
    const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save(state);
    return state;
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  getSession() {
    return this.data.currentSession;
  }

  resetSession(sessionName, room, instructor) {
    const newSession = {
      id: 'SES-' + Date.now().toString().slice(-6),
      name: sessionName || 'Sesi Presensi Baru',
      room: room || 'Ruang Utama',
      instructor: instructor || 'Admin Sistem',
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
      qrIntervalSeconds: 10,
      allowGuestRegistration: true,
    };
    this.data.currentSession = newSession;
    this.data.attendance = [];
    this.data.visitors = [];
    this.data.deviceFingerprints = {};
    this.save();
    return newSession;
  }

  getRoster() {
    return this.data.roster;
  }

  addRosterMember(member) {
    const newMember = {
      id: 'R-' + String(this.data.roster.length + 1).padStart(3, '0'),
      name: member.name.trim(),
      identifier: member.identifier ? member.identifier.trim() : '-',
      role: member.role || 'Peserta',
      division: member.division || 'Umum',
    };
    this.data.roster.push(newMember);
    this.save();
    return newMember;
  }

  deleteRosterMember(id) {
    this.data.roster = this.data.roster.filter(m => m.id !== id);
    this.save();
    return true;
  }

  getAttendance() {
    return this.data.attendance;
  }

  getVisitors() {
    return this.data.visitors;
  }

  logVisitor({ name, identifier, deviceFingerprint, deviceInfo, ip }) {
    const visitor = {
      id: 'VIS-' + Date.now().toString().slice(-6),
      sessionId: this.data.currentSession.id,
      name: name ? name.trim() : 'Anonim',
      identifier: identifier ? identifier.trim() : '-',
      deviceFingerprint: deviceFingerprint || 'UNKNOWN-FP',
      deviceInfo: deviceInfo || 'Web Browser',
      ip: ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    // Keep max 200 visitors in memory
    this.data.visitors.unshift(visitor);
    if (this.data.visitors.length > 200) {
      this.data.visitors.pop();
    }
    this.save();
    return visitor;
  }

  recordAttendance({ name, identifier, deviceFingerprint, deviceInfo, ip, scanMethod }) {
    const trimmedName = (name || '').trim();
    const cleanIdentifier = (identifier || '').trim();
    const fp = deviceFingerprint || 'NO-FINGERPRINT';

    // 1. Check if device fingerprint was already used in current session
    if (fp !== 'NO-FINGERPRINT' && this.data.deviceFingerprints[fp]) {
      const existingAttendanceId = this.data.deviceFingerprints[fp];
      const existingRecord = this.data.attendance.find(a => a.id === existingAttendanceId);
      
      if (existingRecord) {
        if (existingRecord.name.toLowerCase() === trimmedName.toLowerCase()) {
          return {
            success: false,
            error: 'ALREADY_CHECKED_IN',
            message: `Anda (${existingRecord.name}) sudah berhasil melakukan absensi pada ${new Date(existingRecord.timestamp).toLocaleTimeString('id-ID')}.`,
            record: existingRecord,
          };
        } else {
          return {
            success: false,
            error: 'DEVICE_ALREADY_USED',
            message: `🚫 DETEKSI KECURANGAN: Perangkat HP/Browser ini sudah digunakan sebelumnya untuk absen atas nama "${existingRecord.name}". 1 Perangkat fisik hanya dapat melakukan absensi 1 kali!`,
            existingName: existingRecord.name,
          };
        }
      }
    }

    // 2. Check if participant name/identifier already attended
    const alreadyAttended = this.data.attendance.find(
      a => a.name.toLowerCase() === trimmedName.toLowerCase() || 
           (cleanIdentifier && cleanIdentifier !== '-' && a.identifier === cleanIdentifier)
    );

    if (alreadyAttended) {
      return {
        success: false,
        error: 'NAME_ALREADY_RECORDED',
        message: `Peserta atas nama "${alreadyAttended.name}" sudah tercatat hadir pada ${new Date(alreadyAttended.timestamp).toLocaleTimeString('id-ID')}.`,
        record: alreadyAttended,
      };
    }

    // 3. Create Attendance Record
    const record = {
      id: 'ATT-' + Date.now().toString().slice(-6),
      sessionId: this.data.currentSession.id,
      name: trimmedName,
      identifier: cleanIdentifier || '-',
      timestamp: new Date().toISOString(),
      deviceFingerprint: fp,
      deviceInfo: deviceInfo || 'Mobile/Browser',
      ip: ip || '127.0.0.1',
      scanMethod: scanMethod || 'CAMERA_QR',
      status: 'VERIFIED',
      verificationCode: 'VERIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    this.data.attendance.unshift(record);
    if (fp !== 'NO-FINGERPRINT') {
      this.data.deviceFingerprints[fp] = record.id;
    }
    this.save();

    return {
      success: true,
      record,
    };
  }
}

export const db = new Database();
