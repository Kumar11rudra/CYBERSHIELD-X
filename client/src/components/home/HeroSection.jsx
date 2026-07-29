import { motion } from "framer-motion";
import Counter from "./Counter";
import React from "react";
import ThemeToggle from "../common/ThemeToggle";

export default function HeroSection({
  typedText,
  stats,
  t,
  navigate,
}) {
  return (
    <>
      {/* ── HERO ── */}
	      <section className="homepage-hero" style={{ 
	        position: 'relative', 
	        zIndex: 2, 
        minHeight: 'clamp(560px, 58vh, 640px)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
	        justifyContent: 'flex-start', 
		        padding: '56px 24px 36px', 
        textAlign: 'center',
	        overflow: 'hidden'
	      }}>
		        <div className="absolute right-5 top-8 z-30 sm:right-8">
	          <ThemeToggle className="!bg-cyber-card !text-cyber-text shadow-lg shadow-cyber-accent/5" />
	        </div>

		        {/* Subtle static background grid */}
	        <div 
	          style={{
	            position: 'absolute', inset: 0,
	            backgroundImage: 'linear-gradient(rgba(0, 71, 65, 0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(0, 71, 65, 0.008) 1px,transparent 1px)',
	            backgroundSize: '64px 64px',
	            pointerEvents: 'none'
	          }} 
	        />

        {/* Ambient Top Glow */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '-10%', 
            left: '30%', 
            width: 500, 
            height: 500, 
	            background: 'radial-gradient(circle,rgba(0, 71, 65, 0.025) 0%,transparent 70%)', 
            borderRadius: '50%', 
            pointerEvents: 'none' 
          }} 
          className="animate-[pulse-slow_6s_infinite]"
        />

        {/* Subtle Floating Interactive Node Dots */}
	        <div className="absolute inset-0 pointer-events-none opacity-10">
          <motion.div 
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-cyber-accent"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-cyber-accent"
          />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-cyber-accent"
          />
        </div>

        {/* Operational Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
	          className="inline-flex items-center gap-2 border border-cyber-accent/20 bg-cyber-accent/5 rounded-full px-4 py-1.5 mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-cyber-green display-inline-block shadow-[0_0_8px_rgba(34,139,94,0.5)]" />
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-cyber-accent font-bold">
            Enterprise Security Suite
          </span>
          <span className="w-2 h-2 rounded-full bg-cyber-green display-inline-block animate-ping" />
        </motion.div>

        {/* Brand Headline */}
        <motion.h1
          className="font-display text-cyber-text"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            fontSize: 'clamp(32px, 6vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.1,
	            margin: '0 0 12px',
            letterSpacing: '-0.03em',
            position: 'relative',
            zIndex: 2,
          }}
        >
          CYBER
          <span className="text-cyber-accent" style={{ marginLeft: '0.15em' }}> SHIELD</span>
          <span className="text-cyber-accent/60 text-[0.8em] ml-1"> X</span>
        </motion.h1>

        {/* Dynamic Typewriter Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
	          className="text-xs text-cyber-muted font-mono tracking-widest uppercase mb-2 min-h-[22px]"
        >
          {typedText}<span className="text-cyber-accent animate-pulse">|</span>
        </motion.p>

        {/* Value Proposition Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
	          className="text-sm text-cyber-muted font-body leading-relaxed mb-4 max-w-xl"
        >
          An enterprise-grade, high-performance security diagnostic environment. Monitor exposures, audit SSL grade parameters, map subdomain namespaces, and coordinate mitigation playbooks.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
	          className="flex gap-4 flex-wrap justify-center mb-6"
        >
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-cyber-accent hover:shadow-[0_4px_20px_rgba(0,71,65,0.2)] text-cyber-bg font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-transparent border border-cyber-accent/30 text-cyber-accent font-display text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cyber-accent/5 transition-all"
          >
            Create Account
          </button>
        </motion.div>

        {/* Global Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="flex gap-8 flex-wrap justify-center relative z-10"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center min-w-[100px]">
              <div
                className="font-display text-2xl md:text-3xl font-black text-cyber-text"
                style={{ color: `var(--cyber-${s.color})` }}
              >
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[9px] text-cyber-muted font-mono tracking-widest uppercase mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

      </section>
    </>
  );
}
