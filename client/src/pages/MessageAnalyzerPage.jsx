import React, { useState, useMemo } from 'react';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import ThreatGauge from '../components/scan/ThreatGauge';
import CyberIntelligenceConsole from '../components/common/CyberIntelligenceConsole';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, stagger } from '../utils/motion';
import { extractIOCs } from '../utils/iocExtractor';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import usePdfExport from '../hooks/usePdfExport';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function MessageAnalyzerPage() {
  const { t } = useTranslation();

  const TABS = [
    { id: 'sms', label: t('tools.messageAnalyzer.smsTab'), icon: '💬', endpoint: '/tools/sms', placeholder: 'e.g. URGENT: Your account has been blocked. Click here: http://fake-bank.net/verify' },
    { id: 'email', label: t('tools.messageAnalyzer.emailTab'), icon: '📧', placeholder: 'Paste full email body or header here for forensic analysis...' },
  ];

  const [activeTab, setActiveTab] = useState('sms');
  const [text, setText] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exportToolReportPdf, exporting } = usePdfExport();

  const extracted = useMemo(() => extractIOCs(text), [text]);
  const urlsOnly = useMemo(() => extracted.filter(e => e.type === 'url'), [extracted]);

  const handleAnalyze = async () => {
    if (activeTab === 'sms' && !text.trim()) return;
    if (activeTab === 'email' && !emailAddr.trim()) {
      toast.error(t('scanner.validation.enterValidEmail'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let res;
      if (activeTab === 'sms') {
        res = await api.post('/tools/sms', { text });
        setResult({ ...res.data.analysis, mode: 'sms' });
      } else {
        res = await api.post('/auth/email-check', { email: emailAddr.trim() });
        // Normalise email analysis shape
        const a = res.data.analysis;
        setResult({
          mode: 'email',
          score: a.riskScore,
          riskLevel: a.status === 'risky' ? 'dangerous' : a.status === 'neutral' ? 'medium' : 'safe',
          verifyingAuthority: 'CyberShield Email Intel Engine',
          summary: a.summary,
          email: a.email,
          checks: a.checks,
          recommendedAction: a.recommendedAction,
          scannedAt: new Date(),
        });
      }
      toast.success(t('scanner.validation.analysisComplete'));
    } catch (err) {
      const msg = err.response?.data?.error || t('scanner.validation.scanFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setError('');
    setText('');
    setEmailAddr('');
  };

  const handleDeepScan = (url) => {
    toast(t('scanner.validation.initiatingScan', { url }), { icon: '🔍' });
    navigate('/scan', { state: { autoCheck: url } });
  };

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={stagger(0.1)}>
        <motion.p variants={fadeUp} className="font-mono text-[10px] text-cyber-accent uppercase tracking-[0.3em] mb-3">
          {t('tools.messageAnalyzer.subtitle')}
        </motion.p>
        <motion.h1 variants={fadeUp} className="font-display text-4xl text-cyber-text tracking-widest uppercase">
          {t('tools.messageAnalyzer.titlePart1')} <span className="text-cyber-accent">{t('tools.messageAnalyzer.titlePart2')}</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="font-mono text-cyber-muted text-xs mt-3 max-w-2xl leading-relaxed">
          {t('tools.messageAnalyzer.desc')}
        </motion.p>
      </motion.div>

      {/* Tab Selector */}
      <motion.div variants={fadeUp} className="flex gap-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/30 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Input Card */}
      <motion.div className="cyber-card p-8 space-y-6" variants={fadeUp}>
        <AnimatePresence mode="wait">
          {activeTab === 'sms' ? (
            <motion.div key="sms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-mono text-cyber-muted text-xs uppercase tracking-wider">{t('tools.messageAnalyzer.payloadLabel')}</label>
                {urlsOnly.length > 0 && (
                  <span className="font-mono text-[10px] text-cyber-accent animate-pulse uppercase">
                    {t('tools.messageAnalyzer.suspiciousLinks', { count: urlsOnly.length })}
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="cyber-input w-full h-40 p-4 font-mono text-sm resize-none scrollbar-hide"
                  placeholder={activeTabData.placeholder}
                  disabled={loading}
                />
                <div className="absolute top-4 right-4 text-cyber-muted opacity-20 pointer-events-none text-2xl">💬</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider">{t('tools.messageAnalyzer.senderLabel')}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted opacity-50 text-sm">✉</div>
                <input
                  type="email"
                  value={emailAddr}
                  onChange={(e) => setEmailAddr(e.target.value)}
                  placeholder="e.g. alert@microsoft-security-check.com"
                  className="cyber-input pl-12 h-14 w-full"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['admin@gmail.com', 'security@mailinator.com', 'alerts@gamil.com'].map(ex => (
                  <button key={ex} type="button" onClick={() => setEmailAddr(ex)}
                    className="font-mono text-[10px] border border-cyber-border/40 px-3 py-1.5 rounded-lg text-cyber-muted hover:text-cyber-accent transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleAnalyze}
          disabled={loading || (activeTab === 'sms' ? !text.trim() : !emailAddr.trim())}
          className="cyber-button-primary w-full py-4 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
              <span>{t('tools.messageAnalyzer.processingPatterns')}</span>
            </>
          ) : (
            <span className="group-hover:translate-x-1 transition-transform">
              {activeTab === 'sms' ? t('tools.messageAnalyzer.analyzeMessage') : t('tools.messageAnalyzer.analyzeEmail')}
            </span>
          )}
        </button>
      </motion.div>

      {/* Console */}
      <CyberIntelligenceConsole isScanning={loading} type={activeTab} target={activeTab === 'sms' ? text.slice(0, 40) : emailAddr} />

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs rounded-xl flex items-center gap-3">
          <span className="text-lg">⚠</span> {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cyber-card p-8 space-y-8 relative overflow-hidden ${
              result.riskLevel === 'dangerous' ? 'border-cyber-red/50 shadow-[0_0_24px_rgba(255,34,68,0.12)]' : ''
            }`}
          >
            {result.riskLevel === 'dangerous' && (
              <div className="absolute top-0 inset-x-0 h-1 bg-cyber-red animate-pulse" />
            )}

            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              <ThreatGauge score={result.score} riskLevel={result.riskLevel} size={160} />

              <div className="flex-1 space-y-6 w-full">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-widest">
                      {result.mode === 'sms' ? t('tools.messageAnalyzer.scamConfidence') : t('tools.messageAnalyzer.emailIntel')}
                    </p>
                    <h2 className="text-3xl font-bold mt-1 font-display tracking-wider text-cyber-text">
                      {t('tools.messageAnalyzer.threatIndex')}: {result.score}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RiskBadge level={result.riskLevel} />
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error('Operator profile required to download PDF report. Redirecting to login...', { duration: 4000 });
                          setTimeout(() => navigate('/login'), 2000);
                          return;
                        }
                        exportToolReportPdf('Message Analyzer', result.mode === 'sms' ? text.substring(0, 50) : emailAddr, result, user);
                      }}
                      disabled={exporting}
                      className="text-[9px] font-mono uppercase tracking-widest bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent px-3 py-1.5 rounded hover:bg-cyber-accent hover:text-black transition-colors disabled:opacity-50"
                    >
                      {exporting ? t('common.loading') : t('scanner.validation.downloadPdf')}
                    </button>
                  </div>
                </div>

                {/* SMS Result Details */}
                {result.mode === 'sms' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-cyber-surface/40 border border-cyber-border/40 p-4 rounded-xl">
                      <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-2">{t('tools.messageAnalyzer.engine')}</p>
                      <div className="font-mono text-cyber-accent text-xs bg-cyber-accent/10 border border-cyber-accent/30 p-3 rounded-lg flex items-center gap-3">
                        <span>🤖</span> {result.verifyingAuthority}
                      </div>
                    </div>
                    <div className="bg-cyber-surface/40 border border-cyber-border/40 p-4 rounded-xl">
                      <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-2">{t('tools.messageAnalyzer.riskStatus')}</p>
                      <p className={`font-mono text-xs p-3 rounded-lg border ${
                        result.riskLevel === 'dangerous' ? 'text-cyber-red border-cyber-red/30' : 'text-cyber-green border-cyber-green/30'
                      }`}>
                        {result.riskLevel === 'dangerous' ? t('tools.messageAnalyzer.criticalPhishing') : t('tools.messageAnalyzer.noScamPatterns')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Result Details */}
                {result.mode === 'email' && result.checks && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Disposable Domain', value: result.checks.disposableDomain ? '⚠ YES' : '✓ No', danger: result.checks.disposableDomain },
                      { label: 'MX Records', value: result.checks.hasMxRecords ? '✓ Resolved' : '⚠ None Found', danger: !result.checks.hasMxRecords },
                      { label: 'Syntax', value: result.checks.syntax ? '✓ Valid' : '✗ Invalid', danger: !result.checks.syntax },
                      { label: 'Typo Suggestion', value: result.checks.typoSuggestion || '—', danger: !!result.checks.typoSuggestion },
                    ].map((row, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${row.danger ? 'bg-cyber-red/5 border-cyber-red/30' : 'bg-cyber-surface/40 border-cyber-border/40'}`}>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-cyber-muted mb-1">{row.label}</p>
                        <p className={`font-mono text-xs font-bold ${row.danger ? 'text-cyber-red' : 'text-cyber-green'}`}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Extracted URLs (SMS mode) */}
                {result.mode === 'sms' && urlsOnly.length > 0 && (
                  <div className="pt-4 border-t border-cyber-border/30">
                    <p className="font-mono text-cyber-muted text-[10px] mb-4 uppercase tracking-[0.2em]">{t('tools.messageAnalyzer.detectedUrls')}</p>
                    <div className="space-y-3">
                      {urlsOnly.map((url, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 bg-black/30 border border-cyber-border/30 p-3 rounded-xl group hover:border-cyber-accent transition-colors">
                          <code className="font-mono text-[11px] text-cyber-text truncate">{url.value}</code>
                          <button onClick={() => handleDeepScan(url.value)}
                            className="shrink-0 text-[10px] font-mono text-cyber-accent uppercase tracking-wider hover:underline">
                            {t('scanner.validation.forensicScan')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email recommended action */}
                {result.mode === 'email' && result.recommendedAction && (
                  <div className="bg-cyber-accent/5 border border-cyber-accent/20 p-5 rounded-2xl">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyber-accent mb-2">{t('tools.messageAnalyzer.recommendedAction')}</p>
                    <p className="font-mono text-xs text-cyber-text leading-relaxed">{result.recommendedAction}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
