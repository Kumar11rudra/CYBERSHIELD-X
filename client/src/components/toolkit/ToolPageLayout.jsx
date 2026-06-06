import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getToolConfig, getStatusBadge } from './toolConfig';

/**
 * ToolPageLayout — Shared layout wrapper for ALL tool pages.
 *
 * Usage:
 *   <ToolPageLayout toolId="nmap">
 *     <ScannerToolView toolId="nmap" />
 *   </ToolPageLayout>
 */
const ToolPageLayout = ({ toolId: toolIdProp, children }) => {
  const params = useParams();
  const toolId = toolIdProp || params.toolId;
  const tool = getToolConfig(toolId);

  if (!tool) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <h2 style={styles.errorTitle}>Tool Not Found</h2>
        <p style={styles.errorText}>
          No tool with ID <code style={styles.code}>{toolId}</code> exists.
        </p>
        <Link to="/toolkit" style={styles.backLink}>
          ← Back to Toolkit
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(tool.status);
  const toolColor = tool.color || '#00d4ff';

  return (
    <div style={styles.page}>
      {/* ── Back navigation ── */}
      <div style={styles.backBar}>
        <Link to="/toolkit" style={styles.backLink}>
          <span style={styles.backArrow}>←</span> Back to Toolkit
        </Link>
      </div>

      {/* ── Header ── */}
      <header
        style={{
          ...styles.header,
          background: `linear-gradient(135deg, ${toolColor}18 0%, transparent 60%)`,
          borderBottom: `1px solid ${toolColor}30`,
        }}
      >
        <div style={styles.headerContent}>
          {/* Icon */}
          <div
            style={{
              ...styles.iconContainer,
              background: `${toolColor}15`,
              border: `1px solid ${toolColor}30`,
            }}
          >
            <span style={styles.icon}>{tool.icon || '🔧'}</span>
          </div>

          {/* Title block */}
          <div style={styles.titleBlock}>
            <div style={styles.titleRow}>
              <h1 style={styles.toolName}>{tool.name}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  color: badge.color,
                  background: badge.bg,
                  border: `1px solid ${badge.color}40`,
                }}
              >
                {badge.label}
              </span>
            </div>
            <p style={styles.tagline}>{tool.tagline}</p>
          </div>
        </div>

        {/* Category pill */}
        {tool.category && (
          <span
            style={{
              ...styles.categoryPill,
              color: toolColor,
              borderColor: `${toolColor}40`,
            }}
          >
            {tool.category}
          </span>
        )}
      </header>

      {/* ── Main content ── */}
      <main style={styles.main}>{children}</main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Inline Styles
   ═══════════════════════════════════════════════════════ */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    color: '#e2e8f0',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  /* Back bar */
  backBar: {
    padding: '16px 24px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00d4ff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'opacity 0.2s',
    opacity: 0.85,
  },
  backArrow: {
    fontSize: '16px',
  },

  /* Header */
  header: {
    padding: '24px 24px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: '28px',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  toolName: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  tagline: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
  },

  /* Status badge */
  statusBadge: {
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
  },

  /* Category pill */
  categoryPill: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    background: 'transparent',
    alignSelf: 'center',
    whiteSpace: 'nowrap',
  },

  /* Main */
  main: {
    padding: '24px',
    maxWidth: '960px',
    margin: '0 auto',
  },

  /* Error state */
  errorContainer: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '48px',
  },
  errorTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#ffffff',
  },
  errorText: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
  },
  code: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#00d4ff',
  },
};

export default ToolPageLayout;
