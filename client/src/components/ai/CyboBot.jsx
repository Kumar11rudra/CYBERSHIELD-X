import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useVoice from '../../hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// ─── GROQ DIRECT CONFIG (Browser → Groq, no server needed) ───────────────
// Set REACT_APP_GROQ_API_KEY in your .env file — never hardcode secrets here.
const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT = `You are CyboBot Ultra, the elite AI cybersecurity sidekick for CyberShield X.
Persona: High-tech security specialist + friendly "Dost" (friend).

Core Intelligence Modules you support:
1. Nexus Port Sentinel (Nmap): Network reconnaissance & port scanning.
2. Web Config Auditor (Nikto): Web server security & config auditing.
3. Injection Defense Lab (SQLMap): SQL injection & database takeover engine.
4. Aegis Password Hardener (John the Ripper): Password auditing & hash cracking.
5. Ghost Forensics Lab (Autopsy): Digital forensics & incident response.
6. Nexus Enterprise SOC (Splunk): SIEM & real-time security events.
7. Nexus Cloud Guard (Wiz): Cloud-native workload protection.
8. Global Threat Engine (VirusTotal): Unified intelligence from 70+ vendors.
9. Dark Web Monitor (HIBP): Monitoring data breaches & leaks.
10. Quantum Vault (AES-256): Secure encrypted storage for assets.
11. AI Pentest Automator (GPT-4o): Agentic AI driven penetration testing.
12. Mobile Sentinel Hub (MobSF): Automated mobile app security analysis.

Style: Cyberpunk, sharp, use emojis like 🛡️ 🤖 ⚡ 🔍. Keep answers concise with bullet points for complex topics.
Language: Always reply in the SAME language the user writes in.

Action Rules:
- To redirect user to scan page, append exactly: [ACTION: {"type":"NAVIGATE","payload":"/scan"}]
- To scan a specific URL append: [ACTION: {"type":"NAVIGATE_SCAN","payload":"URL"}]
- To go to breach checker: [ACTION: {"type":"NAVIGATE","payload":"/breach-checker"}]
- To go to any module, use [ACTION: {"type":"NAVIGATE","payload":"/toolkit/module_id"}] where module_id is one of: nmap, nikto, sqlmap, john, autopsy, splunk, wiz, virustotal, zerothreat, mobsf.
- For Vault use /vault, for Breach use /breach-checker.`;

const callGroq = async (message, history, userName, path, isLoggedIn) => {
  const systemMsg = `${SYSTEM_PROMPT}\n\nUser: ${userName || 'Explorer'} | Page: ${path} | LoggedIn: ${isLoggedIn}`;
  const msgs = [{ role: 'system', content: systemMsg }];
  // Add last 8 history messages
  for (const h of (history || []).slice(-8)) {
    if (h && h.text) msgs.push({ role: h.isBot ? 'assistant' : 'user', content: h.text });
  }
  msgs.push({ role: 'user', content: message });

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: msgs, max_tokens: 600, temperature: 0.7 })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '🤖 No response.';
};


const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Hindi (हिन्दी)', code: 'hi-IN' },
  { label: 'Marathi (मराठी)', code: 'mr-IN' },
  { label: 'Bengali (বাংলা)', code: 'bn-IN' },
  { label: 'Telugu (తెలుగు)', code: 'te-IN' },
  { label: 'Tamil (தமிழ்)', code: 'ta-IN' },
  { label: 'Gujarati (ગુજરાતી)', code: 'gu-IN' },
  { label: 'Punjabi (ਪੰਜਾਬੀ)', code: 'pa-IN' }
];

