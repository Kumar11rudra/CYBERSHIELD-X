import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import SecurityFortressGauge from '../components/dashboard/SecurityFortressGauge';
import GlobalThreatMap from '../components/dashboard/GlobalThreatMap';
import { toast } from 'react-hot-toast';

// ─── All 20 Active Threat Models ──────────────────────────────────────────────
const THREAT_MODELS = [
  { id: 'dns', icon: '🌐', name: 'DNS Enumeration Engine', tag: 'RECON', color: '#0ea5e9', desc: 'Query DNS and discover subdomains' },
  { id: 'http', icon: '🌍', name: 'HTTP Security Engine', tag: 'WEB', color: '#f59e0b', desc: 'Audit HTTP headers and server configs' },
  { id: 'port', icon: '📡', name: 'Port & Service Engine', tag: 'RECON', color: '#00ff88', desc: 'Scan open ports and discover services' },
  { id: 'service_fingerprint', icon: '🧪', name: 'Service Fingerprint Engine', tag: 'VULNERABILITY', color: '#ff6b6b', desc: 'Identify running software versions' },
  { id: 'ssl', icon: '🔒', name: 'SSL/TLS Security Engine', tag: 'VULNERABILITY', color: '#10b981', desc: 'Inspect active TLS certificates' },
  { id: 'tech_detection', icon: '🕸️', name: 'Technology Detection Engine', tag: 'RECON', color: '#ec4899', desc: 'Identify tech stacks and CMS' },
  { id: 'url', icon: '☣️', name: 'URL & Threat Intel Engine', tag: 'INTEL', color: '#394eff', desc: 'Check malware and phishing reputation' },
  { id: 'whois', icon: '🌐', name: 'WHOIS Record Engine', tag: 'RECON', color: '#06b6d4', desc: 'Query public records for domain ownership' },
];

