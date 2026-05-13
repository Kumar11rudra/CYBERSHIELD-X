import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CyberTerminal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([
    { text: 'NEXUS OS v4.2.0-SENTINEL INITIALIZED...', type: 'system' },
    { text: 'TYPE "/help" FOR COMMAND LIST.', type: 'system' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addLine = (text, type = 'output') => {
    setHistory(prev => [...prev, { text, type }]);
  };

  const handleCommand = async (e) => {
    if (e.key !== 'Enter' || !input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const [action, ...args] = cmd.split(' ');
    addLine(`> ${input}`, 'command');
    setInput('');

    switch (action) {
      case '/help':
        addLine('AVAILABLE COMMANDS:', 'system');
        addLine('/scan [target] - Initiate Deep Scan');
        addLine('/vault         - Navigate to Quantum Vault');
        addLine('/lockdown      - Secure all active assets');
        addLine('/status        - Comprehensive system health');
        addLine('/clear         - Clear terminal history');
        addLine('/exit          - Close terminal');
        break;

      case '/clear':
        setHistory([]);
        break;

      case '/exit':
        onClose();
        break;

      case '/vault':
        addLine('NAVIGATING TO QUANTUM VAULT...', 'system');
        navigate('/vault');
        break;

      case '/scan':
        if (!args[0]) {
          addLine('ERROR: TARGET REQUIRED. USAGE: /scan [email/domain/ip]', 'error');
        } else {
          addLine(`INITIATING SCAN ON: ${args[0]}`, 'system');
          addLine('QUERYING GLOBAL SINKS...', 'output');
          addLine('CROSS-REFERENCING DARK WEB ARCHIVES...', 'output');
          addLine('REDIRECTING TO BREACH EXPLORER...', 'system');
          setTimeout(() => navigate('/breach-checker'), 1500);
        }
        break;

      case '/status':
        addLine('NEXUS CORE: ACTIVE', 'output');
        addLine('THREAT DATABASE: SYNCED (v2026.04.21)', 'output');
        addLine('ENCRYPTION: AES-256 GCM + PQC_ARMOR', 'output');
        addLine('ACTIVE DEFENSE: STANDBY', 'output');
        break;

      case '/lockdown':
        addLine('INITIATING GLOBAL IDENTITY LOCKDOWN...', 'error');
        addLine('ROTATING QUANTUM KEYS...', 'output');
        addLine('VAULT ASSETS RE-ENCRYPTED.', 'system');
        break;

      default:
        addLine(`UNKNOWN COMMAND: ${action}. TYPE "/help" FOR ASSISTANCE.`, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-6 w-[400px] h-[300px] z-[1000] flex flex-col font-mono text-[11px] overflow-hidden rounded-xl border border-cyber-accent/30 shadow-[0_0_50px_rgba(0,212,255,0.2)]"
    >
      {/* Header */}
      <div className="bg-cyber-accent/10 backdrop-blur-xl px-4 py-2 flex justify-between items-center border-b border-cyber-accent/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
          <span className="text-cyber-accent font-black tracking-widest uppercase">Nexus_Console</span>
        </div>
        <button onClick={onClose} className="text-cyber-muted hover:text-white transition-colors">✕</button>
      </div>

      {/* History */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-black/90 backdrop-blur-xl p-4 overflow-y-auto custom-scrollbar"
      >
        {history.map((line, i) => (
          <div key={i} className={`mb-1 ${
            line.type === 'system' ? 'text-cyber-accent font-bold' : 
            line.type === 'error' ? 'text-cyber-red' : 
            line.type === 'command' ? 'text-white/40' : 'text-white/80'
          }`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-black p-3 border-t border-white/5 flex gap-2 items-center">
        <span className="text-cyber-accent font-black">#</span>
        <input 
          autoFocus
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20"
          placeholder="Enter command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
        />
      </div>
    </motion.div>
  );
};

export default CyberTerminal;
