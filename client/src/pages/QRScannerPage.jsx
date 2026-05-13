import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import RiskBadge from '../components/common/RiskBadge';

// jsQR — loaded from CDN via useEffect (no npm install needed)
let jsQR = null;

export default function QRScannerPage() {
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [qrText, setQrText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [libReady, setLibReady] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const animFrameRef = useRef();

  // Load jsQR from CDN
  useEffect(() => {
    if (window.jsQR) { jsQR = window.jsQR; setLibReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.onload = () => { jsQR = window.jsQR; setLibReady(true); };
    document.head.appendChild(script);
    return () => {};
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    if (!libReady) return toast.error('QR library loading, please wait...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      scanFrame();
    } catch {
      toast.error('Camera access denied. Use file upload instead.');
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !jsQR) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      setQrText(code.data);
      stopCamera();
      toast.success('QR Code decoded!');
      return;
    }
    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!libReady) return toast.error('QR library loading, please wait...');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      URL.revokeObjectURL(url);
      if (code) {
        setQrText(code.data);
        toast.success('QR Code decoded!');
      } else {
        toast.error('No QR code found in image. Try a clearer image.');
      }
    };
    img.src = url;
  };

  const handleScan = async () => {
    if (!qrText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/scan', { target: qrText.trim() });
      setResult(res.data.scan);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const RISK_COLOR = { safe: '#00ff88', low: '#ffdd00', medium: '#ff8c00', dangerous: '#ff2244' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] text-cyber-accent/60 uppercase tracking-[0.4em] mb-1">Security Tool</p>
        <h1 className="font-display text-3xl font-black text-white uppercase tracking-tight">
          QR Code <span className="text-cyber-accent">Scanner</span>
        </h1>
        <p className="font-mono text-xs text-cyber-muted mt-1">Decode QR codes and check for malicious links</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {['upload', 'camera'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); stopCamera(); setQrText(''); setResult(null); }}
            className={`px-6 py-2.5 font-mono text-xs rounded-lg border transition-all uppercase tracking-widest ${
              mode === m
                ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent'
                : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20'
            }`}
          >
            {m === 'upload' ? '📷 Upload Image' : '🎥 Camera Scan'}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="cyber-bento-card p-6 space-y-4">
        {mode === 'upload' ? (
          <label className="flex flex-col items-center gap-3 cursor-pointer p-8 border border-dashed border-white/10 rounded-xl hover:border-cyber-accent/40 transition-all">
            <span className="text-4xl">🖼️</span>
            <span className="font-mono text-xs text-cyber-muted">Upload QR code image (JPG/PNG)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-cyber-accent rounded-xl animate-pulse opacity-60" />
                </div>
              )}
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent font-mono text-sm font-bold rounded-lg hover:bg-cyber-accent/30"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
            {scanning && (
              <button onClick={stopCamera} className="font-mono text-xs text-cyber-muted hover:text-cyber-text">
                ✕ Stop Camera
              </button>
            )}
          </div>
        )}

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Decoded text */}
        {qrText && (
          <div className="bg-black/40 rounded-lg p-4 border border-white/10">
            <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Decoded Content</p>
            <p className="font-mono text-sm text-cyber-accent break-all">{qrText}</p>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!qrText || loading}
          className="w-full py-3 bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent font-mono text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-cyber-accent/30 transition-all disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
              Scanning for threats...
            </span>
          ) : 'Check for Threats'}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cyber-bento-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">QR Content Threat Score</p>
                <p className="font-display text-4xl font-black mt-1" style={{ color: RISK_COLOR[result.riskLevel] }}>
                  {result.threatScore}
                  <span className="text-base text-cyber-muted font-mono font-normal">/100</span>
                </p>
              </div>
              <RiskBadge level={result.riskLevel} />
            </div>
            <p className="font-mono text-xs text-cyber-muted break-all">{result.target}</p>
            {result.riskLevel === 'dangerous' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="font-mono text-xs text-red-400 font-bold">⚠ MALICIOUS QR CODE DETECTED — Do not open this link!</p>
              </div>
            )}
            {result.riskLevel === 'safe' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="font-mono text-xs text-green-400">✅ QR code content appears safe.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
