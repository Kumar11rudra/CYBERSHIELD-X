import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import { getToolConfig } from './toolConfig';
import CyberTerminalModal from '../terminal/CyberTerminalModal';

/**
 * DiagnosticToolView — Interactive Terminal Execution view for all specialized security modules.
 */
const ComingSoonView = ({ toolId }) => {
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  if (!tool) return null;

  const toolColor = tool.color || '#00bfff';
  const defaultPlaceholder = tool.inputType === 'domain' ? 'example.com' : tool.inputType === 'ip' ? '8.8.8.8' : 'scanme.nmap.org';

  const handleLaunch = (e) => {
    e.preventDefault();
    setIsTerminalOpen(true);
  };

  return (
    <div style={styles.container}>
      {/* Active Diagnostic Status Badge */}
      <div style={styles.badgeRow}>
        <span style={styles.activeBadge}>
          <span style={styles.badgeDot} />
          DIAGNOSTIC ENGINE :: TERMINAL READY
        </span>
      </div>

      {/* Direct Interactive Terminal Launcher Card */}
      <div className="p-6 rounded-2xl bg-[#0a1424]/90 border border-cyber-accent/30 shadow-[0_0_30px_rgba(0,191,255,0.15)] space-y-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center text-xl">
            {tool.icon || '🛡️'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Execute {tool.name} in CyberSOC Terminal
            </h3>
            <p className="text-[11px] text-cyber-muted">
              Live CLI probe with real-time stream telemetry and AI triage synthesis.
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center bg-[#030914] border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-accent">
            <span className="text-cyber-accent text-xs font-bold mr-2 select-none">
              nexus@cybershield:~$
            </span>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`Enter target for ${tool.name} (e.g. ${defaultPlaceholder})...`}
              className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-cyber-accent text-[#020814] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,191,255,0.5)] transition-all font-mono"
          >
            <Terminal size={14} />
            <span>&gt;_ Launch Terminal</span>
          </button>
        </form>
      </div>

      {/* Description */}
      <div style={styles.descriptionCard}>
        <h3 style={styles.descriptionTitle}>Module Overview: {tool.name}</h3>
        <p style={styles.descriptionText}>
          {tool.description ||
            `${tool.name} operates as part of the CyberShield X Active Security Grid across the ${tool.category} domain.`}
        </p>
      </div>

      {/* Diagnostic Capabilities */}
      {tool.capabilities?.length > 0 && (
        <div style={styles.capsSection}>
          <h4 style={styles.capsTitle}>Active Capabilities & Telemetry Flags</h4>
          <div style={styles.capsList}>
            {tool.capabilities.map((cap) => (
              <div key={cap} style={styles.capItem}>
                <span
                  style={{
                    ...styles.capDot,
                    background: '#00ff88',
                    boxShadow: '0 0 8px rgba(0,255,136,0.6)',
                  }}
                />
                <span style={styles.capText}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category & Type Metadata */}
      <div style={styles.metaRow}>
        {tool.category && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Domain Category</span>
            <span style={{ ...styles.metaValue, color: '#00bfff' }}>{tool.category}</span>
          </div>
        )}
        {tool.inputType && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Telemetry Input Type</span>
            <span style={styles.metaValue}>{tool.inputType.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Cyber Terminal Modal Overlay */}
      <CyberTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        initialTool={tool}
        initialTarget={target.trim() || defaultPlaceholder}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  /* Badge */
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 28px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#00bfff',
    background: 'rgba(0,191,255,0.08)',
    border: '1px solid rgba(0,191,255,0.3)',
    boxShadow: '0 0 20px rgba(0,191,255,0.15)',
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00ff88',
    boxShadow: '0 0 8px #00ff88',
    animation: 'pulse 2s ease-in-out infinite',
  },

  /* Description card */
  descriptionCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
  },
  descriptionTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  descriptionText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#94a3b8',
  },

  /* Capabilities */
  capsSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
  },
  capsTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 700,
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  capsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  capItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  capDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  capText: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },

  /* Meta info */
  metaRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    flex: 1,
    minWidth: '140px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  metaValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
};

export default ComingSoonView;
