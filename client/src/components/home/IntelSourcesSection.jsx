import React from "react";
import { motion } from "framer-motion";

export default function IntelSourcesSection({
  t,
  navigate,
  user,
}) {
  return (
    <>
      {/* ── INTEL SOURCES ── */}
      <section className="py-8 px-5 md:px-6 bg-cyber-bg border-t border-cyber-border/10">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          
          {/* Section Header */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-[0.3em]">
              {t('home.intelSources.subtitle')}
            </p>
            <h2 className="font-display text-2xl font-black text-cyber-text uppercase tracking-tight">
              Platform Capabilities & Feeds
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-cyber-accent to-transparent mx-auto" />
          </div>

          {/* Cards Grid */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { name: 'UrlEngine', desc: t('home.intelSources.vtDesc'), color: 'blue' },
              { name: 'AbuseIPDB', desc: t('home.intelSources.abuseDesc'), color: 'orange' },
              { name: 'Pulsedive', desc: 'Real-time threat feeds & risk scoring', color: 'green' },
              { name: 'AlienVault OTX', desc: 'World largest open threat community', color: 'purple' },
              { name: 'GreyNoise', desc: 'Analyzing global internet scanning noise', color: 'red' },
              { name: 'PortEngine', desc: 'Deep device & network discovery intel', color: 'blue' },
              { name: 'Cisco Talos', desc: 'Industry-leading threat intelligence', color: 'purple' },
              { name: 'HIBP (Breach)', desc: t('home.intelSources.hibpDesc'), color: 'red' },
              { name: 'TLS / OpenSSL', desc: t('home.intelSources.tlsDesc'), color: 'green' },
            ].map((src, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(user ? '/toolkit' : '/signup')}
                className="bg-cyber-card border border-cyber-border/10 hover:border-cyber-accent/40 rounded-xl p-3 min-w-[200px] flex-1 max-w-[280px] text-left cursor-pointer transition-all shadow-md hover:shadow-xl"
              >
                <div className="text-xs font-display font-bold text-cyber-text mb-1">{src.name}</div>
                <div className="text-[11px] text-cyber-muted font-body leading-relaxed">{src.desc}</div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
