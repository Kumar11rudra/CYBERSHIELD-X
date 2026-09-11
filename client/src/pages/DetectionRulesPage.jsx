import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function DetectionRulesPage() {
  const [activeTab, setActiveTab] = useState('library'); // library, coverage, gaps, packs, testing
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [healthMetrics, setHealthMetrics] = useState(null);

  // Detail / Tuning / Versions Modal
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleRevisions, setRuleRevisions] = useState([]);
  const [tuningConditions, setTuningConditions] = useState([]);
  const [tuningReason, setTuningReason] = useState('');
  const [modalTab, setModalTab] = useState('details'); // details, versions, fixtures, tune

  // Review Modal
  const [reviewModalRule, setReviewModalRule] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVE');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewRisk, setReviewRisk] = useState('LOW');

  // Test Fixture Modal
  const [fixtureRule, setFixtureRule] = useState(null);
  const [newFixture, setNewFixture] = useState({
    name: 'Custom Verification Fixture',
    expectedResult: 'MATCH',
    inputJson: '{\n  "eventType": "AUTH_FAILURE",\n  "failureCount": 10\n}',
  });

  // Coverage Data
  const [coverageData, setCoverageData] = useState(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);

  // Gaps Data
  const [gapsData, setGapsData] = useState([]);
  const [loadingGaps, setLoadingGaps] = useState(false);

  // Content Packs Data
  const [packsData, setPacksData] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  // Regression Suite State
  const [regressionReport, setRegressionReport] = useState(null);
  const [runningRegression, setRunningRegression] = useState(false);

  // Bounded AI Copilot Drawer
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiPromptType, setAiPromptType] = useState('review');
  const [aiOutput, setAiOutput] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch Rules & Quality Metrics
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [rulesRes, healthRes] = await Promise.all([
        axios.get(`/api/detections/rules?${params.toString()}`),
        axios.get('/api/detection-health').catch(() => ({ data: null })),
      ]);

      if (rulesRes.data?.success) {
        setRules(rulesRes.data.data.rules || []);
      }
      if (healthRes.data?.success) {
        setHealthMetrics(healthRes.data.data);
      }
    } catch {
      toast.error('Failed to load detection rules');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, severityFilter, statusFilter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Fetch Coverage
  const fetchCoverage = async () => {
    try {
      setLoadingCoverage(true);
      const res = await axios.get('/api/detection-coverage');
      if (res.data?.success) {
        setCoverageData(res.data.data);
      }
    } catch {
      toast.error('Failed to load ATT&CK coverage');
    } finally {
      setLoadingCoverage(false);
    }
  };

  // Fetch Gaps
  const fetchGaps = async () => {
    try {
      setLoadingGaps(true);
      const res = await axios.get('/api/detection-gaps');
      if (res.data?.success) {
        setGapsData(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load detection gaps');
    } finally {
      setLoadingGaps(false);
    }
  };

  // Fetch Content Packs
  const fetchPacks = async () => {
    try {
      setLoadingPacks(true);
      const res = await axios.get('/api/detection-packs');
      if (res.data?.success) {
        setPacksData(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load content packs');
    } finally {
      setLoadingPacks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'coverage' && !coverageData) fetchCoverage();
    if (activeTab === 'gaps') fetchGaps();
    if (activeTab === 'packs') fetchPacks();
  }, [activeTab]);

  // View Rule Details & Revisions
  const handleOpenRuleDetail = async (rule) => {
    setSelectedRule(rule);
    setTuningConditions(rule.conditions || []);
    setModalTab('details');
    try {
      const res = await axios.get(`/api/detections/${rule.ruleId}/versions`);
      if (res.data?.success) {
        setRuleRevisions(res.data.data || []);
      }
    } catch {
      setRuleRevisions([]);
    }
  };

  // Run Test Fixtures on Rule
  const handleRunRuleTests = async (ruleId) => {
    try {
      const res = await axios.post(`/api/detections/${ruleId}/test`, {});
      if (res.data?.success) {
        toast.success(`Tested ${res.data.data.total} fixtures (${res.data.data.passed} passed)`);
        fetchRules();
        if (selectedRule && selectedRule.ruleId === ruleId) {
          const updatedRule = await axios.get(`/api/detections/rules/${ruleId}`);
          if (updatedRule.data?.success) setSelectedRule(updatedRule.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Testing failed');
    }
  };

  // Submit Rule Review
  const handleSubmitReview = async () => {
    if (!reviewModalRule) return;
    try {
      await axios.post(`/api/detections/${reviewModalRule.ruleId}/review`, {
        decision: reviewDecision,
        decisionReason: reviewReason || `Marked ${reviewDecision} via Detection Center`,
        risk: reviewRisk,
      });
      toast.success(`Rule review submitted: ${reviewDecision}`);
      setReviewModalRule(null);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review submission failed');
    }
  };

  // Activate Rule
  const handleActivateRule = async (ruleId) => {
    try {
      await axios.post(`/api/detections/${ruleId}/activate`);
      toast.success(`Rule ${ruleId} activated for production`);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Activation failed');
    }
  };

  // Disable Rule
  const handleDisableRule = async (ruleId) => {
    try {
      await axios.post(`/api/detections/${ruleId}/disable`, { reason: 'Disabled via UI' });
      toast.success(`Rule ${ruleId} disabled`);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Disable failed');
    }
  };

  // Rollback Rule
  const handleRollbackRule = async (ruleId, targetRevision) => {
    try {
      await axios.post(`/api/detections/${ruleId}/rollback`, {
        targetRevision,
        reason: 'Rollback initiated from version history workspace',
      });
      toast.success(`Rolled back rule ${ruleId} to revision r${targetRevision}`);
      fetchRules();
      if (selectedRule) {
        const updated = await axios.get(`/api/detections/rules/${ruleId}`);
        if (updated.data?.success) setSelectedRule(updated.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rollback failed');
    }
  };

  // Save Tuned Revision
  const handleSaveTuning = async () => {
    if (!selectedRule) return;
    try {
      await axios.post(`/api/detections/${selectedRule.ruleId}/versions`, {
        updates: { conditions: tuningConditions },
        changeReason: tuningReason || 'Tuned conditions via Detection Engineering Center',
      });
      toast.success(`New revision created for ${selectedRule.ruleId} (Status: TESTING)`);
      fetchRules();
      const updated = await axios.get(`/api/detections/rules/${selectedRule.ruleId}`);
      if (updated.data?.success) setSelectedRule(updated.data.data);
      setModalTab('details');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save tuning revision');
    }
  };

  // Add Test Fixture
  const handleAddFixture = async () => {
    if (!fixtureRule) return;
    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(newFixture.inputJson);
      } catch {
        toast.error('Invalid JSON payload in fixture input');
        return;
      }

      await axios.post(`/api/detections/${fixtureRule.ruleId}/fixtures`, {
        name: newFixture.name,
        expectedResult: newFixture.expectedResult,
        input: parsedInput,
      });

      toast.success('Test fixture added');
      setFixtureRule(null);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add fixture');
    }
  };

  // Scan for Gaps
  const handleScanGaps = async () => {
    try {
      setLoadingGaps(true);
      const res = await axios.post('/api/detection-gaps/scan');
      if (res.data?.success) {
        toast.success(`Scan completed. Discovered ${res.data.data.length} gap(s)`);
        setGapsData(res.data.data || []);
      }
    } catch {
      toast.error('Failed to run gap scan');
    } finally {
      setLoadingGaps(false);
    }
  };

  // Promote Gap to Candidate Rule
  const handlePromoteGap = async (gapId) => {
    try {
      const res = await axios.post(`/api/detection-gaps/${gapId}/promote`);
      if (res.data?.success) {
        toast.success(`Drafted candidate rule ${res.data.data.ruleId} in DRAFT status`);
        fetchGaps();
        fetchRules();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote gap');
    }
  };

  // Content Pack Actions
  const handleValidatePack = async (packId) => {
    try {
      const res = await axios.post(`/api/detection-packs/${packId}/validate`);
      if (res.data?.success) {
        toast.success(`Pack validated: ${res.data.data.isValid ? 'VALID' : 'ISSUES FOUND'}`);
        fetchPacks();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Validation failed');
    }
  };

  const handleTestPack = async (packId) => {
    try {
      const res = await axios.post(`/api/detection-packs/${packId}/test`);
      if (res.data?.success) {
        toast.success(`Pack tests executed: ${res.data.data.passedTests}/${res.data.data.totalTests} passed`);
        fetchPacks();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Pack testing failed');
    }
  };

  const handleActivatePack = async (packId) => {
    try {
      const res = await axios.post(`/api/detection-packs/${packId}/activate`);
      if (res.data?.success) {
        toast.success(`Content Pack ${packId} activated (${res.data.data.rules.length} rules active)`);
        fetchPacks();
        fetchRules();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Pack activation failed');
    }
  };

  // Run Full Regression Suite
  const handleRunRegression = async () => {
    try {
      setRunningRegression(true);
      const res = await axios.post('/api/detection-tests');
      if (res.data?.success) {
        setRegressionReport(res.data.data);
        toast.success(`Regression complete: ${res.data.data.overallPassRate}% overall pass rate`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Regression run failed');
    } finally {
      setRunningRegression(false);
    }
  };

  // Bounded AI Copilot Queries
  const handleTriggerAI = async (endpoint) => {
    try {
      setAiLoading(true);
      setAiOutput(null);
      let payload = {};
      if (selectedRule) {
        payload = { rule: selectedRule, conditions: selectedRule.conditions };
      }

      const res = await axios.post(`/api/chatbot/detection/${endpoint}`, payload);
      if (res.data?.success) {
        setAiOutput(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI Copilot query failed');
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      REVIEW: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      TESTING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      DRAFT: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      DISABLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      RETIRED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return map[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const getHealthBadge = (health) => {
    const map = {
      HEALTHY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      NEEDS_TEST: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      FAILING_TESTS: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      DISABLED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
      EXPIRED_DEPENDENCY: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      UNSUPPORTED: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return map[health] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-emerald-500">🛡️</span> Enterprise Detection Engineering Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Phase 73 Certified
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Maintainable, versioned, testable detection content with MITRE ATT&CK threat coverage and gap analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition flex items-center gap-2"
          >
            <span>✨</span> AI Detection Engineer
          </button>
          <button
            onClick={fetchRules}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Quality Metrics Bar */}
      {healthMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Active Detections</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{healthMetrics.activeRules}</p>
            <span className="text-[10px] text-zinc-500">Production ready</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Draft / Testing</p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              {(healthMetrics.draftRules || 0) + (healthMetrics.testingRules || 0)}
            </p>
            <span className="text-[10px] text-zinc-500">In pipeline</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Passing Fixtures</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{healthMetrics.rulesPassingTests}</p>
            <span className="text-[10px] text-zinc-500">100% deterministic</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Failing Tests</p>
            <p className="text-xl font-bold text-rose-400 mt-1">{healthMetrics.rulesFailingTests}</p>
            <span className="text-[10px] text-zinc-500">Blocked promotion</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Without Tests</p>
            <p className="text-xl font-bold text-zinc-400 mt-1">{healthMetrics.rulesWithoutTests}</p>
            <span className="text-[10px] text-zinc-500">Action required</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 font-medium">Triggered Rules</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{healthMetrics.rulesTriggered}</p>
            <span className="text-[10px] text-zinc-500">Live signal matches</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6 gap-1 overflow-x-auto">
        {[
          { id: 'library', label: 'Detection Library', icon: '📚' },
          { id: 'coverage', label: 'ATT&CK Threat Coverage', icon: '🎯' },
          { id: 'gaps', label: 'Detection Gaps Center', icon: '🔍' },
          { id: 'packs', label: 'Content Packs', icon: '📦' },
          { id: 'testing', label: 'Regression Testing', icon: '🧪' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-zinc-900 text-white border-t-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DETECTION LIBRARY */}
      {activeTab === 'library' && (
        <div>
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by ID, name, technique, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Lifecycle Statuses</option>
              <option value="ACTIVE">ACTIVE (Production)</option>
              <option value="APPROVED">APPROVED (Awaiting Activation)</option>
              <option value="REVIEW">REVIEW (Pending Review)</option>
              <option value="TESTING">TESTING (Test Fixtures)</option>
              <option value="DRAFT">DRAFT (Drafting)</option>
              <option value="DISABLED">DISABLED</option>
              <option value="RETIRED">RETIRED</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="INFO">INFO</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="AUTHENTICATION">AUTHENTICATION</option>
              <option value="EXECUTION">EXECUTION</option>
              <option value="PERSISTENCE">PERSISTENCE</option>
              <option value="PRIVILEGE_ESCALATION">PRIVILEGE_ESCALATION</option>
              <option value="DEFENSE_EVASION">DEFENSE_EVASION</option>
              <option value="CREDENTIAL_ACCESS">CREDENTIAL_ACCESS</option>
              <option value="COMMAND_AND_CONTROL">COMMAND_AND_CONTROL</option>
              <option value="IOC_MATCH">IOC_MATCH</option>
            </select>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setSeverityFilter('');
                setCategoryFilter('');
              }}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
            >
              Clear Filters
            </button>
          </div>

          {/* Rules Table */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 text-xs">Loading detection content...</div>
            ) : rules.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">No detection rules found matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="p-3">Rule / Content ID</th>
                      <th className="p-3">Name & ATT&CK</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Health</th>
                      <th className="p-3">Revision</th>
                      <th className="p-3">Fixtures</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {rules.map((rule) => (
                      <tr key={rule.ruleId} className="hover:bg-zinc-900/40 transition">
                        <td className="p-3 font-mono">
                          <span className="text-white font-semibold">{rule.contentId || `DET-${rule.ruleId}`}</span>
                          <div className="text-[10px] text-zinc-500">{rule.ruleId}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-zinc-200">{rule.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(rule.mitreAttack || []).map((m, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono"
                              >
                                {m.techniqueId} {m.techniqueName ? `(${m.techniqueName})` : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(rule.status)}`}>
                            {rule.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getHealthBadge(rule.healthStatus)}`}>
                            {rule.healthStatus || 'NEEDS_TEST'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-zinc-400">
                          v{rule.ruleVersion || '1.0.0'} <span className="text-zinc-600">r{rule.revision || 1}</span>
                        </td>
                        <td className="p-3 font-mono text-zinc-400">
                          {rule.testFixtures?.length || 0}
                          {rule.testFixtures?.length > 0 && (
                            <span className="text-[10px] ml-1 text-emerald-400 font-normal">
                              ({rule.testFixtures.filter((f) => f.lastResult === 'PASS').length} pass)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRunRuleTests(rule.ruleId)}
                              title="Run Test Fixtures"
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400 text-[11px] transition"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => handleOpenRuleDetail(rule)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
                            >
                              Inspect / Tune
                            </button>
                            {rule.status === 'REVIEW' && (
                              <button
                                onClick={() => setReviewModalRule(rule)}
                                className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-medium hover:bg-indigo-600/50 transition"
                              >
                                Review
                              </button>
                            )}
                            {rule.status === 'APPROVED' && (
                              <button
                                onClick={() => handleActivateRule(rule.ruleId)}
                                className="px-2 py-1 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium hover:bg-emerald-600/50 transition"
                              >
                                Activate
                              </button>
                            )}
                            {rule.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleDisableRule(rule.ruleId)}
                                className="px-2 py-1 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 text-[11px] transition"
                              >
                                Disable
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MITRE ATT&CK THREAT COVERAGE */}
      {activeTab === 'coverage' && (
        <div>
          {loadingCoverage ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Computing ground-truth ATT&CK matrix...</div>
          ) : !coverageData ? (
            <div className="p-12 text-center text-zinc-500 text-xs">No coverage data available.</div>
          ) : (
            <div>
              {/* Coverage Header Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg">
                  <p className="text-xs text-zinc-400 font-medium">Coverage Score</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{coverageData.coveragePercentage}%</p>
                  <span className="text-[10px] text-zinc-500">Active & Tested Rules</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg">
                  <p className="text-xs text-zinc-400 font-medium">Covered Techniques</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{coverageData.coveredCount}</p>
                  <span className="text-[10px] text-zinc-500">Verified detections</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg">
                  <p className="text-xs text-zinc-400 font-medium">Partially Covered</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{coverageData.partiallyCoveredCount}</p>
                  <span className="text-[10px] text-zinc-500">Draft / Testing stage</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg">
                  <p className="text-xs text-zinc-400 font-medium">Untested Techniques</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{coverageData.untestedCount}</p>
                  <span className="text-[10px] text-zinc-500">Active but 0 tests</span>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg">
                  <p className="text-xs text-zinc-400 font-medium">Uncovered Techniques</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{coverageData.notCoveredCount}</p>
                  <span className="text-[10px] text-zinc-500">Perimeter blind spots</span>
                </div>
              </div>

              {/* Tactics & Techniques Matrix */}
              <div className="space-y-6">
                {coverageData.tactics?.map((tactic) => (
                  <div key={tactic.tactic} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{tactic.tactic}</h3>
                        <p className="text-[11px] text-zinc-400">
                          {tactic.covered} of {tactic.total} techniques covered
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {Math.round((tactic.covered / (tactic.total || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {tactic.techniques?.map((tech) => (
                        <div
                          key={tech.techniqueId}
                          className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                            tech.coverageStatus === 'COVERED'
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                              : tech.coverageStatus === 'PARTIALLY_COVERED'
                              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                              : tech.coverageStatus === 'UNTESTED'
                              ? 'bg-purple-950/20 border-purple-800/40 text-purple-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-mono font-bold text-xs mb-1">
                              <span>{tech.techniqueId}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-zinc-950/60">
                                {tech.coverageStatus}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-zinc-200">{tech.techniqueName}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-500">
                            <span>Rules: {tech.activeRulesCount} active ({tech.testedRulesCount} tested)</span>
                            {tech.observedEvidenceCount > 0 && (
                              <span className="text-amber-400 font-semibold">{tech.observedEvidenceCount} signal(s)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETECTION GAPS CENTER */}
      {activeTab === 'gaps' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Discovered Detection Gaps</h2>
              <p className="text-xs text-zinc-400">
                Evidence-backed perimeter blind spots identified through telemetry, incidents, and threat hunts.
              </p>
            </div>
            <button
              onClick={handleScanGaps}
              disabled={loadingGaps}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-2"
            >
              {loadingGaps ? 'Scanning...' : '⚡ Scan for Gaps'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapsData.map((gap) => (
              <div key={gap.gapId} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">{gap.gapId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      gap.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {gap.severity}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{gap.title}</h3>
                  <p className="text-[11px] text-zinc-400 mb-3">{gap.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 mb-3">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {gap.techniqueId} ({gap.tactic})
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Type: {gap.gapType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Evidence: {gap.evidenceReferences?.length || 0} item(s)
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Status: {gap.status}</span>
                  <button
                    onClick={() => handlePromoteGap(gap.gapId)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                  >
                    Draft Candidate Rule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT PACKS */}
      {activeTab === 'packs' && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Canonical & Enterprise Content Packs</h2>
            <p className="text-xs text-zinc-400">
              Validated, versioned detection bundles ready for testing and production deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packsData.map((pack) => (
              <div key={pack.packId} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{pack.packId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(pack.status)}`}>
                      {pack.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{pack.name}</h3>
                  <p className="text-[11px] text-zinc-400 mb-3">{pack.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 mb-3 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">v{pack.version}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{pack.rules?.length || 0} rules</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{pack.category}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleValidatePack(pack.packId)}
                    className="px-2.5 py-1.5 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  >
                    Validate
                  </button>
                  <button
                    onClick={() => handleTestPack(pack.packId)}
                    className="px-2.5 py-1.5 rounded text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition"
                  >
                    Test Pack
                  </button>
                  <button
                    onClick={() => handleActivatePack(pack.packId)}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                  >
                    Activate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REGRESSION TESTING */}
      {activeTab === 'testing' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detection Regression Testing Suite</h2>
              <p className="text-xs text-zinc-400">
                Execute all deterministic fixtures across the detection library without generating production alerts.
              </p>
            </div>
            <button
              onClick={handleRunRegression}
              disabled={runningRegression}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-2"
            >
              {runningRegression ? 'Executing Suite...' : '▶ Run Full Regression Suite'}
            </button>
          </div>

          {regressionReport && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800">
                  <p className="text-xs text-zinc-500">Overall Pass Rate</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{regressionReport.overallPassRate}%</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800">
                  <p className="text-xs text-zinc-500">Rules Passing All</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{regressionReport.rulesPassingAll}</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800">
                  <p className="text-xs text-zinc-500">Rules Failing</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{regressionReport.rulesFailing}</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800">
                  <p className="text-xs text-zinc-500">Fixtures Tested</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{regressionReport.totalFixtures}</p>
                </div>
              </div>

              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Rule Evaluation Results</h4>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {regressionReport.ruleResults?.map((r) => (
                  <div key={r.ruleId} className="p-2.5 bg-zinc-950/40 rounded border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300">{r.contentId || r.ruleId}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{r.passed}/{r.total} passed</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getHealthBadge(r.healthStatus)}`}>
                        {r.healthStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RULE INSPECT / TUNE / VERSIONS MODAL */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">{selectedRule.name}</h3>
                <p className="text-zinc-400 font-mono text-[11px]">{selectedRule.contentId || selectedRule.ruleId}</p>
              </div>
              <button onClick={() => setSelectedRule(null)} className="text-zinc-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-2 mb-4">
              {['details', 'versions', 'fixtures', 'tune'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`px-3 py-1 rounded capitalize font-medium ${
                    modalTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sub-tab: Details */}
            {modalTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500">Status</span>
                    <div className="font-semibold text-white">{selectedRule.status}</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500">Version</span>
                    <div className="font-mono text-zinc-300">v{selectedRule.ruleVersion} (r{selectedRule.revision})</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500">Health</span>
                    <div className="font-semibold text-emerald-400">{selectedRule.healthStatus}</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500">Severity</span>
                    <div className="font-semibold text-amber-400">{selectedRule.severity}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Conditions</h4>
                  <pre className="p-3 bg-zinc-950 rounded border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedRule.conditions, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Sub-tab: Versions */}
            {modalTab === 'versions' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Immutable Revision History</h4>
                {ruleRevisions.length === 0 ? (
                  <p className="text-zinc-500">No previous revisions recorded.</p>
                ) : (
                  ruleRevisions.map((rev) => (
                    <div key={rev.revisionId} className="p-3 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">Revision r{rev.revision}</span>
                          <span className="text-[10px] text-zinc-500">v{rev.version}</span>
                          <span className="text-[10px] text-zinc-400">by {rev.author}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">{rev.changeReason || 'No change description'}</p>
                      </div>
                      <button
                        onClick={() => handleRollbackRule(selectedRule.ruleId, rev.revision)}
                        className="px-3 py-1 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-semibold"
                      >
                        Rollback to r{rev.revision}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab: Fixtures */}
            {modalTab === 'fixtures' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Configured Fixtures</h4>
                  <button
                    onClick={() => setFixtureRule(selectedRule)}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    + Add Fixture
                  </button>
                </div>
                {(selectedRule.testFixtures || []).map((f) => (
                  <div key={f.fixtureId} className="p-3 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-200">{f.name}</div>
                      <span className="text-[10px] font-mono text-zinc-500">Expected: {f.expectedResult}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      f.lastResult === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {f.lastResult || 'NOT_RUN'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-tab: Tune */}
            {modalTab === 'tune' && (
              <div className="space-y-3">
                <p className="text-zinc-400 text-[11px]">
                  Tuning logic creates an immutable new revision and places the rule into <span className="text-amber-400 font-bold">TESTING</span> status. In-place edits on production rules are forbidden.
                </p>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Change Reason</label>
                  <input
                    type="text"
                    value={tuningReason}
                    onChange={(e) => setTuningReason(e.target.value)}
                    placeholder="e.g. Refined threshold to suppress legitimate backup script noise"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Conditions JSON</label>
                  <textarea
                    rows={6}
                    value={JSON.stringify(tuningConditions, null, 2)}
                    onChange={(e) => {
                      try {
                        setTuningConditions(JSON.parse(e.target.value));
                      } catch (_) {}
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveTuning}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs"
                  >
                    Save as New Revision
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HUMAN REVIEW MODAL */}
      {reviewModalRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 text-xs">
            <h3 className="text-base font-bold text-white mb-2">Operator Review: {reviewModalRule.name}</h3>
            <p className="text-zinc-400 text-[11px] mb-4">
              Formal governance decision. Only Operator or Admin roles may approve content for production activation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                >
                  <option value="APPROVE">APPROVE (Allow Production Activation)</option>
                  <option value="REQUEST_CHANGES">REQUEST_CHANGES (Send Back to DRAFT)</option>
                  <option value="REJECT">REJECT (Reject Rule)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Risk Classification</label>
                <select
                  value={reviewRisk}
                  onChange={(e) => setReviewRisk(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Review Rationale</label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Record justification, verified test results, and authorization rationale..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setReviewModalRule(null)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Confirm Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD FIXTURE MODAL */}
      {fixtureRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 text-xs">
            <h3 className="text-base font-bold text-white mb-2">Add Fixture: {fixtureRule.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Fixture Name</label>
                <input
                  type="text"
                  value={newFixture.name}
                  onChange={(e) => setNewFixture({ ...newFixture, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Expected Result</label>
                <select
                  value={newFixture.expectedResult}
                  onChange={(e) => setNewFixture({ ...newFixture, expectedResult: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                >
                  <option value="MATCH">MATCH</option>
                  <option value="NO_MATCH">NO_MATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-semibold">Input Payload JSON</label>
                <textarea
                  rows={5}
                  value={newFixture.inputJson}
                  onChange={(e) => setNewFixture({ ...newFixture, inputJson: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setFixtureRule(null)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFixture}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Add Fixture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOUNDED AI COPILOT DRAWER */}
      {aiDrawerOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-96 z-50 bg-zinc-900 border-l border-zinc-800 p-5 shadow-2xl flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-base">✨</span>
                <h3 className="text-sm font-bold text-white">AI Detection Engineer</h3>
              </div>
              <button onClick={() => setAiDrawerOpen(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-zinc-400 text-[11px] mb-4">
              Bounded advisory intelligence. Zero autonomous activation authority. All generated rules strictly initialize in <span className="text-amber-400 font-bold">DRAFT</span> status with <span className="text-rose-400 font-bold">enabled: false</span>.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'review', label: 'Review Logic' },
                { id: 'tune', label: 'Suggest Tuning' },
                { id: 'map-attack', label: 'Map ATT&CK' },
                { id: 'find-gaps', label: 'Find Gaps' },
                { id: 'test-plan', label: 'Draft Fixtures' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleTriggerAI(btn.id)}
                  disabled={aiLoading}
                  className="p-2 rounded bg-purple-600/10 text-purple-300 border border-purple-500/20 hover:bg-purple-600/20 transition font-medium text-[11px] text-center"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {aiLoading && (
              <div className="p-4 text-center text-zinc-500">
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Consulting Detection Copilot...
              </div>
            )}

            {aiOutput && (
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800 max-h-80 overflow-y-auto font-mono text-[11px] text-zinc-300">
                <pre className="whitespace-pre-wrap">{JSON.stringify(aiOutput, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
            Advisory Only • Human Gate Mandatory
          </div>
        </div>
      )}
    </div>
  );
}
