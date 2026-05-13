import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { fadeUp, stagger, transitions } from '../../utils/motion';

const STATUS_THEME = {
  healthy: {
    dot: 'rgb(var(--cyber-green-rgb))',
    badge: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
    label: 'All core systems ready',
  },
  partial: {
    dot: 'rgb(var(--cyber-yellow-rgb))',
    badge: 'border-yellow-500/30 bg-yellow-500/10 text-cyber-yellow',
    label: 'Core online, enrichment partial',
  },
  degraded: {
    dot: 'rgb(var(--cyber-red-rgb))',
    badge: 'border-cyber-red/30 bg-cyber-red/10 text-cyber-red',
    label: 'Attention needed',
  },
};

const SERVICE_THEME = {
  online: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
  configured: 'border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent',
  preview: 'border-yellow-500/30 bg-yellow-500/10 text-cyber-yellow',
  missing: 'border-yellow-500/30 bg-yellow-500/10 text-cyber-yellow',
  offline: 'border-cyber-red/30 bg-cyber-red/10 text-cyber-red',
};

export default function SystemStatusPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const res = await api.get('/status');
        if (active) setStatus(res.data);
      } catch {
        if (active) {
          setStatus({
            status: 'degraded',
            services: [
              { id: 'backend', label: 'Backend API', status: 'offline', detail: 'Status check failed.' },
            ],
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStatus();
    const timer = window.setInterval(fetchStatus, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const theme = useMemo(() => STATUS_THEME[status?.status] || STATUS_THEME.partial, [status]);

  if (loading) {
    return (
      <motion.div
        className="rounded-full border border-cyber-border/70 bg-cyber-surface/60 px-3 py-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.fast}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">Checking status...</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUp}
        className={`rounded-full border px-3 py-1.5 inline-flex items-center gap-2 ${theme.badge}`}
        whileHover={{ y: -2, scale: 1.01 }}
        transition={transitions.fast}
      >
        <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: theme.dot }} />
        <span className="font-mono text-[11px] uppercase tracking-[0.24em]">{theme.label}</span>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        {(status?.services || []).map((service, index) => (
          <motion.div
            key={service.id}
            className={`rounded-full border px-3 py-1.5 ${SERVICE_THEME[service.status] || 'border-cyber-border/60 bg-cyber-surface/50 text-cyber-text'}`}
            title={service.detail}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.fast, delay: index * 0.04 }}
            whileHover={{ y: -2, scale: 1.02 }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              {service.label}: {service.status}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
