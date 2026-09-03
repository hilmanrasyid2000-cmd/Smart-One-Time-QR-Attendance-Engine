import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  UserSquare2, 
  ShieldCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import DynamicQRBox from './DynamicQRBox';
import AttendanceTable from './AttendanceTable';
import VisitorTracker from './VisitorTracker';

export default function AdminDashboard({
  session,
  qrData,
  attendance,
  visitors,
  roster,
  guests,
  networkInfo,
  onResetSession,
  onAddMember,
  onDeleteMember,
  onFullscreenProjector,
}) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    name: session?.name || 'Kuliah Umum & Presensi Praktikum',
    room: session?.room || 'Lab Komputer 3 / Hybrid Online',
    instructor: session?.instructor || 'Ir. Jamaluddin, M.Kom',
  });

  const totalRoster = roster.length;
  const presentCount = attendance.length;
  const absentCount = Math.max(0, totalRoster - roster.filter(r => r.attended).length);
  const percentage = totalRoster > 0 ? Math.round((roster.filter(r => r.attended).length / totalRoster) * 100) : 100;

  const handleResetSubmit = (e) => {
    e.preventDefault();
    onResetSession(sessionForm);
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Session Header Card */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SESI AKTIF
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {session?.id || 'SES-001'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {session?.name || 'Sesi Presensi Smart QR'}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{session?.room || 'Ruang Utama'}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserSquare2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengawas: <strong className="text-slate-300">{session?.instructor || 'Admin'}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(session?.startedAt || Date.now()).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Action Button: Reset / New Session */}
        <button
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition-all hover:border-slate-600"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Buat Sesi Baru</span>
        </button>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Peserta */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Peserta Terdaftar</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {totalRoster}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Master Roster</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Hadir (Centang Hijau) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between glow-emerald">
          <div>
            <p className="text-xs text-emerald-300 font-semibold">Telah Hadir (Centang ✓)</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {presentCount}
            </h4>
            <p className="text-[11px] text-emerald-300/70 mt-0.5">Terverifikasi 1-Device</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Belum Hadir */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Belum Hadir</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
              {absentCount}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Menunggu Scan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Persentase Kehadiran */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tingkat Kehadiran</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1">
              {percentage}%
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{visitors.length} Pengunjung Web</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dynamic One-Time QR Box & Visitor Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <DynamicQRBox
            qrData={qrData}
            session={session}
            networkInfo={networkInfo}
            onFullscreen={onFullscreenProjector}
          />
          <VisitorTracker
            visitors={visitors}
            attendance={attendance}
          />
        </div>

        {/* Right Column: Master Attendance Checklist Table */}
        <div className="lg:col-span-7">
          <AttendanceTable
            roster={roster}
            guests={guests}
            attendance={attendance}
            onAddMember={onAddMember}
            onDeleteMember={onDeleteMember}
          />
        </div>

      </div>

      {/* Reset Session Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Buat / Reset Sesi Presensi Baru</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Membuat sesi baru akan mereset data absensi saat ini dan memperbarui kode QR. Master daftar peserta tetap disimpan.
            </p>

            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nama Sesi / Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder="Contoh: Kuliah Algoritma & Pemrograman"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Ruang / Lokasi</label>
                <input
                  type="text"
                  value={sessionForm.room}
                  onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })}
                  placeholder="Contoh: Ruang 304 / Lab IT"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nama Pengawas / Dosen</label>
                <input
                  type="text"
                  value={sessionForm.instructor}
                  onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })}
                  placeholder="Contoh: Ir. Jamaluddin, M.Kom"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Mulai Sesi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
