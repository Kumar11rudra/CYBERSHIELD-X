import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import ThreatGauge from '../../../scan/ThreatGauge';
import RiskBadge from '../../../common/RiskBadge';
import ScanGuidance from '../../../scan/ScanGuidance';
import SecurityAssistantCard from '../../../scan/SecurityAssistantCard';

const SOURCE_LABELS = {
  UrlEngine: 'UrlEngine',
  DnsEngine: 'DnsEngine',
  'CIRCL UrlEngine': 'CIRCL UrlEngine',
};

/**
 * ScanResultConsole Component
 * Renders the threat gauges, source bars, and guides for the scan output.
 */
export default function ScanResultConsole({ result, copy, onViewReport }) {
  const { t } = useTranslation();
  const isDangerous = result.risk.level === 'dangerous';
  const isMedium = result.risk.level === 'medium';
  const actionLabel = isDangerous
    ? copy.actionDanger
    : isMedium
    ? copy.actionMedium
    : copy.actionSafe;

  const handleExportPDF = async () => {
    try {
      const res = await api.get(`/history/${result.id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cybershield-scan-${result.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    }
  };

  return (
    <div
      className={`cyber-card overflow-hidden ${
        isDangerous ? 'border-cyber-red/50 shadow-[0_0_20px_rgba(255,34,68,0.1)]' : ''
      }`}
    >
      {isDangerous && (
        <div className="bg-cyber-red/10 border-b border-cyber-red/20 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-cyber-red">⚠</span>
            <span className="font-mono text-cyber-red text-[10px] tracking-widest uppercase font-bold">
              {t('scanner.validation.highThreatDetected', 'HIGH RISK THREAT DETECTED')}
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-pulse" />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <ThreatGauge score={result.threatScore} riskLevel={result.risk.level} size={160} />

          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div className="min-w-0">
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-[0.2em] mb-1">
                  {copy.scannedTarget}
                </p>
                <p className="font-mono text-cyber-text text-sm break-all font-bold">
                  {result.target}
                </p>
                <p
                  className={`font-mono text-[11px] mt-2 ${
                    isDangerous ? 'text-cyber-red' : 'text-cyber-muted'
                  }`}
                >
                  {actionLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] border border-cyber-border/40 px-2 py-1 text-cyber-muted rounded uppercase tracking-wider">
                  {result.targetType}
                </span>
                <RiskBadge level={result.risk.level} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {Object.entries(result.sourceScores || {}).map(([source, score]) => (
                <SourceScore key={source} label={SOURCE_LABELS[source] || source} score={score} />
              ))}
            </div>

            <ScanGuidance scan={result} collapsible />
            <div className="mt-4">
              <SecurityAssistantCard scan={result} compact />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-cyber-border/30">
              <button
                onClick={onViewReport}
                className="cyber-button-primary text-xs py-2 px-6 haptic-press"
              >
                {copy.viewReport}
              </button>
              <button
                onClick={handleExportPDF}
                className="font-mono text-[10px] text-cyber-accent hover:text-cyber-text uppercase tracking-widest transition-all"
              >
                {copy.downloadPdf}
              </button>
              <span className="font-mono text-cyber-muted text-[10px] ml-auto">
                {t('scanner.validation.scannedAt', 'Scanned at')}:{' '}
                {new Date(result.scannedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceScore({ label, score }) {
  const color =
    score > 75 ? '#ff2244' : score > 50 ? '#ff8c00' : score > 20 ? '#ffdd00' : '#00ff88';
  return (
    <div className="bg-black/20 border border-cyber-border/40 rounded-lg p-3">
      <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-cyber-bg rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ backgroundColor: color }}
          />
        </div>
        <span className="font-mono text-xs font-bold w-6" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}
