import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TEAM = [
  {
    id: 'anil-kumar',
    name: 'Anil Kumar',
    role: 'Founder & Cybersecurity Analyst',
    color: '00bfff',
    isFounder: true,
    initials: 'AK',
    clearance: 'FOUNDER & LEAD',
    status: 'ONLINE',
    focus: 'THREAT INTELLIGENCE & CORE ARCHITECTURE'
  },
  {
    id: 'suryansh',
    name: 'Suryansh',
    role: 'Data Analyst',
    color: '00ff88',
    initials: 'SY',
    clearance: 'CORE SPECIALIST',
    status: 'ONLINE',
    focus: 'DATA INTELLIGENCE & THREAT ANALYSIS'
  },
  {
    id: 'aryan-patel',
    name: 'Aryan Patel',
    role: 'AI & Machine Learning',
    color: 'ff8c00',
    initials: 'AP',
    clearance: 'CORE SPECIALIST',
    status: 'ONLINE',
    focus: 'AI SECURITY MODELS & THREAT DETECTION'
  },
  {
    id: 'pranav',
    name: 'Pranav',
    role: 'Data Analyst',
    color: 'b400ff',
    initials: 'PR',
    clearance: 'CORE SPECIALIST',
    status: 'ONLINE',
    focus: 'DATA ANALYTICS & SECURITY TELEMETRY'
  },
  {
    id: 'ankita',
    name: 'Ankita',
    role: 'Network Analyst',
    color: 'ff2244',
    initials: 'AN',
    clearance: 'CORE SPECIALIST',
    status: 'ONLINE',
    focus: 'NETWORK SECURITY & DIGITAL FORENSICS'
  },
  {
    id: 'sushant',
    name: 'Sushant',
    role: 'Data Analyst',
    color: '00ff88',
    initials: 'SU',
    clearance: 'CORE SPECIALIST',
    status: 'ONLINE',
    focus: 'DATA ANALYTICS & THREAT CORRELATION'
  }
];

const COLOR_MAP = {
  '00bfff': {
    hex: '#00bfff',
    border: 'border-[#00bfff]/40',
    hoverBorder: 'hover:border-[#00bfff]',
    glow: 'shadow-[0_0_20px_rgba(0,191,255,0.25)]',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,191,255,0.45)]',
    text: 'text-[#00bfff]',
    bg: 'bg-[#00bfff]/10',
    gradient: 'from-[#00bfff]/25 via-[#00bfff]/5 to-transparent',
    badge: 'bg-[#00bfff]/15 text-[#00bfff] border-[#00bfff]/30'
  },
  '00ff88': {
    hex: '#00ff88',
    border: 'border-[#00ff88]/40',
    hoverBorder: 'hover:border-[#00ff88]',
    glow: 'shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,255,136,0.4)]',
    text: 'text-[#00ff88]',
    bg: 'bg-[#00ff88]/10',
    gradient: 'from-[#00ff88]/25 via-[#00ff88]/5 to-transparent',
    badge: 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30'
  },
  'ff8c00': {
    hex: '#ff8c00',
    border: 'border-[#ff8c00]/40',
    hoverBorder: 'hover:border-[#ff8c00]',
    glow: 'shadow-[0_0_20px_rgba(255,140,0,0.2)]',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,140,0,0.4)]',
    text: 'text-[#ff8c00]',
    bg: 'bg-[#ff8c00]/10',
    gradient: 'from-[#ff8c00]/25 via-[#ff8c00]/5 to-transparent',
    badge: 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/30'
  },
  'b400ff': {
    hex: '#b400ff',
    border: 'border-[#b400ff]/40',
    hoverBorder: 'hover:border-[#b400ff]',
    glow: 'shadow-[0_0_20px_rgba(180,0,255,0.2)]',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(180,0,255,0.4)]',
    text: 'text-[#b400ff]',
    bg: 'bg-[#b400ff]/10',
    gradient: 'from-[#b400ff]/25 via-[#b400ff]/5 to-transparent',
    badge: 'bg-[#b400ff]/15 text-[#b400ff] border-[#b400ff]/30'
  },
  'ff2244': {
    hex: '#ff2244',
    border: 'border-[#ff2244]/40',
    hoverBorder: 'hover:border-[#ff2244]',
    glow: 'shadow-[0_0_20px_rgba(255,34,68,0.2)]',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,34,68,0.4)]',
    text: 'text-[#ff2244]',
    bg: 'bg-[#ff2244]/10',
    gradient: 'from-[#ff2244]/25 via-[#ff2244]/5 to-transparent',
    badge: 'bg-[#ff2244]/15 text-[#ff2244] border-[#ff2244]/30'
  }
};

