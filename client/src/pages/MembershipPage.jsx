import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { fadeUp, stagger } from '../utils/motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Citizen Guard',
    price: '₹0',
    subtitle: 'Essential protection for everyone',
    features: [
      'Basic URL & IP Scanning',
      'Breach Checker (Manual)',
      'Community Threat Intel',
      'Email Identity Check',
      'Standard PDF Reports'
    ],
    button: 'Current Plan',
    accent: 'cyber-muted',
    premium: false
  },
  {
    id: 'pro',
    name: 'Nexus Professional',
    price: '₹499/mo',
    subtitle: 'Advanced tools for power users',
    features: [
      'Everything in Free',
      'AI Forensic Deep-Dive (Gemini)',
      'Dark Web Monitor (5 targets)',
      'Priority Scan Infrastructure',
      'Advanced Homograph Detection',
      'Ad-Free Experience'
    ],
    button: 'Upgrade to Pro',
    accent: 'cyber-accent',
    premium: true,
    highlight: true
  },
  {
    id: 'elite',
    name: 'CyberShield Elite',
    price: '₹1,499/mo',
    subtitle: 'Military-grade digital fortress',
    features: [
      'Everything in Pro',
      'Unlimited Dark Web Monitoring',
      'Dedicated Security Concierge (AI)',
      'White-label PDF Reports',
      'Early Access to Zero-Day Alerts',
      '24/7 Priority Support'
    ],
    button: 'Join the Elite',
    accent: 'cyber-gold',
    premium: true,
    gold: true
  }
];

export default function MembershipPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleSubscribe = (id) => {
    if (id === 'free') return;
    toast.success(`Redirecting to Secure Payment Gateway for ${id.toUpperCase()}...`, {
        icon: '💳'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
      <motion.div initial="hidden" animate="show" variants={stagger(0.1)} className="text-center space-y-6">
        <motion.p variants={fadeUp} className="font-mono text-xs text-cyber-accent uppercase tracking-[0.4em]">
          ELEVATE YOUR DEFENSES
        </motion.p>
        <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl text-white font-black tracking-tighter">
          NEXUS <span className="text-cyber-accent">MEMBERSHIP</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="font-mono text-xs text-cyber-muted max-w-2xl mx-auto leading-relaxed">
          Unlock the world's first premium cybersecurity intelligence ecosystem. Move beyond basic scanning to proactive elite digital warfare defense.
        </motion.p>
      </motion.div>

      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={stagger(0.15)} 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {plans.map((plan) => (
          <motion.div 
            key={plan.id}
            variants={fadeUp}
            className={`cyber-card p-10 flex flex-col gap-8 relative overflow-hidden group ${
                plan.highlight ? 'border-cyber-accent/50 shadow-[0_0_40px_rgba(0,212,255,0.1)]' : ''
            } ${plan.gold ? 'border-cyber-gold/50 shadow-[0_0_40px_rgba(255,215,0,0.1)]' : ''}`}
          >
            {plan.highlight && (
                <div className="absolute top-4 right-4 bg-cyber-accent text-black font-black text-[9px] px-3 py-1 rounded-full uppercase">
                    Most Popular
                </div>
            )}
            
            <div className="space-y-4">
              <h3 className={`font-display text-3xl font-black ${plan.gold ? 'text-cyber-gold' : 'text-white'}`}>
                {plan.name}
              </h3>
              <p className="font-mono text-xs text-cyber-muted italic">"{plan.subtitle}"</p>
              <div className="pt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                {plan.id !== 'free' && <span className="font-mono text-xs text-cyber-muted">/month</span>}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest border-b border-cyber-border/30 pb-2">Included Intelligence</p>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`text-sm ${plan.gold ? 'text-cyber-gold' : 'text-cyber-accent'}`}>✓</span>
                    <span className="font-mono text-xs text-cyber-text/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isAdmin ? (
              <div className="w-full py-4 text-center rounded-xl bg-cyber-green/20 border border-cyber-green text-cyber-green font-black text-xs uppercase tracking-widest">
                LIFETIME ADMIN ACCESS ACTIVE
              </div>
            ) : (
              <button 
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      plan.id === 'free' 
                      ? 'bg-white/5 border border-white/10 text-cyber-muted cursor-default'
                      : plan.gold
                      ? 'bg-cyber-gold text-black hover:bg-white'
                      : 'bg-cyber-accent text-black hover:bg-white shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                  }`}
              >
                {plan.button}
              </button>
            )}

            {/* Background Accents */}
            <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[100px] opacity-10 ${
                plan.gold ? 'bg-cyber-gold' : 'bg-cyber-accent'
            }`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Comparison Detail Placeholder */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="cyber-card p-12 bg-cyber-accent/5 border-dashed text-center">
        <h4 className="font-display text-2xl text-white mb-4 uppercase tracking-widest">Enterprise & Bulk Licensing</h4>
        <p className="font-mono text-xs text-cyber-muted max-w-3xl mx-auto leading-relaxed">
            Protecting an entire organization or government entity? We offer custom nodes and local deployments of the CyberShield Nexus engine. <span className="text-cyber-accent underline cursor-pointer">Contact Elite Sales →</span>
        </p>
      </motion.div>
    </div>
  );
}
