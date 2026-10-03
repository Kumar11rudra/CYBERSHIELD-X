import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../components/common/BrandLogo';
import api from '../services/api';
import CyberPassScanner from '../components/auth/CyberPassScanner';
import CyberBadgeModal from '../components/auth/CyberBadgeModal';
import SecurityHelpModal from '../components/auth/SecurityHelpModal';
import { Download, Smartphone, QrCode, UserCheck, ShieldAlert, KeyRound, Sparkles, CheckCircle2, Lock, HelpCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('passkey'); // 'passkey' | 'totp' | 'setup' | 'credentials'
  const [founderBadge, setFounderBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [totpSetup, setTotpSetup] = useState(null);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);

  // First-Time Founder Setup Form State
  const [setupUsername, setSetupUsername] = useState('anil-kumar');
  const [setupEmail, setSetupEmail] = useState('admin@cybershieldx.in');
  const [setupFullName, setSetupFullName] = useState('Anil Kumar');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupPasskey, setSetupPasskey] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  const { adminLogin, cyberPassLogin, founderSetup, user } = useAuth();
  const navigate = useNavigate();

  // Handle CyberPass / Passkey / TOTP Login
  const handleCyberPassLogin = async (passkeyData, identityInput = null) => {
    setIsAuthenticatingPasskey(true);
    try {
      const res = await cyberPassLogin(passkeyData, identityInput);
      toast.success('★ FOUNDER ADMIN CLEARANCE GRANTED ★', {
        icon: '🛡️',
        style: {
          border: '1px solid #ff0033',
          padding: '12px',
          color: '#ff4466',
          background: '#0a0002'
        }
      });
      navigate(res.redirectTo || '/nexus-admin/dashboard', { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid or unauthorized Admin Passkey / Authenticator Code';
      toast.error(errMsg);
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  // Download Founder Badge
  const handleDownloadFounderBadge = async () => {
    try {
      const res = await api.get('/auth/founder-cyberpass-badge');
      if (res.data && res.data.badge) {
        setFounderBadge(res.data.badge);
        setShowBadgeModal(true);
      }
    } catch (err) {
      toast.error('Failed to generate Founder Master Badge');
    }
  };

  // Fetch Founder Google Authenticator QR and Secret Key
  const handleFetchTotpSetup = async () => {
    try {
      const res = await api.get('/auth/founder-totp-setup');
      if (res.data && res.data.qrDataUrl) {
        setTotpSetup(res.data);
        setShowTotpModal(true);
      }
    } catch (err) {
      toast.error('Failed to load Google Authenticator setup');
    }
  };

  // Handle First-Time Founder Setup Submission
  const handleFounderSetupSubmit = async (e) => {
    e.preventDefault();
    if (setupPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSetupLoading(true);
    try {
      const res = await founderSetup({
        username: setupUsername,
        email: setupEmail,
        fullName: setupFullName,
        password: setupPassword,
        founderPasskey: setupPasskey || undefined
      });
      toast.success('★ FOUNDER ADMIN INITIALIZED & ACTIVATED ★', {
        icon: '🚀',
        style: {
          border: '1px solid #00ff88',
          padding: '12px',
          color: '#00ff88',
          background: '#020814'
        }
      });
      navigate(res.redirectTo || '/nexus-admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initialize Founder Admin');
    } finally {
      setSetupLoading(false);
    }
  };

  // Standard Admin Login (Clearance ID + Password)
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(identity, password);
      toast.success('Admin Login Successful');
      navigate('/nexus-admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/nexus-admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role === 'admin') return null;

  return (
    <div className="flex min-h-screen bg-[#050000] overflow-hidden relative font-mono text-red-500">
      {/* Background Matrix/Grid Red */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#050000] to-[#050000] pointer-events-none opacity-80" />

      {/* LEFT HEMISPHERE: Command Center Graphic */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative bg-[#020000] flex-col items-center justify-center p-12 border-r border-red-900/30 overflow-hidden"
      >
        {/* Animated Radar Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] border border-red-500/10 rounded-full absolute" />
          <div className="w-[600px] h-[600px] border border-red-500/20 rounded-full absolute" />
          <div className="w-[400px] h-[400px] border border-red-500/30 rounded-full absolute" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-[800px] h-[800px] rounded-full absolute bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,0,0,0.1)_360deg)]"
          />
        </div>
        
        <motion.div 
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 relative drop-shadow-[0_0_40px_rgba(255,0,0,0.5)] flex flex-col items-center"
        >
          <div className="relative mb-6">
            <BrandLogo size={140} />
            <div className="absolute -inset-4 border border-red-500/30 rounded-full animate-ping opacity-20" />
            <div className="absolute -inset-8 border border-red-500/10 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-[0.25em] text-white font-sans text-center">
            CYBERSHIELD <span className="text-red-500">NEXUS</span>
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs text-red-400 tracking-[0.3em] font-mono uppercase">
              FOUNDER COMMAND STATION • ANIL KUMAR
            </p>
          </div>
        </motion.div>

        {/* Tactical HUD Telemetry */}
        <div className="absolute bottom-8 left-8 right-8 z-10 grid grid-cols-3 gap-4 border-t border-red-900/40 pt-4 text-[10px] text-red-400/80 font-mono">
          <div>
            <span className="text-red-600 block">DEFENSE LEVEL:</span>
            <span>MAXIMUM ZERO-TRUST</span>
          </div>
          <div>
            <span className="text-red-600 block">PASSKEY CRYPTO:</span>
            <span>HMAC-SHA256 • RFC 6238</span>
          </div>
          <div className="text-right">
            <span className="text-red-600 block">CORE STATUS:</span>
            <span className="text-emerald-400">ARMED & ONLINE</span>
          </div>
        </div>
      </motion.div>

      {/* RIGHT HEMISPHERE: Command Center Controls */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full overflow-y-auto max-h-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Top Lockup for Mobile */}
          <div className="text-center mb-5 lg:hidden">
            <div className="inline-block p-3 rounded-full bg-red-950/40 border border-red-500/30 mb-2 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
              <BrandLogo size={50} />
            </div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-white">NEXUS ADMIN CONSOLE</h1>
            <p className="text-[10px] text-red-400 tracking-widest mt-1">FOUNDER CLEARANCE • ANIL KUMAR</p>
          </div>

          <div className="bg-[#0b0102]/95 border border-red-500/30 p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(255,0,0,0.18)] relative backdrop-blur-2xl">
            {/* Glowing Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500 pointer-events-none rounded-tl-xl shadow-[0_0_10px_#ff0033]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500 pointer-events-none rounded-tr-xl shadow-[0_0_10px_#ff0033]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500 pointer-events-none rounded-bl-xl shadow-[0_0_10px_#ff0033]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500 pointer-events-none rounded-br-xl shadow-[0_0_10px_#ff0033]" />

            {/* Security Manual Quick Trigger */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest font-bold">
                Select Auth Protocol
              </span>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/30 text-[10px] font-mono transition-all shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Security Manual & Guide</span>
              </button>
            </div>

            {/* ── REDESIGNED 4-WAY TACTICAL COMMAND TABS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-black/80 border border-red-900/60 mb-6 relative z-10 shadow-[inset_0_0_15px_rgba(255,0,0,0.15)]">
              <button
                type="button"
                onClick={() => setAuthMode('passkey')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300 relative ${
                  authMode === 'passkey'
                    ? 'bg-gradient-to-b from-red-600/30 to-rose-900/40 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                    : 'text-red-400/60 hover:text-red-200 hover:bg-white/[0.04]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 mb-1" />
                <span>CyberPass</span>
                {authMode === 'passkey' && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-400 shadow-[0_0_8px_#ff0033]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('totp')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300 relative ${
                  authMode === 'totp'
                    ? 'bg-gradient-to-b from-red-600/30 to-rose-900/40 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                    : 'text-red-400/60 hover:text-red-200 hover:bg-white/[0.04]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 mb-1" />
                <span>Google Auth</span>
                {authMode === 'totp' && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-400 shadow-[0_0_8px_#ff0033]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('setup')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300 relative ${
                  authMode === 'setup'
                    ? 'bg-gradient-to-b from-red-600/30 to-rose-900/40 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                    : 'text-red-400/60 hover:text-red-200 hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mb-1 text-yellow-400" />
                <span className="text-yellow-400">Setup Admin</span>
                {authMode === 'setup' && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-yellow-400 shadow-[0_0_8px_#ffcc00]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300 relative ${
                  authMode === 'credentials'
                    ? 'bg-gradient-to-b from-red-600/30 to-rose-900/40 text-white border border-red-400 shadow-[0_0_15px_rgba(255,0,50,0.5)]'
                    : 'text-red-400/60 hover:text-red-200 hover:bg-white/[0.04]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 mb-1" />
                <span>Password</span>
                {authMode === 'credentials' && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-400 shadow-[0_0_8px_#ff0033]" />
                )}
              </button>
            </div>

            {/* ── TAB 1: CYBERPASS UNIVERSAL SCANNER ── */}
            {authMode === 'passkey' && (
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-center mb-4 space-y-1">
                  <h3 className="font-display font-black text-sm uppercase tracking-widest text-red-400">
                    FOUNDER MASTER PASSKEY CLEARANCE
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Drop Founder Badge image, scan Master QR, or enter 32-character Passkey
                  </p>
                </div>

                <CyberPassScanner
                  theme="red"
                  onPasskeyDetected={handleCyberPassLogin}
                  isAuthenticating={isAuthenticatingPasskey}
                />

                <div className="mt-5 pt-3 border-t border-red-900/40 text-center w-full flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleDownloadFounderBadge}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold hover:underline transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Founder Badge (.PNG)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 2: GOOGLE AUTHENTICATOR (RFC 6238 TOTP) ── */}
            {authMode === 'totp' && (
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-display font-black text-sm uppercase tracking-widest text-red-400">
                    GOOGLE AUTHENTICATOR • 6-DIGIT TOTP
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    RFC 6238 time-based cryptographic rolling verification
                  </p>
                </div>

                {/* Direct 6-Digit Entry Card */}
                <CyberPassScanner
                  theme="red"
                  onPasskeyDetected={handleCyberPassLogin}
                  isAuthenticating={isAuthenticatingPasskey}
                />

                {/* Setup Modal Trigger */}
                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-center w-full">
                  <p className="text-[10px] text-slate-300 mb-2">
                    Need to link Google Authenticator or Microsoft Authenticator app on your phone?
                  </p>
                  <button
                    type="button"
                    onClick={handleFetchTotpSetup}
                    className="px-4 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(255,0,50,0.3)] inline-flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Scan Authenticator QR Code (One-Time Setup)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 3: FIRST-TIME FOUNDER SETUP (ANIL KUMAR) ── */}
            {authMode === 'setup' && (
              <form onSubmit={handleFounderSetupSubmit} className="space-y-4 relative z-10">
                <div className="text-center mb-2 space-y-1">
                  <h3 className="font-display font-black text-sm uppercase tracking-widest text-yellow-400">
                    INITIALIZE FOUNDER ADMIN (FIRST-TIME SETUP)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Set your custom Master Username, Email & Password to activate direct manual login
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                      Founder Username
                    </label>
                    <input
                      type="text"
                      value={setupUsername}
                      onChange={(e) => setSetupUsername(e.target.value)}
                      className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                      Founder Full Name
                    </label>
                    <input
                      type="text"
                      value={setupFullName}
                      onChange={(e) => setSetupFullName(e.target.value)}
                      className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                    Founder Admin Email
                  </label>
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                      Create Master Password (Min 8 chars)
                    </label>
                    <input
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                      Confirm Master Password
                    </label>
                    <input
                      type="password"
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-red-300/70 uppercase tracking-widest mb-1">
                    Founder Passkey Secret (Optional for initial setup)
                  </label>
                  <input
                    type="text"
                    value={setupPasskey}
                    onChange={(e) => setSetupPasskey(e.target.value)}
                    placeholder="CSX-FOUNDER-MASTER-PASSKEY-..."
                    className="w-full bg-black/60 border border-red-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none placeholder:text-red-950 uppercase"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-3 mt-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-bold tracking-[0.2em] uppercase text-xs rounded-xl border border-red-500/60 shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{setupLoading ? 'INITIALIZING FOUNDER ACCOUNT...' : '⚡ ACTIVATE FOUNDER ADMIN & ENTER CONSOLE →'}</span>
                </motion.button>
              </form>
            )}

            {/* ── TAB 4: STANDARD CREDENTIALS LOGIN ── */}
            {authMode === 'credentials' && (
              <form onSubmit={handleAdminLogin} className="space-y-5 relative z-10" autoComplete="off">
                <div className="relative group">
                  <label className="block text-[10px] text-red-300/60 uppercase tracking-[0.2em] mb-2 group-focus-within:text-red-500 transition-colors">
                    Clearance ID (Username, Email, or Mobile)
                  </label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span className="text-red-500/50 group-focus-within:text-red-500 text-sm">▶</span>
                     </div>
                     <input
                       type="text"
                       name="nexus-clearance-id"
                       autoComplete="off"
                       value={identity}
                       onChange={(e) => setIdentity(e.target.value)}
                       className="w-full bg-black/60 border border-red-900/50 rounded-lg pl-8 pr-4 py-3 text-red-100 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-red-900/80"
                       placeholder="anil-kumar or admin@cybershieldx.in"
                       required
                     />
                  </div>
                </div>

                <div className="relative group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] text-red-300/60 uppercase tracking-[0.2em] group-focus-within:text-red-500 transition-colors">
                      Master Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span className="text-red-500/50 group-focus-within:text-red-500 text-sm">▶</span>
                    </div>
                    <input
                      type="password"
                      name="nexus-passkey"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-red-900/50 rounded-lg pl-8 pr-4 py-3 text-red-100 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-red-900/80"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600/20 text-red-400 font-bold tracking-[0.2em] uppercase text-sm border border-red-500/50 shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all duration-300 disabled:opacity-50 rounded-xl"
                >
                  {loading ? 'AUTHENTICATING...' : 'ESTABLISH UPLINK →'}
                </motion.button>
              </form>
            )}

            <div className="mt-8 pt-5 border-t border-red-900/40 text-center relative z-10 flex items-center justify-between text-[10px] text-red-400/60 font-mono">
              <span>SECURITY LEVEL: ZERO-TRUST</span>
              <span>RESTRICTED ACCESS</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Founder Master Badge Modal */}
      {showBadgeModal && founderBadge && (
        <CyberBadgeModal
          badge={founderBadge}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

      {/* Google Authenticator QR Code Setup Modal */}
      {showTotpModal && totpSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0a0204] border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(255,0,50,0.3)] text-center relative"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <h3 className="font-display font-black text-sm text-white tracking-widest uppercase">
                GOOGLE AUTHENTICATOR SETUP
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mb-4">
              Scan this QR code with Google Authenticator or Microsoft Authenticator app on your phone.
            </p>

            <div className="p-3 bg-white rounded-xl inline-block shadow-[0_0_20px_rgba(0,191,255,0.4)] mb-3">
              <img
                src={totpSetup.qrDataUrl}
                alt="Google Authenticator QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            {/* Clear New User Guidance Box */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3 mb-3 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  How to setup on your phone:
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[9px] text-cyan-300 underline hover:text-white"
                >
                  Need Help?
                </button>
              </div>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">
                1. Search for <strong>"Google Authenticator"</strong> on Google Play Store or Apple App Store and install it.
              </p>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">
                2. Open the app, tap the <strong>"+" (Plus)</strong> button, and choose <strong>"Scan a QR code"</strong>.
              </p>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">
                3. Point your camera at this QR code. It will instantly start generating rolling 6-digit codes!
              </p>
            </div>

            <div className="bg-black/60 border border-red-900/60 rounded-xl p-3 mb-4 text-left">
              <p className="text-[9px] uppercase tracking-wider text-red-400 font-bold mb-1">
                Manual Setup Key (If Camera is unavailable):
              </p>
              <div className="flex items-center justify-between">
                <code className="text-white font-mono text-xs font-bold tracking-widest select-all">
                  {totpSetup.secret}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSetup.secret);
                    toast.success('Secret key copied!');
                  }}
                  className="px-2 py-1 text-[10px] bg-red-600/30 text-red-300 rounded hover:bg-red-600/50"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTotpModal(false);
                setAuthMode('totp');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,50,0.4)]"
            >
              Done Scanning • Enter 6-Digit Code →
            </button>
          </motion.div>
        </div>
      )}

      {/* Security Help & Authentication Manual Modal */}
      <SecurityHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