// Cyber Bracket HUD Element
const HudBrackets = ({ colorStyle }) => (
  <>
    <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 ${colorStyle.border} pointer-events-none rounded-tl-xs z-20`} />
    <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 ${colorStyle.border} pointer-events-none rounded-tr-xs z-20`} />
    <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 ${colorStyle.border} pointer-events-none rounded-bl-xs z-20`} />
    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 ${colorStyle.border} pointer-events-none rounded-br-xs z-20`} />
  </>
);

// Tactical Cyber Analyst Avatar Component with Concentric Radar HUD Rings (78px Diameter)
const CyberAvatar = ({ color, initials, id, size = 78 }) => {
  const hex = COLOR_MAP[color]?.hex || '#00bfff';

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Layer 1: Outer Radar Sweep Animation Ring */}
      <svg className="absolute inset-0 w-full h-full animate-[spin_14s_linear_infinite] pointer-events-none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" fill="none" stroke={hex} strokeWidth="1" strokeDasharray="6 12" opacity="0.35" />
        <circle cx="50" cy="50" r="41" fill="none" stroke={hex} strokeWidth="1.5" strokeDasharray="40 160" opacity="0.8" />
      </svg>

      {/* Layer 2: Concentric Radar Ticks Ring */}
      <svg className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite_reverse] pointer-events-none opacity-40" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="37" fill="none" stroke={hex} strokeWidth="1" strokeDasharray="3 6" />
      </svg>

      {/* Layer 3: Cyber Visor & Silhouette Badge Frame */}
      <div 
        className="w-[82%] h-[82%] rounded-full bg-gradient-to-b from-[#0e1d35] via-[#050d1a] to-[#020712] border-2 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:scale-105 transition-transform"
        style={{ borderColor: `${hex}85`, boxShadow: `0 0 20px ${hex}40` }}
      >
        {/* Faint Background Circuit Micro-Grid */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:5px_5px]" />

        {/* Tactical Cyber Visor Vector */}
        <svg viewBox="0 0 64 64" fill="none" className="w-[72%] h-[72%] relative z-10">
          <path d="M32 10C21 10 16 18 16 28C16 38 21 44 32 46C43 44 48 38 48 28C48 18 43 10 32 10Z" fill={`${hex}20`} stroke={hex} strokeWidth="1.5" />
          
          {(id === 'suryansh' || id === 'sushant') && (
            <>
              <path d="M20 25C24 23 40 23 44 25C42 29 38 31 32 31C26 31 22 29 20 25Z" fill={hex} opacity="0.9" />
              <circle cx="26" cy="27" r="1.5" fill="#fff" />
              <circle cx="32" cy="27" r="1.5" fill="#fff" />
              <circle cx="38" cy="27" r="1.5" fill="#fff" />
            </>
          )}

          {id === 'aryan-patel' && (
            <>
              <path d="M20 25C24 23 40 23 44 25C42 29 38 31 32 31C26 31 22 29 20 25Z" fill={hex} opacity="0.9" />
              <path d="M24 27L32 24L40 27" stroke="#fff" strokeWidth="1" />
            </>
          )}

          {id === 'pranav' && (
            <>
              <path d="M20 25C24 23 40 23 44 25C42 29 38 31 32 31C26 31 22 29 20 25Z" fill={hex} opacity="0.9" />
              <path d="M22 27H42" stroke="#fff" strokeWidth="1" strokeDasharray="2 2" />
            </>
          )}

          {id === 'ankita' && (
            <>
              <path d="M20 25C24 23 40 23 44 25C42 29 38 31 32 31C26 31 22 29 20 25Z" fill={hex} opacity="0.9" />
              <polygon points="32,23 37,27 32,30 27,27" fill="#fff" opacity="0.9" />
            </>
          )}

          {(!id || id === 'anil-kumar') && (
            <>
              <path d="M20 25C24 23 40 23 44 25C42 29 38 31 32 31C26 31 22 29 20 25Z" fill={hex} opacity="0.95" />
              <circle cx="32" cy="27" r="2.5" fill="#ffffff" />
            </>
          )}

          <path d="M10 56C12 46 20 44 32 44C44 44 52 46 54 56" stroke={hex} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.65" />
        </svg>

        {/* Initials Badge Overlay */}
        <span 
          className="absolute bottom-0.5 right-1 text-[8px] font-mono font-black px-1 rounded border bg-black/90 text-white shadow-sm"
          style={{ borderColor: `${hex}90` }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
};

