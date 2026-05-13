import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ACTION_MAP = {
  'LOGIN': { icon: '🔑', color: 'text-green-400', bg: 'bg-green-400/10' },
  'LOGOUT': { icon: '🚪', color: 'text-cyber-muted', bg: 'bg-white/5' },
  'PROFILE_UPDATE': { icon: '👤', color: 'text-cyber-accent', bg: 'bg-cyber-accent/10' },
  'SECURITY_SCAN': { icon: '🛡️', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  '2FA_ENABLED': { icon: '🔐', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  '2FA_DISABLED': { icon: '🔓', color: 'text-red-400', bg: 'bg-red-400/10' },
  'ADMIN_VIEW_REPORT': { icon: '👁️', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'RECOVER_PASSWORD': { icon: '🔄', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  'BREACH_CHECK_EMAIL': { icon: '🛑', color: 'text-red-500', bg: 'bg-red-500/10' },
  'BREACH_CHECK_PHONE': { icon: '📱', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'PASSWORD_CHECK': { icon: '🔑', color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

export default function ActivityTimeline({ activities = [] }) {
  const { t } = useTranslation();
  if (!activities.length) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
        <p className="font-mono text-xs text-cyber-muted uppercase tracking-widest">» {t('admin.noActivityFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-mono text-[10px] text-white uppercase tracking-[0.2em]">{t('admin.nodeIntelligenceTimeline')}</h4>
        <span className="font-mono text-[9px] text-cyber-muted">{t('admin.recordsDetected', { count: activities.length })}</span>
      </div>

      <div className="relative pl-6 border-l border-white/10 space-y-8 pb-4">
        {activities.map((activity, i) => {
          const cfg = ACTION_MAP[activity.action] || { icon: '⚡', color: 'text-white', bg: 'bg-white/10' };
          
          return (
            <motion.div 
              key={activity._id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              {/* Timeline Dot */}
              <div className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#020508] ${cfg.bg.replace('/10', '')} ${cfg.color}`} />
              
              <div className={`cyber-card p-4 hover:border-white/20 transition-all group`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center text-lg`}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className={`font-display text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <p className="font-mono text-[9px] text-cyber-muted mt-0.5">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="font-mono text-[9px] text-white/40 uppercase">IP: {activity.metadata?.ip || 'Internal'}</p>
                     <p className="font-mono text-[8px] text-white/20 mt-0.5">{activity.metadata?.device || 'Unknown'}</p>
                  </div>
                </div>

                {activity.metadata?.details && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] font-mono text-white/60 leading-relaxed italic">
                      » {activity.metadata.details}
                    </p>
                  </div>
                )}
                
                {activity.metadata?.location && (
                  <div className="mt-2 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px]">📍</span>
                    <span className="font-mono text-[8px] text-white uppercase tracking-tighter">
                      {activity.metadata.location.city}, {activity.metadata.location.country}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
