import React from 'react';

/**
 * SessionIntelligenceSection Component
 * Displays a list of active login sessions and provides revocation actions.
 */
const SessionIntelligenceSection = React.memo(({
  sessions = [],
  sessionsLoading = false,
  onRevokeSession,
}) => {
  return (
    <section className="cyber-bento-card p-8">
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest">
          Session Intelligence Monitor
        </h2>
        <span className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">
          Active Nodes: {sessions.length}
        </span>
      </div>

      <div className="space-y-4">
        {sessionsLoading ? (
          <div className="py-8 text-center font-mono text-xs text-cyber-muted animate-pulse uppercase tracking-widest">
            Scanning for active neural links...
          </div>
        ) : (
          sessions.map((sess, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-cyber-accent/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyber-accent/5 border border-cyber-accent/20 flex items-center justify-center text-cyber-accent">
                  {sess.userAgent.includes('Mobile') ? '📱' : '💻'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                    {sess.userAgent}
                  </p>
                  <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mt-1">
                    Last Active: {new Date(sess.lastUsedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRevokeSession(sess.deviceId)}
                className="p-2 text-cyber-muted hover:text-cyber-red transition-colors group-hover:scale-110"
                title="Purge Session"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

export default SessionIntelligenceSection;
