import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { stagger, fadeUp } from '../../../utils/motion';
import CyberIntelligenceConsole from '../../common/CyberIntelligenceConsole';
import AIReportModal from '../../scan/AIReportModal';
import useScannerState from './hooks/useScannerState';

// Sub-components
import ScanTargetForm from './sub-components/ScanTargetForm';
import ScanResultConsole from './sub-components/ScanResultConsole';

const SOURCE_MAP_BY_TYPE = {
  url: ['UrlEngine URL', 'DnsEngine', 'Threat Scoring Engine'],
  ip: ['UrlEngine IP', 'UrlEngine', 'Threat Scoring Engine'],
  domain: ['DnsEngine', 'UrlEngine Domain', 'Threat Scoring Engine'],
  hash: ['UrlEngine Hash', 'CIRCL UrlEngine', 'Threat Scoring Engine'],
};

/**
 * ScannerInput Component
 * Coordinator for real-time security scanning inputs and console alerts.
 */
export default function ScannerInput({ onResult }) {
  const { t } = useTranslation();
  const [showReport, setShowReport] = useState(false);

  const copy = useMemo(
    () => ({
      loginToScan: t('scanner.validation.loginToScan', 'Please login to perform a scan.'),
      dangerToast: t('scanner.validation.dangerToast', 'Danger detected! Threat score:'),
      mediumToast: t('scanner.validation.mediumToast', 'Medium warning:'),
      scanFailed: t('scanner.validation.scanFailed', 'Scan failed.'),
      helperEmpty: t('scanner.validation.helperEmpty', 'Enter target IP, Domain, URL, or Hash'),
      helperValid: t(
        'scanner.validation.helperValid',
        'Valid target format detected'
      ),
      helperInvalid: t('scanner.validation.helperInvalid', 'Invalid target format'),
      helperExtracted: (count) =>
        t('scanner.validation.helperExtracted', { count }),
      quickTest: t('scanner.validation.quickTest', 'Quick Test:'),
      placeholder: t('scanner.validation.placeholder', 'Scan IP, domain, URL, or file hash...'),
      scanning: t('scanner.validation.scanning', 'Scanning...'),
      scan: t('scanner.validation.scan', 'Scan'),
      loadingTitle: t('scanner.validation.loadingTitle', 'INTERROGATING INTEL CHANNELS'),
      queried: t('scanner.validation.queried', 'Intel Queried'),
      appears: t('scanner.validation.appears', 'Target appears to be'),
      scannedTarget: t('scanner.validation.scannedTarget', 'Scanned Target'),
      actionDanger: t('scanner.validation.actionDanger', 'Isolate node network links immediately.'),
      actionMedium: t('scanner.validation.actionMedium', 'Monitor activity closely.'),
      actionSafe: t('scanner.validation.actionSafe', 'No immediate threats discovered.'),
      viewReport: t('scanner.validation.viewReport', 'View Report'),
      downloadPdf: t('scanner.validation.downloadPdf', 'Download PDF'),
    }),
    [t]
  );

  const {
    target,
    setTarget,
    loading,
    result,
    inputFocused,
    setInputFocused,
    extractedTargets,
    setExtractedTargets,
    detectedType,
    heuristics,
    handleScan,
  } = useScannerState({ onResult, copy, t });

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
    >
      {/* Scanner Input Form */}
      <ScanTargetForm
        target={target}
        setTarget={setTarget}
        loading={loading}
        inputFocused={inputFocused}
        setInputFocused={setInputFocused}
        heuristics={heuristics}
        detectedType={detectedType}
        extractedTargets={extractedTargets}
        setExtractedTargets={setExtractedTargets}
        onSubmitScan={handleScan}
        copy={copy}
      />

      {/* Modern Intelligence Console */}
      <CyberIntelligenceConsole
        isScanning={loading}
        type={detectedType || 'url'}
        target={target}
      />

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
            <p className="font-mono text-cyber-accent text-sm animate-pulse uppercase tracking-[0.3em]">
              {copy.loadingTitle}
            </p>
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
            <ScanResultConsole
              result={result}
              copy={copy}
              onViewReport={() => setShowReport(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AIReportModal isOpen={showReport} onClose={() => setShowReport(false)} scanData={result} />
    </motion.div>
  );
}
