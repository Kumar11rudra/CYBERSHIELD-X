import React from "react";
import { motion } from "framer-motion";
import BrandLogo from "../common/BrandLogo";

export default function FinalCTASection({
  t,
  navigate,
}) {
  return (
    <>
      {/* FINAL CTA */}
      <section className="py-8 px-6 bg-cyber-bg border-t border-cyber-border/10 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto space-y-5"
        >
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003366]/80 to-[#006699]/60 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyber-accent/20 border border-cyber-accent/30">
              <BrandLogo size={36} />
            </div>
            <div className="absolute inset-[-6px] rounded-full border border-cyber-accent/20 animate-ping" style={{ animationDuration: '3s' }} />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-black text-cyber-text uppercase tracking-tight">
              {t('home.finalCta.title')}
            </h2>
            <p className="text-sm text-cyber-muted font-body leading-relaxed">
              {t('home.finalCta.desc')}
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-cyber-accent hover:shadow-[0_4px_20px_rgba(0,71,65,0.25)] text-cyber-bg font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-transparent border border-cyber-accent/30 text-cyber-accent font-display text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cyber-accent/5 transition-all"
            >
              Create Account
            </button>
          </div>
        </motion.div>
      </section>
    </>
  );
}
