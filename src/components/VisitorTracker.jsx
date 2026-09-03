import React from 'react';
import { 
  Users, 
  Eye, 
  Smartphone, 
  Laptop, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

export default function VisitorTracker({ visitors, attendance }) {
  // Map of attendees for cross-referencing
  const attendedNames = new Set(attendance.map(a => a.name.toLowerCase()));

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Pengecek Pengunjung Web</span>
              <span className="px-2 py-0.2 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-mono">
                {visitors.length} Masuk
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Log pengunjung yang masuk ke website &amp; menginput nama
            </p>
          </div>
        </div>
      </div>

      {/* Visitor List Feed */}
      <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1">
        {visitors.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Belum ada pengunjung yang masuk &amp; menginput nama.
          </div>
        ) : (
          visitors.map((visitor, idx) => {
            const hasAttended = attendedNames.has(visitor.name.toLowerCase());

            return (
              <div
                key={visitor.id || idx}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      hasAttended
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    }`}
                  >
                    {hasAttended ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{visitor.name}</span>
                      {hasAttended ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                          Sudah Absen
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                          Masuk Web
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-slate-500" />
                      <span>{visitor.deviceInfo}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-500">{visitor.deviceFingerprint}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {new Date(visitor.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    IP: {visitor.ip?.replace('::ffff:', '')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
