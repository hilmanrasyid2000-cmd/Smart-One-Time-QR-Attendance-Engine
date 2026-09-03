import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Maximize2, 
  KeyRound, 
  ExternalLink,
  Settings2,
  Globe,
  Smartphone
} from 'lucide-react';

export default function DynamicQRBox({ qrData, onFullscreen, session, networkInfo }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [remaining, setRemaining] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customHost, setCustomHost] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [qrMode, setQrMode] = useState('URL'); // 'URL' (Default - open browser on scan) or 'TOKEN'

  const token = qrData?.token || 'JAMAL-INIT';
  const intervalSeconds = qrData?.intervalSeconds || 10;
  const expiresAt = qrData?.expiresAt || Date.now() + 10000;

  // Determine host to use
  const defaultHost = networkInfo?.primaryIp || window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const activeHost = customHost.trim() || `${defaultHost}${port}`;
  const protocol = window.location.protocol;

  // Full attendance check-in URL encoded in QR
  const attendanceUrl = activeHost.startsWith('http') 
    ? `${activeHost}/?token=${token}`
    : `${protocol}//${activeHost}/?token=${token}`;

  const qrPayload = qrMode === 'URL' ? attendanceUrl : token;

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Calculate remaining seconds
  useEffect(() => {
    const calcRemaining = () => {
      const diff = Math.max(0, expiresAt - Date.now());
      setRemaining(Math.min(intervalSeconds, Math.ceil(diff / 1000)));
    };
    calcRemaining();
    const interval = setInterval(calcRemaining, 200);
    return () => clearInterval(interval);
  }, [expiresAt, intervalSeconds]);

  // Generate QR Code with the full web URL
  useEffect(() => {
    if (!token) return;
    QRCode.toDataURL(qrPayload, {
      width: 340,
      margin: 1.5,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Gen error:', err));
  }, [qrPayload, token]);

  const progressPercent = Math.max(0, Math.min(100, (remaining / intervalSeconds) * 100));

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden flex flex-col items-center">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-1.5">
            Dynamic One-Time QR
          </h3>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg text-xs transition-colors border ${
              showConfig ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Pengaturan IP / URL QR"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 transition-colors border border-slate-700/50"
              title="Tampilkan di Layar Proyektor"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Proyektor</span>
            </button>
          )}
        </div>
      </div>

      {/* Host / URL Config Dropdown */}
      {showConfig && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 mb-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Format Isi QR Code:</span>
            </span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setQrMode('URL')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  qrMode === 'URL' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                URL Web (Rekomendasi)
              </button>
              <button
                onClick={() => setQrMode('TOKEN')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  qrMode === 'TOKEN' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Token Teks
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">
              Host / IP Address untuk HP Peserta:
            </label>
            <input
              type="text"
              placeholder={`Contoh: ${defaultHost}${port}`}
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Saat di-scan kamera HP bawaan, HP otomatis membuka link web di atas.
            </p>
          </div>
        </div>
      )}

      {/* Anti-Screenshot Live Clock */}
      <div className="w-full bg-slate-900/90 rounded-xl px-3 py-1.5 mb-3.5 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Waktu Live:</span>
        </div>
        <div className="text-emerald-400 font-bold tracking-wider">
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          <span className="text-[10px] text-slate-500 ml-1">
            .{String(currentTime.getMilliseconds()).padStart(3, '0').slice(0, 2)}
          </span>
        </div>
      </div>

      {/* QR Code Container with Countdown Ring Frame */}
      <div className="relative group my-1">
        {/* White Border Frame */}
        <div className="p-3 bg-white rounded-2xl shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Dynamic Attendance QR"
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 bg-slate-100 flex items-center justify-center rounded-lg">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}

          {/* Center Logo Shield Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 p-2 rounded-xl shadow-md border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                J
              </div>
            </div>
          </div>
        </div>

        {/* Rolling Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 text-[11px] font-semibold px-3 py-1 rounded-full border border-emerald-500/30 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" style={{ animationDuration: '3s' }} />
          <span>Auto-refresh: <strong className="text-white font-mono">{remaining}s</strong></span>
        </div>
      </div>

      {/* Expiry Progress Bar */}
      <div className="w-full mt-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 truncate max-w-[200px]">
            <KeyRound className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">Token: <strong className="text-white font-mono text-xs">{token}</strong></span>
          </span>
          <span className="font-mono text-emerald-400 font-bold shrink-0">{remaining} detik</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              remaining <= 3 ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Direct Scan Instruction Box */}
      <div className="w-full mt-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5 text-xs text-emerald-300 flex items-start gap-2">
        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p>
            <strong>Scan Kamera HP Langsung:</strong> Kamera HP peserta akan langsung mendeteksi tautan web absensi otomatis.
          </p>
        </div>
      </div>

    </div>
  );
}
