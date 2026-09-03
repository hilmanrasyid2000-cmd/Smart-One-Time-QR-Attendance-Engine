import React, { useState, useEffect } from 'react';
import { 
  User, 
  IdCard, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone,
  Lock,
  Zap
} from 'lucide-react';
import QRScanner from './QRScanner';
import AttendanceBadge from './AttendanceBadge';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { sounds } from '../utils/sound';

export default function UserPortal({ session, initialToken }) {
  const [step, setStep] = useState(1); // 1: Input Nama, 2: Scan QR, 3: Success Badge
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [deviceMeta, setDeviceMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [activeToken, setActiveToken] = useState(initialToken || '');

  // Extract token from URL if present
  useEffect(() => {
    if (initialToken) {
      setActiveToken(initialToken);
    } else {
      const params = new URLSearchParams(window.location.search);
      const tok = params.get('token');
      if (tok) {
        setActiveToken(tok);
      }
    }
  }, [initialToken]);

  // Initialize device fingerprint on mount
  useEffect(() => {
    const meta = getDeviceFingerprint();
    setDeviceMeta(meta);

    // Check if user previously saved their name on this device
    const savedName = localStorage.getItem('jamal_user_name');
    const savedId = localStorage.getItem('jamal_user_id');
    if (savedName) setName(savedName);
    if (savedId) setIdentifier(savedId);
  }, []);

  // Check-In API call
  const executeCheckIn = async (tokenToUse, nameToUse, idToUse, method = 'URL_SCAN') => {
    setIsLoading(true);
    setErrorMessage('');

    const fp = deviceMeta?.fingerprint || 'FP-UNKNOWN';
    const devInfo = deviceMeta?.deviceInfo || 'Mobile Web';

    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          name: nameToUse.trim(),
          identifier: idToUse.trim(),
          deviceFingerprint: fp,
          deviceInfo: devInfo,
          scanMethod: method,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        sounds.playError();
        setErrorMessage(data.message || 'Gagal memverifikasi absensi.');
        setIsLoading(false);
        return;
      }

      // Success!
      sounds.playSuccess();
      setAttendanceResult(data.record);
      setStep(3);
    } catch (err) {
      sounds.playError();
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server. Pastikan HP terhubung ke WiFi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Form Submit
  const handleProceedOrCheckIn = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Silakan masukkan nama lengkap Anda.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    // Save name in localStorage
    localStorage.setItem('jamal_user_name', name.trim());
    localStorage.setItem('jamal_user_id', identifier.trim());

    try {
      // Log visitor entry
      await fetch('/api/visitor/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          identifier: identifier.trim(),
          deviceFingerprint: deviceMeta?.fingerprint || 'FP-UNKNOWN',
          deviceInfo: deviceMeta?.deviceInfo || 'Mobile Web',
        }),
      });
    } catch (err) {
      console.warn('Visitor entry log notice:', err);
    }

    // IF token was already provided via URL scan from phone camera -> Check in immediately!
    if (activeToken) {
      await executeCheckIn(activeToken, name, identifier, 'URL_QR_SCAN');
    } else {
      // Otherwise move to in-app camera scanner
      setIsLoading(false);
      setStep(2);
    }
  };

  // Step 2: Handle QR scan from in-app camera scanner
  const handleInAppScan = async (scannedText, method) => {
    let cleanToken = scannedText;
    if (scannedText.includes('token=')) {
      try {
        const url = new URL(scannedText.startsWith('http') ? scannedText : `http://dummy.com/${scannedText}`);
        const t = url.searchParams.get('token');
        if (t) cleanToken = t;
      } catch (e) {
        const m = scannedText.match(/token=([A-Za-z0-9_-]+)/);
        if (m) cleanToken = m[1];
      }
    }
    setActiveToken(cleanToken);
    await executeCheckIn(cleanToken, name, identifier, method || 'CAMERA_QR');
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 px-4">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-xs mx-auto mb-6">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            step >= 1 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-800 text-slate-500'
          }`}>
            1
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Input Nama</span>
        </div>

        <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            step >= 2 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-800 text-slate-500'
          }`}>
            2
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Scan QR</span>
        </div>

        <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
            step >= 3 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-800 text-slate-500'
          }`}>
            3
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Selesai ✓</span>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-rose-300 mb-0.5">Peringatan Presensi:</h5>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Input Nama & Identitas */}
      {step === 1 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          
          {/* Detected Scanned Token Banner */}
          {activeToken && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-xs">QR Code Berhasil Terdeteksi!</div>
                <div className="text-[11px] text-emerald-400 font-mono truncate">Token: {activeToken}</div>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center mb-3">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Presensi Peserta
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeToken 
                ? 'Ketik nama Anda di bawah ini dan tekan tombol "Selesaikan Absensi".'
                : 'Silakan input nama Anda untuk memulai presensi.'}
            </p>
          </div>

          <form onSubmit={handleProceedOrCheckIn} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nama Lengkap *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-teal-400" />
                <span>NIM / NIK / ID Peserta (Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 202401002"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>

            {/* Device Info Badge */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span>Device: <strong className="text-slate-300">{deviceMeta?.deviceInfo || 'Detecting...'}</strong></span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {deviceMeta?.fingerprint || 'FP-...' }
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : activeToken ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan Absensi Sekarang</span>
                </>
              ) : (
                <>
                  <span>Lanjut ke Scan QR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Live In-App Camera QR Scanner */}
      {step === 2 && (
        <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white truncate max-w-[160px]">{name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{deviceMeta?.fingerprint}</p>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700"
            >
              Ganti Nama
            </button>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>Scan Kode QR Proyektor</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Arahkan kamera ke One-Time QR dinamis yang ditampilkan di layar pengawas.
            </p>
          </div>

          {/* QR Scanner Component */}
          <QRScanner
            isScanningActive={step === 2 && !isLoading}
            onScanSuccess={handleInAppScan}
            onError={(msg) => setErrorMessage(msg)}
          />

          {isLoading && (
            <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memvalidasi token &amp; sidik jari perangkat...</span>
            </div>
          )}

          {/* Security Disclaimer */}
          <div className="mt-5 w-full max-w-sm p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Aturan 1 Device:</strong> Sistem mengunci sidik jari browser (Canvas/Hardware) Anda. Percobaan absen ganda dengan perangkat yang sama akan ditolak secara otomatis.
            </p>
          </div>

        </div>
      )}

      {/* STEP 3: Verified Digital Attendance Pass */}
      {step === 3 && attendanceResult && (
        <AttendanceBadge
          record={attendanceResult}
          session={session}
          onReset={() => {
            setActiveToken('');
            setStep(1);
          }}
        />
      )}

    </div>
  );
}
