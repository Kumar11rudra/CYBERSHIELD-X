import React from 'react';
import ScannerInput from '../components/scan/ScannerInput';
import { useTranslation } from 'react-i18next';

export default function ScanPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-cyber-text tracking-widest uppercase">{t('navigation.liveScanner')}</h1>
        <p className="font-mono text-cyber-muted text-xs mt-2 max-w-2xl">
          {t('scanner.description')}
        </p>
      </div>

      {/* Scanner card */}
      <div className="cyber-card p-6">
        <p className="font-mono text-cyber-muted text-xs uppercase tracking-wider mb-4">{t('scanner.enterTarget')}</p>
        <ScannerInput />
      </div>

      {/* Info section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <p className="font-mono text-cyber-accent text-xs uppercase tracking-wider mb-2">📊 {t('scanner.realtimeAnalysis')}</p>
          <p className="font-mono text-cyber-muted text-xs leading-relaxed">
            {t('scanner.realtimeAnalysisDesc')}
          </p>
        </div>
        <div className="cyber-card p-4">
          <p className="font-mono text-cyber-accent text-xs uppercase tracking-wider mb-2">🔍 {t('scanner.comprehensiveData')}</p>
          <p className="font-mono text-cyber-muted text-xs leading-relaxed">
            {t('scanner.comprehensiveDataDesc')}
          </p>
        </div>
        <div className="cyber-card p-4">
          <p className="font-mono text-cyber-accent text-xs uppercase tracking-wider mb-2">📥 {t('scanner.exportReports')}</p>
          <p className="font-mono text-cyber-muted text-xs leading-relaxed">
            {t('scanner.exportReportsDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
