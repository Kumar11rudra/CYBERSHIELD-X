import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToolConfig } from '../toolConfig';
import dashboardService from '../../../services/dashboardService';
import { useAuth } from '../../../context/AuthContext';
import usePdfExport from '../../../hooks/usePdfExport';
import toast from 'react-hot-toast';
import styles from './styles';

// Sub-components
import ResultCardsGrid from './sub-components/ResultCardsGrid';
import SkeletonLoader from './sub-components/SkeletonLoader';

/**
 * AnalyzerToolView Component
 * Main coordinator for analysis tools (UrlEngine, WHOIS, SSL).
 */
export default function AnalyzerToolView({ toolId }) {
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { exportToolReportPdf } = usePdfExport();

  const handleExportPdf = () => {
    if (!user) {
      toast.error('You must login first to download the report.');
      navigate('/login');
      return;
    }
    exportToolReportPdf(tool.name, target, results, user);
  };

  const handleAnalyze = useCallback(async () => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setResults(null);
    setError(null);
    setAnalyzing(true);

    try {
      const data = await dashboardService.executeTool({
        toolId,
        target: trimmed,
      });

      // Normalise the response into a renderable shape
      if (data?.report) {
        setResults(data.report);
      } else if (data?.results) {
        setResults(data.results);
      } else {
        setResults(data);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Analysis failed';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [target, toolId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !analyzing) {
      handleAnalyze();
    }
  };

  if (!tool) return null;

  const toolColor = tool.color || '#00d4ff';

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
        <label htmlFor="analyzer-target-input" style={styles.inputLabel}>Target</label>
        <div style={styles.inputRow}>
          <input
            id="analyzer-target-input"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tool.inputPlaceholder || 'Enter target...'}
            disabled={analyzing}
            className="focus:border-cyber-accent focus:ring-2 focus:ring-cyber-accent/15 outline-none transition-all"
            style={{
              ...styles.input,
              borderColor: analyzing ? 'rgba(0,71,65,0.05)' : `${toolColor}40`,
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !target.trim()}
            className="focus:ring-2 focus:ring-cyber-accent/40 outline-none transition-all"
            style={{
              ...styles.analyzeButton,
              background: analyzing
                ? 'rgba(0,71,65,0.05)'
                : `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)`,
              cursor: analyzing || !target.trim() ? 'not-allowed' : 'pointer',
              opacity: analyzing || !target.trim() ? 0.5 : 1,
            }}
          >
            {analyzing ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner}>⟳</span> Analyzing…
              </span>
            ) : (
              '🔬 Analyze'
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

      {/* Report section */}
      <div style={styles.reportSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={styles.reportTitle}>
            {analyzing ? 'Analyzing…' : results ? 'Analysis Report' : 'Report'}
          </h3>
          {results && !analyzing && (
            <button onClick={handleExportPdf} style={styles.exportButton}>
              📄 Export PDF
            </button>
          )}
        </div>
        {analyzing && <SkeletonLoader />}
        {!analyzing && results && <ResultCardsGrid data={results} />}
        {!analyzing && !results && !error && (
          <p style={styles.reportPlaceholder}>
            Enter a target above and click Analyze to generate a report.
          </p>
        )}
      </div>
    </div>
  );
}