// Reusable Core Team Card Component (Sized h-[320px] for Prominent Desktop SOC Dashboard Visual Impact)
const CoreTeamCard = ({ member, onClick, idx }) => {
  const style = COLOR_MAP[member.color] || COLOR_MAP['00bfff'];
  const memberId = member.name.split(' ')[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      whileHover={{ y: -3 }}
      onClick={() => onClick(member)}
      className={`
        relative group cursor-pointer bg-gradient-to-b from-[#0a1628]/95 via-[#050d1a]/98 to-[#020814]/98 backdrop-blur-xl
        border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 overflow-hidden shadow-2xl
        h-[320px] min-h-[320px] max-h-[320px] w-full
        ${style.border} ${style.hoverBorder} ${style.glow} ${style.hoverGlow}
      `}
    >
      <HudBrackets colorStyle={style} />

      {/* Faint Internal Scanline & Circuit Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.6)_51%)] [background-size:100%_4px]" />
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* TOP METADATA: ID & ONLINE STATUS */}
      <div className="flex items-center justify-between text-[9px] font-mono tracking-widest mb-1.5 border-b border-white/10 pb-1.5 relative z-10">
        <span className="text-white/80 font-bold uppercase">ID: {memberId}</span>
        <span className="inline-flex items-center gap-1.5 text-[#00ff88] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
          ● ONLINE
        </span>
      </div>

      {/* CENTER: CYBER AVATAR, NAME, ROLE BADGE & SPECIALIZATION */}
      <div className="flex flex-col items-center text-center my-auto space-y-1.5 relative z-10">
        {/* Cyber Avatar Component */}
        <CyberAvatar color={member.color} initials={member.initials} id={member.id} size={78} />

        {/* Member Name (High-Contrast Display Typography) */}
        <h3 className="font-display text-base sm:text-lg font-black text-white uppercase tracking-wider group-hover:text-[#00bfff] transition-colors truncate w-full pt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {member.name}
        </h3>

        {/* Role Designation Badge */}
        <span className={`inline-block text-[9px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border shadow-sm ${style.badge}`}>
          [ {member.role.toUpperCase()} ]
        </span>

        {/* Technical Specialization Field (Fixed 30px height box) */}
        <div className="h-[30px] flex items-center justify-center text-center w-full px-1">
          <p className="text-[9px] sm:text-[10px] text-cyber-muted font-mono uppercase tracking-wider leading-tight line-clamp-2">
            {member.focus}
          </p>
        </div>
      </div>

      {/* BOTTOM SECURITY BAR: CLEARANCE & INTERACTIVE ACTION */}
      <div className="mt-auto pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-cyber-muted relative z-10">
        <span className="uppercase tracking-wider">ROLE: <strong className="text-white font-bold">{member.clearance}</strong></span>
        <span className={`${style.text} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-bold uppercase tracking-wider`}>
          VIEW PROFILE →
        </span>
      </div>
    </motion.div>
  );
};

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState(null);
  const navigate = useNavigate();

  const founder = TEAM.find(t => t.isFounder);
  const coreMembers = TEAM.filter(t => !t.isFounder);

  return (
    <div className="w-full min-h-screen bg-[#020814] text-cyber-text font-mono relative overflow-x-hidden flex flex-col justify-between py-2 px-3 sm:px-6">
      
      {/* Background Cyber Grid & Glow Orbs */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 191, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 191, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-[#00bfff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-[#00ff88]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container - Compact 100vh Desktop Viewport Composition */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col my-auto space-y-2.5 sm:space-y-3">
        
        {/* HEADER SECTION (Compact) */}
        <header className="text-center space-y-0.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#00bfff]/10 border border-[#00bfff]/30 text-[#00bfff] text-[10px] uppercase tracking-[0.3em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00bfff] animate-pulse" />
            LEADERSHIP & TALENT
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-white uppercase">
            OUR <span className="text-[#00bfff] drop-shadow-[0_0_12px_rgba(0,191,255,0.4)]">CORE TEAM</span>
          </h1>
          <p className="text-[10px] text-cyber-muted max-w-xl mx-auto uppercase tracking-wider leading-tight">
            The analysts, engineers, and visionaries securing the CyberShield X platform.
          </p>
        </header>

        {/* FOUNDER SECTION */}
        {founder && (() => {
          const style = COLOR_MAP[founder.color];
          return (
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedMember(founder)}
                className={`
                  relative group cursor-pointer w-full max-w-md bg-gradient-to-b from-[#0a1628]/90 via-[#050d1a]/95 to-[#020814]/95 backdrop-blur-xl
                  border rounded-xl p-3.5 transition-all duration-300 text-center shadow-2xl overflow-hidden
                  ${style.border} ${style.hoverBorder} ${style.glow} ${style.hoverGlow}
                `}
              >
                <HudBrackets colorStyle={style} />
                
                {/* Header Status Bar inside Founder Card */}
                <div className="flex items-center justify-between text-[9px] text-cyber-muted uppercase tracking-widest mb-2 border-b border-white/10 pb-1.5">
                  <span className="text-[#00bfff] font-bold">★ FOUNDER & LEAD ★</span>
                  <span className="inline-flex items-center gap-1.5 text-[#00ff88] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    ● ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 relative z-10">
                  {/* Cyber Avatar HUD Badge */}
                  <div className="shrink-0">
                    <CyberAvatar color={founder.color} initials={founder.initials} id={founder.id} size={70} />
                  </div>

                  {/* Founder Details */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-display font-black text-white uppercase tracking-wide group-hover:text-[#00bfff] transition-colors truncate">
                        {founder.name}
                      </h3>
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-[#00bfff]/30 bg-[#00bfff]/10 text-[#00bfff] uppercase font-bold">
                        FOUNDER
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#00bfff] uppercase tracking-wider mt-0.5">
                      {founder.role}
                    </p>
                    <p className="text-[10px] text-cyber-muted uppercase tracking-wider mt-0.5 line-clamp-1">
                      {founder.focus}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-cyber-muted font-mono relative z-10">
                  <span>ROLE: <strong className="text-white">{founder.clearance}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/nexus-admin');
                      }}
                      className="px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:border-red-400 transition-all font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                      title="Authorized Founder / SecOps Portal Access"
                    >
                      ADMIN CONSOLE →
                    </button>
                    <span className="text-[#00bfff] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 font-bold uppercase">
                      VIEW PROFILE →
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Hierarchy Tree Visual Line */}
              <div className="w-[2px] h-3 bg-gradient-to-b from-[#00bfff]/60 via-[#00bfff]/20 to-transparent my-0.5" />
            </div>
          );
        })()}

        {/* SECTION BANNER: CORE TEAM */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative bg-[#020814] px-4 flex items-center gap-2">
            <span className="text-[#00bfff] text-xs">★</span>
            <h2 className="font-display text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase">
              CORE TEAM <span className="text-cyber-muted font-normal">| THE PEOPLE SECURING CYBERSHIELD X</span>
            </h2>
            <span className="text-[#00bfff] text-xs">★</span>
          </div>
        </div>

        {/* 5 CORE TEAM MEMBERS GRID (1 Row on Desktop: lg:grid-cols-5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 lg:gap-4 w-full">
          {coreMembers.map((member, idx) => (
            <CoreTeamCard
              key={member.id}
              member={member}
              onClick={setSelectedMember}
              idx={idx}
            />
          ))}
        </div>

      </div>

      {/* FOOTER METADATA BAR (Compact) */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full pt-2 mt-1 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] text-cyber-muted font-mono uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
          CYBERSHIELD X · CORE SECURITY TEAM
        </div>
        <div>
          CYBERSHIELD X LEADERSHIP & ENGINEERING
        </div>
      </footer>

      {/* CONTACT DOSSIER DIALOG MODAL OVERLAY (Preserved Functionality) */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#070f21] border border-[#00bfff]/40 p-6 rounded-2xl max-w-md w-full relative shadow-[0_0_40px_rgba(0,191,255,0.2)] font-mono"
            >
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-cyber-muted hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                ✕
              </button>

              {/* Dossier Header */}
              <div className="flex items-center gap-4 mb-5 border-b border-white/10 pb-4">
                <CyberAvatar color={selectedMember.color} initials={selectedMember.initials} id={selectedMember.id} size={64} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-black text-white uppercase">{selectedMember.name}</h3>
                    {selectedMember.isFounder && (
                      <span className="text-[8px] bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/40 px-1.5 py-0.5 rounded font-bold uppercase">
                        FOUNDER
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: COLOR_MAP[selectedMember.color]?.hex || '#00bfff' }}>
                    {selectedMember.role}
                  </p>
                  <p className="text-[10px] text-cyber-muted uppercase mt-1">
                    {selectedMember.focus}
                  </p>
                </div>
              </div>

              {/* Dossier Security Metadata */}
              <div className="space-y-3 font-mono text-xs text-cyber-muted bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="uppercase text-[10px] tracking-wider">Role:</span>
                  <span className="text-white uppercase font-bold">{selectedMember.clearance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="uppercase text-[10px] tracking-wider">Status:</span>
                  <span className="text-[#00ff88] uppercase font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                    {selectedMember.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="uppercase text-[10px] tracking-wider">Specialization:</span>
                  <span className="text-[#00bfff] uppercase font-bold text-[10px] text-right">{selectedMember.focus}</span>
                </div>
              </div>

              <div className="mt-5 text-center text-[10px] text-cyber-muted uppercase tracking-widest">
                CYBERSHIELD X CORE TEAM · VERIFIED
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
