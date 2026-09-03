# 🚀 Smart One-Time QR Attendance Engine (Jamal)

Aplikasi presensi modern berbasis **Dynamic Rolling QR Code** dan **Device Fingerprinting** untuk mencegah kecurangan (anti-titip absen / 1 device 1 scan), dilengkapi dashboard **Admin**, portal **User**, **Visitor Tracker**, dan **Checklist Kehadiran Real-Time**.

---

## 🌟 Fitur Utama

1. **Dashboard Admin**:
   - **Dynamic Rolling QR Code**: QR code berganti secara otomatis setiap 10 detik dengan progress bar dan countdown timer.
   - **Master Checklist Kehadiran**: Tabel daftar peserta lengkap dengan status **✅ Centang Hijau (Hadir)** seketika peserta berhasil absen.
   - **Pengecek Pengunjung Web (Visitor Tracker)**: Mencatat secara real-time siapa saja yang masuk ke website dan menginput nama mereka.
   - **Mode Layar Penuh / Proyektor**: Tampilan jernih resolusi tinggi untuk ditampilkan di proyektor kelas atau TV auditorium dengan live ticker absensi masuk.
   - **Export CSV / Excel**: Unduh rekapitulasi kehadiran dengan timestamp detik, device fingerprint, dan kode verifikasi.
   - **Audio Chime**: Bunyi notifikasi saat ada peserta yang berhasil melakukan absensi.

2. **Portal User (Peserta / Mahasiswa / Karyawan)**:
   - **Step 1: Input Nama & Identitas**: Form nama awal saat memasuki website.
   - **Step 2: Kamera QR Scanner**: Pemindai QR kamera bawaan yang cepat dengan viewfinder laser dan opsi ganti kamera.
   - **Step 3: Kartu Bukti Digital & Confetti**: Tanda terima absensi terverifikasi dengan kode unik dan status centang hijau.

3. **Proteksi Anti-Joki (Device Fingerprinting)**:
   - Sistem membaca sidik jari hardware & browser (Canvas hash, WebGL renderer, AudioContext signature, resolusi layar, dll).
   - **1 Device Hanya 1 Kali Absen**: Mencegah satu orang menggunakan 1 HP/laptop untuk mengabsenkan teman-temannya.

---

## 🛠️ Cara Menjalankan

### 1. Menjalankan Server & Client Secara Bersamaan
Buka terminal di folder project lalu jalankan:
```bash
npm run dev
```

Sistem akan menjalankan:
- **Backend API & Socket.IO**: `http://localhost:3000`
- **Frontend Dashboard**: `http://localhost:5173`

### 2. Membuka dari Smartphone / HP Peserta
1. Pastikan smartphone peserta dan laptop admin terhubung ke jaringan **WiFi yang sama**.
2. Buka browser smartphone lalu ketik alamat IP yang tertera di header navbar / modal WiFi (misal: `http://192.168.1.15:5173`).
3. Peserta input nama lalu scan QR code yang tampil di layar laptop / proyektor admin.

---

## 📁 Struktur Folder

```
├── package.json
├── vite.config.js
├── tailwind.config.js
├── server/
│   ├── server.js              # Server Express + Socket.IO + Dynamic QR Engine
│   ├── db.js                  # Database JSON + Fingerprint Manager
│   └── test_verify.js         # Skrip pengujian otomatis
└── src/
    ├── main.jsx               # Entry point React
    ├── App.jsx                # Layout & Socket Event Handler
    ├── components/
    │   ├── Navbar.jsx         # Header & WiFi network share modal
    │   ├── AdminDashboard.jsx # Dashboard admin dengan statistik & tabel
    │   ├── DynamicQRBox.jsx   # Rolling One-Time QR dengan timer ring
    │   ├── AttendanceTable.jsx# Checklist peserta dengan centang hijau (✓)
    │   ├── VisitorTracker.jsx # Pengecek pengunjung yang masuk ke web
    │   ├── QRScanner.jsx      # Scanner kamera QR bawaan
    │   ├── UserPortal.jsx     # Wizard input nama & absensi user
    │   ├── AttendanceBadge.jsx# Kartu bukti hadir digital + confetti
    │   └── ProjectorView.jsx  # Mode layar penuh untuk proyektor
    ├── utils/
    │   ├── fingerprint.js     # Engine sidik jari perangkat (1-Device-1-Scan)
    │   ├── sound.js           # Audio chime Web Audio API
    │   └── socket.js          # Koneksi Socket.IO
    └── index.css              # Styling Tailwind & animasi laser
```
