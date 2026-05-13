import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CorrelationGraph = () => {
  const { t } = useTranslation();
  const nodes = [
    { id: 'identity', label: 'PRIMARY_IDENTITY', type: 'core', x: '50%', y: '50%' },
    { id: 'phone', label: 'MOBILE_PII', type: 'data', x: '30%', y: '30%' },
    { id: 'email', label: 'EMAIL_VECTOR', type: 'data', x: '70%', y: '30%' },
    { id: 'facebook', label: 'FB_REGISTRY', type: 'leak', x: '20%', y: '60%' },
    { id: 'dominos', label: 'DOMINOS_DB', type: 'leak', x: '80%', y: '60%' },
    { id: 'upstox', label: 'FINANCIAL_UP', type: 'leak', x: '50%', y: '85%' },
  ];

  const links = [
    { from: 'identity', to: 'phone' },
    { from: 'identity', to: 'email' },
    { from: 'phone', to: 'facebook' },
    { from: 'phone', to: 'dominos' },
    { from: 'email', to: 'dominos' },
    { from: 'email', to: 'upstox' },
  ];

  return (
    <div className="cyber-bento-card p-6 h-full relative overflow-hidden bg-black/40 border-cyber-accent/10">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest">{t('dashboard.exposureGraph')}</h3>
          <p className="text-[9px] font-mono text-cyber-muted mt-1 uppercase">{t('dashboard.exposureGraphDesc')}</p>
        </div>
      </div>

      <div className="relative w-full h-[300px]">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {links.map((link, i) => {
            const from = nodes.find(n => n.id === link.from);
            const to = nodes.find(n => n.id === link.to);
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(0, 212, 255, 0.2)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-help"
            style={{ left: node.x, top: node.y }}
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-110 ${
              node.type === 'core' ? 'bg-cyber-accent/20 border-cyber-accent border-2 shadow-[0_0_20px_rgba(0,212,255,0.4)]' :
              node.type === 'data' ? 'bg-white/5 border-white/20' : 'bg-cyber-red/10 border-cyber-red/40'
            }`}>
              <div className={`w-full h-full rounded-2xl flex items-center justify-center font-black text-[10px] ${
                node.type === 'core' ? 'text-cyber-accent' : 
                node.type === 'data' ? 'text-white/60' : 'text-cyber-red'
              }`}>
                {node.id.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <span className="mt-2 text-[7px] font-mono text-cyber-muted uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded border border-white/5">
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-end border-t border-white/5 pt-4">
        <div className="flex gap-4">
          <div>
            <p className="text-[7px] font-mono text-cyber-muted uppercase">{t('dashboard.correlations')}</p>
            <p className="text-xs font-black text-white">{t('history.all').toUpperCase()}</p>
          </div>
          <div>
            <p className="text-[7px] font-mono text-cyber-muted uppercase">{t('dashboard.attackSurface')}</p>
            <p className="text-xs font-black text-cyber-accent">14.2%</p>
          </div>
        </div>
        <div className="text-[8px] font-mono text-cyber-muted italic">
          Nexus_ID: 7x192_CORR
        </div>
      </div>
    </div>
  );
};

export default CorrelationGraph;
