import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Download, 
  UserPlus, 
  Trash2, 
  Shield, 
  Smartphone,
  Filter,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';

export default function AttendanceTable({ 
  roster, 
  guests, 
  attendance, 
  onAddMember, 
  onDeleteMember 
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PRESENT', 'ABSENT'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', identifier: '', role: 'Mahasiswa', division: 'Informatika' });

  // Merge roster with guests for comprehensive view
  const combinedList = [
    ...roster.map(r => ({ ...r, isGuest: false })),
    ...guests.map(g => ({
      id: g.id,
      name: g.name,
      identifier: g.identifier,
      role: 'Tamu / Guest',
      division: 'Registrasi Mandiri',
      attended: true,
      attendanceRecord: g,
      isGuest: true,
    })),
  ];

  // Filter list
  const filtered = combinedList.filter((item) => {
    const matchSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.identifier && item.identifier.toLowerCase().includes(search.toLowerCase())) ||
      (item.division && item.division.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (filterStatus === 'PRESENT') return item.attended;
    if (filterStatus === 'ABSENT') return !item.attended;
    return true;
  });

  const presentTotal = combinedList.filter(i => i.attended).length;
  const absentTotal = roster.filter(i => !i.attended).length;

  const handleExportCSV = () => {
    window.location.href = '/api/export/csv';
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    onAddMember(newMember);
    setNewMember({ name: '', identifier: '', role: 'Mahasiswa', division: 'Informatika' });
    setShowAddModal(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col h-full">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Daftar Peserta &amp; Checklist Kehadiran
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {presentTotal} Hadir / {roster.length} Peserta
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Peserta yang telah menginput nama &amp; scan QR akan otomatis mendapatkan <strong className="text-emerald-400">Centang Hijau (✓)</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tambah Nama</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 my-4">
        {/* Search input */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama peserta, NIM, atau divisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter buttons */}
        <div className="sm:col-span-5 flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({combinedList.length})
          </button>
          <button
            onClick={() => setFilterStatus('PRESENT')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
              filterStatus === 'PRESENT'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Hadir ({presentTotal})</span>
          </button>
          <button
            onClick={() => setFilterStatus('ABSENT')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
              filterStatus === 'ABSENT'
                ? 'bg-rose-600/80 text-white font-semibold'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Belum ({absentTotal})</span>
          </button>
        </div>
      </div>

      {/* Roster Table Content */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/50">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 sticky top-0">
            <tr>
              <th className="py-3 px-3.5 text-center w-12">Status</th>
              <th className="py-3 px-4">Nama Peserta</th>
              <th className="py-3 px-3">NIM / Identitas</th>
              <th className="py-3 px-3 hidden md:table-cell">Divisi / Jurusan</th>
              <th className="py-3 px-3">Waktu Presensi</th>
              <th className="py-3 px-3 hidden lg:table-cell">Device &amp; Security</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Tidak ada data peserta yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const isAttended = item.attended;
                const record = item.attendanceRecord;

                return (
                  <tr
                    key={item.id || idx}
                    className={`transition-colors ${
                      isAttended
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Status Checkmark / Badge */}
                    <td className="py-3 px-3.5 text-center">
                      {isAttended ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse-fast">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.isGuest && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded font-normal">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.role || 'Peserta'}
                      </div>
                    </td>

                    {/* NIM / ID */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {item.identifier || '-'}
                    </td>

                    {/* Division */}
                    <td className="py-3 px-3 hidden md:table-cell text-slate-400">
                      {item.division || 'Umum'}
                    </td>

                    {/* Attendance Timestamp */}
                    <td className="py-3 px-3">
                      {isAttended && record ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {new Date(record.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            WIB
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">
                          Belum Absen
                        </span>
                      )}
                    </td>

                    {/* Device Fingerprint / Security */}
                    <td className="py-3 px-3 hidden lg:table-cell">
                      {isAttended && record ? (
                        <div className="text-[10px] space-y-0.5">
                          <div className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{record.deviceFingerprint}</span>
                          </div>
                          <div className="text-slate-400 truncate max-w-[140px]" title={record.deviceInfo}>
                            {record.deviceInfo}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      {!item.isGuest && onDeleteMember && (
                        <button
                          onClick={() => onDeleteMember(item.id)}
                          title="Hapus Peserta"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Peserta ke Master List</span>
            </h4>
            
            <form onSubmit={handleSubmitAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NIM / NIK / ID</label>
                  <input
                    type="text"
                    placeholder="202401099"
                    value={newMember.identifier}
                    onChange={(e) => setNewMember({ ...newMember, identifier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jurusan / Divisi</label>
                  <input
                    type="text"
                    placeholder="Informatika"
                    value={newMember.division}
                    onChange={(e) => setNewMember({ ...newMember, division: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
