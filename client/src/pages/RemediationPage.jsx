import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RemediationPage() {
  const [activeTab, setActiveTab] = useState('lookup');
  const [loading, setLoading] = useState(false);

  // States
  const [cveQuery, setCveQuery] = useState('');
  const [envContext, setEnvContext] = useState('');
  const [activePlan, setActivePlan] = useState(null);
  const [fixes, setFixes] = useState([]);
  const [history, setHistory] = useState([]);

  // Expanded fix in table
  const [expandedFixId, setExpandedFixId] = useState(null);

  // Generate / Lookup CVE Plan
  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!cveQuery.trim()) return toast.error('Please specify a CVE identifier.');

    setLoading(true);
    try {
      const res = await api.get('/remediations', {
        params: {
          cve: cveQuery.trim().toUpperCase(),
          context: envContext,
        },
      });
      setActivePlan(res.data);
      toast.success('AI Remediation plan formulated.');

      // Add to local history list
      const newEntry = {
        cve: cveQuery.trim().toUpperCase(),
        timestamp: new Date(),
        summary: res.data.executiveSummary,
      };
      setHistory(prev => [newEntry, ...prev.filter(h => h.cve !== newEntry.cve)].slice(0, 50));
    } catch (err) {
      toast.error('Failed to generate remediation plan.');
    } finally {
      setLoading(false);
    }
  };

  // Load Vulnerability Fixes
  const loadFixes = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = localStorage.getItem('activeOrgId');
      const headers = orgId ? { 'x-organization-id': orgId } : {};
      const res = await api.get('/remediations/fixes', { headers });
      setFixes(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve active vulnerability fixes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'fixes') {
      loadFixes();
    }
  }, [activeTab, loadFixes]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8 font-mono text-[#e0e6ff] space-y-6 relative z-10">
      {/* Header */}
      <div className="border border-[#00bfff]/20 bg-[#070f21]/80 rounded-xl p-5 shadow-[0_0_24px_rgba(0,191,255,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              <span>🧠</span> AI Remediation <span className="text-[#00bfff]">Assistant</span>
            </h1>
            <p className="text-[10px] text-[#5a7fa8] mt-1 uppercase tracking-wider">
              CVE Analysis · Root Cause Identification · Code Fixes · Verification Checklists
            </p>
          </div>
          <div className="flex gap-2">
            {['lookup', 'fixes', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all
                  ${activeTab === tab
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'border-[#224466]/40 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
              >
                {tab === 'lookup' ? '🔍 AI Lookup' : tab === 'fixes' ? '🛡️ Vulnerability Fixes' : '📝 Lookup History'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AI LOOKUP                                             */}
      {/* ============================================================ */}
      {activeTab === 'lookup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Form */}
          <div className="lg:col-span-1 border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Analyze CVE</h3>
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">CVE Identifier</label>
                <input type="text" required value={cveQuery} onChange={e => setCveQuery(e.target.value)}
                  placeholder="e.g. CVE-2021-44228" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Environment Context (Optional)</label>
                <textarea value={envContext} onChange={e => setEnvContext(e.target.value)} rows={3}
                  placeholder="e.g. running on Nginx v1.18 web server, Ubuntu 20.04 node" className="w-full bg-black/40 border border-[#224466]/40 rounded p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none placeholder-white/10" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold rounded text-xs uppercase tracking-widest transition-all">
                {loading ? 'Formulating Plan...' : '🧠 Formulate Fix'}
              </button>
            </form>
          </div>

          {/* Formulated Plan View */}
          <div className="lg:col-span-2 border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-5 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] gap-4">
                <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-xs text-cyan-400/60 uppercase tracking-widest">Generating mitigation path...</p>
              </div>
            ) : activePlan ? (
              <div className="space-y-5">
                <div className="border-b border-[#224466]/20 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-black text-cyan-400 font-mono tracking-widest uppercase">Fix Directive: {cveQuery.toUpperCase()}</h2>
                  <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded uppercase font-mono">
                    Formulation Concluded
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Executive Summary */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Executive Summary</h4>
                    <p className="text-gray-300 leading-relaxed bg-black/20 p-3 rounded border border-[#224466]/10">{activePlan.executiveSummary}</p>
                  </div>

                  {/* Root Cause */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Root Cause</h4>
                    <p className="text-gray-300 leading-relaxed bg-black/20 p-3 rounded border border-[#224466]/10">{activePlan.rootCause}</p>
                  </div>

                  {/* Recommended Fix */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Recommended Fix</h4>
                    <pre className="text-gray-300 leading-relaxed bg-black/40 p-3 rounded border border-[#224466]/20 font-mono text-xs whitespace-pre-wrap">{activePlan.recommendedFix}</pre>
                  </div>

                  {/* Verification Checklist */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Verification Checklist</h4>
                    <pre className="text-cyan-400 leading-relaxed bg-black/40 p-3 rounded border border-[#224466]/20 font-mono text-xs whitespace-pre-wrap">{activePlan.verificationChecklist}</pre>
                  </div>

                  {/* References */}
                  {activePlan.references && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">References</h4>
                      <pre className="text-[#5a7fa8] leading-relaxed bg-black/20 p-3 rounded border border-[#224466]/10 font-mono text-[10px] whitespace-pre-wrap">{activePlan.references}</pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center space-y-2">
                <span className="text-4xl">🤖</span>
                <p className="text-xs text-gray-500 uppercase tracking-widest">AI Remediation Terminal Idle</p>
                <p className="text-[9px] text-gray-600">Input a CVE ID on the left to pull structured vulnerability triage plans.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: VULNERABILITY FIXES                                   */}
      {/* ============================================================ */}
      {activeTab === 'fixes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Vulnerability Mappings</h2>
            <button onClick={loadFixes} className="px-2.5 py-1 border border-[#224466]/40 hover:border-white/20 rounded text-[9px] uppercase tracking-widest">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs text-cyan-400/60 uppercase tracking-widest">Generating patches mapping...</p>
            </div>
          ) : fixes.length === 0 ? (
            <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest">No active vulnerabilities found to patch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fixes.map((fix) => (
                <div key={fix.vulnId} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl overflow-hidden">
                  <div onClick={() => setExpandedFixId(expandedFixId === fix.vulnId ? null : fix.vulnId)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-cyan-400">{fix.cve}</span>
                        <span className="text-[9px] text-[#5a7fa8]">Host: <strong className="text-white">{fix.hostname}</strong></span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate max-w-2xl">{fix.summary}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase
                        ${fix.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                        {fix.severity}
                      </span>
                      <span className="text-gray-500">{expandedFixId === fix.vulnId ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expandedFixId === fix.vulnId && (
                    <div className="p-4 bg-black/40 border-t border-[#224466]/20 space-y-4 text-xs font-mono">
                      <div>
                        <h4 className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">Recommended Fix</h4>
                        <pre className="text-gray-300 leading-relaxed bg-black/40 p-3 rounded border border-[#224466]/20 font-mono text-xs whitespace-pre-wrap">{fix.fix}</pre>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">Verification Steps</h4>
                        <pre className="text-cyan-400 leading-relaxed bg-black/40 p-3 rounded border border-[#224466]/20 font-mono text-xs whitespace-pre-wrap">{fix.checklist}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: REMEDIATION HISTORY                                   */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Triage Lookup History</h2>
          
          {history.length === 0 ? (
            <div className="border border-dashed border-[#224466]/30 rounded-xl p-16 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest">No recent lookup records.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} onClick={() => { setCveQuery(h.cve); setActiveTab('lookup'); handleLookup(); }}
                  className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl p-3 flex items-center justify-between gap-4 cursor-pointer hover:border-cyan-400/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-cyan-400">{h.cve}</span>
                    <p className="text-[10px] text-gray-500 truncate max-w-xl">{h.summary}</p>
                  </div>
                  <span className="text-[9px] text-[#5a7fa8]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
