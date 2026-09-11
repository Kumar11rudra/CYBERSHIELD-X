import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'IOC_SWEEP', label: 'IOC Sweep' },
  { id: 'BEHAVIORAL', label: 'Behavioral Anomaly' },
  { id: 'DNS_ANOMALY', label: 'DNS / DGA Anomaly' },
  { id: 'OUTBOUND_C2', label: 'Outbound C2' },
  { id: 'CREDENTIAL_ACCESS', label: 'Credential Access' },
  { id: 'EXECUTION_ANOMALY', label: 'Execution Fault' },
  { id: 'CUSTOM', label: 'Custom Hypothesis' },
];

const ENTITIES = [
  { id: 'finding', label: 'Security Finding' },
  { id: 'alert', label: 'SOC Alert' },
  { id: 'incident', label: 'Incident' },
  { id: 'ioc', label: 'Indicator of Compromise (IOC)' },
  { id: 'terminal_job', label: 'Terminal Job / Execution' },
  { id: 'asset', label: 'Asset Inventory' },
];

const OPERATORS = [
  { id: 'equals', label: 'Equals (=)' },
  { id: 'not_equals', label: 'Not Equals (!=)' },
  { id: 'contains', label: 'Contains (Substring)' },
  { id: 'regex', label: 'Regex Pattern' },
  { id: 'greater_than', label: 'Greater Than (>)' },
  { id: 'less_than', label: 'Less Than (<)' },
  { id: 'in', label: 'In (Comma-separated)' },
];

const TIME_WINDOWS = [
  { id: '15m', label: 'Last 15 Minutes' },
  { id: '1h', label: 'Last 1 Hour' },
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days (Max)' },
];

const ALL_DATA_SOURCES = ['FINDINGS', 'ALERTS', 'INCIDENTS', 'ASSETS', 'IOCS', 'TERMINAL_JOBS'];

