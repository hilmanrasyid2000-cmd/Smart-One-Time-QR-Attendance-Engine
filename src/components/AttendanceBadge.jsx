import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Smartphone, 
  Award, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function AttendanceBadge({ record, session, onReset }) {
  // Fire celebratory confetti upon mounting
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#14b8a6', '#f59e0b', '#3b82f6'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Attendance Pass Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative overflow-hidden text-center glow-emerald">
        
        {/* Background glow decoration */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Big Success Checkmark Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>PRESENSI BERHASIL DICENTANG</span>
        </div>

        <h3 className="text-2xl font-extrabold text-white tracking-tight">
          {record.name}
        </h3>
        {record.identifier && record.identifier !== '-' && (
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            NIM / ID: <span className="text-white font-semibold">{record.identifier}</span>
          </p>
        )}

        {/* Ticket Divider with dashed line */}
        <div className="my-5 border-t border-dashed border-slate-700/80 relative">
          <div className="absolute -left-10 -top-3 w-6 h-6 bg-slate-950 rounded-full border-r border-slate-800" />
          <div className="absolute -right-10 -top-3 w-6 h-6 bg-slate-950 rounded-full border-l border-slate-800" />
        </div>

        {/* Metadata Details Grid */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 text-left space-y-3 text-xs">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Sesi Kegiatan:</span>
            </span>
            <span className="text-white font-semibold text-right truncate max-w-[180px]">
              {session?.name || 'Sesi Utama'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Waktu Presensi:</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              {new Date(record.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}{' '}
              WIB
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Device Fingerprint:</span>
            </span>
            <span className="text-teal-400 font-mono text-[11px] font-medium">
              {record.deviceFingerprint}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              <span>Kode Verifikasi:</span>
            </span>
            <span className="text-white font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              {record.verificationCode || 'VERIF-OK'}
            </span>
          </div>

        </div>

        {/* Info Note */}
        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
          Nama Anda telah otomatis tercatat dan mendapatkan <strong>centang hijau</strong> di layar admin. Terima kasih!
        </p>

      </div>
    </div>
  );
}
