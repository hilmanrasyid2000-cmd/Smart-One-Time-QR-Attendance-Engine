/**
 * Device Fingerprint Utility for Smart One-Time QR Attendance Engine
 * Computes unique hardware & browser parameters to enforce 1-device-1-scan rule.
 */

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('JamalAttendance, #1@*', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('JamalAttendance, #1@*', 4, 17);

    return hashString(canvas.toDataURL());
  } catch (e) {
    return 'canvas-err';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'gl-nodesc';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return hashString(`${vendor}~${renderer}`);
  } catch (e) {
    return 'webgl-err';
  }
}

function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'no-audio';
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    gain.gain.value = 0; // mute
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);
    const audioHash = hashString(`${context.sampleRate}_${analyser.frequencyBinCount}`);
    context.close();
    return audioHash;
  } catch (e) {
    return 'audio-err';
  }
}

export function getDeviceFingerprint() {
  // 1. Persistent local device anchor
  let localDeviceId = localStorage.getItem('jamal_device_guid');
  if (!localDeviceId) {
    localDeviceId = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('jamal_device_guid', localDeviceId);
  }

  // 2. Hardware and browser environment traits
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const concurrency = navigator.hardwareConcurrency || 4;
  const userAgent = navigator.userAgent || '';
  const canvasHash = getCanvasFingerprint();
  const webglHash = getWebGLFingerprint();
  const audioHash = getAudioFingerprint();
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 3. Combined composite raw fingerprint
  const rawFingerprint = [
    localDeviceId,
    screenInfo,
    timezone,
    concurrency,
    canvasHash,
    webglHash,
    audioHash,
    touchSupport ? 'touch' : 'mouse',
    userAgent.replace(/Mozilla\/5\.0 \([^)]+\)/, ''), // generic part
  ].join('||');

  const fpHash = hashString(rawFingerprint).padStart(8, '0');
  const shortId = `FP-${fpHash.substring(0, 4)}-${fpHash.substring(4, 8)}`;

  // Determine user-friendly device name
  let deviceName = 'PC / Laptop';
  if (/Android/i.test(userAgent)) deviceName = 'Android Smartphone';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) deviceName = 'Apple iOS Device';
  else if (/Macintosh/i.test(userAgent)) deviceName = 'MacBook / macOS';
  else if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';

  return {
    fingerprint: shortId,
    rawHash: fpHash,
    deviceInfo: `${deviceName} (${window.screen.width}x${window.screen.height})`,
    localId: localDeviceId,
    isMobile: touchSupport && window.innerWidth < 768,
  };
}
