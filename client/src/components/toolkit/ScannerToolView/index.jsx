import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getToolConfig } from '../toolConfig';
import { useAuth } from '../../../context/AuthContext';
import usePdfExport from '../../../hooks/usePdfExport';
import toast from 'react-hot-toast';
import useScanner from './hooks/useScanner';
import styles from './styles';

// Sub-components
import TerminalConsole from './sub-components/TerminalConsole';

/**
 * ScannerToolView Component
 * Main coordinator for scanner tools (e.g. Nmap, Nikto).
 */
export default function ScannerToolView({ toolId }) {
  const tool = getToolConfig(toolId);
  const {
    target,
    setTarget,
    results,
    scanning,
    error,
    handleScan,
  } = useScanner(toolId);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { exportToolReportPdf } = usePdfExport();

  const handleExportPdf = () => {
    if (!user) {
      toast.error('You must login first to download the report.');
      navigate('/login');
      return;
    }
    exportToolReportPdf(
      tool.name,
      target,
      { rawAnalysis: results, riskLevel: 'safe', score: 0 },
      user
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !scanning) {
      handleScan();
    }
  };

  if (!tool) return null;

  const toolColor = tool.color || '#00ff88';

  return (
    <div style={styles.container}>
      {/* Description */}
      <p style={styles.description}>{tool.description}</p>

      {/* Capabilities */}
      {tool.capabilities?.length > 0 && (
        <div style={styles.capsRow}>
          {tool.capabilities.map((cap) => (
            <span
              key={cap}
              style={{ ...styles.capBadge, borderColor: `${toolColor}40`, color: toolColor }}
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Input section */}
      <div style={styles.inputSection}>
        <label htmlFor="target-input" style={styles.inputLabel}>Target</label>
        <div style={styles.inputRow}>
          <input
            id="target-input"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tool.inputPlaceholder || 'Enter target...'}
            disabled={scanning}
            className="focus:border-cyber-accent focus:ring-2 focus:ring-cyber-accent/15 outline-none transition-all"
            style={{
              ...styles.input,
              borderColor: scanning ? 'rgba(0,71,65,0.05)' : `${toolColor}40`,
            }}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !target.trim()}
            className="focus:ring-2 focus:ring-cyber-accent/40 outline-none transition-all"
            style={{
              ...styles.scanButton,
              background: scanning
                ? 'rgba(0,71,65,0.05)'
                : `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
              cursor: scanning || !target.trim() ? 'not-allowed' : 'pointer',
              opacity: scanning || !target.trim() ? 0.5 : 1,
            }}
          >
            {scanning ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner}>⟳</span> Scanning…
              </span>
            ) : (
              '⚡ Scan'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>✖</span> {error}
        </div>
      )}

      {/* Terminal Output Console */}
      <TerminalConsole
        target={target}
        results={results}
        scanning={scanning}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}
