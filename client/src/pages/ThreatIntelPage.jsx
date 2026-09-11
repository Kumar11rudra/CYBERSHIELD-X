import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ThreatIntelPage() {
  const [activeTab, setActiveTab] = useState('fusion'); // 'fusion' | 'actors' | 'timeline'

  // IOC Fusion State
  const [indicatorInput, setIndicatorInput] = useState('185.220.101.5');
  const [enriching, setEnriching] = useState(false);
  const [currentIntel, setCurrentIntel] = useState(null);
  const [platformMatches, setPlatformMatches] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Threat Actors & Campaigns State
  const [actors, setActors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingContext, setLoadingContext] = useState(false);

  // Investigation Timeline State
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineSeverity, setTimelineSeverity] = useState('');

  // Initial load
  useEffect(() => {
    fetchContextData();
    fetchTimeline();
    // Pre-run enrichment on default indicator
    handleEnrich('185.220.101.5');
  }, []);

  const fetchContextData = async () => {
    try {
      setLoadingContext(true);
      const [actorsRes, campaignsRes] = await Promise.all([
        axios.get('/api/intel/threat-actors'),
        axios.get('/api/intel/campaigns'),
      ]);
      if (actorsRes.data?.success) setActors(actorsRes.data.data || []);
      if (campaignsRes.data?.success) setCampaigns(campaignsRes.data.data || []);
    } catch (err) {
      console.warn('Failed to load threat context:', err.message);
    } finally {
      setLoadingContext(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      setTimelineLoading(true);
      const params = new URLSearchParams();
      if (timelineSeverity) params.append('severity', timelineSeverity);
      params.append('limit', '40');

      const res = await axios.get(`/api/intel/investigation-timeline?${params.toString()}`);
      if (res.data?.success) {
        setTimelineEvents(res.data.data.timeline || []);
      }
    } catch (err) {
      console.warn('Failed to load investigation timeline:', err.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleEnrich = async (indicatorToQuery) => {
    const target = indicatorToQuery || indicatorInput;
    if (!target || !target.trim()) {
      toast.error('Enter an indicator to enrich');
      return;
    }

    try {
      setEnriching(true);
      setMatchingLoading(true);

      // 1. Enrich indicator
      const enrichRes = await axios.post('/api/intel/enrich', { indicator: target.trim() });
      if (enrichRes.data?.success) {
        setCurrentIntel(enrichRes.data.data);
        toast.success(`Enrichment complete: State [${enrichRes.data.data.state}]`);
      }

      // 2. Fetch platform matches
      const matchRes = await axios.get(`/api/intel/matches?indicator=${encodeURIComponent(target.trim())}`);
      if (matchRes.data?.success) {
        setPlatformMatches(matchRes.data.data.matches || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrichment request failed');
    } finally {
      setEnriching(false);
      setMatchingLoading(false);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-2">
                THREAT INTELLIGENCE FUSION CENTER
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  FUSION & TIMELINE
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Multi-Provider IOC Correlation • Authentic Provenance • Zero Synthetic Data
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#0a1124] p-1 rounded border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('fusion')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'fusion'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            IOC Fusion & Matches
          </button>
          <button
            onClick={() => setActiveTab('actors')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'actors'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Threat Actors & Campaigns
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'timeline'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Investigation Timeline
          </button>
        </div>
      </div>

      {/* ─── TAB 1: IOC FUSION & PLATFORM MATCHES ───────────────────────────── */}
      {activeTab === 'fusion' && (
        <div className="space-y-6">
          {/* Lookup Console Card */}
          <div className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-3 flex items-center justify-between">
              <span>Indicator Normalization & Authentic Enrichment</span>
              <span className="text-[10px] text-slate-400">DNS • OTX • CIRCL HashLookup</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={indicatorInput}
                onChange={(e) => setIndicatorInput(e.target.value)}
                placeholder="Enter IP, domain, URL, CVE, or SHA256/MD5 hash..."
                className="flex-1 bg-[#020814] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
              <button
                onClick={() => handleEnrich()}
                disabled={enriching}
                className="px-5 py-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
              >
                {enriching ? 'Enriching...' : 'Enrich Indicator'}
              </button>
            </div>
          </div>

          {/* Intel Detail & Platform Matches Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Authentic Provenance Card (6 cols) */}
            <div className="lg:col-span-6 bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white font-mono">INDICATOR PROVENANCE</h3>
                {currentIntel && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                      currentIntel.state === 'CONFIRMED'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : currentIntel.state === 'UNAVAILABLE'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : currentIntel.state === 'PARTIAL'
                        ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/40'
                        : 'bg-green-950 text-green-400 border border-green-500/40'
                    }`}
                  >
                    STATE: {currentIntel.state}
                  </span>
                )}
              </div>

              {currentIntel ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-[#020814] p-3 rounded border border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">INDICATOR</span>
                      <span className="text-cyan-300 font-bold">{currentIntel.indicator}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">NORMALIZED TYPE</span>
                      <span className="text-slate-200">{currentIntel.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PROVIDER</span>
                      <span className="text-slate-200">{currentIntel.provider}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">REPUTATION</span>
                      <span
                        className={
                          currentIntel.reputation === 'MALICIOUS'
                            ? 'text-red-400 font-bold'
                            : currentIntel.reputation === 'SUSPICIOUS'
                            ? 'text-yellow-400'
                            : 'text-slate-300'
                        }
                      >
                        {currentIntel.reputation}
                      </span>
                    </div>
                  </div>

                  {/* Provider Details */}
                  {currentIntel.enrichmentDetails && (
                    <div className="bg-[#020814] p-3 rounded border border-white/5 space-y-2">
                      <span className="text-slate-500 block text-[10px]">PROVIDER TELEMETRY DETAILS</span>
                      {currentIntel.enrichmentDetails.resolvedIps && (
                        <div className="text-[11px] text-slate-300">
                          Resolved IPs: {currentIntel.enrichmentDetails.resolvedIps.join(', ')}
                        </div>
                      )}
                      {currentIntel.enrichmentDetails.pulseCount !== undefined && (
                        <div className="text-[11px] text-slate-300">
                          AlienVault OTX Pulses: {currentIntel.enrichmentDetails.pulseCount}
                        </div>
                      )}
                      {currentIntel.enrichmentDetails.malwareFamily && (
                        <div className="text-[11px] text-red-400">
                          Malware Family: {currentIntel.enrichmentDetails.malwareFamily}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 pt-1">
                        Retrieved At: {new Date(currentIntel.provenance?.retrievedAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs font-mono">
                  Enter an indicator above and click Enrich Indicator.
                </div>
              )}
            </div>

            {/* Right Column: Platform Matches Matrix (6 cols) */}
            <div className="lg:col-span-6 bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white font-mono">ENVIRONMENT PLATFORM MATCHES</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                  {platformMatches.length} Matches Found
                </span>
              </div>

              {matchingLoading ? (
                <div className="text-center py-10 text-slate-400 text-xs font-mono animate-pulse">
                  Scanning active assets, findings, alerts, and incidents...
                </div>
              ) : platformMatches.length > 0 ? (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {platformMatches.map((m, idx) => (
                    <div key={idx} className="bg-[#020814] border border-white/10 rounded p-3 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px] border border-cyan-500/20">
                          {m.entityType}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.entityId}</span>
                      </div>
                      <div className="font-semibold text-slate-200">{m.entityName}</div>
                      <div className="text-[11px] text-cyan-300">{m.matchReason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs font-mono">
                  Zero active platform matches found for this indicator.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: THREAT ACTORS & CAMPAIGNS ───────────────────────────────── */}
      {activeTab === 'actors' && (
        <div className="space-y-8">
          {/* Threat Actors */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-4">
              Structured Threat Actor Profiles ({actors.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actors.map((act) => (
                <div key={act.actorId} className="bg-[#0a1124] border border-white/10 rounded-lg p-4 font-mono text-xs space-y-2 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{act.actorId}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {act.attributionStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{act.name}</h3>
                  {act.aliases && act.aliases.length > 0 && (
                    <div className="text-slate-400 text-[11px]">Aliases: {act.aliases.join(', ')}</div>
                  )}
                  <div className="text-slate-300 text-[11px]">Origin: {act.origin} • Motivation: {act.motivation}</div>
                  {act.targetedSectors && act.targetedSectors.length > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Sectors: {act.targetedSectors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campaigns */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono mb-4">
              Active & Historical Campaigns ({campaigns.length})
            </h2>

            <div className="bg-[#0a1124] border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#020814] border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="p-3">CAMPAIGN ID</th>
                    <th className="p-3">NAME</th>
                    <th className="p-3">ATTRIBUTED ACTOR</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ASSOCIATED IOCS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.map((camp) => (
                    <tr key={camp.campaignId} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-cyan-400">{camp.campaignId}</td>
                      <td className="p-3 text-white font-semibold">{camp.name}</td>
                      <td className="p-3 text-slate-300">{camp.threatActorName || 'Unattributed'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            camp.status === 'ACTIVE'
                              ? 'bg-red-950 text-red-400 border border-red-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{camp.associatedIOCs?.length || 0} indicator(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: INVESTIGATION TIMELINE ──────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="bg-[#0a1124] border border-cyan-500/20 rounded-lg p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/5 gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Evidence-Backed Investigation Timeline
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Aggregated chronological trace across Hunts, Alerts, Findings, Incidents, and Jobs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timelineSeverity}
                onChange={(e) => {
                  setTimelineSeverity(e.target.value);
                  setTimeout(fetchTimeline, 50);
                }}
                className="bg-[#020814] border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
              <button
                onClick={fetchTimeline}
                className="px-3 py-1 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs font-mono"
              >
                Refresh
              </button>
            </div>
          </div>

          {timelineLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono animate-pulse">
              Aggregating security event records...
            </div>
          ) : timelineEvents.length > 0 ? (
            <div className="relative border-l-2 border-cyan-500/30 ml-4 pl-5 space-y-6 my-4">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="relative font-mono text-xs">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#020814] ${
                      event.severity === 'CRITICAL'
                        ? 'bg-red-500'
                        : event.severity === 'HIGH'
                        ? 'bg-orange-500'
                        : event.severity === 'MEDIUM'
                        ? 'bg-yellow-500'
                        : 'bg-cyan-500'
                    }`}
                  ></span>

                  <div className="bg-[#020814] border border-white/10 rounded p-3 space-y-1 hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px] border border-cyan-500/20">
                        {event.eventType}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-bold text-white text-sm">{event.title}</div>
                    <div className="text-slate-300 text-[11px]">{event.details}</div>
                    <div className="text-[10px] text-slate-500 pt-1">Actor: {event.actor} • ID: {event.sourceId}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Zero timeline events recorded within the selected parameters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
