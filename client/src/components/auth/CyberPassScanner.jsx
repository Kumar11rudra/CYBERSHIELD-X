import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Key, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, Lock, FileImage, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CyberPassScanner({ onPasskeyDetected, isAuthenticating = false, theme = 'cyan' }) {
  const [activeTab, setActiveTab] = useState('upload'); // Default to 'upload' for 100% universal compatibility
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [operatorIdentity, setOperatorIdentity] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedSuccess, setDecodedSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const streamRef = useRef(null);

  const isRed = theme === 'red';
  const primaryColor = isRed ? '#ff0033' : '#00bfff';
  const primaryBorder = isRed ? 'border-red-500/40' : 'border-cyan-500/30';
  const primaryGlow = isRed ? 'shadow-[0_0_20px_rgba(255,0,50,0.3)]' : 'shadow-[0_0_20px_rgba(0,191,255,0.25)]';

  // Play subtle high-tech verification beep via Web Audio API (Zero external assets)
  const playCyberBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  }, []);

  // Handle successful passkey recognition
  const handleSuccess = useCallback((passkeyData, identity = null) => {
    if (decodedSuccess || isAuthenticating) return;
    setDecodedSuccess(true);
    playCyberBeep();
    stopCamera();
    if (identity) {
      onPasskeyDetected(passkeyData, identity);
    } else {
      onPasskeyDetected(passkeyData);
    }
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

  // Decode QR matrix directly from an uploaded or dropped image file (Pure Client-Side Canvas)
  const decodeImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (.png, .jpg, .webp)');
      return;
    }

    setIsDecoding(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (qrResult && qrResult.data) {
            handleSuccess(qrResult.data);
          } else {
            toast.error('No CyberPass QR matrix detected in this image. Ensure the full badge is visible.');
          }
        } catch (err) {
          toast.error('Error decoding badge image. Please try another file.');
        } finally {
          setIsDecoding(false);
        }
      };

      img.onerror = () => {
        setIsDecoding(false);
        toast.error('Failed to load image file.');
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }, [handleSuccess]);

  // Handle Drag & Drop events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      decodeImageFile(e.dataTransfer.files[0]);
    }
  }, [decodeImageFile]);

  // Handle manual 32-character passkey submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      handleSuccess(clean);
    }
  };

  // Handle 6-digit Google Authenticator code submit
  const handleTotpSubmit = (e) => {
    e.preventDefault();
    const clean = totpCode.trim();
    if (/^\d{6}$/.test(clean)) {
      handleSuccess(clean, operatorIdentity.trim() || null);
    } else {
      toast.error('Please enter a valid 6-digit numeric Authenticator code');
    }
  };

  // Switch tabs cleanly
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

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── REDESIGNED HIGH-TECH TACTICAL HUD TABS ── */}
      <div className={`w-full max-w-md p-1.5 rounded-2xl bg-black/75 backdrop-blur-2xl border ${primaryBorder} ${primaryGlow} mb-5 flex items-center justify-between gap-1 relative overflow-hidden`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-sky-500/10 to-emerald-500/5 pointer-events-none" />

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'upload'
              ? isRed
                ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                : 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-white border border-cyan-400 shadow-[0_0_15px_rgba(0,191,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Badge</span>
          {activeTab === 'upload' && (
            <motion.div
              layoutId="activeTabGlow"
              className={`absolute bottom-0 left-2 right-2 h-[2px] ${isRed ? 'bg-red-400 shadow-[0_0_8px_#ff0033]' : 'bg-cyan-400 shadow-[0_0_8px_#00bfff]'}`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'camera'
              ? isRed
                ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                : 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-white border border-cyan-400 shadow-[0_0_15px_rgba(0,191,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Live Scan</span>
          {activeTab === 'camera' && (
            <motion.div
              layoutId="activeTabGlow"
              className={`absolute bottom-0 left-2 right-2 h-[2px] ${isRed ? 'bg-red-400 shadow-[0_0_8px_#ff0033]' : 'bg-cyan-400 shadow-[0_0_8px_#00bfff]'}`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('authenticator')}
          className={`relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'authenticator'
              ? isRed
                ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                : 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-white border border-cyan-400 shadow-[0_0_15px_rgba(0,191,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Google Auth</span>
          {activeTab === 'authenticator' && (
            <motion.div
              layoutId="activeTabGlow"
              className={`absolute bottom-0 left-2 right-2 h-[2px] ${isRed ? 'bg-red-400 shadow-[0_0_8px_#ff0033]' : 'bg-cyan-400 shadow-[0_0_8px_#00bfff]'}`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all duration-300 ${
            activeTab === 'manual'
              ? isRed
                ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                : 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-white border border-cyan-400 shadow-[0_0_15px_rgba(0,191,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Passkey</span>
          {activeTab === 'manual' && (
            <motion.div
              layoutId="activeTabGlow"
              className={`absolute bottom-0 left-2 right-2 h-[2px] ${isRed ? 'bg-red-400 shadow-[0_0_8px_#ff0033]' : 'bg-cyan-400 shadow-[0_0_8px_#00bfff]'}`}
            />
          )}
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
                  ? isRed
                    ? 'border-red-400 bg-red-950/30 shadow-[0_0_25px_rgba(255,0,50,0.4)]'
                    : 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_25px_rgba(0,191,255,0.4)]'
                  : isRed
                    ? 'border-red-500/30 bg-black/50 hover:border-red-400 hover:bg-red-950/20 shadow-xl'
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
            <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 ${isRed ? 'border-red-400' : 'border-cyan-400'} pointer-events-none rounded-tl-xs`} />
            <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 ${isRed ? 'border-red-400' : 'border-cyan-400'} pointer-events-none rounded-tr-xs`} />
            <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 ${isRed ? 'border-red-400' : 'border-cyan-400'} pointer-events-none rounded-bl-xs`} />
            <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 ${isRed ? 'border-red-400' : 'border-cyan-400'} pointer-events-none rounded-br-xs`} />

            {/* Animated Laser Scanline across upload box */}
            <div className={`absolute inset-x-0 h-1 bg-gradient-to-r from-transparent ${isRed ? 'via-red-400 shadow-[0_0_12px_#ff0033]' : 'via-cyan-400 shadow-[0_0_12px_#00bfff]'} to-transparent pointer-events-none animate-laser-sweep`} />

            {/* Animated Hologram Icon */}
            <div className={`w-16 h-16 rounded-2xl ${isRed ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(255,0,50,0.2)]' : 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(0,191,255,0.2)]'} border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              {isDecoding ? (
                <RefreshCw className={`w-7 h-7 ${isRed ? 'text-red-400' : 'text-cyan-400'} animate-spin`} />
              ) : (
                <FileImage className={`w-7 h-7 ${isRed ? 'text-red-400' : 'text-cyan-400'}`} />
              )}
            </div>

            <p className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              {isDecoding ? 'DECODING CYBERPASS...' : 'DROP BADGE IMAGE HERE'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide leading-relaxed">
              Click to select from Photos / Gallery <br />
              <span className={`${isRed ? 'text-red-400' : 'text-cyan-400'} font-bold`}>100% Offline • Zero Camera Needed</span>
            </p>
          </label>
        </motion.div>
      )}

      {/* ── TAB 2: LIVE WEBCAM SCANNER ── */}
      {activeTab === 'camera' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full max-w-sm h-64 bg-black/80 rounded-2xl overflow-hidden relative border border-cyan-500/30 shadow-2xl flex items-center justify-center">
            {cameraActive && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}

            {/* Holographic Reticle HUD */}
            <div className="absolute inset-4 pointer-events-none border border-cyan-500/20 rounded-xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg shadow-[0_0_10px_#00bfff]" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg shadow-[0_0_10px_#00bfff]" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg shadow-[0_0_10px_#00bfff]" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg shadow-[0_0_10px_#00bfff]" />
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00bfff] animate-laser-sweep" />
            </div>

            {/* Camera error fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                <p className="text-xs text-rose-300 font-mono mb-3">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold"
                >
                  Switch to Badge Image Upload →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: GOOGLE AUTHENTICATOR (RFC 6238 TOTP 6-DIGIT CODE) ── */}
      {activeTab === 'authenticator' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleTotpSubmit}
          className="w-full max-w-sm space-y-3"
        >
          <div className={`bg-black/75 border ${primaryBorder} rounded-2xl p-4 shadow-xl space-y-3`}>
            <div className="flex items-center justify-between">
              <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isRed ? 'text-red-400' : 'text-cyan-400'} font-bold`}>
                Google / Microsoft Authenticator
              </label>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                6-Digit TOTP
              </span>
            </div>

            {/* Optional Identity for non-founder operators */}
            {!isRed && (
              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                  Operator Username / Email (Optional for Founder)
                </label>
                <input
                  type="text"
                  value={operatorIdentity}
                  onChange={(e) => setOperatorIdentity(e.target.value)}
                  placeholder="e.g. operator or user@cybershieldx.in"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-white font-mono text-xs rounded-lg px-3 py-2 outline-none"
                  autoComplete="off"
                />
              </div>
            )}

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className={`w-full bg-slate-900/90 border ${isRed ? 'border-red-500/40 focus:border-red-400' : 'border-cyan-500/40 focus:border-cyan-400'} text-center text-white font-mono text-xl font-bold tracking-[0.4em] rounded-xl px-3 py-3 outline-none shadow-inner`}
                autoComplete="off"
                autoFocus
              />
            </div>

            <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
              Open your phone's Google Authenticator app and type the current 6-digit rolling code.
            </p>
          </div>

          <button
            type="submit"
            disabled={totpCode.length !== 6 || isAuthenticating}
            className={`w-full py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider ${
              isRed
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(255,0,50,0.4)]'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-[0_0_15px_rgba(0,191,255,0.3)]'
            } hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verify Authenticator Code →</span>
          </button>
        </motion.form>
      )}

      {/* ── TAB 4: MANUAL 32-CHARACTER PASSKEY / RECOVERY STRING ── */}
      {activeTab === 'manual' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleManualSubmit}
          className="w-full max-w-sm space-y-3"
        >
          <div className={`bg-black/75 border ${primaryBorder} rounded-2xl p-4 shadow-xl`}>
            <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isRed ? 'text-red-400' : 'text-cyan-400'} font-bold mb-2`}>
              Enter Passkey or 32-Char Secret Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="CSX-FOUNDER-MASTER-PASSKEY-..."
                className={`w-full bg-slate-900/90 border border-slate-700 ${isRed ? 'focus:border-red-400' : 'focus:border-cyan-400'} text-white font-mono text-xs rounded-lg px-3 py-2.5 outline-none tracking-wider placeholder:text-slate-600 uppercase`}
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
            className={`w-full py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider ${
              isRed
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(255,0,50,0.4)]'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-[0_0_15px_rgba(0,191,255,0.3)]'
            } hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
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
