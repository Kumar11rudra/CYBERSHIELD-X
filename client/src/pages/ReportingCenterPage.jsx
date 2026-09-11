import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Search,
  Plus,
  Play,
  Trash2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Lock,
  Filter,
  Check,
  X,
  PieChart,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', icon: TrendingUp, desc: 'High-level organizational risk posture, critical exposures, and operational SLA performance.' },
  { id: 'SOC_OPERATIONS', label: 'SOC Operations', icon: Activity, desc: 'Operational throughput, MTTA, MTTR, analyst caseload, and triage metrics.' },
  { id: 'INCIDENT_REPORT', label: 'Incident Report', icon: AlertTriangle, desc: 'Deep-dive postmortem on active or resolved incidents with attack chains and evidence logs.' },
  { id: 'CASE_DOSSIER', label: 'Case Dossier', icon: Layers, desc: 'Comprehensive case intelligence dossier with linked findings, alerts, and assets.' },
  { id: 'THREAT_HUNT_REPORT', label: 'Threat Hunt Report', icon: Search, desc: 'Hypotheses, sweeps, indicators matched, and telemetry queries executed.' },
  { id: 'DETECTION_COVERAGE', label: 'Detection Coverage', icon: Shield, desc: 'MITRE ATT&CK matrix coverage, active rules, detection gaps, and test results.' },
  { id: 'THREAT_INTELLIGENCE', label: 'Threat Intelligence', icon: BarChart3, desc: 'Active adversary profiles, IOC feeds, campaign telemetry, and watchlist matches.' },
  { id: 'COMPLIANCE_EVIDENCE', label: 'Compliance Evidence', icon: Lock, desc: 'Evidence packages mapped across 9 security control frameworks with immutable hashes.' },
  { id: 'AUDIT_ACTIVITY', label: 'Audit Activity', icon: Clock, desc: 'Immutable platform audit logs, actor provenance, state transitions, and access history.' }
];

