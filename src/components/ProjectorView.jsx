import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Minimize2, 
  Clock, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Wifi,
  KeyRound,
  Smartphone
} from 'lucide-react';

export default function ProjectorView({ 
  session, 
  qrData, 
  attendance, 
  roster, 
  networkInfo, 
  onClose 
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [remaining, setRemaining] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = qrData?.token || 'JAMAL-INIT';
  const intervalSeconds = qrData?.intervalSeconds || 10;
  const expiresAt = qrData?.expiresAt || Date.now() + 10000;

  const totalRoster = roster.length;
  const presentCount = attendance.length;
  const percentage = totalRoster > 0 ? Math.round((presentCount / totalRoster) * 100) : 100;

  const primaryIp = networkInfo?.primaryIp || window.location.hostname;
  const clientPort = window.location.port ? `:${window.location.port}` : '';
  const mobileUrl = `${window.location.protocol}//${primaryIp}${clientPort}`;
  const directAttendanceUrl = `${mobileUrl}/?token=${token}`;

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    const calcRemaining = () => {
      const diff = Math.max(0, expiresAt - Date.now());
      setRemaining(Math.min(intervalSeconds, Math.ceil(diff / 1000)));
    };
    calcRemaining();
    const interval = setInterval(calcRemaining, 200);
    return () => clearInterval(interval);
  }, [expiresAt, intervalSeconds]);

  // QR Code render with direct URL
  useEffect(() => {
    if (!token) return;
    QRCode.toDataURL(directAttendanceUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [directAttendanceUrl, token]);

  const progressPercent = Math.max(0, Math.min(100, (remaining / intervalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar: Session Info, Live Clock & Close Button */}
      <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            MODE LAYAR PROYEKTOR / KIOSK
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {session?.name || 'Sesi Presensi Smart QR'}
          </h1>
          <p className="text-xs text-slate-400">
            {session?.room || 'Ruang Kelas'} • Pengawas: {session?.instructor || 'Admin'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Live Clock */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 text-sm font-mono">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-base">
              {currentTime.toLocaleTimeString('id-ID')}
            </span>
          </div>

          {/* Exit Fullscreen */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Kembali ke Admin</span>
          </button>
        </div>
      </div>

      {/* Center Layout: Giant Dynamic QR + Stats & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-auto z-10">
        
        {/* Left: Giant Dynamic QR */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          
          <div className="relative group p-4 bg-white rounded-3xl shadow-2xl shadow-emerald-950/60 flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic QR Code"
                className="w-72 h-72 sm:w-96 sm:h-96 object-contain rounded-2xl"
              />
            ) : (
              <div className="w-72 h-72 sm:w-96 sm:h-96 bg-slate-100 flex items-center justify-center rounded-2xl">
                <span className="text-slate-500 font-medium">Memuat QR...</span>
              </div>
            )}

            {/* Shield Logo Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 p-3 rounded-2xl shadow-xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-base">
                  J
                </div>
              </div>
            </div>
          </div>

          {/* Token Code & Expiration Progress */}
          <div className="w-full max-w-sm mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Token: <strong className="font-mono text-white text-sm">{token}</strong></span>
              </span>
              <span className="font-mono text-emerald-400 font-bold text-sm shrink-0">{remaining}s</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  remaining <= 3 ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* Right: Live Counter, Instructions & Recent Attendees Ticker */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Instruction Card with URL */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>Cara Absensi dari Smartphone Anda:</span>
            </h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Arahkan kamera HP Anda ke kode QR dinamis di samping.</li>
              <li>Tap tautan website yang muncul di layar HP.</li>
              <li>Input Nama Lengkap Anda &amp; absensi otomatis <strong>tercentang hijau</strong>!</li>
            </ol>
          </div>

          {/* Big Attendance Counter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center">
              <p className="text-xs text-emerald-300 font-medium">Peserta Hadir (✓)</p>
              <h3 className="text-4xl font-black text-emerald-400 mt-1">
                {presentCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">dari {totalRoster} terdaftar</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Persentase Kehadiran</p>
              <h3 className="text-4xl font-black text-teal-400 mt-1">
                {percentage}%
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalRoster - presentCount} Belum Scan</p>
            </div>
          </div>

          {/* Recent Attendees Live Ticker */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Presensi Masuk Terkini:</span>
            </h4>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {attendance.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  Menunggu peserta melakukan scan QR pertama...
                </p>
              ) : (
                attendance.slice(0, 5).map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="font-semibold text-white">{att.name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {new Date(att.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Footer Anti-Fraud Policy */}
      <div className="z-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2 border-t border-slate-900 pt-3">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Sistem Dilengkapi Proteksi Anti-Joki (Device Fingerprinting - 1 Perangkat 1 Kali Absen)</span>
      </div>

    </div>
  );
}
