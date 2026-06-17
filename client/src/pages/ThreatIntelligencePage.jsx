import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ThreatIntelligencePage() {
  const { t } = useTranslation();
  
  // Search states
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ip'); // ip, domain, hash, email, url
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);

  // Feeds states
  const [recentIOCs, setRecentIOCs] = useState([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Fetch recent queries
  const fetchRecentIOCs = async () => {
    try {
      setLoadingFeeds(true);
      const res = await api.get('/ioc/recent?limit=8');
      if (res.data && res.data.records) {
        setRecentIOCs(res.data.records);
      }
    } catch (err) {
      console.error('Error fetching recent IOC logs:', err);
    } finally {
      setLoadingFeeds(false);
    }
  };

  useEffect(() => {
    fetchRecentIOCs();
  }, []);

  // Handle Search Submission
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResult(null);
    try {
      const res = await api.get(`/ioc?target=${encodeURIComponent(query.trim())}`);
      if (res.data && res.data.record) {
        setResult(res.data.record);
        toast.success('Threat intelligence correlated');
        fetchRecentIOCs(); // Refresh logs
      } else {
        toast.error('Could not retrieve threat records');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Intelligence lookup failed');
    } finally {
      setSearching(false);
    }
  };

  // Helper for threat color
  const getReputationColor = (rep) => {
    if (rep >= 75) return '#ff2244'; // Cyber Red
    if (rep >= 40) return '#ff8c00'; // Orange
    return '#00ff88'; // Neon Green
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-mono text-[#e0e6ff] relative z-10">
      
      {/* Page Header */}
      <div className="border border-[#00bfff]/20 bg-[#070f21]/70 rounded-xl p-6 mb-8 shadow-[0_0_20px_rgba(0,191,255,0.05)]">
        <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase font-display flex items-center gap-2">
          <span>🌐</span> THREAT INTELLIGENCE CENTER <span className="text-[#00bfff]">V2.0</span>
        </h1>
        <p className="text-xs text-[#5a7fa8] mt-1.5 uppercase tracking-wider">
          Correlate target indicators (IPs, Domains, File Hashes) against passive heuristics and active vulnerability logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Search & Display results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search Console */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4 border-b border-[#224466]/30 pb-2">reputation search console</h3>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ip', label: 'IP ADDRESS' },
                  { id: 'domain', label: 'DOMAIN NAME' },
                  { id: 'hash', label: 'FILE HASH' },
                  { id: 'email', label: 'EMAIL VECTOR' },
                  { id: 'url', label: 'URL ENDPOINT' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id)}
                    className={`text-[9px] px-2.5 py-1 rounded font-bold border transition-all ${
                      type === opt.id
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(0,191,255,0.2)]'
                        : 'bg-black/30 border-[#224466]/40 text-[#5a7fa8] hover:border-cyan-500/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Enter target ${type.toUpperCase()} (e.g., ${
                    type === 'ip' ? '8.8.8.8' : 
                    type === 'domain' ? 'google.com' : 
                    type === 'hash' ? '44d88612fea8a8f36de82e1278abb02f' :
                    type === 'email' ? 'malicious@spambot.ru' : 'https://suspect-site.org'
                  })`}
                  className="flex-1 bg-black/60 border border-[#224466]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-2 bg-gradient-to-r from-[#00bfff] to-blue-600 hover:shadow-[0_0_15px_rgba(0,191,255,0.4)] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                >
                  {searching ? 'SEARCHING...' : 'CORRELATE'}
                </button>
              </div>
            </form>
          </div>

          {/* Results Viewer */}
          <AnimatePresence mode="wait">
            {searching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-8 text-center"
              >
                <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs uppercase text-cyan-400 animate-pulse tracking-widest">Running neural indicators correlation...</p>
              </motion.div>
            )}

            {!searching && result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg space-y-6"
              >
                {/* Score Header */}
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b border-[#224466]/30 pb-4 gap-4">
                  <div className="text-center md:text-left">
                    <span className="text-[9px] border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      {result.type} INDICATOR
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2 break-all">{result.value}</h2>
                  </div>

                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-[#224466]/20">
                    <div className="text-center">
                      <div className="text-2xl font-black tracking-tighter" style={{ color: getReputationColor(result.reputation) }}>
                        {result.reputation}/100
                      </div>
                      <div className="text-[8px] text-[#5a7fa8] uppercase mt-0.5 font-bold">REPUTATION</div>
                    </div>
                    <div className="w-px h-8 bg-[#224466]/30" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-cyan-400">
                        {result.confidence}%
                      </div>
                      <div className="text-[8px] text-[#5a7fa8] uppercase mt-0.5 font-bold">CONFIDENCE</div>
                    </div>
                  </div>
                </div>

                {/* Risk Level Alert */}
                <div className="p-4 rounded-lg border flex items-start gap-3" style={{
                  backgroundColor: result.reputation >= 75 ? 'rgba(255,34,68,0.06)' : result.reputation >= 40 ? 'rgba(255,140,0,0.06)' : 'rgba(0,255,136,0.06)',
                  borderColor: `${getReputationColor(result.reputation)}40`
                }}>
                  <span className="text-lg" style={{ color: getReputationColor(result.reputation) }}>
                    {result.reputation >= 75 ? '🚨' : result.reputation >= 40 ? '⚠' : '✓'}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: getReputationColor(result.reputation) }}>
                      {result.reputation >= 75 ? 'HIGH RISK THREAT INDICATOR' : result.reputation >= 40 ? 'SUSPICIOUS REPUTATION DETECTED' : 'PERIMETER SECURE / SAFE TARGET'}
                    </h4>
                    <p className="text-[11px] text-[#cbd5e1] mt-1.5 leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-[#224466]/10 pb-1.5">
                      <span className="text-[#5a7fa8] uppercase">Reporting Source</span>
                      <span className="text-white font-bold">{result.source}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-[#224466]/10 pb-1.5">
                      <span className="text-[#5a7fa8] uppercase">Enrichment Status</span>
                      <span className="text-green-400 font-bold uppercase text-[10px] bg-green-500/10 border border-green-500/20 px-1.5 rounded">{result.enrichmentStatus}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-[#224466]/10 pb-1.5">
                      <span className="text-[#5a7fa8] uppercase">First Seen</span>
                      <span className="text-white">{new Date(result.firstSeen).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-[#224466]/10 pb-1.5">
                      <span className="text-[#5a7fa8] uppercase">Last Evaluated</span>
                      <span className="text-white">{new Date(result.lastSeen).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {result.tags && result.tags.length > 0 && (
                  <div className="border-t border-[#224466]/30 pt-4">
                    <h4 className="text-[10px] text-[#5a7fa8] uppercase tracking-widest mb-2 font-bold">Correlated Threat Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.tags.map((tg, idx) => (
                        <span key={idx} className="text-[9px] border border-[#224466]/40 bg-black/40 text-[#e0e6ff] px-2.5 py-0.5 rounded">
                          #{tg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

          {/* Fallback Instruction */}
          {!result && !searching && (
            <div className="border border-[#224466]/20 bg-black/20 rounded-xl p-8 text-center italic text-xs text-[#5a7fa8]">
              Enter a query in the console above to run a multi-source threat reputation check.
            </div>
          )}

        </div>

        {/* Right Column: Feeds & Recent Lookups */}
        <div className="space-y-6">
          
          {/* Recent Lookups */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4 border-b border-[#224466]/30 pb-2">RECENT QUERIES LOG</h3>
            
            {loadingFeeds ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                <span className="text-[9px] text-[#5a7fa8] uppercase">Syncing logs...</span>
              </div>
            ) : recentIOCs.length === 0 ? (
              <p className="text-xs text-[#5a7fa8] italic text-center py-4">No recent lookup logs.</p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recentIOCs.map((ioc) => (
                  <div 
                    key={ioc._id}
                    onClick={() => { setQuery(ioc.value); setType(ioc.type); }}
                    className="border border-[#224466]/25 bg-black/40 rounded p-2 hover:border-cyan-400/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[8px] bg-[#224466]/40 px-1 py-0.5 rounded text-cyan-400 font-bold uppercase tracking-wider">{ioc.type}</span>
                        <span className="text-[8px] text-[#476585]">{new Date(ioc.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] font-bold text-white truncate pr-2">{ioc.value}</p>
                    </div>
                    <div className="text-center font-bold text-[10px] px-2 py-0.5 rounded" style={{
                      color: getReputationColor(ioc.reputation),
                      background: `${getReputationColor(ioc.reputation)}0c`,
                      border: `1px solid ${getReputationColor(ioc.reputation)}20`
                    }}>
                      {ioc.reputation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Passive Intel Feeds */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-4 border-b border-[#224466]/30 pb-2">HEURISTICS STATS</h3>
            <ul className="text-[11px] text-[#cbd5e1] space-y-2.5 pl-3 list-disc">
              <li>IP block ranges checked against 44 public abuse filters.</li>
              <li>Domains correlated against legacy expiration metrics.</li>
              <li>MD5/SHA signatures scanned via local EICAR catalog patterns.</li>
              <li>Deep context checking evaluates suspicious payload strings.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
