import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ThreatGauge from './ThreatGauge';
import RiskBadge from '../common/RiskBadge';
import ScanGuidance from './ScanGuidance';
import SecurityAssistantCard from './SecurityAssistantCard';
import CyberIntelligenceConsole from '../common/CyberIntelligenceConsole';
import { saveRecentLocalScan } from '../../utils/localScanHistory';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { buttonHover, fadeUp, stagger, transitions } from '../../utils/motion';
import { validateTarget, detectIocType } from '../../utils/smartValidator';
import { extractIOCs, analyzeDomainHeuristics } from '../../utils/iocExtractor';
import AIReportModal from './AIReportModal';
import { mobileUX } from '../../utils/mobileUX';

const SOURCE_LABELS = {
  virusTotal: 'VirusTotal',
  abuseIPDB: 'AbuseIPDB',
  domainIntel: 'Domain Intel',
  hashlookup: 'CIRCL Hashlookup',
};

const SOURCE_MAP_BY_TYPE = {
  url: ['VirusTotal URL', 'Domain Intel', 'Threat Scoring Engine'],
  ip: ['VirusTotal IP', 'AbuseIPDB', 'Threat Scoring Engine'],
  domain: ['Domain Intel', 'VirusTotal Domain', 'Threat Scoring Engine'],
  hash: ['VirusTotal Hash', 'CIRCL Hashlookup', 'Threat Scoring Engine'],
};