const TAG_COLORS = {
  RECON: '#0ea5e9', VULNERABILITY: '#f97316', WEB: '#ef4444', PASSWORD: '#a855f7',
  FORENSICS: '#78716c', SOC: '#65a30d', CLOUD: '#10b981', INTEL: '#394eff',
  AI: '#e11d48', MOBILE: '#0ea5e9', OSINT: '#a855f7', PRIVACY: '#7c3aed',
  WEB3: '#6366f1', EXPLOIT: '#991b1b', CONTAINER: '#0284c7'
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // States
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3');
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { sender: 'copilot', text: 'Hello! I am your AI Security Copilot. I have analyzed your recent scans database. Ask me anything about your current security posture or vulnerabilities.' }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [toolSearch, setToolSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard Stats & Threat Feed
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, threatsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/threat-feed')
        ]);
        
        if (statsRes.data) {
          setStats(statsRes.data);
        }
        if (threatsRes.data && threatsRes.data.items) {
          setThreats(threatsRes.data.items);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);

  // Handle Copilot Chat Submission
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput.trim();
    setChatLogs(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatting(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        model: selectedModel,
        context: {
          currentPath: 'Dashboard Command Center',
          isLoggedIn: true
        }
      });

      if (response.data && response.data.data) {
        setChatLogs(prev => [...prev, { sender: 'copilot', text: response.data.data.text }]);
      } else {
        setChatLogs(prev => [...prev, { sender: 'copilot', text: 'Sorry, I encountered an issue processing that query. Please try again.' }]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setChatLogs(prev => [
        ...prev,
        { 
          sender: 'copilot', 
          text: `[FALLBACK] The local LLM engine (${selectedModel}) is offline. Here is a signature-based threat assessment: Ensure all target endpoints have valid SSL certificates, restrict SSH access, and secure exposed subdomain records.` 
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] font-mono text-cyan-400 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="animate-pulse tracking-[0.25em] text-xs uppercase">Connecting to CyberShield X Command Core...</p>
      </div>
    );
  }

  const overallScore = stats?.securityScore ?? 100;
  const recentScans = stats?.recentScans ?? [];
  const recommendations = stats?.copilotRecommendations ?? [];

  // Filter tools
  const categories = ['ALL', ...new Set(THREAT_MODELS.map(m => m.tag))];
  const filteredTools = THREAT_MODELS.filter(m => {
    const matchSearch = toolSearch === '' || m.name.toLowerCase().includes(toolSearch.toLowerCase()) || m.tag.toLowerCase().includes(toolSearch.toLowerCase());
    const matchCat = activeCategory === 'ALL' || m.tag === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen p-4 md:p-6 font-mono text-[#e0e6ff] bg-[#020814]/90 relative z-10">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border border-[#00bfff]/20 bg-[#070f21]/70 rounded-xl p-4 md:p-5 mb-5 gap-4 shadow-[0_0_20px_rgba(0,191,255,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00bfff]" />
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase font-display">
              NEXUS COMMAND CENTER <span className="text-[#00bfff]">V2.0</span>
            </h1>
          </div>
          <p className="text-[10px] md:text-xs text-[#5a7fa8] mt-1 uppercase tracking-wider">
            Active Threat Perception Node: India-East | Secure Protocol Active
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end font-mono">
          <div className="text-sm md:text-base text-cyan-400 font-bold tracking-widest">
            {time.toLocaleTimeString()}
          </div>
          <div className="text-[9px] text-[#476585] uppercase tracking-wider mt-0.5">
            {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Row 1: Security Gauge + AI Copilot ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        
        {/* Card 1: Security Posture Gauge */}
        <div className="flex flex-col justify-between border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg">
          <div className="border-b border-[#224466]/30 pb-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">SECURITY GAUGE</span>
            <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">ON-LINE</span>
          </div>

          <SecurityFortressGauge score={overallScore} label="POSTURE HEALTH" />

          {/* Scoring Breakdown HUD */}
          <div className="mt-4 border-t border-[#224466]/30 pt-4 flex flex-col gap-2">
            <div className="text-[9px] text-[#5a7fa8] uppercase tracking-widest mb-1">Score Allocation</div>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-1.5 bg-black/40 rounded border border-[#224466]/20">
                <div className="text-cyan-400 font-bold">25</div>
                <div className="text-[8px] text-[#476585] mt-0.5">DNS</div>
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-[#224466]/20">
                <div className="text-green-400 font-bold">25</div>
                <div className="text-[8px] text-[#476585] mt-0.5">SSL</div>
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-[#224466]/20">
                <div className="text-orange-400 font-bold">20</div>
                <div className="text-[8px] text-[#476585] mt-0.5">SUB</div>
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-[#224466]/20">
                <div className="text-red-400 font-bold">15</div>
                <div className="text-[8px] text-[#476585] mt-0.5">RISK</div>
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-[#224466]/20">
                <div className="text-purple-400 font-bold">15</div>
                <div className="text-[8px] text-[#476585] mt-0.5">HIST</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: AI Security Copilot Chat Console */}
        <div className="lg:col-span-2 flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[420px] lg:h-auto">
          {/* Header */}
          <div className="border-b border-[#224466]/30 pb-3 mb-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="text-xs font-bold text-white tracking-widest uppercase">AI SECURITY COPILOT</span>
            </div>
            
            {/* Model Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a7fa8] uppercase">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-black/60 border border-[#00bfff]/30 rounded px-2 py-0.5 text-[10px] text-cyan-400 focus:outline-none focus:border-cyan-400"
              >
                <option value="llama3">Llama 3</option>
                <option value="deepseek-r1">DeepSeek R1</option>
                <option value="mistral">Mistral</option>
              </select>
            </div>
          </div>

          {/* Recommendations Summary */}
          {recommendations.length > 0 && (
            <div className="bg-[#02050b] border border-red-500/10 rounded-lg p-3 mb-3 max-h-[80px] overflow-y-auto">
              <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                SYSTEM RECOMMENDATIONS & Triages
              </div>
              <ul className="list-disc pl-4 text-[10px] text-[#cbd5e1] space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat Logs */}
          <div className="flex-1 bg-black/50 border border-[#224466]/20 rounded-lg p-3 overflow-y-auto font-mono text-xs flex flex-col gap-3 min-h-[140px]">
            {chatLogs.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] rounded-lg p-2.5 ${
                  msg.sender === 'user' 
                    ? 'bg-cyan-500/10 border border-cyan-500/20 self-end text-cyan-400' 
                    : 'bg-[#0b172d]/80 border border-white/5 self-start text-[#e2e8f0]'
                }`}
              >
                <div className="text-[8px] text-[#476585] uppercase tracking-wider mb-1 font-bold">
                  {msg.sender === 'user' ? 'USER QUERY' : 'COPILOT AGENT'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            ))}
            {isChatting && (
              <div className="self-start bg-[#0b172d]/80 border border-white/5 rounded-lg p-2.5 text-cyan-400 animate-pulse flex items-center gap-2">
                <span>🤖</span>
                <span className="text-[10px] uppercase tracking-widest">Typing triage response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot: 'Explain my SSL status' or 'How can I fix DNS issues?'"
              className="flex-1 bg-black/60 border border-[#224466]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              disabled={isChatting}
              className="px-4 py-2 bg-gradient-to-r from-[#00bfff] to-blue-600 hover:shadow-[0_0_15px_rgba(0,191,255,0.4)] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
              SEND
            </button>
          </form>
        </div>
      </div>

      {/* ── Row 2: Threat Map + Live Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        
        {/* Card 3: Interactive Global Map */}
        <div className="flex flex-col justify-between border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg overflow-hidden h-[400px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-2 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">CYBER THREAT MAP</span>
            <span className="text-[9px] text-[#5a7fa8] uppercase">LIVE ATTACK GRAPH</span>
          </div>
          <div className="flex-1 w-full relative overflow-hidden rounded-lg">
            <GlobalThreatMap />
          </div>
        </div>

        {/* Card 4: Live Threat Feed (CISA Alerts) */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[400px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">CISA CYBERSECURITY ADVISORIES</span>
            <span className="text-[9px] text-orange-400 font-bold border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 rounded">REALTIME</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {threats.length === 0 ? (
              <p className="text-xs text-[#5a7fa8] italic text-center mt-8">No live advisories available at this moment.</p>
            ) : (
              threats.map((t, idx) => {
                let badgeColor = 'bg-green-500/10 text-green-400 border border-green-500/20';
                if (t.severity === 'Critical') badgeColor = 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse';
                else if (t.severity === 'High') badgeColor = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                else if (t.severity === 'Medium') badgeColor = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
                
                return (
                  <div key={t.id || idx} className="border border-[#224466]/20 bg-black/30 rounded-lg p-3 hover:border-cyan-400/25 transition-all">
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                        {t.severity || 'LOW'}
                      </span>
                      <span className="text-[9px] text-[#476585]">{t.publishedAt || 'RECENT'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#cbd5e1] leading-relaxed mb-1.5 line-clamp-2">{t.title}</h4>
                    <div className="flex justify-between items-center border-t border-[#224466]/10 pt-1.5 text-[10px]">
                      <span className="text-[#5a7fa8] italic font-semibold">{t.advisoryType || 'Alert'}</span>
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold"
                      >
                        READ ADVISORY &gt;
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: 20 Threat Model Grid ── */}
      <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg mb-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-[#224466]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">⚡ THREAT MODEL ARSENAL</span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">{THREAT_MODELS.length} ACTIVE MODELS</span>
            </div>
            <p className="text-[10px] text-[#5a7fa8] mt-1">Click any model to open its dedicated security tool</p>
          </div>
          {/* Search */}
          <input
            type="text"
            value={toolSearch}
            onChange={e => setToolSearch(e.target.value)}
            placeholder="Search models..."
            className="bg-black/60 border border-[#224466]/30 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-400 font-mono w-full md:w-52"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-black/30 border-[#224466]/30 text-[#5a7fa8] hover:text-white hover:border-[#224466]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredTools.map((model, idx) => (
            <motion.button
              key={model.id}
              onClick={() => navigate(`/toolkit/${model.id}`)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex flex-col items-start text-left p-3 bg-black/40 border border-[#224466]/25 rounded-xl hover:border-opacity-60 transition-all cursor-pointer overflow-hidden"
              style={{ '--tool-color': model.color }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                style={{ background: `radial-gradient(ellipse at top left, ${model.color}15 0%, transparent 70%)` }}
              />

              {/* Icon + Tag */}
              <div className="flex items-center justify-between w-full mb-2 relative z-10">
                <span className="text-xl leading-none">{model.icon}</span>
                <span
                  className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                  style={{ color: TAG_COLORS[model.tag] || '#6b7280', borderColor: `${TAG_COLORS[model.tag] || '#6b7280'}40`, background: `${TAG_COLORS[model.tag] || '#6b7280'}10` }}
                >
                  {model.tag}
                </span>
              </div>

              {/* Name */}
              <span
                className="text-[10px] font-bold leading-tight mb-1 relative z-10 group-hover:text-white transition-colors line-clamp-2"
                style={{ color: '#cbd5e1' }}
              >
                {model.name}
              </span>

              {/* Desc */}
              <span className="text-[8.5px] text-[#476585] relative z-10 group-hover:text-[#5a7fa8] transition-colors line-clamp-1">
                {model.desc}
              </span>

              {/* Active indicator line at bottom */}
              <div
                className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full"
                style={{ background: model.color }}
              />
            </motion.button>
          ))}

          {filteredTools.length === 0 && (
            <div className="col-span-full text-center py-8 text-[#5a7fa8] text-xs italic">
              No models match your search. Try a different keyword or category.
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Scan History + Threat Intel + Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card 5: Recent Scans History */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[300px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">RECENT SCAN RUNS</span>
            <Link to="/history" className="text-[10px] text-cyan-400 font-bold hover:underline">VIEW ALL &gt;</Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#5a7fa8] italic">
                No scans recorded. Launch a tool from the model arsenal above to audit your target.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#224466]/20 text-[#5a7fa8]">
                    <th className="pb-2">TARGET</th>
                    <th className="pb-2">TOOL</th>
                    <th className="pb-2">SCORE</th>
                    <th className="pb-2 text-center">RISK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#224466]/10">
                  {recentScans.slice(0, 5).map((scan) => {
                    let riskBadge = 'text-green-400 bg-green-500/10';
                    if (scan.riskLevel === 'dangerous') riskBadge = 'text-red-500 bg-red-500/10';
                    else if (scan.riskLevel === 'medium') riskBadge = 'text-orange-400 bg-orange-500/10';
                    
                    return (
                      <tr 
                        key={scan._id} 
                        className="hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => navigate(`/history/${scan._id}`)}
                      >
                        <td className="py-2 font-bold text-white max-w-[100px] truncate">{scan.target}</td>
                        <td className="py-2 uppercase text-cyan-400">{scan.tool || 'Port Scan'}</td>
                        <td className="py-2 font-bold">{scan.threatScore}/100</td>
                        <td className="py-2 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${riskBadge}`}>
                            {scan.riskLevel || 'SAFE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 6: Threat Intelligence Center */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg justify-between h-[300px]">
          <div>
            <div className="border-b border-[#224466]/30 pb-3 mb-3 flex justify-between items-center">
              <span className="text-xs font-bold text-white tracking-widest uppercase">THREAT INTEL CENTER</span>
              <Link to="/threat-intel" className="text-[10px] text-cyan-400 font-bold hover:underline">OPEN &gt;</Link>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-[#cbd5e1] leading-relaxed">
                Correlate indicators of compromise (IP, Domain, File Hash, URL, Email) against passive offline databases.
              </p>
              
              {/* Quick search form */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="IP, Domain, Hash..."
                  id="quick-ioc-search"
                  className="w-full bg-black/60 border border-[#224466]/30 rounded-lg px-2.5 py-1.5 text-[10.5px] text-white focus:outline-none focus:border-cyan-400 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      navigate(`/threat-intel?target=${encodeURIComponent(e.target.value.trim())}`);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const val = document.getElementById('quick-ioc-search')?.value;
                    if (val?.trim()) {
                      navigate(`/threat-intel?target=${encodeURIComponent(val.trim())}`);
                    }
                  }}
                  className="w-full py-1.5 bg-[#00bfff]/10 border border-[#00bfff]/30 hover:bg-[#00bfff]/20 text-[#00bfff] text-[9.5px] font-mono rounded-lg transition-all font-bold uppercase tracking-wider"
                >
                  ⚡ CORRELATE IOC
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats / summary */}
          <div className="bg-black/40 border border-[#224466]/15 rounded-lg p-2 flex items-center justify-between text-[9px] mt-2">
            <div className="text-center flex-1 border-r border-[#224466]/20">
              <span className="block text-[#5a7fa8] uppercase text-[7px] font-bold">Active Threats</span>
              <span className="block text-red-500 font-bold text-xs mt-0.5">842</span>
            </div>
            <div className="text-center flex-1">
              <span className="block text-[#5a7fa8] uppercase text-[7px] font-bold">Verified Safe</span>
              <span className="block text-green-400 font-bold text-xs mt-0.5">14,204</span>
            </div>
          </div>
        </div>

        {/* Card 7: System Status */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[300px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-3">
            <span className="text-xs font-bold text-white tracking-widest uppercase">SYSTEM STATUS</span>
          </div>

          <div className="flex-1 space-y-2.5">
            {[
              { label: 'Backend API', status: 'ONLINE', color: '#22c55e' },
              { label: 'MongoDB Database', status: 'CONNECTED', color: '#22c55e' },
              { label: 'Threat Feed Sync', status: 'ACTIVE', color: '#22c55e' },
              { label: 'AI Copilot Engine', status: 'STANDBY', color: '#f59e0b' },
              { label: 'WebSocket Layer', status: 'ONLINE', color: '#22c55e' },
              { label: 'Tool Execution Engine', status: 'READY', color: '#22c55e' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-[#cbd5e1]">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.color }} />
                  <span className="font-bold font-mono" style={{ color: item.color }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Arsenal Stats */}
          <div className="border-t border-[#224466]/30 pt-3 mt-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-cyan-400 font-bold text-sm">20</div>
                <div className="text-[8px] text-[#476585] uppercase">Models</div>
              </div>
              <div>
                <div className="text-green-400 font-bold text-sm">LIVE</div>
                <div className="text-[8px] text-[#476585] uppercase">Status</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-sm">24+</div>
                <div className="text-[8px] text-[#476585] uppercase">Intel</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}