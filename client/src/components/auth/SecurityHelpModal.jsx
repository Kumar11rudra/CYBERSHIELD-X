import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  QrCode, 
  KeyRound, 
  Lock, 
  X, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

export default function SecurityHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl max-h-[90vh] bg-gradient-to-b from-[#091524] via-[#050d18] to-[#020814] border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,191,255,0.25)] flex flex-col font-mono overflow-hidden"
        >
          {/* Tactical Corner HUD Accents */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none rounded-tl-xs" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none rounded-tr-xs" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none rounded-bl-xs" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none rounded-br-xs" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-white tracking-widest uppercase">
                  SECURITY & AUTHENTICATION MANUAL
                </h3>
                <p className="text-[10px] text-slate-400">
                  How CyberShield X passwordless security works
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar text-xs">
            
            {/* 1. Google Authenticator Guide */}
            <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>1. Google Authenticator (6-Digit TOTP Code)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Google Authenticator generates a <strong className="text-white">6-digit rolling security code</strong> that changes every 30 seconds on your smartphone. Even if someone steals your computer, they cannot access your account without your phone.
              </p>

              <div className="bg-black/60 border border-white/5 rounded-lg p-3 space-y-2 text-[10px]">
                <div className="font-bold text-emerald-400 uppercase tracking-wider">Quick Step-by-Step Setup:</div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] shrink-0 mt-0.5">1</span>
                  <span>Install <strong>Google Authenticator</strong> from <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Google Play Store</a> or <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Apple App Store</a>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] shrink-0 mt-0.5">2</span>
                  <span>Open the app on your phone and tap the <strong>"+" (Plus)</strong> button at the bottom right.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] shrink-0 mt-0.5">3</span>
                  <span>Select <strong>"Scan a QR code"</strong> and point your camera at the QR code displayed on screen (or choose "Enter a setup key" to paste the secret).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] shrink-0 mt-0.5">4</span>
                  <span>Enter the 6-digit rolling code displayed on your phone into the verification box.</span>
                </div>
              </div>
            </div>

            {/* 2. CyberPass ID Badge Guide */}
            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px] tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>2. CyberPass™ Digital Security Badge</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                When you create your account, CyberShield X generates a personal <strong className="text-white">Digital Security Badge (.PNG)</strong> containing your cryptographic QR matrix.
              </p>
              <div className="bg-black/60 border border-white/5 rounded-lg p-3 space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>1-Click Image Upload:</strong> Simply drop your badge image file to log in immediately.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Live Camera Scan:</strong> Hold your phone or printed card badge in front of your webcam.</span>
                </div>
              </div>
            </div>

            {/* 3. Passkey Guide */}
            <div className="bg-slate-900/70 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-[11px] tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>3. 32-Character Secret Passkey</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Every operator has a high-entropy 32-character token. If you ever lose camera access or are on a device without your badge image, you can paste your Passkey string to sign in securely.
              </p>
            </div>

            {/* 4. Zero-Password Security Guarantee */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong className="text-white">Zero Database Password Vulnerability:</strong> CyberShield X authenticates via HMAC-SHA256 cryptographic signatures. No plain passwords can ever be leaked or stolen from the database.
              </p>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-cyan-500/20 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              CyberShield X • Enterprise Authentication Standards
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              Got It, Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
