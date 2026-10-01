import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Key, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, Lock, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CyberPassScanner({ onPasskeyDetected, isAuthenticating = false, theme = 'cyan' }) {
  const [activeTab, setActiveTab] = useState('upload'); // Default to 'upload' for 100% universal compatibility
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedSuccess, setDecodedSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const streamRef = useRef(null);

  // Play subtle high-tech verification beep via Web Audio API (Zero external assets)
  const playCyberBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12); // E6 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  }, []);

  // Handle successful passkey recognition
  const handleSuccess = useCallback((passkeyData) => {
    if (decodedSuccess || isAuthenticating) return;
    setDecodedSuccess(true);
    playCyberBeep();
    stopCamera();
    onPasskeyDetected(passkeyData);
  }, [decodedSuccess, isAuthenticating, playCyberBeep, onPasskeyDetected]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start webcam scanner
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestScanFrame();
      }
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera. Please check permissions or upload badge image.');
      setCameraActive(false);
    }
  }, []);

  // Scan frame by frame from video
  const requestScanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        handleSuccess(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(requestScanFrame);
  }, [handleSuccess]);

  // Decode QR from uploaded image file
  const decodeImageFile = useCallback((file) => {
    if (!file) return;
    setIsDecoding(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          setIsDecoding(false);
          if (code && code.data) {
            handleSuccess(code.data);
          } else {
            toast.error('No valid CyberPass QR detected in this image. Please upload a clear badge.');
          }
        } catch {
          setIsDecoding(false);
          toast.error('Failed to process image file. Please try another image or manual code.');
        }
      };
      img.onerror = () => {
        setIsDecoding(false);
        toast.error('Could not load image file.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [handleSuccess]);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      decodeImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter your 32-character passkey or recovery code');
      return;
    }
    handleSuccess(manualCode.trim());
  };

  // Manage camera state on tab change
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  const isThemeRed = theme === 'red';
  const primaryColor = isThemeRed ? '#ef4444' : '#00bfff';
  const secondaryColor = isThemeRed ? '#ff8c00' : '#00ff88';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HIGH-TECH MODE SWITCHER TABS ── */}
      <div className="flex items-center justify-center p-1 rounded-xl bg-black/60 border border-white/10 mb-5 w-full max-w-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'upload'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,191,255,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Badge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'camera'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,191,255,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Live Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,191,255,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Passkey</span>
        </button>
      </div>

      {/* ── TAB 1: DROPZONE / GALLERY IMAGE UPLOAD (NO CAMERA REQUIRED) ── */}
      {activeTab === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              w-full max-w-sm h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group
              ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_25px_rgba(0,191,255,0.4)]'
                  : 'border-cyan-500/30 bg-black/40 hover:border-cyan-400/70 hover:bg-cyan-950/20 shadow-xl'
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && decodeImageFile(e.target.files[0])}
            />

            {/* Glowing Corner Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none rounded-tl-xs" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none rounded-tr-xs" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none rounded-bl-xs" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none rounded-br-xs" />

            {/* Animated Laser Scanline across upload box */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00bfff] pointer-events-none animate-laser-sweep" />

            {/* Animated Hologram Icon */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,191,255,0.2)] group-hover:scale-105 transition-transform">
              {isDecoding ? (
                <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
              ) : (
                <FileImage className="w-7 h-7 text-cyan-400" />
              )}
            </div>

            <p className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              {isDecoding ? 'DECODING CYBERPASS...' : 'DROP BADGE IMAGE HERE'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide leading-relaxed">
              Click to select from Photos / Gallery <br />
              <span className="text-cyan-400/80 font-bold">100% Offline • Zero Camera Needed</span>
            </p>
          </label>
        </motion.div>
      )}

      {/* ── TAB 2: LIVE WEBCAM SCANNER WITH LASER SWEEP ── */}
      {activeTab === 'camera' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          <div className="relative w-full max-w-sm h-64 bg-black rounded-2xl border-2 border-cyan-500/40 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {!cameraActive && !cameraError && (
              <div className="flex flex-col items-center gap-2 text-cyan-400 font-mono">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs tracking-widest uppercase">INITIALIZING SENSOR...</span>
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-amber-300 font-mono">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold hover:bg-cyan-500/30"
                >
                  Switch to Upload Badge File →
                </button>
              </div>
            )}

            {cameraActive && (
              <>
                {/* Tactical HUD Reticle */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0" />
                  <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0" />
                  <div className="w-3 h-3 rounded-full bg-cyan-400/40 animate-ping" />
                </div>

                {/* Animated Laser Sweep Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#00ff88] pointer-events-none animate-laser-sweep" />

                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="text-[10px] font-mono font-bold bg-black/80 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 tracking-widest uppercase">
                    SCANNING CYBERPASS QR
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: MANUAL 32-CHARACTER PASSKEY / RECOVERY STRING ── */}
      {activeTab === 'manual' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleManualSubmit}
          className="w-full max-w-sm space-y-3"
        >
          <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4 shadow-xl">
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold mb-2">
              Enter Passkey or 32-Char Secret Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="CSX-FOUNDER-MASTER-PASSKEY-..."
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-xs rounded-lg px-3 py-2.5 outline-none tracking-wider placeholder:text-slate-600 uppercase"
                autoComplete="off"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-mono mt-2 leading-relaxed">
              Accepts Founder Master Key, User Digital Passkey, or Emergency Backup Code.
            </p>
          </div>

          <button
            type="submit"
            disabled={!manualCode.trim() || isAuthenticating}
            className="w-full py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_15px_rgba(0,191,255,0.3)] flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verify & Authenticate →</span>
          </button>
        </motion.form>
      )}

      {/* ── AUTHENTICATING OVERLAY ── */}
      <AnimatePresence>
        {(isAuthenticating || decodedSuccess) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="uppercase tracking-widest">
              CRYPTOGRAPHIC PASSKEY VERIFIED • DISPATCHING...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
