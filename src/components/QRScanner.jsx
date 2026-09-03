import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  SwitchCamera, 
  Flashlight, 
  Keyboard, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function QRScanner({ onScanSuccess, onError, isScanningActive }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  // Discover cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
        }
      })
      .catch((err) => {
        console.warn('Error getting cameras:', err);
        setCameraError('Akses kamera tidak diizinkan atau tidak tersedia. Anda dapat menggunakan opsi Input Kode Manual.');
      });
  }, []);

  // Start / Stop Scanner
  useEffect(() => {
    if (activeTab !== 'camera' || !selectedCameraId || !isScanningActive) {
      stopScanner();
      return;
    }

    startScanner(selectedCameraId);

    return () => {
      stopScanner();
    };
  }, [activeTab, selectedCameraId, isScanningActive]);

  const startScanner = async (cameraId) => {
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const qrScanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success Callback
          if (decodedText) {
            onScanSuccess(decodedText, 'CAMERA_QR');
          }
        },
        (errorMessage) => {
          // Frame read errors are normal while seeking QR
        }
      );
      setIsStarted(true);
      setCameraError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError('Gagal mengakses stream kamera. Pastikan izin kamera telah diberikan.');
      setIsStarted(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
      setIsStarted(false);
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    onScanSuccess(manualToken.trim(), 'MANUAL_TOKEN');
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Mode Switcher (Kamera vs Input Manual) */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4 w-full max-w-sm">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'camera'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Kamera QR Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'manual'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Ketik Token Manual</span>
        </button>
      </div>

      {/* Mode 1: Camera Scanner */}
      {activeTab === 'camera' && (
        <div className="w-full max-w-sm flex flex-col items-center">
          
          {/* Viewfinder Box */}
          <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center">
            
            {/* HTML5 QR Container */}
            <div id={scannerContainerId} className="w-full h-full object-cover" />

            {/* Viewfinder Corners & Target Overlay */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              </div>
              
              {/* Laser Animation */}
              <div className="scanner-laser" />

              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>

            {/* Error or Fallback State */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-5 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Gunakan Input Manual
                </button>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex items-center justify-between w-full mt-3 px-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Arahkan ke QR di layar Admin</span>
            </span>

            {cameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>Ganti Kamera</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Manual Token Input */}
      {activeTab === 'manual' && (
        <form
          onSubmit={handleManualSubmit}
          className="w-full max-w-sm glass-panel p-5 rounded-2xl border border-slate-800 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Masukkan Token Presensi (Yang tampil di bawah QR)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: JAMAL-8F92A1"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center uppercase tracking-widest text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            Verifikasi Token Presensi
          </button>
        </form>
      )}

    </div>
  );
}
