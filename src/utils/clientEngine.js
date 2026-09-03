/**
 * Standalone Client-Side Engine for GitHub Pages & Offline Deployment
 * Emulates the dynamic rolling QR tokens, live checklist, visitor tracking,
 * and 1-device-1-scan fingerprinting using BroadcastChannel + localStorage.
 */

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

class ClientEngine {
  constructor() {
    this.channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('jamal_attendance_channel')
      : null;

    this.intervalSeconds = 10;
    this.validTokens = new Map();
    this.listeners = new Map();
    this.initTokenLoop();

    if (this.channel) {
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        this.trigger(type, payload);
      };
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  trigger(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(payload));
    }
  }

  broadcast(type, payload) {
    this.trigger(type, payload);
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  initTokenLoop() {
    this.rotate();
    setInterval(() => {
      this.rotate();
    }, this.intervalSeconds * 1000);
  }

  generateToken() {
    const chars = '0123456789ABCDEF';
    let hash = '';
    for (let i = 0; i < 12; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `JAMAL-${hash}`;
  }

  rotate() {
    const token = this.generateToken();
    const now = Date.now();
    const expiresAt = now + this.intervalSeconds * 1000;
    this.currentToken = token;
    this.expiresAt = expiresAt;

    this.validTokens.set(token, { createdAt: now, expiresAt });

    const qrPayload = {
      token,
      intervalSeconds: this.intervalSeconds,
      expiresAt,
      timestamp: now,
    };

    this.broadcast('qr_rotated', qrPayload);
  }

  getCurrentQR() {
    const remaining = Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1000));
    return {
      token: this.currentToken || this.generateToken(),
      intervalSeconds: this.intervalSeconds,
      expiresAt: this.expiresAt || Date.now() + 10000,
      remainingSeconds: remaining,
      timestamp: Date.now(),
    };
  }

  getSession() {
    const raw = localStorage.getItem('jamal_session');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    const defaultSession = {
      id: 'SES-001',
      name: 'Kuliah Umum & Presensi Praktikum (Sesi Utama)',
      room: 'Lab Komputer 3 / Hybrid Online',
      instructor: 'Ir. Jamaluddin, M.Kom',
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
      qrIntervalSeconds: 10,
    };
    localStorage.setItem('jamal_session', JSON.stringify(defaultSession));
    return defaultSession;
  }

  resetSession(form) {
    const newSession = {
      id: 'SES-' + Date.now().toString().slice(-6),
      name: form.name || 'Sesi Presensi Baru',
      room: form.room || 'Ruang Utama',
      instructor: form.instructor || 'Admin Sistem',
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
      qrIntervalSeconds: 10,
    };
    localStorage.setItem('jamal_session', JSON.stringify(newSession));
    localStorage.setItem('jamal_attendance', JSON.stringify([]));
    localStorage.setItem('jamal_visitors', JSON.stringify([]));
    localStorage.setItem('jamal_device_fps', JSON.stringify({}));
    this.rotate();
    this.broadcast('session_updated', { session: newSession });
    return newSession;
  }

  getRoster() {
    const raw = localStorage.getItem('jamal_roster');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    localStorage.setItem('jamal_roster', JSON.stringify(DEFAULT_ROSTER));
    return DEFAULT_ROSTER;
  }

  addRoster(member) {
    const roster = this.getRoster();
    const newMember = {
      id: 'R-' + String(roster.length + 1).padStart(3, '0'),
      name: member.name.trim(),
      identifier: member.identifier ? member.identifier.trim() : '-',
      role: member.role || 'Peserta',
      division: member.division || 'Umum',
    };
    roster.push(newMember);
    localStorage.setItem('jamal_roster', JSON.stringify(roster));
    this.broadcast('roster_updated');
    return newMember;
  }

  deleteRoster(id) {
    let roster = this.getRoster();
    roster = roster.filter(r => r.id !== id);
    localStorage.setItem('jamal_roster', JSON.stringify(roster));
    this.broadcast('roster_updated');
  }

  getAttendance() {
    const raw = localStorage.getItem('jamal_attendance');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [];
  }

  getVisitors() {
    const raw = localStorage.getItem('jamal_visitors');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [];
  }

  logVisitor({ name, identifier, deviceFingerprint, deviceInfo }) {
    const visitors = this.getVisitors();
    const visitor = {
      id: 'VIS-' + Date.now().toString().slice(-6),
      name: name ? name.trim() : 'Tamu Web',
      identifier: identifier ? identifier.trim() : '-',
      deviceFingerprint: deviceFingerprint || 'UNKNOWN-FP',
      deviceInfo: deviceInfo || 'Web Browser',
      ip: '127.0.0.1 (Web)',
      timestamp: new Date().toISOString(),
    };
    visitors.unshift(visitor);
    if (visitors.length > 200) visitors.pop();
    localStorage.setItem('jamal_visitors', JSON.stringify(visitors));
    this.broadcast('visitor_new', visitor);
    return visitor;
  }

  checkIn({ token, name, identifier, deviceFingerprint, deviceInfo, scanMethod }) {
    const trimmedName = (name || '').trim();
    const cleanId = (identifier || '').trim();
    const fp = deviceFingerprint || 'NO-FP';

    // 1. Check Device Fingerprinting (1 Device 1 Scan)
    let deviceFps = {};
    try {
      deviceFps = JSON.parse(localStorage.getItem('jamal_device_fps') || '{}');
    } catch (e) {}

    const attendance = this.getAttendance();

    if (fp !== 'NO-FP' && deviceFps[fp]) {
      const existingId = deviceFps[fp];
      const existing = attendance.find(a => a.id === existingId);
      if (existing) {
        if (existing.name.toLowerCase() === trimmedName.toLowerCase()) {
          return {
            success: false,
            error: 'ALREADY_CHECKED_IN',
            message: `Anda (${existing.name}) sudah berhasil melakukan absensi sebelumnya!`,
            record: existing,
          };
        } else {
          return {
            success: false,
            error: 'DEVICE_ALREADY_USED',
            message: `🚫 DETEKSI KECURANGAN: Perangkat ini sudah digunakan sebelumnya untuk absen atas nama "${existing.name}". 1 Perangkat fisik hanya dapat melakukan absensi 1 kali!`,
            existingName: existing.name,
          };
        }
      }
    }

    // 2. Check Name duplicate
    const already = attendance.find(a => a.name.toLowerCase() === trimmedName.toLowerCase());
    if (already) {
      return {
        success: false,
        error: 'NAME_ALREADY_RECORDED',
        message: `Peserta atas nama "${already.name}" sudah tercatat hadir.`,
        record: already,
      };
    }

    // 3. Create Record
    const session = this.getSession();
    const record = {
      id: 'ATT-' + Date.now().toString().slice(-6),
      sessionId: session.id,
      name: trimmedName,
      identifier: cleanId || '-',
      timestamp: new Date().toISOString(),
      deviceFingerprint: fp,
      deviceInfo: deviceInfo || 'Web Browser',
      ip: '127.0.0.1 (Web)',
      scanMethod: scanMethod || 'CAMERA_QR',
      status: 'VERIFIED',
      verificationCode: 'VERIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    attendance.unshift(record);
    localStorage.setItem('jamal_attendance', JSON.stringify(attendance));

    if (fp !== 'NO-FP') {
      deviceFps[fp] = record.id;
      localStorage.setItem('jamal_device_fps', JSON.stringify(deviceFps));
    }

    this.broadcast('attendance_new', { record });

    return {
      success: true,
      message: '✅ Absensi Berhasil Terverifikasi!',
      record,
    };
  }
}

export const clientEngine = new ClientEngine();
