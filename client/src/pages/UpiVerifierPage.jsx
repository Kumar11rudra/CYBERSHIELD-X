import React, { useState } from 'react';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import ThreatGauge from '../components/scan/ThreatGauge';
import CyberIntelligenceConsole from '../components/common/CyberIntelligenceConsole';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, transitions } from '../utils/motion';
import toast from 'react-hot-toast';
import usePdfExport from '../hooks/usePdfExport';
import { useAuth } from '../context/AuthContext';

export default function UpiVerifierPage() {
  const [upi, setUpi] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { exportToolReportPdf, exporting } = usePdfExport();

  const handleVerify = async () => {
    const trimmed = upi.trim();
    if (!trimmed) return;
    
    // Basic format check
    if (!trimmed.includes('@') && !trimmed.startsWith('upi://')) {
      toast.error('Enter a valid UPI ID (username@bank) or UPI Link');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/tools/upi', { upi: trimmed });
      setResult(res.data.analysis);
      toast.success('Verification complete');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to verify UPI';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <h1 className="font-display text-4xl text-cyber-text tracking-widest uppercase">
          UPI & Payment Link <span className="text-cyber-accent">Verifier</span>
        </h1>
        <p className="font-mono text-cyber-muted text-xs mt-3 max-w-2xl leading-relaxed">
          Check if a UPI ID (@bank) or a payment link is safe. Our engine verifies merchant handles against known fraud databases and banking protocols.
        </p>
      </motion.div>

      <motion.div className="cyber-card p-8 space-y-6" variants={fadeUp}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-accent font-mono text-xs">🏦</div>
            <input
              type="text"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="cyber-input pl-12 h-14"
              placeholder="e.g. merchant@okicici or upi://pay?pa=..."
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={loading || !upi.trim()}
            className="cyber-button-primary px-12 h-14 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                <span>Verifying</span>
              </>
            ) : (
              'Verify Handle'
            )}
          </button>
        </div>
        <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest text-center">
          Verified against NPCI Index + CyberShield Fraud Intelligence
        </p>
      </motion.div>

      <CyberIntelligenceConsole isScanning={loading} type="upi" target={upi} />

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs rounded-xl flex items-center gap-3"
        >
          <span className="text-lg">⚠</span> {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cyber-card p-8 space-y-8 relative overflow-hidden ${
              result.riskLevel === 'dangerous' ? 'border-cyber-red/50 shadow-[0_0_20px_rgba(255,34,68,0.1)]' : ''
            }`}
          >
            {result.riskLevel === 'dangerous' && (
              <div className="absolute top-0 inset-x-0 h-1 bg-cyber-red animate-pulse" />
            )}
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <ThreatGauge score={result.score} riskLevel={result.riskLevel} size={160} />
              
              <div className="flex-1 space-y-6 w-full">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-widest">Verification Result</p>
                    <h2 className="text-2xl font-bold mt-1 font-display tracking-wider text-cyber-text">
                      Risk Score: {result.score}/100
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RiskBadge level={result.riskLevel} />
                    <button 
                      onClick={() => exportToolReportPdf('UPI/Payment Verifier', upi, result, user)}
                      disabled={exporting}
                      className="text-[9px] font-mono uppercase tracking-widest bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent px-3 py-1.5 rounded hover:bg-cyber-accent hover:text-black transition-colors disabled:opacity-50"
                    >
                      {exporting ? 'Generating...' : 'Download PDF Report'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-cyber-surface/40 border border-cyber-border/40 p-4 rounded-xl">
                    <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-2 font-bold">Verifying Authority</p>
                    <div className="font-mono text-cyber-accent text-xs bg-cyber-accent/10 border border-cyber-accent/30 p-3 rounded flex items-center gap-3">
                      <span className="text-xl">🛡️</span> {result.verifyingAuthority}
                    </div>
                  </div>
                  <div className="bg-cyber-surface/40 border border-cyber-border/40 p-4 rounded-xl">
                    <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-wider mb-2 font-bold">Safety Status</p>
                    <p className={`font-mono text-xs p-3 rounded ${
                      result.riskLevel === 'dangerous' ? 'text-cyber-red bg-cyber-red/10 border border-cyber-red/30' : 'text-cyber-green bg-cyber-green/10 border border-cyber-green/30'
                    }`}>
                      {result.riskLevel === 'dangerous' 
                        ? 'IDENTIFIED AS POTENTIAL FRAUD. DO NOT PAY.' 
                        : 'NO ACTIVE REPORTS FOUND. PAY WITH CAUTION.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-cyber-border/30">
                  <p className="font-mono text-cyber-muted text-[10px] mb-2 uppercase tracking-widest">Analysis Details</p>
                  <p className="font-mono text-xs text-cyber-text/80 leading-relaxed italic">
                    "The provided handle was matched against our real-time database of reported fraudulent merchant VPAs. Heuristic analysis performed on ${upi.includes('@') ? 'VPA handle' : 'payment link string'}."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
