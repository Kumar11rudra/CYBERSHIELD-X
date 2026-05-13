import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import BrandLogo from '../components/common/BrandLogo';

export default function AdminLoginPage() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, user } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(identity, password);
      toast.success('Central Command Access Granted');
      navigate('/nexus-admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };


  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/nexus-admin/dashboard');
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
          <div className="relative">
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 border-2 border-dashed border-red-500/40 rounded-full"
            />
            <BrandLogo size={140} color="#ef4444" />
          </div>
        </motion.div>

        <div className="z-10 mt-20 text-center max-w-lg relative">
          <h2 className="font-display text-5xl font-bold text-red-500 tracking-widest mb-4 uppercase" style={{ textShadow: '0 0 20px rgba(255,0,0,0.4)' }}>
            NEXUS <br/><span className="text-white">COMMAND</span>
          </h2>
          <div className="w-16 h-1 bg-red-600 mx-auto mb-6 opacity-80" />
          <p className="text-sm text-red-400/70 leading-relaxed uppercase tracking-widest">
            Level 5 Security Clearance Required. <br />
            All telemetry is monitored and recorded.
          </p>
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-between items-end border-t border-red-900/40 pt-4">
          <div>
            <p className="text-[10px] text-red-500 font-bold tracking-[0.3em] mb-1 animate-pulse">RESTRICTED AREA</p>
            <p className="text-[9px] text-red-500/50 tracking-[0.3em] uppercase">Auth node protocol active</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-white/50 tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
               SYSTEM ENCRYPTED
             </p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT HEMISPHERE: Glassmorphism Red Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 bg-gradient-to-l from-black/90 to-transparent">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md relative"
        >
          {/* Mobile Header Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex justify-center mb-4 relative drop-shadow-[0_0_30px_rgba(255,0,0,0.5)]">
              <BrandLogo size={60} color="#ef4444" />
            </div>
            <h1 className="font-display text-3xl font-bold text-red-500 tracking-widest">NEXUS COMMAND</h1>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-3xl border border-red-500/20 p-8 md:p-10 rounded-2xl shadow-[0_8px_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
            
            {/* High-Tech Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500/80 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500/80 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500/80 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500/80 rounded-br-xl" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-[70px] pointer-events-none" />

            <div className="relative z-10 mb-8 border-b border-red-500/20 pb-4">
              <h2 className="font-display text-xl text-white tracking-[0.2em] mb-1 font-bold">ADMIN CLEARANCE</h2>
              <p className="text-[10px] text-red-400 tracking-widest uppercase">Identity Verification</p>
            </div>

            {/* Hidden honeypot fields — block browser autofill */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input type="text" name="username" tabIndex="-1" />
              <input type="password" name="password" tabIndex="-1" />
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6 relative z-10" autoComplete="off">
              <div className="relative group">
                <label className="block text-[10px] text-red-300/60 uppercase tracking-[0.2em] mb-2 group-focus-within:text-red-500 transition-colors">
                  Clearance ID (Email or Mobile)
                </label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-red-500/50 group-focus-within:text-red-500 text-sm">▶</span>
                   </div>
                   <input
                     type="text"
                     name="nexus-clearance-id"
                     autoComplete="off"
                     data-lpignore="true"
                     data-form-type="other"
                     value={identity}
                     onChange={(e) => setIdentity(e.target.value)}
                     className="w-full bg-black/60 border border-red-900/50 rounded-md pl-8 pr-4 py-3 text-red-100 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-red-900/80 uppercase"
                     placeholder="ADMIN@NEXUS.IO / +91XXXXXXXXXX"
                     required
                   />
                </div>
              </div>

              <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] text-red-300/60 uppercase tracking-[0.2em] group-focus-within:text-red-500 transition-colors">
                    Security Passkey
                  </label>
                  <Link to="/forgot-password" className="text-[9px] uppercase tracking-widest text-red-400/60 hover:text-red-500 transition-colors">
                    Forgot Passkey?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-red-500/50 group-focus-within:text-red-500 text-sm">▶</span>
                  </div>
                  <input
                    type="password"
                    name="nexus-passkey"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-red-900/50 rounded-md pl-8 pr-4 py-3 text-red-100 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-red-900/80"
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
                className="w-full py-3.5 mt-6 bg-red-600/20 text-red-500 font-bold tracking-[0.2em] uppercase text-sm border border-red-500/50 shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all duration-300 disabled:opacity-50 relative overflow-hidden group rounded-sm"
              >
                {loading ? 'AUTHENTICATING...' : 'ESTABLISH UPLINK'}
                <div className="absolute inset-0 -translate-y-full group-hover:animate-[scanLine_2s_infinite] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
              </motion.button>
            </form>

            <div className="mt-10 pt-6 border-t border-red-900/40 text-center relative z-10">
              <p className="text-[8px] text-red-500/40 tracking-[0.3em] mb-3 uppercase">Secure Authentication Gateway</p>
              <p className="text-[9px] text-red-400/80 uppercase tracking-[0.1em]">
                Unauthorized access is strictly prohibited.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
