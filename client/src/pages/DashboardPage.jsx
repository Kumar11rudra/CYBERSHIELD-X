import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import SecurityFortressGauge from '../components/dashboard/SecurityFortressGauge';
import GlobalThreatMap from '../components/dashboard/GlobalThreatMap';
import { toast } from 'react-hot-toast';

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
        toast.error('Failed to retrieve security feeds');
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
      // Fallback response in case backend LLM is down
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

  return (
    <div className="min-h-screen p-4 md:p-8 font-mono text-[#e0e6ff] bg-[#020814]/90 relative z-10">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border border-[#00bfff]/20 bg-[#070f21]/70 rounded-xl p-4 md:p-6 mb-6 gap-4 shadow-[0_0_20px_rgba(0,191,255,0.05)]">
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

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
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
        <div className="lg:col-span-2 flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[480px] lg:h-auto">
          {/* Header */}
          <div className="border-b border-[#224466]/30 pb-3 mb-4 flex justify-between items-center">
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
          <div className="bg-[#02050b] border border-red-500/10 rounded-lg p-3 mb-4 max-h-[110px] overflow-y-auto">
            <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              SYSTEM RECOMMENDATIONS & Triages
            </div>
            <ul className="list-disc pl-4 text-[10.5px] text-[#cbd5e1] space-y-1.5">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

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
          <form onSubmit={handleSendChat} className="mt-4 flex gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Card 3: Interactive Global Map */}
        <div className="flex flex-col justify-between border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg overflow-hidden h-[450px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-2 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">CYBER THREAT MAP</span>
            <span className="text-[9px] text-[#5a7fa8] uppercase">LIVE ATTACK GRAPH</span>
          </div>
          <div className="flex-1 w-full relative overflow-hidden rounded-lg">
            <GlobalThreatMap />
          </div>
        </div>

        {/* Card 4: Live Threat Feed (CISA Alerts) */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[450px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">CISA CYBERSECURITY ADVISORIES</span>
            <span className="text-[9px] text-orange-400 font-bold border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 rounded">REALTIME</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                        {t.severity || 'LOW'}
                      </span>
                      <span className="text-[9px] text-[#476585]">{t.publishedAt || 'RECENT'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#cbd5e1] leading-relaxed mb-2 line-clamp-2">{t.title}</h4>
                    <div className="flex justify-between items-center border-t border-[#224466]/10 pt-2 text-[10px]">
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

      {/* Row 3: History & Threat Intelligence & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 5: Recent Scans History */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg h-[320px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-white tracking-widest uppercase">RECENT SCAN RUNS</span>
            <Link to="/history" className="text-[10px] text-cyan-400 font-bold hover:underline">VIEW ALL &gt;</Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#5a7fa8] italic">
                No scans recorded. Launch a tool from the quick actions menu to audit your target.
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
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg justify-between h-[320px]">
          <div>
            <div className="border-b border-[#224466]/30 pb-3 mb-4 flex justify-between items-center">
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

        {/* Card 7: Quick Actions */}
        <div className="flex flex-col border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-4 shadow-lg justify-between h-[320px]">
          <div className="border-b border-[#224466]/30 pb-3 mb-4">
            <span className="text-xs font-bold text-white tracking-widest uppercase">QUICK ACTIONS CORES</span>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {[
              { label: 'DNS LOOKUP', icon: '🌐', path: '/toolkit/dig', color: '#0ea5e9' },
              { label: 'SSL CERT SCAN', icon: '🔒', path: '/toolkit/ssl', color: '#10b981' },
              { label: 'PORT SCANNER', icon: '📡', path: '/toolkit/nmap', color: '#6366f1' },
              { label: 'SUBDOMAIN SCAN', icon: '🔎', path: '/toolkit/subfinder', color: '#f59e0b' },
              { label: 'BREACH LOOKUP', icon: '🛑', path: '/breach-checker', color: '#ef4444' },
              { label: 'SAFE VAULT', icon: '🗄️', path: '/vault', color: '#8b5cf6' }
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => navigate(btn.path)}
                className="flex flex-col items-center justify-center p-2 bg-black/40 border border-[#224466]/20 rounded-lg hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] transition-all group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform duration-300 mb-0.5">{btn.icon}</span>
                <span className="text-[9px] font-bold text-[#cbd5e1] tracking-wider text-center">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}