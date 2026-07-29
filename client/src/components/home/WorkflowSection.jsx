import React from "react";
import { motion } from "framer-motion";

export default function WorkflowSection({ t }) {
  return (
    <>
      {/* ── HOW IT WORKS ── */}
      <section className="py-12 px-6 bg-cyber-bg border-t border-cyber-border/10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 space-y-2"
          >
            <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-[0.3em]">{t('home.workflow.subtitle')}</p>
            <h2 className="font-display text-2xl font-black text-cyber-text uppercase tracking-tight">
              {t('home.workflow.title')}
            </h2>
          </motion.div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: t('home.workflow.step1Title'), desc: t('home.workflow.step1Desc'), color: 'blue', icon: '📋' },
              { step: '02', title: t('home.workflow.step2Title'), desc: t('home.workflow.step2Desc'), color: 'green', icon: '⚡' },
              { step: '03', title: t('home.workflow.step3Title'), desc: t('home.workflow.step3Desc'), color: 'orange', icon: '🎯' },
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -30 : i === 2 ? 30 : 0, y: i === 1 ? 30 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-cyber-card border border-cyber-border/10 rounded-2xl p-5 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="font-mono text-xl font-bold text-cyber-accent">{s.step}</span>
                </div>
                <h3 className="text-sm font-display font-bold text-cyber-text mb-2">{s.title}</h3>
                <p className="text-xs text-cyber-muted font-body leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}