export default function ReportingCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kpis'); // kpis, library, generator, schedules, ai
  const [loading, setLoading] = useState(false);

  // Operational Metrics states
  const [kpis, setKpis] = useState(null);
  const [mttaMttr, setMttaMttr] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);

  // Reports Library states
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFilterType, setReportFilterType] = useState('');
  const [reportSearch, setReportSearch] = useState('');

  // Generator states
  const [genReportType, setGenReportType] = useState('EXECUTIVE_SUMMARY');
  const [genTitle, setGenTitle] = useState('');
  const [genDesc, setGenDesc] = useState('');
  const [genTimeRange, setGenTimeRange] = useState('30d');
  const [isGenerating, setIsGenerating] = useState(false);

  // Schedules states
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedName, setSchedName] = useState('');
  const [schedType, setSchedType] = useState('EXECUTIVE_SUMMARY');
  const [schedFreq, setSchedFreq] = useState('WEEKLY');
  const [schedRecipients, setSchedRecipients] = useState('');

  // AI Advisory states
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [metricToExplain, setMetricToExplain] = useState('MTTA');

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [kpiRes, mttaRes, slaRes, trendsRes, riskRes] = await Promise.allSettled([
        api.get('/reports/metrics/kpis'),
        api.get('/reports/metrics/mtta-mttr?timeRange=30d'),
        api.get('/reports/metrics/sla?timeRange=30d'),
        api.get('/reports/metrics/trends?period=30d'),
        api.get('/reports/metrics/executive-risk'),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value.data.success) {
        setKpis(kpiRes.value.data.data);
      }
      if (mttaRes.status === 'fulfilled' && mttaRes.value.data.success) {
        setMttaMttr(mttaRes.value.data.data);
      }
      if (slaRes.status === 'fulfilled' && slaRes.value.data.success) {
        setSlaData(slaRes.value.data.data);
      }
      if (trendsRes.status === 'fulfilled' && trendsRes.value.data.success) {
        setTrends(trendsRes.value.data.data);
      }
      if (riskRes.status === 'fulfilled' && riskRes.value.data.success) {
        setRiskSummary(riskRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
      toast.error('Failed to fetch operational metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const params = {};
      if (reportFilterType) params.reportType = reportFilterType;
      if (reportSearch) params.search = reportSearch;
      const res = await api.get('/reports', { params });
      if (res.data.success) {
        setReports(res.data.data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  }, [reportFilterType, reportSearch]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/reports/schedules');
      if (res.data.success) {
        setSchedules(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchReports();
    fetchSchedules();
  }, [fetchMetrics, fetchReports, fetchSchedules]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await api.post('/reports/generate', {
        reportType: genReportType,
        title: genTitle || `${genReportType.replace(/_/g, ' ')} — ${new Date().toLocaleDateString()}`,
        description: genDesc,
        parameters: { timeRange: genTimeRange },
      });
      if (res.data.success) {
        toast.success(`Report generated: ${res.data.data.reportId} (v${res.data.data.version})`);
        setGenTitle('');
        setGenDesc('');
        fetchReports();
        setActiveTab('library');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Report generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (reportId, format) => {
    window.open(`${api.defaults.baseURL || ''}/api/reports/${reportId}/export/${format}`, '_blank');
    toast.success(`Downloading ${format.toUpperCase()} export...`);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/reports/schedules', {
        name: schedName,
        reportType: schedType,
        frequency: schedFreq,
        recipients: schedRecipients.split(',').map((r) => r.trim()).filter(Boolean),
      });
      if (res.data.success) {
        toast.success('Report schedule created');
        setShowScheduleModal(false);
        setSchedName('');
        fetchSchedules();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleRunScheduleNow = async (scheduleId) => {
    try {
      toast.loading('Triggering scheduled generation...', { id: 'sched' });
      const res = await api.post(`/reports/schedules/${scheduleId}/run-now`);
      if (res.data.success) {
        toast.success('Report generated successfully via scheduler', { id: 'sched' });
        fetchSchedules();
        fetchReports();
      }
    } catch (err) {
      toast.error('Schedule execution failed', { id: 'sched' });
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this report schedule?')) return;
    try {
      await api.delete(`/reports/schedules/${scheduleId}`);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to delete schedule');
    }
  };

  const askAiExplainer = async (metric) => {
    try {
      setAiLoading(true);
      const val = kpis ? kpis[metric] || '0' : '0';
      const res = await api.post('/chatbot/reports/explain-metric', {
        metricName: metric,
        metricValue: val,
      });
      if (res.data.success) {
        setAiInsight(res.data.data);
      }
    } catch (err) {
      toast.error('AI copilot unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const askAiExecutiveNarrative = async () => {
    try {
      setAiLoading(true);
      const res = await api.post('/chatbot/reports/executive', {
        riskScore: riskSummary?.calculatedRiskScore || 0,
        criticalIncidents: kpis?.incidents?.critical || 0,
        slaBreaches: slaData?.breachedCount || 0,
        detectionGaps: kpis?.detections?.gaps || 0,
        openFindings: kpis?.findings?.open || 0,
      });
      if (res.data.success) {
        setAiInsight({
          name: 'Executive Briefing',
          interpretation: res.data.data.executiveNarrative,
          aiBoundary: res.data.data.aiBoundary,
        });
      }
    } catch (err) {
      toast.error('AI narrative generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text p-4 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyber-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyber-accent/10 rounded-xl border border-cyber-accent/30 text-cyber-accent">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Enterprise SOC Reporting & Intelligence
                <span className="px-2 py-0.5 text-xs font-mono bg-cyber-accent/20 text-cyber-accent rounded border border-cyber-accent/30">
                  Phase 74 Certified
                </span>
              </h1>
              <p className="text-sm text-cyber-muted mt-0.5">
                Audit-ready evidence, executive summaries, non-synthetic operational KPIs, and cryptographic report versioning.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              fetchMetrics();
              fetchReports();
              fetchSchedules();
              toast.success('Metrics refreshed from database');
            }}
            className="px-3.5 py-2 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-accent/50 text-xs font-medium text-cyber-text flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Records
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className="px-4 py-2 rounded-lg bg-cyber-accent hover:bg-cyber-accent/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyber-accent/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-cyber-border/40 pb-2 overflow-x-auto">
        {[
          { id: 'kpis', label: 'Executive Intelligence & KPIs', icon: TrendingUp },
          { id: 'library', label: `Report Library (${reports.length})`, icon: FileText },
          { id: 'generator', label: 'Report Generator', icon: Plus },
          { id: 'schedules', label: `Scheduled Tasks (${schedules.length})`, icon: Calendar },
          { id: 'ai', label: 'Bounded AI Copilot', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-cyber-card text-cyber-accent border border-cyber-accent/40 shadow-sm'
                  : 'text-cyber-muted hover:text-white hover:bg-cyber-card/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: EXECUTIVE INTELLIGENCE & KPIS ───────────────────────────── */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {/* Executive Risk Posture Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyber-card via-cyber-card/95 to-cyber-accent/5 border border-cyber-border/60 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyber-accent">
                  <Shield className="w-4 h-4" />
                  Calculated Enterprise Risk Posture
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-extrabold text-white">
                    {riskSummary ? `${riskSummary.calculatedRiskScore}/100` : 'CALCULATING...'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (riskSummary?.calculatedRiskScore || 0) > 60
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : (riskSummary?.calculatedRiskScore || 0) > 30
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {riskSummary?.riskBand || 'EVALUATING'}
                  </span>
                </div>
                <p className="text-xs text-cyber-muted max-w-2xl">
                  Evidence-based composite derived strictly from active critical incidents, unmitigated detection gaps,
                  vulnerabilities, and high-exposure assets. Zero synthetic score inflation.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                <div className="p-3 bg-cyber-bg/60 rounded-xl border border-cyber-border/40 text-center">
                  <div className="text-xs text-cyber-muted">Critical Incidents</div>
                  <div className="text-xl font-bold text-red-400 mt-1">
                    {riskSummary?.criticalIncidents?.count || kpis?.incidents?.critical || 0}
                  </div>
                </div>
                <div className="p-3 bg-cyber-bg/60 rounded-xl border border-cyber-border/40 text-center">
                  <div className="text-xs text-cyber-muted">Detection Gaps</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {riskSummary?.detectionGaps?.count || kpis?.detections?.gaps || 0}
                  </div>
                </div>
                <div className="p-3 bg-cyber-bg/60 rounded-xl border border-cyber-border/40 text-center">
                  <div className="text-xs text-cyber-muted">Open Findings</div>
                  <div className="text-xl font-bold text-cyber-accent mt-1">
                    {riskSummary?.unresolvedFindings?.count || kpis?.findings?.open || 0}
                  </div>
                </div>
                <div className="p-3 bg-cyber-bg/60 rounded-xl border border-cyber-border/40 text-center">
                  <div className="text-xs text-cyber-muted">SLA Breaches</div>
                  <div className="text-xl font-bold text-red-400 mt-1">
                    {slaData?.breachedCount || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MTTA Card */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-cyber-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyber-accent" />
                  MEAN TIME TO ACKNOWLEDGE (MTTA)
                </span>
                <button
                  onClick={() => askAiExplainer('MTTA')}
                  className="text-cyber-accent hover:underline text-[10px]"
                >
                  Explain
                </button>
              </div>
              <div className="text-3xl font-bold text-white">
                {mttaMttr?.mtta?.formatted || 'NO_DATA'}
              </div>
              <div className="text-[11px] text-cyber-muted flex items-center justify-between border-t border-cyber-border/30 pt-2">
                <span>Sample Size: {mttaMttr?.mtta?.sampleSize || 0}</span>
                <span className="text-amber-400/80">
                  Exclusions: {mttaMttr?.mtta?.excludedIncompleteCount || 0}
                </span>
              </div>
            </div>

            {/* MTTR Card */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-cyber-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  MEAN TIME TO RESOLVE (MTTR)
                </span>
                <button
                  onClick={() => askAiExplainer('MTTR')}
                  className="text-cyber-accent hover:underline text-[10px]"
                >
                  Explain
                </button>
              </div>
              <div className="text-3xl font-bold text-white">
                {mttaMttr?.mttr?.formatted || 'NO_DATA'}
              </div>
              <div className="text-[11px] text-cyber-muted flex items-center justify-between border-t border-cyber-border/30 pt-2">
                <span>Resolved: {mttaMttr?.mttr?.sampleSize || 0}</span>
                <span className="text-amber-400/80">
                  Excluded Open: {mttaMttr?.mttr?.excludedIncompleteCount || 0}
                </span>
              </div>
            </div>

            {/* SLA Compliance Card */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-cyber-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyber-accent" />
                  SLA PERFORMANCE
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {slaData?.onTrackRate !== undefined ? `${slaData.onTrackRate}% ON TRACK` : 'N/A'}
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                {slaData?.breachedCount !== undefined ? `${slaData.breachedCount} Breaches` : 'NO_DATA'}
              </div>
              <div className="text-[11px] text-cyber-muted flex items-center justify-between border-t border-cyber-border/30 pt-2">
                <span>Governed: {slaData?.totalGoverned || 0}</span>
                <span className="text-red-400/80">Rate: {slaData?.breachRate || 0}%</span>
              </div>
            </div>

            {/* Detection Coverage Card */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-cyber-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <Shield className="w-3.5 h-3.5 text-cyber-accent" />
                  ATT&CK COVERAGE
                </span>
                <button
                  onClick={() => askAiExplainer('ATTACK_COVERAGE')}
                  className="text-cyber-accent hover:underline text-[10px]"
                >
                  Explain
                </button>
              </div>
              <div className="text-3xl font-bold text-white">
                {kpis?.detections?.attackCoverageRate !== undefined
                  ? `${kpis.detections.attackCoverageRate}%`
                  : 'NOT_MEASURED'}
              </div>
              <div className="text-[11px] text-cyber-muted flex items-center justify-between border-t border-cyber-border/30 pt-2">
                <span>Active Rules: {kpis?.detections?.activeRules || 0}</span>
                <span className="text-amber-400/80">Gaps: {kpis?.detections?.gaps || 0}</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Incident Operational Lifecycle */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-accent" />
                Incident Lifecycle Breakdown
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Total Persisted Incidents</span>
                  <span className="font-mono font-bold text-white">{kpis?.incidents?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Active / Open Incidents</span>
                  <span className="font-mono font-bold text-amber-400">{kpis?.incidents?.open || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Critical Severity</span>
                  <span className="font-mono font-bold text-red-400">{kpis?.incidents?.critical || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Verified Resolved</span>
                  <span className="font-mono font-bold text-emerald-400">{kpis?.incidents?.resolved || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-cyber-muted">Closed Incidents</span>
                  <span className="font-mono font-bold text-cyber-muted">{kpis?.incidents?.closed || 0}</span>
                </div>
              </div>
            </div>

            {/* Threat Hunting & IOC Sweeps */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyber-accent" />
                Threat Hunting Operations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Total Hunt Sweeps</span>
                  <span className="font-mono font-bold text-white">{kpis?.threatHunts?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Matched Sweeps (Hits)</span>
                  <span className="font-mono font-bold text-amber-400">{kpis?.threatHunts?.matched || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Clean / No-Match Sweeps</span>
                  <span className="font-mono font-bold text-emerald-400">{kpis?.threatHunts?.noMatch || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-cyber-muted">Failed Sweeps</span>
                  <span className="font-mono font-bold text-red-400">{kpis?.threatHunts?.failed || 0}</span>
                </div>
              </div>
            </div>

            {/* Response Actions & Governance */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyber-accent" />
                Response Actions & Governance
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Pending Dual-Key Approvals</span>
                  <span className="font-mono font-bold text-amber-400">{kpis?.responseActions?.pendingApprovals || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Executed Actions</span>
                  <span className="font-mono font-bold text-emerald-400">{kpis?.responseActions?.successful || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cyber-border/20">
                  <span className="text-cyber-muted">Failed Actions</span>
                  <span className="font-mono font-bold text-red-400">{kpis?.responseActions?.failed || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-cyber-muted">Unverified Response Actions</span>
                  <span className="font-mono font-bold text-amber-400">{kpis?.responseActions?.unverified || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: REPORT LIBRARY & VIEWER ─────────────────────────────────── */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-cyber-card border border-cyber-border/50">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  type="text"
                  placeholder="Search report ID or title..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent"
                />
              </div>

              <select
                value={reportFilterType}
                onChange={(e) => setReportFilterType(e.target.value)}
                className="bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent"
              >
                <option value="">All Report Types</option>
                {REPORT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-cyber-muted font-mono">
              Showing {reports.length} immutable report versions
            </span>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto rounded-xl border border-cyber-border/50 bg-cyber-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-cyber-bg/80 border-b border-cyber-border/50 text-cyber-muted font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Report ID & Title</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Checksum (SHA-256)</th>
                  <th className="p-3.5">Generated At</th>
                  <th className="p-3.5 text-right">Exports & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/30">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-cyber-muted">
                      No reports generated yet. Click "Generate Report" to produce your first enterprise audit report.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.reportId} className="hover:bg-cyber-bg/40 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{r.title}</div>
                        <div className="text-[11px] font-mono text-cyber-accent mt-0.5">{r.reportId}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border/60 text-[11px] font-mono">
                          {r.reportType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-cyber-text font-bold">
                        v{r.version}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-cyber-muted truncate max-w-[140px]" title={r.contentHash}>
                        {r.contentHash ? `${r.contentHash.slice(0, 16)}...` : 'N/A'}
                      </td>
                      <td className="p-3.5 text-cyber-muted whitespace-nowrap">
                        {r.generatedAt ? new Date(r.generatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="p-1.5 rounded bg-cyber-bg hover:bg-cyber-border text-cyber-text transition"
                            title="View Snapshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExport(r.reportId, 'json')}
                            className="p-1.5 rounded bg-cyber-bg hover:bg-cyber-border text-cyber-accent transition"
                            title="Export JSON"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExport(r.reportId, 'csv')}
                            className="p-1.5 rounded bg-cyber-bg hover:bg-cyber-border text-emerald-400 transition"
                            title="Export CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExport(r.reportId, 'pdf')}
                            className="p-1.5 rounded bg-cyber-bg hover:bg-cyber-border text-red-400 transition"
                            title="Export PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Snapshot Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
              <div className="bg-cyber-card border border-cyber-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                <div className="p-5 border-b border-cyber-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedReport.title}</h3>
                    <p className="text-xs text-cyber-muted font-mono mt-0.5">
                      {selectedReport.reportId} (v{selectedReport.version}) • Checksum: {selectedReport.contentHash}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded text-cyber-muted hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border/40 text-xs font-mono space-y-1">
                    <div>Type: <span className="text-white">{selectedReport.reportType}</span></div>
                    <div>Requested By: <span className="text-white">{selectedReport.requestedBy}</span></div>
                    <div>Generated: <span className="text-white">{new Date(selectedReport.generatedAt).toISOString()}</span></div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Report Snapshot Preview</h4>
                    <pre className="p-4 bg-cyber-bg rounded-xl border border-cyber-border/40 text-[11px] font-mono text-cyber-text overflow-x-auto max-h-96">
                      {JSON.stringify(selectedReport.contentSnapshot || selectedReport, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="p-4 border-t border-cyber-border flex items-center justify-between bg-cyber-bg/40">
                  <span className="text-[11px] text-cyber-muted font-mono">
                    Cryptographically immutable snapshot
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(selectedReport.reportId, 'pdf')}
                      className="px-3 py-1.5 rounded-lg bg-cyber-accent text-white text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-cyber-text text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: REPORT GENERATOR ────────────────────────────────────────── */}
      {activeTab === 'generator' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border/60 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Generate Enterprise SOC Report</h2>
              <p className="text-xs text-cyber-muted mt-1">
                Select a certified report template. Reports are generated strictly from persisted platform records
                with cryptographic SHA-256 immutability.
              </p>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white uppercase tracking-wider">
                  Select Report Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {REPORT_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = genReportType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setGenReportType(t.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-cyber-accent/15 border-cyber-accent text-white shadow-md'
                            : 'bg-cyber-bg/60 border-cyber-border/50 text-cyber-muted hover:border-cyber-accent/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-xs">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyber-accent' : 'text-cyber-muted'}`} />
                          {t.label}
                        </div>
                        <p className="text-[11px] text-cyber-muted mt-1.5 leading-relaxed">
                          {t.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Report Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 SOC Executive Risk & Operations Dossier"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Observation Window</label>
                  <select
                    value={genTimeRange}
                    onChange={(e) => setGenTimeRange(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days (Standard)</option>
                    <option value="90d">Last Quarter (90 Days)</option>
                    <option value="all">Full Historical Persistence</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Report Executive Scope / Notes (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide context or specific areas of audit focus..."
                  value={genDesc}
                  onChange={(e) => setGenDesc(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyber-accent"
                />
              </div>

              <div className="p-4 rounded-xl bg-cyber-bg/50 border border-cyber-border/40 flex items-start gap-3">
                <Shield className="w-4 h-4 text-cyber-accent shrink-0 mt-0.5" />
                <div className="text-[11px] text-cyber-muted leading-relaxed">
                  <strong className="text-white">Reporting Truthfulness Guarantee:</strong> Reports will NOT interpolate or invent missing data.
                  If no incidents or threat hunts exist in the selected window, the report will explicitly document
                  <code className="mx-1 px-1 bg-cyber-card text-cyber-accent rounded">NO_DATA</code> or
                  <code className="mx-1 px-1 bg-cyber-card text-cyber-accent rounded">INSUFFICIENT_DATA</code>.
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-lg bg-cyber-accent hover:bg-cyber-accent/90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyber-accent/20 transition"
                >
                  <FileText className="w-4 h-4" />
                  {isGenerating ? 'Generating Verifiable Report...' : 'Generate Immutable Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SCHEDULED REPORTS ───────────────────────────────────────── */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Automated Report Schedules</h2>
              <p className="text-xs text-cyber-muted">
                Configure recurrent report generation tasks. Generation success is cryptographically recorded separately from delivery status.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-lg bg-cyber-accent text-white text-xs font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.length === 0 ? (
              <div className="col-span-full p-8 text-center text-cyber-muted rounded-xl border border-cyber-border/40 bg-cyber-card">
                No automated report schedules configured yet.
              </div>
            ) : (
              schedules.map((s) => (
                <div key={s.scheduleId} className="p-5 rounded-xl bg-cyber-card border border-cyber-border/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{s.name}</h4>
                      <p className="text-[11px] font-mono text-cyber-accent mt-0.5">{s.scheduleId}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-bg border border-cyber-border text-cyber-text">
                      {s.frequency}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-cyber-muted">
                    <div>Type: <span className="text-white font-mono">{s.reportType}</span></div>
                    <div>Next Run: <span className="text-white">{s.nextRunAt ? new Date(s.nextRunAt).toLocaleDateString() : 'Pending'}</span></div>
                    <div>Last Status: <span className="text-emerald-400 font-mono">{s.lastRunStatus || 'NONE'}</span></div>
                  </div>

                  <div className="flex items-center justify-between border-t border-cyber-border/30 pt-3">
                    <button
                      onClick={() => handleRunScheduleNow(s.scheduleId)}
                      className="px-3 py-1.5 rounded bg-cyber-bg hover:bg-cyber-accent hover:text-white text-xs text-cyber-text font-medium flex items-center gap-1.5 transition"
                    >
                      <Play className="w-3 h-3" />
                      Run Now
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(s.scheduleId)}
                      className="p-1.5 rounded text-cyber-muted hover:text-red-400 transition"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
              <div className="bg-cyber-card border border-cyber-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-cyber-border pb-3">
                  <h3 className="font-bold text-white text-base">Create Report Schedule</h3>
                  <button onClick={() => setShowScheduleModal(false)} className="text-cyber-muted hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">Schedule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Weekly Executive Briefing"
                      value={schedName}
                      onChange={(e) => setSchedName(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white">Report Template</label>
                      <select
                        value={schedType}
                        onChange={(e) => setSchedType(e.target.value)}
                        className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                      >
                        {REPORT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white">Frequency</label>
                      <select
                        value={schedFreq}
                        onChange={(e) => setSchedFreq(e.target.value)}
                        className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="ON_DEMAND">On Demand</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">Recipients (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="ciso@org.com, soc-lead@org.com"
                      value={schedRecipients}
                      onChange={(e) => setSchedRecipients(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-accent"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-xs text-cyber-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-cyber-accent text-white text-xs font-semibold"
                    >
                      Create Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: BOUNDED AI COPILOT ──────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border/60 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyber-accent" />
                  Bounded AI Reporting Copilot
                </h2>
                <p className="text-xs text-cyber-muted mt-1">
                  Advisory interpretation of operational metrics and executive narratives. AI does not alter data, certify compliance, or invent values.
                </p>
              </div>

              <button
                onClick={askAiExecutiveNarrative}
                disabled={aiLoading}
                className="px-4 py-2 rounded-lg bg-cyber-accent text-white text-xs font-semibold flex items-center gap-2"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Draft Executive Narrative
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-cyber-border/30">
              <span className="text-xs text-cyber-muted self-center mr-2">Explain Metric:</span>
              {['MTTA', 'MTTR', 'SLA_BREACH_RATE', 'ATTACK_COVERAGE'].map((m) => (
                <button
                  key={m}
                  onClick={() => askAiExplainer(m)}
                  className="px-3 py-1 rounded bg-cyber-bg border border-cyber-border/60 hover:border-cyber-accent text-xs font-mono text-cyber-text"
                >
                  {m}
                </button>
              ))}
            </div>

            {/* AI Output Card */}
            {aiLoading ? (
              <div className="p-8 text-center text-xs text-cyber-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyber-accent" />
                Synthesizing bounded advisory analysis...
              </div>
            ) : aiInsight ? (
              <div className="p-5 rounded-xl bg-cyber-bg border border-cyber-accent/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyber-accent" />
                    {aiInsight.name || 'AI Advisory Insight'}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-card border border-cyber-border text-cyber-accent">
                    ADVISORY ONLY
                  </span>
                </div>

                {aiInsight.formula && (
                  <div className="text-xs font-mono text-cyber-muted bg-cyber-card/60 p-2.5 rounded-lg border border-cyber-border/30">
                    Formula: <span className="text-white">{aiInsight.formula}</span>
                  </div>
                )}

                <p className="text-xs text-cyber-text leading-relaxed whitespace-pre-line">
                  {aiInsight.interpretation}
                </p>

                {aiInsight.aiBoundary && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300">
                    <strong>Guardrail Disclaimer:</strong> {aiInsight.aiBoundary.disclaimer}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-cyber-muted rounded-xl bg-cyber-bg/40 border border-cyber-border/30">
                Click "Draft Executive Narrative" or choose a metric above to consult the advisory AI assistant.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
