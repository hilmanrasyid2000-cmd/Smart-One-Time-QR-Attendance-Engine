import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  UserCheck, 
  Tv, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function Navbar({ activeTab, setActiveTab, networkInfo }) {
  const [isMuted, setIsMuted] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const primaryIp = networkInfo?.primaryIp || window.location.hostname;
  const clientPort = window.location.port || '5173';
  const mobileAccessUrl = `http://${primaryIp}:${clientPort}`;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('admin')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                  Smart One-Time QR
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Engine (Jamal)
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Anti-Proxy Attendance & Live Checklist
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('user')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'user'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>User / Absen</span>
            </button>

            <button
              onClick={() => setActiveTab('projector')}
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'projector'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Proyektor</span>
            </button>
          </nav>

          {/* Quick Actions (Network Info & Mute) */}
          <div className="flex items-center space-x-2">
            
            {/* WiFi / Mobile Access Button */}
            <button
              onClick={() => setShowNetworkModal(!showNetworkModal)}
              title="Akses dari HP / Jaringan WiFi"
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              <Wifi className="w-4 h-4 text-teal-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>

            {/* Sound Effects Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Suara Dinonaktifkan' : 'Suara Aktif (Chime Absensi)'}
              className={`p-2 rounded-lg transition-colors border ${
                isMuted
                  ? 'bg-slate-800/50 text-slate-500 border-slate-800'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Network Modal Dropdown */}
      {showNetworkModal && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 shadow-xl">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 mt-1 sm:mt-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <span>Buka Web dari HP Peserta (WiFi Lokal)</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-mono">1 Device 1 Scan</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pastikan HP peserta terhubung ke WiFi yang sama dengan laptop admin, lalu buka link:
                </p>
                <div className="mt-2 inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400 font-mono text-xs select-all">
                  <span>{mobileAccessUrl}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNetworkModal(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