export default function ScannerInput({ onResult }) {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [extractedTargets, setExtractedTargets] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validation = useMemo(() => validateTarget(target), [target]);
  const detectedType = validation.type;
  const heuristics = useMemo(() =>
    detectedType === 'domain' || detectedType === 'url'
      ? analyzeDomainHeuristics(target)
      : { suspicious: false },
    [target, detectedType]
  );

  const copy = useMemo(() => ({
    loginToScan: t('scanner.validation.loginToScan'),
    dangerToast: t('scanner.validation.dangerToast'),
    mediumToast: t('scanner.validation.mediumToast'),
    scanFailed: t('scanner.validation.scanFailed'),
    helperEmpty: t('scanner.validation.helperEmpty'),
    helperValid: t('scanner.validation.helperValid', { type: detectedType?.toUpperCase() }),
    helperInvalid: t('scanner.validation.helperInvalid'),
    helperExtracted: (count) => t('scanner.validation.helperExtracted', { count }),
    quickTest: t('scanner.validation.quickTest'),
    placeholder: t('scanner.validation.placeholder'),
    scanning: t('scanner.validation.scanning'),
    scan: t('scanner.validation.scan'),
    loadingTitle: t('scanner.validation.loadingTitle'),
    queried: t('scanner.validation.queried'),
    appears: t('scanner.validation.appears'),
    scannedTarget: t('scanner.validation.scannedTarget'),
    actionDanger: t('scanner.validation.actionDanger'),
    actionMedium: t('scanner.validation.actionMedium'),
    actionSafe: t('scanner.validation.actionSafe'),
    viewReport: t('scanner.validation.viewReport'),
    downloadPdf: t('scanner.validation.downloadPdf'),
  }), [detectedType, t]);

  const handleScan = async (e, overrideTarget) => {
    if (e) e.preventDefault();
    const finalTarget = (overrideTarget || target).trim();

    if (!validateTarget(finalTarget).valid) {
      const extracted = extractIOCs(finalTarget);
      if (extracted.length > 0) {
        setExtractedTargets(extracted);
        toast(t('scanner.multipleTargets'), { icon: '🔍' });
        return;
      }
      toast.error(t('scanner.invalidTarget'));
      return;
    }

    if (!user) {
      toast.error(copy.loginToScan);
      navigate('/login');
      return;
    }

    setLoading(true);
    setResult(null);
    setExtractedTargets([]);
    mobileUX.impact('HEAVY'); // Haptic feedback on start

    try {
      const res = await api.post('/scan', { target: finalTarget });
      setResult(res.data.scan);
      setTarget(finalTarget);
      saveRecentLocalScan(res.data.scan);
      onResult?.(res.data.scan);

      if (res.data.scan.risk.level === 'dangerous') {
        mobileUX.vibrate(); // Warning vibration
        toast.error(`${copy.dangerToast} ${res.data.scan.threatScore}/100`, { duration: 6000 });
      } else if (res.data.scan.risk.level === 'medium') {
        mobileUX.impact('MEDIUM');
        toast(`${copy.mediumToast} ${res.data.scan.threatScore}/100`, {
          icon: '⚡',
          duration: 5000,
          style: { borderColor: '#ff8c00' },
        });
      } else {
        mobileUX.impact('LIGHT');
        toast.success(`${copy.appears} ${res.data.scan.risk.label}`);
      }
    } catch (err) {
      mobileUX.impact('LIGHT');
      const msg = err.response?.data?.error || copy.scanFailed;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const examples = ['8.8.8.8', 'openai.com', 'https://example.com/login', '44d88612fea8a8f36de82e1278abb02f'];

  return (
    <motion.div className="w-full max-w-3xl mx-auto" variants={stagger(0.06)} initial="hidden" animate="show">
      {/* Scanner form */}
      <motion.form onSubmit={handleScan} className="space-y-3" variants={fadeUp}>
        <motion.div
          className={`relative rounded-lg p-[1px] transition-all duration-500 ${heuristics.suspicious ? 'bg-gradient-to-r from-cyber-red/50 via-cyber-orange/30 to-cyber-red/50' : ''
            }`}
          animate={inputFocused
            ? {
              scale: 1.005,
              boxShadow: heuristics.suspicious
                ? '0 0 30px rgba(255, 34, 68, 0.2)'
                : '0 0 28px rgba(0, 212, 255, 0.16)',
            }
            : { scale: 1, boxShadow: '0 0 0 0 rgba(0, 212, 255, 0)' }}
        >
          <div className="bg-cyber-bg rounded-lg relative overflow-hidden">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-cyber-muted text-xs select-none z-10">
              &gt;_
            </div>
            <input
              type="text"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                if (extractedTargets.length > 0) setExtractedTargets([]);
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={copy.placeholder}
              className={`cyber-input pl-10 pr-36 h-14 text-base border-none ring-0 focus:ring-0 ${heuristics.suspicious ? 'text-cyber-orange' : ''
                }`}
              disabled={loading}
              autoComplete="off"
              spellCheck="false"
            />

            <motion.button
              type="submit"
              disabled={loading || !target.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 cyber-button-primary disabled:opacity-40 disabled:cursor-not-allowed h-10 flex items-center gap-2 haptic-press"
              whileHover={!loading && target.trim() ? buttonHover.whileHover : undefined}
              whileTap={!loading && target.trim() ? buttonHover.whileTap : undefined}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                  <span>{copy.scanning}</span>
                </div>
              ) : (
                <>
                  <ScanIcon />
                  <span>{copy.scan}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Heuristic Warnings & Helpers */}
        <AnimatePresence>
          {heuristics.suspicious && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 px-2 text-cyber-red font-mono text-[10px] uppercase tracking-wider"
            >
              <span className="animate-pulse">⚠️</span>
              <span>HEURISTIC ALERT: {heuristics.reason}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4 flex-wrap px-1">
          <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-cyber-muted text-xs">{copy.quickTest}</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setTarget(ex)}
                className="font-mono text-xs text-cyber-muted hover:text-cyber-accent border border-cyber-border/40 hover:border-cyber-accent/40 px-2 py-1 rounded transition-all"
              >
                {ex}
              </button>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className={`font-mono text-[10px] uppercase tracking-widest ${detectedType ? 'text-cyber-accent' : target.trim() ? 'text-cyber-orange' : 'text-cyber-muted'
            }`}>
            {!target.trim() ? copy.helperEmpty : detectedType ? copy.helperValid : copy.helperInvalid}
          </motion.p>
        </div>

        {/* Extracted Targets List */}
        <AnimatePresence>
          {extractedTargets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 backdrop-blur-sm"
            >
              <p className="font-mono text-[11px] text-cyber-accent uppercase tracking-[0.2em] mb-3">
                {copy.helperExtracted(extractedTargets.length)}
              </p>
              <div className="flex flex-wrap gap-2">
                {extractedTargets.map((ext, idx) => (
                  <button
                    key={`${ext.value}-${idx}`}
                    onClick={() => handleScan(null, ext.value)}
                    className="flex items-center gap-2 bg-black/40 border border-cyber-border hover:border-cyber-accent transition-all px-3 py-1.5 rounded-lg group"
                  >
                    <span className="font-mono text-[10px] text-cyber-muted uppercase group-hover:text-cyber-accent">{ext.type}</span>
                    <span className="font-mono text-xs text-cyber-text">{ext.value}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Modern Intelligence Console */}
      <CyberIntelligenceConsole isScanning={loading} type={detectedType || 'url'} target={target} />

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="scan-loading"
            className="mt-8 cyber-card p-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-2 border-cyber-accent/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-mono text-cyber-accent text-sm animate-pulse uppercase tracking-[0.3em]">{copy.loadingTitle}</p>
            <div className="mt-6 flex justify-center gap-2">
              {(SOURCE_MAP_BY_TYPE[detectedType] || SOURCE_MAP_BY_TYPE.url).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-1 bg-cyber-accent/30 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="w-full h-full bg-cyber-accent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!loading && result && (
          <motion.div
            key={`scan-result-${result.id || result.target}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <ScanResult result={result} copy={copy} onViewReport={() => setShowReport(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AIReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        scanData={result}
      />
    </motion.div>
  );
}

function ScanResult({ result, copy, onViewReport }) {
  const navigate = useNavigate();
  const isDangerous = result.risk.level === 'dangerous';
  const isMedium = result.risk.level === 'medium';
  const actionLabel = isDangerous ? copy.actionDanger : isMedium ? copy.actionMedium : copy.actionSafe;

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
    <div className={`cyber-card overflow-hidden ${isDangerous ? 'border-cyber-red/50 shadow-[0_0_20px_rgba(255,34,68,0.1)]' : ''}`}>
      {isDangerous && (
        <div className="bg-cyber-red/10 border-b border-cyber-red/20 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-cyber-red">⚠</span>
            <span className="font-mono text-cyber-red text-[10px] tracking-widest uppercase font-bold">
              {t('scanner.validation.highThreatDetected')}
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
                <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-[0.2em] mb-1">{copy.scannedTarget}</p>
                <p className="font-mono text-cyber-text text-sm break-all font-bold">{result.target}</p>
                <p className={`font-mono text-[11px] mt-2 ${isDangerous ? 'text-cyber-red' : 'text-cyber-muted'}`}>{actionLabel}</p>
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
              <button onClick={onViewReport} className="cyber-button-primary text-xs py-2 px-6 haptic-press">
                {copy.viewReport}
              </button>
              <button onClick={handleExportPDF} className="font-mono text-[10px] text-cyber-accent hover:text-cyber-text uppercase tracking-widest transition-all">
                {copy.downloadPdf}
              </button>
              <span className="font-mono text-cyber-muted text-[10px] ml-auto">
                {t('scanner.validation.scannedAt')}: {new Date(result.scannedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceScore({ label, score }) {
  const color = score > 75 ? '#ff2244' : score > 50 ? '#ff8c00' : score > 20 ? '#ffdd00' : '#00ff88';
  return (
    <div className="bg-black/20 border border-cyber-border/40 rounded-lg p-3">
      <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-wider mb-2">{label}</p>
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
        <span className="font-mono text-xs font-bold w-6" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
