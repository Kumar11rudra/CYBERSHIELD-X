import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  FileCheck,
  Download,
  RefreshCw,
  Search,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  Shield,
  Activity,
  X,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DOMAINS = [
  { id: 'ALL', label: 'All Domains' },
  { id: 'ACCESS_CONTROL', label: 'Access Control' },
  { id: 'LOGGING_MONITORING', label: 'Logging & Monitoring' },
  { id: 'VULNERABILITY_MANAGEMENT', label: 'Vulnerability Management' },
  { id: 'INCIDENT_RESPONSE', label: 'Incident Response' },
  { id: 'CHANGE_MANAGEMENT', label: 'Change Management' },
  { id: 'ASSET_MANAGEMENT', label: 'Asset Management' },
  { id: 'DATA_PROTECTION', label: 'Data Protection' },
  { id: 'THREAT_DETECTION', label: 'Threat Detection' },
  { id: 'BUSINESS_CONTINUITY', label: 'Business Continuity' },
];

export default function ComplianceCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('controls'); // controls, packages, ai
  const [controls, setControls] = useState([]);
  const [selectedControl, setSelectedControl] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // AI Advisory Explainer
  const [aiControlInsight, setAiControlInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/compliance/controls');
      if (res.data.success) {
        setControls(res.data.data.controls || []);
      }
    } catch (err) {
      console.error('Failed to load compliance controls:', err);
      toast.error('Failed to fetch compliance controls');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await api.get('/compliance/evidence-packages');
      if (res.data.success) {
        setPackages(res.data.data.packages || []);
      }
    } catch (err) {
      console.error('Failed to fetch evidence packages:', err);
    }
  }, []);

  useEffect(() => {
    fetchControls();
    fetchPackages();
  }, [fetchControls, fetchPackages]);

  const handleEvaluateAll = async () => {
    try {
      setEvaluating(true);
      toast.loading('Evaluating controls against persisted platform evidence...', { id: 'eval' });
      const res = await api.post('/compliance/evaluate-all');
      if (res.data.success) {
        toast.success(`Evaluated ${res.data.data.length} controls against real evidence`, { id: 'eval' });
        fetchControls();
      }
    } catch (err) {
      toast.error('Evidence evaluation failed', { id: 'eval' });
    } finally {
      setEvaluating(false);
    }
  };

  const handleGeneratePackage = async (controlId) => {
    try {
      toast.loading('Generating immutable evidence package...', { id: 'pkg' });
      const res = await api.post('/compliance/evidence-packages', { controlId });
      if (res.data.success) {
        toast.success(`Package ${res.data.data.packageId} created with SHA-256 proof`, { id: 'pkg' });
        fetchPackages();
        setActiveTab('packages');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate evidence package', { id: 'pkg' });
    }
  };

  const handleVerifyPackage = async (packageId) => {
    try {
      const res = await api.get(`/compliance/evidence-packages/${packageId}`);
      if (res.data.success) {
        setSelectedPackage(res.data.data);
      }
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const askAiControlExplainer = async (control) => {
    try {
      setAiLoading(true);
      const res = await api.post('/chatbot/reports/explain-control', {
        controlId: control.controlId,
        domain: control.domain,
      });
      if (res.data.success) {
        setAiControlInsight(res.data.data);
        setActiveTab('ai');
      }
    } catch (err) {
      toast.error('AI explanation unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredControls = controls.filter(
    (c) => selectedDomain === 'ALL' || c.domain === selectedDomain
  );

  const stats = {
    total: controls.length,
    present: controls.filter((c) => c.status === 'EVIDENCE_PRESENT').length,
    partial: controls.filter((c) => c.status === 'PARTIAL_EVIDENCE').length,
    missing: controls.filter((c) => c.status === 'NO_EVIDENCE').length,
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyber-accent/10 rounded-xl border border-cyber-accent/30 text-cyber-accent">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Compliance Evidence & Audit Center
                <span className="px-2 py-0.5 text-xs font-mono bg-cyber-accent/20 text-cyber-accent rounded border border-cyber-accent/30">
                  Zero Trust Evidence
                </span>
              </h1>
              <p className="text-sm text-cyber-muted mt-0.5">
                Automated platform evidence mappings across 9 security control frameworks. Cryptographically sealed audit bundles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleEvaluateAll}
            disabled={evaluating}
            className="px-4 py-2 rounded-lg bg-cyber-accent hover:bg-cyber-accent/90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyber-accent/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            Evaluate Platform Evidence
          </button>
        </div>
      </div>

      {/* Compliance Posture Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border/50">
          <div className="text-xs text-cyber-muted">Total Monitored Controls</div>
          <div className="text-2xl font-extrabold text-white mt-1">{stats.total} Controls</div>
          <div className="text-[11px] text-cyber-muted mt-1">Across 9 Modular Domains</div>
        </div>
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border/50">
          <div className="text-xs text-cyber-muted">Evidence Present</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.present}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Verified Platform Records</div>
        </div>
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border/50">
          <div className="text-xs text-cyber-muted">Partial Evidence</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{stats.partial}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Sub-Threshold Records</div>
        </div>
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border/50">
          <div className="text-xs text-cyber-muted">Missing Evidence</div>
          <div className="text-2xl font-extrabold text-red-400 mt-1">{stats.missing}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Action Required</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-2">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
            activeTab === 'controls'
              ? 'bg-cyber-card text-cyber-accent border border-cyber-accent/40'
              : 'text-cyber-muted hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Control Framework ({filteredControls.length})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
            activeTab === 'packages'
              ? 'bg-cyber-card text-cyber-accent border border-cyber-accent/40'
              : 'text-cyber-muted hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Evidence Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
            activeTab === 'ai'
              ? 'bg-cyber-card text-cyber-accent border border-cyber-accent/40'
              : 'text-cyber-muted hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Control Copilot
        </button>
      </div>

      {/* ─── TAB 1: CONTROLS MATRIX ─────────────────────────────────────────── */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Domain Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedDomain === d.id
                    ? 'bg-cyber-accent text-white font-semibold'
                    : 'bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredControls.map((c) => {
              const isPresent = c.status === 'EVIDENCE_PRESENT';
              const isPartial = c.status === 'PARTIAL_EVIDENCE';
              const isMissing = c.status === 'NO_EVIDENCE';

              return (
                <div
                  key={c.controlId}
                  className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 hover:border-cyber-accent/40 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border/60 text-cyber-accent">
                        {c.controlId}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          isPresent
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isPartial
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm leading-snug">{c.title}</h4>
                    <p className="text-xs text-cyber-muted line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-cyber-border/30">
                    <div className="flex items-center justify-between text-xs text-cyber-muted">
                      <span>Domain: <strong className="text-white">{c.domain}</strong></span>
                      <span>Records: <strong className="text-cyber-accent font-mono">{c.evidenceCount || 0}</strong></span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => askAiControlExplainer(c)}
                        className="text-[11px] text-cyber-accent hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain
                      </button>

                      <button
                        onClick={() => handleGeneratePackage(c.controlId)}
                        className="px-3 py-1.5 rounded bg-cyber-bg hover:bg-cyber-accent hover:text-white text-xs text-cyber-text font-medium flex items-center gap-1.5 transition"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Seal Package
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: EVIDENCE PACKAGES ───────────────────────────────────────── */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-cyber-border/50 bg-cyber-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-cyber-bg/80 border-b border-cyber-border/50 text-cyber-muted font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Package ID & Control</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Evidence Records</th>
                  <th className="p-3.5">Integrity Checksum (SHA-256)</th>
                  <th className="p-3.5">Generated At</th>
                  <th className="p-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/30">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-cyber-muted">
                      No sealed evidence packages found. Click "Seal Package" on any control to generate an immutable cryptographic proof.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.packageId} className="hover:bg-cyber-bg/40 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{pkg.controlTitle}</div>
                        <div className="text-[11px] font-mono text-cyber-accent mt-0.5">
                          {pkg.packageId} • {pkg.controlId}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border/60 text-[11px] font-mono">
                          {pkg.controlDomain}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-cyber-text font-bold">
                        {pkg.evidenceCount} records
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-cyber-muted truncate max-w-[140px]" title={pkg.packageHash}>
                        {pkg.packageHash ? `${pkg.packageHash.slice(0, 16)}...` : 'N/A'}
                      </td>
                      <td className="p-3.5 text-cyber-muted whitespace-nowrap">
                        {pkg.generatedAt ? new Date(pkg.generatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleVerifyPackage(pkg.packageId)}
                          className="px-3 py-1 rounded bg-cyber-bg hover:bg-cyber-border text-cyber-accent text-xs font-medium flex items-center gap-1.5 ml-auto transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Verify Hash
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Verification Modal */}
          {selectedPackage && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
              <div className="bg-cyber-card border border-cyber-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-cyber-border pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Cryptographic Proof Verification</h3>
                    <p className="text-xs text-cyber-muted font-mono">{selectedPackage.packageId}</p>
                  </div>
                  <button onClick={() => setSelectedPackage(null)} className="text-cyber-muted hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {selectedPackage.verification?.isHashValid
                        ? 'SHA-256 Hash matches recorded evidence state. Zero tampering detected.'
                        : 'Warning: Hash verification mismatch.'}
                    </span>
                  </div>

                  <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border/40 font-mono space-y-1.5">
                    <div>Control: <span className="text-white">{selectedPackage.controlTitle}</span> ({selectedPackage.controlId})</div>
                    <div>Domain: <span className="text-white">{selectedPackage.controlDomain}</span></div>
                    <div>Sealed Records: <span className="text-white font-bold">{selectedPackage.evidenceCount}</span></div>
                    <div className="truncate">Stored Hash: <span className="text-cyber-accent">{selectedPackage.packageHash}</span></div>
                    <div className="truncate">Computed Hash: <span className="text-emerald-400">{selectedPackage.verification?.computedHash}</span></div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-white">Source Records Included:</div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {selectedPackage.evidenceRecords?.map((r, i) => (
                        <div key={i} className="p-2 bg-cyber-bg/60 rounded border border-cyber-border/30 text-[11px]">
                          <span className="font-mono font-bold text-cyber-accent mr-2">{r.entityType}</span>
                          <span className="text-white mr-2">[{r.entityId}]</span>
                          <span className="text-cyber-muted">{r.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-cyber-border">
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border text-xs text-cyber-text"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: AI CONTROL COPILOT ──────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border/60 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyber-accent" />
                Compliance Advisory AI Copilot
              </h2>
              <p className="text-xs text-cyber-muted mt-1">
                Advisory interpretation of compliance controls and technical evidence criteria.
              </p>
            </div>

            {aiLoading ? (
              <div className="p-8 text-center text-xs text-cyber-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyber-accent" />
                Interpreting control evidence criteria...
              </div>
            ) : aiControlInsight ? (
              <div className="p-5 rounded-xl bg-cyber-bg border border-cyber-accent/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-sm">
                    {aiControlInsight.title} ({aiControlInsight.controlId})
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-card border border-cyber-border text-cyber-accent">
                    {aiControlInsight.domain}
                  </span>
                </div>

                <div className="text-xs text-cyber-text leading-relaxed">
                  {aiControlInsight.explanation}
                </div>

                <div className="p-3 bg-cyber-card/60 rounded-lg border border-cyber-border/40 text-xs font-mono">
                  <div className="text-cyber-muted">Evidence Criteria:</div>
                  <div className="text-white mt-0.5">{aiControlInsight.evidenceCriteria}</div>
                </div>

                {aiControlInsight.aiBoundary && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300">
                    <strong>Notice:</strong> {aiControlInsight.aiBoundary.disclaimer}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-cyber-muted rounded-xl bg-cyber-bg/40 border border-cyber-border/30">
                Select "Explain" on any control in the Control Framework tab to inspect its technical evidence criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
