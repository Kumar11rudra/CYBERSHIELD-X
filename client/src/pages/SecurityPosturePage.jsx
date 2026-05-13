import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';

const SECURITY_LAYERS = [
  {
    title: 'Zero-Log Infrastructure',
    desc: 'Our servers never store your scan history, personal metadata, or target credentials. Every session is ephemeral and wiped upon completion.',
    icon: '🕵️',
    color: 'from-blue-500/20 to-cyber-accent/20',
    tag: 'PRIVACY',
    details: ['No Scan Retention', 'Ephemeral Sessions', 'Zero IP Tracking', 'Auto-Wipe Protocols']
  },
  {
    title: 'Quantum-Safe Encryption',
    desc: 'All data in transit and at rest is protected by AES-256-GCM and RSA-4096 algorithms, ensuring military-grade protection against brute force.',
    icon: '🔐',
    color: 'from-purple-500/20 to-pink-500/20',
    tag: 'DATA SEC',
    details: ['AES-256-GCM', 'RSA-4096 Key Exchange', 'Bcrypt Hashing', 'Quantum-Resistant Layer']
  },
  {
    title: 'AI Threat Hunting',
    desc: 'Continuous real-time monitoring using neural networks to identify and block suspicious patterns before they reach your workspace.',
    icon: '🤖',
    color: 'from-cyber-green/20 to-emerald-500/20',
    tag: 'REAL-TIME',
    details: ['Neural Pattern ID', 'Real-time WAF', 'DDoS Protection', 'Anomaly Detection']
  },
  {
    title: 'Multi-Layer Authentication',
    desc: 'Enforce biometric and hardware-based MFA (U2F/WebAuthn) to ensure that only verified personnel can access the Nexus Command Center.',
    icon: '🆔',
    color: 'from-orange-500/20 to-red-500/20',
    tag: 'ACCESS',
    details: ['MFA Enforcement', 'Biometric Support', 'U2F Compatibility', 'Secure Session Lock']
  },
  {
    title: 'E2EE Secure Tunneling',
    desc: 'Communication between your browser and our backend is tunneled through end-to-end encrypted WebSocket layers for tamper-proof logs.',
    icon: '🛡️',
    color: 'from-blue-600/20 to-cyan-500/20',
    tag: 'NETWORK',
    details: ['TLS 1.3 Strict', 'Encrypted WebSockets', 'Custom VPN Overlay', 'Tamper-Proof Stream']
  },
  {
    title: 'GDPR & Global Compliance',
    desc: 'Fully aligned with GDPR, CERT-In advisories, and App Store safety guidelines to protect user rights and regional data sovereignty.',
    icon: '⚖️',
    color: 'from-gray-500/20 to-gray-400/20',
    tag: 'COMPLIANCE',
    details: ['GDPR Compliant', 'CERT-In Aligned', 'App Store Ready', 'Data Sovereignty']
  }
];

export default function SecurityPosturePage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-cyber-bg text-white selection:bg-cyber-accent/30 selection:text-white">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#ff224422_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZjIyNDQiLz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* HEADER */}
        <header className="text-center mb-24">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block mb-6"
          >
            <BrandLogo size={100} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display text-4xl md:text-6xl font-black tracking-tighter mb-4 italic uppercase"
          >
            Nexus Elite <span className="text-cyber-accent">Security Protocols</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-sm text-cyber-muted tracking-[0.2em] uppercase max-w-3xl mx-auto leading-relaxed"
          >
            Transparently detailing the A-Z defensive architecture protecting the CyberShield X ecosystem.
          </motion.p>
        </header>

        {/* STATS STRIP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Platform', path: '/login' },
            { label: 'Security', path: '/security' },
            { label: 'Live Modules', path: '/login' },
            { label: 'Create Account', path: '/signup' },
            ...(user?.role === 'admin' ? [{ label: 'Admin Portal', path: '/nexus-admin' }] : [])
          ].map((item, i) => (
            <Link key={i} to={item.path} style={{
              color: '#cbd5e1', textDecoration: 'none', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.3s'
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#00bfff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; }}
            >
              {item.label}
            </Link>
          ))}
        </div>
     {/* SECURITY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {SECURITY_LAYERS.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group p-8 rounded-2xl bg-gradient-to-br border border-white/10 hover:border-cyber-accent/50 transition-all overflow-hidden shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${layer.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-4xl">{layer.icon}</span>
                  <span className="text-[9px] font-bold text-cyber-accent bg-cyber-accent/10 border border-cyber-accent/20 px-2 py-1 rounded">{layer.tag}</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-3 tracking-tight">{layer.title}</h3>
                <p className="font-mono text-sm text-cyber-muted mb-6 leading-relaxed">
                  {layer.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {layer.details.map((d, di) => (
                    <span key={di} className="text-[10px] font-mono uppercase bg-black/40 border border-white/10 px-2 py-1 rounded text-cyber-accent">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* INFRASTRUCTURE DIAGRAM PLACEHOLDER / CALL TO ACTION */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-cyber-accent/5 border border-cyber-accent/20 rounded-3xl p-12 text-center"
        >
          <div className="inline-block px-4 py-1 bg-cyber-accent/20 text-cyber-accent rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-6 border border-cyber-accent/30">
            Certified Defense
          </div>
          <h2 className="text-3xl font-display font-bold mb-6">Built for High-Stakes Operations</h2>
          <p className="font-mono text-sm text-cyber-muted max-w-3xl mx-auto mb-10 leading-relaxed uppercase tracking-wider">
            Our infrastructure is hardened against SQLi, NoSQLi, XSS, and CSRF attacks. Every byte of data passed through our Nexus nodes is treated with extreme data-hygiene protocols.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/signup" className="px-8 py-4 bg-cyber-accent text-cyber-bg font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all uppercase tracking-widest text-sm">
              Launch Shield
            </Link>
            <Link to="/login" className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest text-sm">
              Log in to Nexus
            </Link>
          </div>
        </motion.div>

        {/* FOOTER LINK */}
        <div className="mt-20 text-center">
          <Link to="/" className="font-mono text-xs text-cyber-muted hover:text-cyber-accent tracking-[0.3em] uppercase transition-all">
            ← Return to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
