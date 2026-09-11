import React, { useState, useEffect } from 'react';
import {
  Share2, Search, Link2, Clock, GitCommit, CheckCircle2, Shield,
  Bot, RefreshCw, Layers, Database, ChevronRight, AlertCircle, FileCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InvestigationGraphPage = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [entityType, setEntityType] = useState('INCIDENT');
  const [entityId, setEntityId] = useState('INC-77001');
  const [graphData, setGraphData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [rules, setRules] = useState([]);
  const [results, setResults] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'explorer') {
        const res = await fetch(`/api/data-fabric/graph/neighborhood?entityType=${entityType}&entityId=${entityId}`);
        const data = await res.json();
        if (data.success) setGraphData(data);
      } else if (activeTab === 'timeline') {
        const res = await fetch('/api/data-fabric/timeline');
        const data = await res.json();
        if (data.success) setTimeline(data.events);
      } else if (activeTab === 'rules') {
        const res = await fetch('/api/data-fabric/correlation/rules');
        const data = await res.json();
        if (data.success) setRules(data.rules);
      } else if (activeTab === 'results') {
        const res = await fetch('/api/data-fabric/correlation/results');
        const data = await res.json();
        if (data.success) setResults(data.results);
      } else if (activeTab === 'integrity') {
        const res = await fetch('/api/data-fabric/integrity');
        const data = await res.json();
        if (data.success) setIntegrity(data.report);
      }
    } catch (err) {
      toast.error('Failed to load investigation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGraph = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/data-fabric/graph/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Graph sync complete. Materialized ${data.result.nodeCount} nodes, ${data.result.edgeCount} edges`);
        fetchData();
      }
    } catch (err) {
      toast.error('Graph sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleExplore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/data-fabric/graph/neighborhood?entityType=${entityType}&entityId=${entityId}`);
      const data = await res.json();
      if (data.success) {
        setGraphData(data);
        toast.success(`Graph query retrieved ${data.totalNodes} nodes and ${data.totalEdges} edges`);
      }
    } catch (err) {
      toast.error('Graph query failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiCopilot = async (endpoint, body = {}) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chatbot/investigation/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.data);
        toast.success('Investigation copilot advisory ready');
      }
    } catch (err) {
      toast.error('AI copilot request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Share2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Unified Investigation Graph</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              v62.1.0 Certified
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise Security Data Fabric, Deterministic Event Correlation & Evidence-Backed Graph Analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncGraph}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Graph Data</span>
          </button>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 space-x-2 pb-2">
        {[
          { id: 'explorer', label: 'Graph Explorer', icon: Share2 },
          { id: 'search', label: 'Entity Search', icon: Search },
          { id: 'details', label: 'Relationships', icon: Link2 },
          { id: 'timeline', label: 'Unified Timeline', icon: Clock },
          { id: 'rules', label: 'Correlation Rules', icon: GitCommit },
          { id: 'results', label: 'Correlation Results', icon: CheckCircle2 },
          { id: 'provenance', label: 'Evidence & Provenance', icon: Database },
          { id: 'snapshots', label: 'Graph Snapshots', icon: Layers },
          { id: 'integrity', label: 'Graph Integrity', icon: Shield },
          { id: 'copilot', label: 'AI Copilot', icon: Bot },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Traversing security graph...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Graph Explorer */}
          {activeTab === 'explorer' && (
            <div className="space-y-6">
              {/* Search Bar for Graph Pivot */}
              <form onSubmit={handleExplore} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3">
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="INCIDENT">INCIDENT</option>
                  <option value="ASSET">ASSET</option>
                  <option value="IOC">IOC</option>
                  <option value="FINDING">FINDING</option>
                  <option value="ALERT">ALERT</option>
                  <option value="AUTOMATION_EXECUTION">AUTOMATION_EXECUTION</option>
                </select>
                <input
                  type="text"
                  placeholder="Entity ID (e.g. INC-77001)"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition"
                >
                  Explore Neighborhood
                </button>
              </form>

              {/* Subgraph Display */}
              {graphData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">Bounded Investigation Subgraph</h3>
                      <span className="text-xs font-mono text-cyan-400">Nodes: {graphData.totalNodes} • Edges: {graphData.totalEdges}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 min-h-[300px]">
                      {graphData.nodes?.map((n) => (
                        <div key={n.nodeId} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-xs font-mono text-cyan-400 uppercase">{n.entityType}</span>
                            <h4 className="font-bold text-white text-sm">{n.displayName}</h4>
                            <p className="text-xs text-slate-400">ID: {n.entityId} • Source: {n.source}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            n.classification === 'HIGH' || n.classification === 'CRITICAL' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {n.classification}
                          </span>
                        </div>
                      ))}
                      {graphData.nodes?.length === 0 && (
                        <p className="text-center text-slate-500 py-12">No nodes found in graph scope. Click "Sync Graph Data" to materialize platform entities.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Materialized Relationships</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {graphData.edges?.map((e) => (
                        <div key={e.edgeId} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                          <p className="font-mono text-cyan-400 font-semibold">{e.relationshipType}</p>
                          <p className="text-slate-300">{e.fromNode} → {e.toNode}</p>
                          <p className="text-slate-400 font-mono">Provenance: {e.provenanceType}</p>
                        </div>
                      ))}
                      {graphData.edges?.length === 0 && (
                        <p className="text-center text-slate-500 py-6 text-xs">No graph edges discovered for this entity.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Entity Search */}
          {activeTab === 'search' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Global Security Entity Index</h3>
              <p className="text-sm text-slate-400">
                Data Fabric normalizes entity representations across 14 platform domains into unified queryable nodes.
              </p>
            </div>
          )}

          {/* TAB 3: Relationships */}
          {activeTab === 'details' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Relationship Provenance Inspector</h3>
              <p className="text-sm text-slate-400">
                Every relationship edge in the CyberShield X Data Fabric carries cryptographic checksums and verifiable record provenance.
              </p>
            </div>
          )}

          {/* TAB 4: Unified Timeline */}
          {activeTab === 'timeline' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Chronological Investigation Timeline</h3>
              <div className="space-y-3">
                {timeline.map((ev) => (
                  <div key={ev.eventId} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-cyan-400 uppercase">{ev.entityType}</span>
                        <span className="text-xs text-slate-400">• {new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm mt-0.5">{ev.title}</h4>
                      <p className="text-xs text-slate-400">Source: {ev.source}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded font-semibold">
                      {ev.classification}
                    </span>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <p className="text-center text-slate-500 py-6">No timeline events recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Correlation Rules */}
          {activeTab === 'rules' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Event Correlation Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((r) => (
                  <div key={r.ruleId} className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-sm">{r.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs rounded font-semibold">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{r.description}</p>
                    <p className="text-xs font-mono text-cyan-400">Relationship: {r.relationshipType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Correlation Results */}
          {activeTab === 'results' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Correlation Execution Results</h3>
              <div className="space-y-3">
                {results.map((res) => (
                  <div key={res.correlationId} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{res.correlationId}</h4>
                      <p className="text-xs text-slate-400">Rule: {res.ruleId} • Rel: {res.relationshipType}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs rounded font-semibold">
                      {res.determination}
                    </span>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="text-center text-slate-500 py-6">No correlation results recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Evidence & Provenance */}
          {activeTab === 'provenance' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Cryptographic Edge Provenance</h3>
              <p className="text-sm text-slate-400">
                All materialized relationships retain source record IDs and cryptographic SHA-256 edge checksums.
              </p>
            </div>
          )}

          {/* TAB 8: Graph Snapshots */}
          {activeTab === 'snapshots' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Immutable Investigation Graph Snapshots</h3>
              <p className="text-sm text-slate-400">
                Snapshots freeze the state of a graph traversal into an immutable record with SHA-256 content hashes.
              </p>
            </div>
          )}

          {/* TAB 9: Graph Integrity */}
          {activeTab === 'integrity' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Graph Fabric Integrity Diagnostics</h3>
              {integrity && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Integrity Score</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{integrity.integrityScore}%</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Total Graph Nodes</p>
                    <p className="text-2xl font-bold text-white mt-1">{integrity.totalNodes}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase">Total Graph Edges</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{integrity.totalEdges}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: AI Copilot */}
          {activeTab === 'copilot' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    <span>Bounded AI Investigation Copilot</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Advisory graph traversal and relationship explanations.</p>
                </div>
                <button
                  onClick={() => fetchAiCopilot('summarize', { entityType, entityId })}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition"
                >
                  Generate Graph Analysis
                </button>
              </div>

              {aiAnalysis && (
                <div className="bg-slate-950 border border-cyan-900/50 p-5 rounded-lg space-y-3">
                  <h4 className="font-bold text-cyan-400 text-sm">Advisory Analysis</h4>
                  <p className="text-sm text-slate-300">{aiAnalysis.summary}</p>
                  <div className="p-3 bg-slate-900 rounded text-xs text-slate-400 font-mono">
                    {aiAnalysis.aiBoundary?.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestigationGraphPage;
