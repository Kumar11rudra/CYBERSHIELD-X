import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Copy, ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../common/BrandLogo';

export default function CyberBadgeModal({ badge, onClose, onProceed }) {
  const [copied, setCopied] = React.useState(false);
  const badgeCardRef = useRef(null);

  if (!badge) return null;

  const copyBackupCode = () => {
    if (badge.backupCode) {
      navigator.clipboard.writeText(badge.backupCode);
      setCopied(true);
      toast.success('Backup Passkey copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const downloadBadgeImage = () => {
    if (badge.qrDataUrl) {
      const link = document.createElement('a');
      link.href = badge.qrDataUrl;
      link.download = `CyberShieldX-Badge-${badge.name ? badge.name.replace(/\s+/g, '_') : 'Passkey'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Digital Clearance Badge downloaded to your device!');
    }
  };

  const isFounder = badge.role === 'admin' || badge.clearance?.includes('FOUNDER');
  const accentColor = isFounder ? '#00bfff' : '#00ff88';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#0a1628] via-[#050d1a] to-[#020814] border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,191,255,0.25)] overflow-hidden font-mono"
        >
          {/* Tactical Corner HUD Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none rounded-tl-xs" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none rounded-tr-xs" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none rounded-bl-xs" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none rounded-br-xs" />

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header Badge */}
          <div className="text-center space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              CYBERPASS™ DIGITAL CLEARANCE
            </div>
            <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">
              YOUR SECURITY BADGE
            </h2>
            <p className="text-[11px] text-slate-400">
              Save this badge to your device for instant 1-click passwordless login.
            </p>
          </div>

          {/* ── THE DIGITAL ID BADGE CARD ── */}
          <div
            ref={badgeCardRef}
            className="w-full bg-gradient-to-b from-[#0c1f38] via-[#071324] to-[#020814] border-2 border-cyan-400/50 rounded-xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-3"
          >
            {/* Background Circuit Grid Overlay */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00bfff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            {/* Brand Header */}
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <BrandLogo size={22} />
                <span className="text-xs font-bold font-mono tracking-wider text-white">
                  CYBERSHIELD <span className="text-emerald-400">X</span>
                </span>
              </div>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest"
                style={{
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}15`
                }}
              >
                {badge.clearance || 'SECURITY OPERATOR'}
              </span>
            </div>

            {/* User Identity Details */}
            <div className="relative z-10">
              <h3 className="text-base font-display font-black text-white uppercase tracking-wide">
                {badge.name || 'Security Operator'}
              </h3>
              <p className="text-[10px] text-cyan-400 font-mono tracking-wider">
                ID: {badge.role === 'admin' ? 'FOUNDER-ADMIN' : (badge.backupCode ? badge.backupCode.slice(0, 12).toUpperCase() : 'AGENT-PASS')}
              </p>
            </div>

            {/* The QR Code Container */}
            <div className="relative z-10 p-2.5 bg-black/90 rounded-xl border border-cyan-500/40 shadow-[0_0_20px_rgba(0,191,255,0.3)]">
              {badge.qrDataUrl ? (
                <img
                  src={badge.qrDataUrl}
                  alt="CyberPass QR Code"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Security Verification Stamp */}
            <div className="w-full border-t border-white/10 pt-2 flex items-center justify-between text-[9px] text-slate-400 relative z-10">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3 h-3" />
                HMAC-SHA256 SIGNED
              </span>
              <span className="font-mono">VALID: LIFETIME</span>
            </div>
          </div>

          {/* Backup Passkey String with 1-Click Copy */}
          {badge.backupCode && (
            <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Backup Passkey String:
                </p>
                <p className="text-[10px] font-mono text-cyan-300 truncate">
                  {badge.backupCode}
                </p>
              </div>
              <button
                type="button"
                onClick={copyBackupCode}
                className="shrink-0 p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs flex items-center gap-1 transition-colors"
                title="Copy Backup Passkey"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold">{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={downloadBadgeImage}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,191,255,0.2)] flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Badge (.PNG)</span>
            </button>

            <button
              type="button"
              onClick={onProceed || onClose}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-mono text-xs font-black uppercase tracking-wider hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center justify-center gap-1.5"
            >
              <span>Continue →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
