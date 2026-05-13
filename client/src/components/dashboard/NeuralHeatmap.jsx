import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NeuralHeatmap = () => {
  const { t } = useTranslation();
  // Simulate attack pings across the world
  const pings = useMemo(() => [
    { id: 1, x: '20%', y: '30%', label: 'NA_BLOCK_01' },
    { id: 2, x: '65%', y: '45%', label: 'AS_BLOCK_04' },
    { id: 3, x: '45%', y: '25%', label: 'EU_BLOCK_09' },
    { id: 4, x: '75%', y: '65%', label: 'OC_BLOCK_02' },
    { id: 5, x: '30%', y: '70%', label: 'SA_BLOCK_11' },
    { id: 6, x: '55%', y: '60%', label: 'AF_BLOCK_05' },
    { id: 7, x: '68%', y: '35%', label: 'IN_DEFEND_XL' },
  ], []);

  return (
    <div className="cyber-bento-card p-6 h-full relative overflow-hidden group bg-black/40">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('dashboard.heatmap')}</h3>
          <p className="text-[9px] font-mono text-cyber-muted mt-1 uppercase">{t('dashboard.heatmapDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-ping" />
          <span className="text-[10px] font-mono text-cyber-accent uppercase font-black tracking-tighter">LIVE_MAP</span>
        </div>
      </div>

      <div className="relative w-full h-[200px] border border-white/5 rounded-xl bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-center bg-no-repeat bg-contain opacity-40 grayscale invert brightness-200">
        <div className="absolute inset-0 bg-cyber-accent/5 mix-blend-overlay" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {pings.map((ping) => (
          <motion.div
            key={ping.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: ping.id * 0.4,
              repeatType: 'loop' 
            }}
            style={{ left: ping.x, top: ping.y }}
            className="absolute"
          >
            <div className="w-3 h-3 rounded-full bg-cyber-accent shadow-[0_0_15px_rgba(5,255,161,0.8)]" />
            <div className="absolute top-4 left-0 whitespace-nowrap">
              <span className="text-[6px] font-mono text-cyber-accent bg-black/80 px-1 border border-cyber-accent/30 lowercase tracking-widest">
                {ping.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 relative z-10">
        <div>
          <p className="text-[8px] font-mono text-cyber-muted uppercase mb-1">{t('dashboard.activeBlocks')}</p>
          <p className="text-xs font-black text-white">42,901/hr</p>
        </div>
        <div>
          <p className="text-[8px] font-mono text-cyber-muted uppercase mb-1">{t('dashboard.globalLatency')}</p>
          <p className="text-xs font-black text-cyber-accent">12ms</p>
        </div>
        <div>
          <p className="text-[8px] font-mono text-cyber-muted uppercase mb-1">{t('dashboard.defensiveNodes')}</p>
          <p className="text-xs font-black text-white">1,402</p>
        </div>
      </div>
    </div>
  );
};

export default NeuralHeatmap;
