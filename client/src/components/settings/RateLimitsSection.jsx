import React from 'react';
import { Link } from 'react-router-dom';
import ROUTES from '../../constants/routes';

/**
 * RateLimitsSection Component
 * Displays rate limit details and quota dashboards.
 */
const RateLimitsSection = React.memo(() => {
  return (
    <section className="cyber-bento-card p-8">
      <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
        Intelligence Quotas
      </h2>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 gap-4">
        <div>
          <p className="text-sm font-bold text-white mb-1">API Rate Limits</p>
          <p className="text-xs text-cyber-muted">
            View your daily intelligence scan limits and API usage quotas.
          </p>
        </div>
        <Link
          to={ROUTES.API_LIMITS}
          className="px-6 py-3 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent hover:text-black transition-all whitespace-nowrap"
        >
          View Dashboard →
        </Link>
      </div>
    </section>
  );
});

export default RateLimitsSection;