export default function ThreatHuntingPage() {
  const [activeTab, setActiveTab] = useState('workbench'); // 'workbench' | 'templates' | 'history'

  // Hunt Form State
  const [huntName, setHuntName] = useState('Anomalous Activity Sweep');
  const [category, setCategory] = useState('IOC_SWEEP');
  const [hypothesis, setHypothesis] = useState('Observed telemetry correlates with elevated adversary threat signals.');
  const [entity, setEntity] = useState('finding');
  const [timeWindow, setTimeWindow] = useState('24h');
  const [booleanLogic, setBooleanLogic] = useState('AND');
  const [dataSources, setDataSources] = useState(['FINDINGS', 'ALERTS']);
  const [conditions, setConditions] = useState([
    { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' },
  ]);

  // Validation & Execution State
  const [validating, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // Templates & Saved Hunts
  const [templates, setTemplates] = useState([]);
  const [savedHunts, setSavedHunts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // AI Assistant Drawer
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);

  // Promotion Modals
  const [promoFindingModal, setPromoFindingModal] = useState(null); // evidence item
  const [promoIncidentModal, setPromoIncidentModal] = useState(null);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSeverity, setPromoSeverity] = useState('HIGH');

  // Load Templates and Saved Hunts
  useEffect(() => {
    fetchTemplates();
    fetchSavedHunts();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/hunts/templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch hunt templates:', err.message);
    }
  };

  const fetchSavedHunts = async () => {
    try {
      setLoadingSaved(true);
      const res = await axios.get('/api/hunts');
      if (res.data?.success) {
        setSavedHunts(res.data.data.hunts || []);
      }
    } catch (err) {
      console.warn('Failed to fetch saved hunts:', err.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Conditions management
  const handleAddCondition = () => {
    if (conditions.length >= 8) {
      toast.error('Maximum 8 conditions supported per hunt query');
      return;
    }
    setConditions([...conditions, { field: 'severity', operator: 'equals', value: 'HIGH' }]);
  };

  const handleRemoveCondition = (index) => {
    if (conditions.length === 1) {
      toast.error('At least one condition is required');
      return;
    }
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index, field, val) => {
    const updated = [...conditions];
    updated[index][field] = val;
    setConditions(updated);
  };

  const toggleDataSource = (ds) => {
    if (dataSources.includes(ds)) {
      if (dataSources.length === 1) {
        toast.error('At least one data source must remain selected');
        return;
      }
      setDataSources(dataSources.filter((d) => d !== ds));
    } else {
      setDataSources([...dataSources, ds]);
    }
  };

  // Query AST validation
  const handleValidateAST = async () => {
    try {
      setValidating(true);
      const query = {
        entity,
        conditions,
        booleanLogic,
      };
      const res = await axios.post('/api/hunts/validate', { structuredQuery: query });
      if (res.data?.success) {
        if (res.data.valid) {
          toast.success('Query AST is valid and syntax-safe');
          setValidationResult({ valid: true });
        } else {
          toast.error(`Invalid AST: ${res.data.errors?.join(', ')}`);
          setValidationResult({ valid: false, errors: res.data.errors });
        }
      }
    } catch (err) {
      toast.error('Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  // Execute Hunt
  const handleExecuteHunt = async () => {
    try {
      setExecuting(true);
      const structuredQuery = { entity, conditions, booleanLogic };

      // 1. Create or ensure hunt exists
      const huntPayload = {
        name: huntName.trim() || 'Custom Threat Hunt',
        hypothesis: hypothesis.trim() || 'Observed telemetry indicates adversary activity.',
        category,
        structuredQuery,
        dataSources,
        timeRange: { type: 'relative', relativeWindow: timeWindow },
      };

      const createRes = await axios.post('/api/hunts', huntPayload);
      if (!createRes.data?.success) {
        toast.error(createRes.data?.error || 'Failed to initialize hunt');
        return;
      }

      const hunt = createRes.data.data;
      toast.success(`Hunt [${hunt.huntId}] created. Executing asynchronously...`);

      // 2. Trigger async execution
      const execRes = await axios.post(`/api/hunts/${hunt.huntId}/execute`);
      if (execRes.data?.success) {
        const execution = execRes.data.data;
        setCurrentExecution(execution);

        // Poll execution status until resolved
        pollExecution(execution.executionId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hunt execution failed');
      setExecuting(false);
    }
  };

  const pollExecution = (executionId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.get(`/api/hunt-executions/${executionId}`);
        if (res.data?.success) {
          const exec = res.data.data;
          setCurrentExecution(exec);

          if (exec.status !== 'RUNNING' || attempts >= 20) {
            clearInterval(interval);
            setExecuting(false);
            if (exec.status === 'MATCHED') {
              toast.success(`Hunt execution MATCHED: ${exec.resultCount} evidence record(s) observed!`);
            } else if (exec.status === 'NO_MATCH') {
              toast('Hunt completed: NO_MATCH (Zero matches in time window)', { icon: '🔍' });
            } else if (exec.status === 'FAILED') {
              toast.error('Hunt execution failed');
            }
            fetchSavedHunts();
          }
        }
      } catch (err) {
        clearInterval(interval);
        setExecuting(false);
      }
    }, 1000);
  };

  // Clone from Template
  const handleCloneTemplate = async (templateId) => {
    try {
      const res = await axios.post(`/api/hunts/templates/${templateId}/clone`);
      if (res.data?.success) {
        const cloned = res.data.data;
        toast.success(`Loaded template: ${cloned.name}`);
        setHuntName(cloned.name);
        setHypothesis(cloned.hypothesis);
        setCategory(cloned.category || 'CUSTOM');
        setEntity(cloned.structuredQuery?.entity || 'finding');
        setConditions(cloned.structuredQuery?.conditions || []);
        setDataSources(cloned.dataSources || ['FINDINGS', 'ALERTS']);
        setActiveTab('workbench');
      }
    } catch (err) {
      toast.error('Failed to clone template');
    }
  };

  // AI Assistance Actions
  const handleAiHypothesis = async () => {
    try {
      setAiGenerating(true);
      const res = await axios.post('/api/chatbot/hunting/hypothesis', {
        category,
        observationContext: hypothesis,
      });
      if (res.data?.success) {
        setAiOutput(res.data.data);
        if (res.data.data?.hypothesis) {
          setHypothesis(res.data.data.hypothesis);
          toast.success('AI hypothesis applied to hunt builder');
        }
      }
    } catch (err) {
      toast.error('AI assistant request failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiExplain = async () => {
    if (!currentExecution) {
      toast.error('Execute a hunt first to generate an explanation');
      return;
    }
    try {
      setAiGenerating(true);
      const res = await axios.post('/api/chatbot/hunting/explain', {
        executionId: currentExecution.executionId,
        resultCount: currentExecution.resultCount,
        evidenceSummary: currentExecution.evidence?.[0]?.summary || '',
      });
      if (res.data?.success) {
        setAiOutput(res.data.data);
        toast.success('AI explanation generated');
      }
    } catch (err) {
      toast.error('AI assistant request failed');
    } finally {
      setAiGenerating(false);
    }
  };

  // Evidence Promotion to Finding
  const submitPromoteFinding = async () => {
    if (!promoFindingModal || !currentExecution) return;
    try {
      const res = await axios.post(`/api/hunt-executions/${currentExecution.executionId}/promote-finding`, {
        evidenceId: promoFindingModal.evidenceId,
        title: promoTitle || promoFindingModal.title,
        severity: promoSeverity,
      });
      if (res.data?.success) {
        toast.success(`Finding [${res.data.data.findingId}] created with immutable lineage!`);
        setPromoFindingModal(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote finding');
    }
  };

  // Evidence Promotion to Incident
  const submitPromoteIncident = async () => {
    if (!promoIncidentModal || !currentExecution) return;
    try {
      const res = await axios.post(`/api/hunt-executions/${currentExecution.executionId}/promote-incident`, {
        evidenceId: promoIncidentModal.evidenceId,
        title: promoTitle || promoIncidentModal.title,
        severity: promoSeverity,
      });
      if (res.data?.success) {
        toast.success(`Incident [${res.data.data.incidentId}] created with attack-chain linkage!`);
        setPromoIncidentModal(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote incident');
    }
  };

  // Draft Candidate Detection Rule
  const handleDraftDetection = async () => {
    if (!currentExecution) return;
    try {
      const res = await axios.post(`/api/hunt-executions/${currentExecution.executionId}/draft-detection`);
      if (res.data?.success) {
        toast.success(`Candidate Detection Rule [${res.data.data.ruleId}] created in DRAFT status! Requires operator approval.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to draft detection rule');
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-200 p-6 font-sans">
      {/* ─── Header & Telemetry Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cyan-500/20 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-2">
                THREAT HUNTING WORKBENCH
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  v61.4.0 • PHASE 71
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Continuous Hypothesis-Driven SOC Investigation • Zero Synthetic Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#0a1124] p-1 rounded border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'workbench'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hunt Builder
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'templates'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Templates & Saved ({savedHunts.length})
          </button>
          <button
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 ${
              aiDrawerOpen
                ? 'bg-purple-950/60 text-purple-300 border-purple-400/40'
                : 'bg-purple-950/20 text-purple-400 border-purple-500/20 hover:border-purple-400/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            AI Copilot
          </button>
        </div>
      </div>

      {/* ─── TAB 1: HUNT WORKBENCH ─────────────────────────────────────────── */}
      {activeTab === 'workbench' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Hunt Builder (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span>1. Structured Query & Hypothesis</span>
                <span className="text-[10px] text-slate-400">Strict Server AST Validation</span>
              </h2>

              {/* Hunt Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Hunt Identifier / Name</label>
                  <input
                    type="text"
                    value={huntName}
                    onChange={(e) => setHuntName(e.target.value)}
                    className="w-full bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                    placeholder="e.g. C2 Outbound Beacon Detection"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Hypothesis Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hypothesis Formulation */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-400">Analytical Hypothesis</label>
                  <button
                    onClick={handleAiHypothesis}
                    disabled={aiGenerating}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                  >
                    ✦ Suggest via AI
                  </button>
                </div>
                <textarea
                  rows="2"
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  className="w-full bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none font-mono"
                  placeholder="State the threat actor behavior or anomalous hypothesis to verify..."
                />
              </div>

              {/* Target Entity & Time Horizon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Target Entity</label>
                  <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="w-full bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {ENTITIES.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Time Horizon (Bounded)</label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {TIME_WINDOWS.map((tw) => (
                      <option key={tw.id} value={tw.id}>
                        {tw.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Boolean Combination</label>
                  <div className="flex rounded border border-white/10 overflow-hidden bg-[#020814] p-0.5">
                    <button
                      type="button"
                      onClick={() => setBooleanLogic('AND')}
                      className={`flex-1 text-xs py-1.5 font-mono ${
                        booleanLogic === 'AND' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'
                      }`}
                    >
                      AND (All)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBooleanLogic('OR')}
                      className={`flex-1 text-xs py-1.5 font-mono ${
                        booleanLogic === 'OR' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'
                      }`}
                    >
                      OR (Any)
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Sources Selector */}
              <div className="mb-4">
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Data Sources to Query</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DATA_SOURCES.map((ds) => {
                    const active = dataSources.includes(ds);
                    return (
                      <button
                        key={ds}
                        type="button"
                        onClick={() => toggleDataSource(ds)}
                        className={`text-xs px-2.5 py-1 rounded border font-mono transition-all ${
                          active
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50'
                            : 'bg-[#020814] text-slate-500 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {active && '✓ '}
                        {ds}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Condition Rows */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400">Evaluation Conditions ({conditions.length})</label>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    + Add Condition
                  </button>
                </div>

                <div className="space-y-2">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-[#020814] p-2 rounded border border-white/5">
                      <input
                        type="text"
                        value={cond.field}
                        onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                        placeholder="field (e.g. severity)"
                        className="w-full sm:w-1/3 bg-[#0a1124] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                        className="w-full sm:w-1/3 bg-[#0a1124] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                        placeholder="value (e.g. HIGH)"
                        className="w-full sm:w-1/3 bg-[#0a1124] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-red-400 hover:text-red-300 p-1 text-sm font-mono"
                        title="Remove condition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/5 gap-3">
                <button
                  type="button"
                  onClick={handleValidateAST}
                  disabled={validating}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono transition-all"
                >
                  {validating ? 'Validating AST...' : 'Validate Query AST'}
                </button>

                <button
                  type="button"
                  onClick={handleExecuteHunt}
                  disabled={executing}
                  className="px-5 py-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 text-xs font-mono font-bold tracking-wider transition-all shadow-lg flex items-center gap-2"
                >
                  {executing ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Executing Hunt...
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      EXECUTE THREAT HUNT
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Telemetry & Observed Evidence (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Status Card */}
            <div className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-3 flex items-center justify-between">
                <span>Execution Status</span>
                {currentExecution && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                      currentExecution.status === 'MATCHED'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : currentExecution.status === 'NO_MATCH'
                        ? 'bg-green-950 text-green-400 border border-green-500/40'
                        : currentExecution.status === 'RUNNING'
                        ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {currentExecution.status}
                  </span>
                )}
              </h2>

              {currentExecution ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-[#020814] p-3 rounded border border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">EXECUTION ID</span>
                      <span className="text-slate-200">{currentExecution.executionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIME WINDOW</span>
                      <span className="text-slate-200">{currentExecution.resolvedTimeRange?.windowLabel || timeWindow}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MATCHES OBSERVED</span>
                      <span className={`font-bold ${currentExecution.resultCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {currentExecution.resultCount} record(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">DURATION</span>
                      <span className="text-slate-200">{currentExecution.durationMs || 0} ms</span>
                    </div>
                  </div>

                  {/* Feedback Action Deck */}
                  {currentExecution.resultCount > 0 && (
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded flex items-center justify-between">
                      <span className="text-[11px] text-cyan-300">Convert observed pattern:</span>
                      <button
                        onClick={handleDraftDetection}
                        className="px-2.5 py-1 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 text-[11px] transition-all"
                      >
                        + Draft Detection Rule
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No active hunt execution. Configure parameters and click Execute.
                </div>
              )}
            </div>

            {/* Observed Evidence Records List */}
            <div className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-3 flex items-center justify-between">
                <span>Observed Telemetry Evidence</span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentExecution?.evidence?.length || 0} items
                </span>
              </h2>

              {currentExecution?.evidence && currentExecution.evidence.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {currentExecution.evidence.map((ev, idx) => (
                    <div key={idx} className="bg-[#020814] border border-white/10 rounded p-3 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px] border border-cyan-500/20">
                          {ev.sourceEntity}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-200">{ev.title}</div>
                      {ev.summary && <div className="text-slate-400 text-[11px]">{ev.summary}</div>}

                      <div className="text-[11px] text-slate-500 bg-[#0a1124] p-1.5 rounded">
                        Match: <span className="text-cyan-300">{ev.matchDetails?.matchedField}</span> {ev.matchDetails?.matchedOperator}{' '}
                        <span className="text-white">{String(ev.matchDetails?.matchedValue)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => {
                            setPromoFindingModal(ev);
                            setPromoTitle(ev.title);
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded"
                        >
                          → Promote to Finding
                        </button>
                        <button
                          onClick={() => {
                            setPromoIncidentModal(ev);
                            setPromoTitle(ev.title);
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-0.5 rounded"
                        >
                          → Elevate to Incident
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  {currentExecution?.status === 'NO_MATCH'
                    ? 'Truthful NO_MATCH: No evidence met the query conditions.'
                    : 'Evidence items will appear here upon execution.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TEMPLATES & SAVED HUNTS ────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          {/* Canonical Templates */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-4 flex items-center gap-2">
              <span>Canonical Threat Hunt Templates</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                Pre-Packaged
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => (
                <div key={tmpl.templateId} className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-4 flex flex-col justify-between hover:border-cyan-400/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono border border-cyan-500/20">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{tmpl.defaultTimeWindow}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{tmpl.name}</h3>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{tmpl.description}</p>
                    <div className="text-[11px] text-slate-300 font-mono bg-[#020814] p-2 rounded mb-3">
                      <span className="text-slate-500 block text-[9px]">HYPOTHESIS</span>
                      {tmpl.hypothesis}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCloneTemplate(tmpl.templateId)}
                    className="w-full py-1.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/20 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>✦</span> Clone & Hunt
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Hunts Table */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-4">
              Saved Threat Hunts ({savedHunts.length})
            </h2>

            <div className="bg-[#0a1124] border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#020814] border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="p-3">HUNT ID</th>
                    <th className="p-3">NAME</th>
                    <th className="p-3">CATEGORY</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">EXECUTIONS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {savedHunts.map((h) => (
                    <tr key={h.huntId} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-cyan-400">{h.huntId}</td>
                      <td className="p-3 text-white font-semibold">{h.name}</td>
                      <td className="p-3 text-slate-400">{h.category}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {h.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{h.executionCount || 0}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setHuntName(h.name);
                            setHypothesis(h.hypothesis);
                            setCategory(h.category);
                            setEntity(h.structuredQuery?.entity || 'finding');
                            setConditions(h.structuredQuery?.conditions || []);
                            setDataSources(h.dataSources || ['FINDINGS', 'ALERTS']);
                            setActiveTab('workbench');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px]"
                        >
                          Load in Builder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI COPILOT DRAWER ─────────────────────────────────────────────── */}
      {aiDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0a1124] border-l border-purple-500/30 p-5 shadow-2xl z-50 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                <h3 className="font-bold text-sm text-purple-300 font-mono">BOUNDED AI HUNTING COPILOT</h3>
              </div>
              <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-white text-lg">
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 font-mono">
              Advisory Copilot grounded strictly in verified runtime evidence. Zero autonomous execution or detection activation.
            </p>

            <div className="space-y-2 mb-6">
              <button
                onClick={handleAiHypothesis}
                disabled={aiGenerating}
                className="w-full text-left p-2.5 rounded bg-purple-950/40 border border-purple-500/20 hover:border-purple-400/40 text-xs text-purple-200 font-mono transition-all"
              >
                ✦ Suggest Hypothesis for Category [{category}]
              </button>
              <button
                onClick={handleAiExplain}
                disabled={aiGenerating || !currentExecution}
                className="w-full text-left p-2.5 rounded bg-purple-950/40 border border-purple-500/20 hover:border-purple-400/40 text-xs text-purple-200 font-mono transition-all"
              >
                ✦ Explain Current Execution Evidence
              </button>
            </div>

            {aiGenerating && (
              <div className="text-center py-6 text-xs text-purple-300 font-mono animate-pulse">
                Analyzing runtime security signals...
              </div>
            )}

            {aiOutput && !aiGenerating && (
              <div className="bg-[#020814] border border-purple-500/30 rounded p-3 text-xs font-mono space-y-2">
                <div className="text-purple-400 font-bold border-b border-white/5 pb-1">AI Advisory Output</div>
                {aiOutput.hypothesis && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">FORMULATED HYPOTHESIS</span>
                    <span className="text-slate-200">{aiOutput.hypothesis}</span>
                  </div>
                )}
                {aiOutput.explanation && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">RESULT EXPLANATION</span>
                    <span className="text-slate-200">{aiOutput.explanation}</span>
                  </div>
                )}
                {aiOutput.keyObservations && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">OBSERVATIONS</span>
                    <ul className="list-disc list-inside text-slate-300">
                      {aiOutput.keyObservations.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                  Model: {aiOutput.model || 'gemini-2.5-flash'} • Provider: {aiOutput.provider || 'CyberShield Bounded AI'}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center pt-4 border-t border-white/5">
            Strict Defense-in-Depth AI Boundary Policy Enforced
          </div>
        </div>
      )}

      {/* ─── MODAL: Promote to Finding ──────────────────────────────────────── */}
      {promoFindingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1124] border border-cyan-500/30 rounded-lg p-5 max-w-md w-full font-mono text-xs shadow-2xl">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">PROMOTE EVIDENCE TO FINDING</h3>
            <p className="text-slate-400 mb-3 text-[11px]">
              Promotes observed telemetry to an official Finding record with immutable lineage to execution [{currentExecution?.executionId}].
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">FINDING TITLE</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-[#020814] border border-white/10 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">SEVERITY</label>
                <select
                  value={promoSeverity}
                  onChange={(e) => setPromoSeverity(e.target.value)}
                  className="w-full bg-[#020814] border border-white/10 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="INFO">INFO</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPromoFindingModal(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitPromoteFinding}
                className="px-4 py-1.5 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Elevate to Incident ─────────────────────────────────────── */}
      {promoIncidentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1124] border border-red-500/30 rounded-lg p-5 max-w-md w-full font-mono text-xs shadow-2xl">
            <h3 className="text-sm font-bold text-red-400 mb-3">ELEVATE EVIDENCE TO INCIDENT</h3>
            <p className="text-slate-400 mb-3 text-[11px]">
              Elevates observed telemetry to a high-priority Incident with attack-chain linkage.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-[#020814] border border-white/10 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">SEVERITY</label>
                <select
                  value={promoSeverity}
                  onChange={(e) => setPromoSeverity(e.target.value)}
                  className="w-full bg-[#020814] border border-white/10 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPromoIncidentModal(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitPromoteIncident}
                className="px-4 py-1.5 rounded bg-red-500 text-white font-bold hover:bg-red-400"
              >
                Confirm Elevation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