export default function CyboBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chips, setChips] = useState([]);
  const [lastIntent, setLastIntent] = useState(null);
  const [activeMode, setActiveMode] = useState('basic'); // 'basic' or 'ultra'
  
  // Voice & Language State
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(localStorage.getItem('cybo_lang') || (globalLang === 'hi' ? 'hi-IN' : 'en-US'));
  const [prefVoice, setPrefVoice] = useState(localStorage.getItem('cybo_voice') || '');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(localStorage.getItem('cybo_voice_on') === 'true');
  const [availableVoices, setAvailableVoices] = useState([]);

  const { isListening, transcript, startListening, stopListening, speak } = useVoice(lang);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updateSettings } = useTheme();
  
  const chatEndRef = useRef(null);
  const idleTimer = useRef(null);

  // Sync speech transcript to input
  useEffect(() => {
    if (transcript) handleSend(null, transcript);
  }, [transcript]);

  // Load voices
  useEffect(() => {
    const loader = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (!prefVoice && voices.length > 0) {
        // Find a female voice as default
        const female = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google hindi'));
        if (female) setPrefVoice(female.name);
      }
    };
    window.speechSynthesis.onvoiceschanged = loader;
    loader();
  }, []);

  // Initialize bot with language selection or greeting
  useEffect(() => {
    const hasMet = localStorage.getItem('cybo_met');
    const hasSelectedLang = localStorage.getItem('cybo_lang');

    if (!hasMet) {
      const name = user?.preferredNickname || user?.username || "Explorer";
      setMessages([
        { 
          text: `Hi there! I am your **Cyber Sidekick**. I see your name is **${name}**. Should I call you by this name, or do you prefer **'Friend'**?`, 
          isBot: true 
        }
      ]);
      setChips([
        { label: `Call me ${name}`, value: `Call me ${name}` },
        { label: 'Call me Friend', value: 'Call me Friend' }
      ]);
      localStorage.setItem('cybo_met', 'true');
    } else if (!hasSelectedLang && messages.length === 0) {
      setMessages([
        { text: "Welcome! Please choose your preferred language to continue.", isBot: true }
      ]);
      setChips(LANGUAGES.map(l => ({ label: l.label, value: `set_lang_${l.code}` })));
    } else if (messages.length === 0) {
      const savedName = localStorage.getItem('cybo_nickname');
      const name = user?.preferredNickname || savedName || user?.username || "Friend";
      setMessages([{ text: `Welcome back, ${name}! What would you like to scan or investigate today?`, isBot: true }]);
    }
  }, [user]);

  // Idle detection
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      return;
    }
    const resetTimer = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (!isOpen) setShowBubble(true);
      }, 20000); 
    };
    window.addEventListener('mousemove', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      clearTimeout(idleTimer.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleAction = (action) => {
    if (!action) return;
    if (action.type === 'SET_THEME') {
      updateSettings('theme', action.payload);
    } else if (action.type === 'NAVIGATE') {
      navigate(action.payload);
    } else if (action.type === 'NAVIGATE_SCAN') {
      navigate('/scan', { state: { autoCheck: action.payload } });
    } else if (action.type === 'SAVE_GUEST_NICKNAME') {
      localStorage.setItem('cybo_nickname', action.payload);
    }
  };

  const handleSend = async (e, overrideText) => {
    if (e) e.preventDefault();
    const userText = overrideText || input;
    if (!userText.trim()) return;

    // Handle initial language selection
    if (userText.startsWith('set_lang_')) {
      const code = userText.split('_').pop();
      setLang(code);
      localStorage.setItem('cybo_lang', code);
      
      // Also sync with global app language
      const appLang = code.split('-')[0]; // 'hi-IN' -> 'hi'
      i18n.changeLanguage(appLang);
      setGlobalLang(appLang);

      setMessages(prev => [...prev, { text: `Language set to ${LANGUAGES.find(l => l.code === code)?.label}`, isBot: true }]);
      setChips([]);
      return;
    }

    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setChips([]);
    setLoading(true);

    try {
      const userName = user?.preferredNickname || user?.username || 'Explorer';
      let rawText = await callGroq(userText, messages, userName, location.pathname, !!user);

      // Parse [ACTION: {...}]
      let action = null;
      const actionMatch = rawText.match(/\[ACTION:\s*({.*?})\]/s);
      if (actionMatch) {
        try { action = JSON.parse(actionMatch[1]); } catch (_) {}
        rawText = rawText.replace(actionMatch[0], '').trim();
      }

      // Dynamic chips
      const newChips = [];
      if (rawText.toLowerCase().includes('scan')) newChips.push({ label: '🔍 Open Scanner', value: 'scan karo' });
      if (rawText.toLowerCase().includes('breach') || rawText.toLowerCase().includes('leak')) newChips.push({ label: '🛡️ Check Breaches', value: 'breach check karo' });

      setMessages(prev => [...prev, { text: rawText, isBot: true }]);
      setActiveMode('ultra');
      if (newChips.length > 0) setChips(newChips);
      if (isVoiceEnabled) speak(rawText.replace(/\*\*/g, '').replace(/__/g, ''), prefVoice);
      if (action) setTimeout(() => handleAction(action), 600);

    } catch (err) {
      console.error('[CYBOBOT ERROR]', err.message);
      setMessages(prev => [...prev, { text: `⚡ Error: ${err.message}. Please check console & retry.`, isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    if (!text) return null;

    // Use a safer way to render bold and italic without dangerouslySetInnerHTML
    // Split by lines first
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <div key={i} className="h-2" />;

      // Simple parser for **bold** and __italic__
      const parts = line.split(/(\*\*.*?\*\*|__.*?__)/g);
      
      return (
        <div key={i} className="mb-1">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-cyber-accent">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('__') && part.endsWith('__')) {
              return <em key={j} className="text-cyber-muted">{part.slice(2, -2)}</em>;
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const toggleSettings = () => setShowSettings(!showSettings);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Proactive Bubble */}
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsOpen(true)}
              className="absolute bottom-16 right-0 w-48 p-3 bg-cyber-accent text-cyber-bg rounded-2xl shadow-xl cursor-pointer font-mono text-[10px] font-bold"
            >
              💬 Ask CyboBot anything...
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 w-80 sm:w-[420px] h-[550px] bg-cyber-card border border-cyber-accent/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
            >
              {/* Header */}
              <div className="bg-cyber-surface/80 border-b border-cyber-border/40 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BrandLogo size={32} />
                  <div>
                    <h3 className="font-display text-sm font-bold text-cyber-accent flex items-center gap-2">
                       CYBOBOT 
                       {activeMode === 'ultra' && (
                         <span className="bg-cyber-accent text-cyber-bg text-[8px] px-1.5 py-0.5 rounded animate-pulse">ULTRA</span>
                       )}
                    </h3>
                    <p className="text-[9px] text-cyber-muted font-mono uppercase tracking-tighter">
                      {activeMode === 'ultra' ? 'Quantum-Neural Processor Active' : 'Basic Lexical Engine'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={toggleSettings} className={`p-2 rounded hover:bg-white/10 transition-colors ${showSettings ? 'text-cyber-accent' : 'text-cyber-muted'}`}>
                     ⚙️
                   </button>
                   <button onClick={() => setIsOpen(false)} className="text-cyber-muted hover:text-cyber-red p-2">
                    ✕
                   </button>
                </div>
              </div>

              {/* Settings View */}
              {showSettings ? (
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-black/40">
                   <div className="space-y-4">
                      <p className="font-mono text-xs text-cyber-accent uppercase font-bold">Bot Settings</p>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-cyber-muted uppercase font-mono">Preferred Language</label>
                        <select 
                          value={lang} 
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setLang(newLang);
                            localStorage.setItem('cybo_lang', newLang);
                            
                            // Sync global app language
                            const appLang = newLang.split('-')[0];
                            i18n.changeLanguage(appLang);
                            setGlobalLang(appLang);
                          }}
                          className="w-full bg-cyber-bg border border-cyber-border p-2 rounded text-xs text-cyber-text"
                        >
                          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-cyber-muted uppercase font-mono">Voice Over</label>
                        <select 
                          value={prefVoice} 
                          onChange={(e) => {
                            setPrefVoice(e.target.value);
                            localStorage.setItem('cybo_voice', e.target.value);
                          }}
                          className="w-full bg-cyber-bg border border-cyber-border p-2 rounded text-xs text-cyber-text"
                        >
                          {availableVoices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-cyber-border rounded-lg bg-white/5">
                        <span className="font-mono text-xs text-cyber-text">Voice Response Mode</span>
                        <button 
                          onClick={() => {
                            setIsVoiceEnabled(!isVoiceEnabled);
                            localStorage.setItem('cybo_voice_on', !isVoiceEnabled);
                          }}
                          className={`w-10 h-5 rounded-full transition-colors relative ${isVoiceEnabled ? 'bg-cyber-accent' : 'bg-cyber-muted/30'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isVoiceEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                   </div>
                   <button onClick={toggleSettings} className="w-full cyber-button-primary py-2 text-xs font-bold uppercase mt-4">Save & Close</button>
                </div>
              ) : (
                <>
                  {/* Chat Area */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide relative ${activeMode === 'ultra' ? 'bg-cyber-accent/[0.02]' : ''}`}>
                    {activeMode === 'ultra' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-accent to-transparent animate-scan-slow" />
                      </div>
                    )}
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 font-mono text-xs leading-relaxed shadow-lg ${
                          msg.isBot 
                            ? 'bg-cyber-bg/60 border border-cyber-border/40 text-cyber-text rounded-tl-none' 
                            : 'bg-cyber-accent border border-cyber-accent/30 text-cyber-bg font-bold rounded-tr-none'
                        }`}>
                          {renderText(msg.text)}
                        </div>
                      </div>
                    ))}
                    
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-start pl-2">
                        {chips.map((chip, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(null, chip.value)}
                            className="bg-cyber-surface border border-cyber-accent/30 text-cyber-accent px-3 py-1.5 rounded-full font-mono text-[10px] hover:bg-cyber-accent hover:text-cyber-bg transition-all"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {loading && <div className="text-[10px] text-cyber-muted italic animate-pulse">Neural engine thinking...</div>}
                    {isListening && <div className="text-[10px] text-cyber-accent font-bold animate-pulse">Listening to voice input... 🎙️</div>}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 bg-cyber-surface/40 border-t border-cyber-border/40">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={isListening ? 'Listening...' : 'Ask me anything, Dost...'}
                          className="w-full bg-cyber-bg/60 border border-cyber-border/50 text-cyber-text font-mono text-xs p-3 rounded-xl focus:border-cyber-accent pr-10"
                        />
                        <button
                          type="button"
                          onClick={isListening ? stopListening : startListening}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-cyber-red text-white animate-pulse' : 'text-cyber-muted hover:text-cyber-accent'}`}
                        >
                          🎙️
                        </button>
                      </div>
                      <button type="submit" className="bg-cyber-accent text-cyber-bg w-12 h-10 rounded-xl font-bold hover:scale-105 transition-all">
                        →
                      </button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-20 h-20 rounded-full bg-cyber-bg border-2 border-cyber-accent/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,191,255,0.4)] relative hover:scale-105 transition-transform duration-300"
          style={{
            animation: !isOpen ? 'botFloat 3s ease-in-out infinite' : 'none'
          }}
        >
          <style>{`
            @keyframes botFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); box-shadow: 0 0 25px rgba(0,191,255,0.4); }
              50% { transform: translateY(-10px) rotate(3deg); box-shadow: 0 0 40px rgba(0,255,204,0.6); border-color: #00ffcc; }
            }
          `}</style>
          {isOpen ? (
            <span className="text-3xl text-cyber-accent">✕</span>
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 bg-cyber-accent/20 rounded-full blur-2xl group-hover:bg-cyber-accent/40 transition-all duration-500" />
              <img 
                src="/bot-avatar.png" 
                alt="CyboBot" 
                className="w-18 h-18 object-contain relative z-10 rounded-full"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(0,255,204,0.7)) brightness(1.1) contrast(1.2)',
                  imageRendering: 'crisp-edges'
                }}
              />
            </div>
          )}
          {!isOpen && <div className="absolute top-0 right-0 w-5 h-5 bg-cyber-green rounded-full border-2 border-cyber-bg animate-pulse shadow-[0_0_15px_#00ff88]" />}
        </button>
      </div>
    </>
  );
}
