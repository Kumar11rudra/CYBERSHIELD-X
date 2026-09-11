import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Terminal, Shield, Zap, Lock, Activity, 
  ArrowRight, X, Sparkles, Cpu, Layers, CornerDownLeft, AlertTriangle
} from 'lucide-react';
import { getAllTools } from '../toolkit/toolConfig';

const NATIVE_TOOL_IDS = new Set(['dns', 'whois', 'port', 'http', 'ssl', 'traceroute']);
const BROWSER_TOOL_IDS = new Set(['jwt-parser', 'base64-decoder', 'url-sanitizer', 'hash-generator', 'hex-editor']);
const BLOCKED_TOOL_IDS = new Set(['sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara-rules', 'radare2', 'semgrep', 'gitleaks']);

export default function CommandPaletteModal({ isOpen, onClose, onOpenTerminalWithTool }) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const allTools = useMemo(() => getAllTools(), []);

  // System navigation shortcuts
  const systemActions = useMemo(() => [
    { 
      id: 'act-term-syscheck', 
      title: 'Host Syscheck & Environment Diagnostic', 
      category: 'System Diagnostics', 
      targetBadge: 'HOST_NATIVE',
      icon: Activity, 
      action: () => onOpenTerminalWithTool?.({ id: 'syscheck', name: 'Host Syscheck' }, 'localhost') 
    },
    { 
      id: 'act-term-nmap', 
      title: 'Nmap Port Scan (Host Native)', 
      category: 'Network Recon', 
      targetBadge: 'HOST_NATIVE',
      icon: Terminal, 
      action: () => onOpenTerminalWithTool?.({ id: 'port', name: 'Nmap Port Scanner' }, 'scanme.nmap.org') 
    },
    { 
      id: 'act-term-dig', 
      title: 'DNS Dig Reconnaissance (Host Native)', 
      category: 'DNS & Network', 
      targetBadge: 'HOST_NATIVE',
      icon: Terminal, 
      action: () => onOpenTerminalWithTool?.({ id: 'dns', name: 'DNS Recon' }, 'example.com') 
    },
    { 
      id: 'act-term-perimeter', 
      title: 'Launch 5-Vector Perimeter Playbook', 
      category: 'SOC Playbook', 
      targetBadge: 'PLAYBOOK',
      icon: Zap, 
      action: () => onOpenTerminalWithTool?.(null, 'example.com') 
    },
    { 
      id: 'act-nav-dashboard', 
      title: 'Navigate to CyberSOC Dashboard', 
      category: 'Navigation', 
      targetBadge: 'DESKTOP',
      icon: Shield, 
      action: () => navigate('/dashboard') 
    },
    { 
      id: 'act-nav-toolkit', 
      title: `Browse Tools Hub (${allTools.length} Tools)`, 
      category: 'Navigation', 
      targetBadge: 'TOOLKIT',
      icon: Cpu, 
      action: () => navigate('/toolkit') 
    },
    { 
      id: 'act-nav-breach', 
      title: 'Dark Web Breach & Compromise Explorer', 
      category: 'Intelligence', 
      targetBadge: 'API_ENGINE',
      icon: Lock, 
      action: () => navigate('/breach-checker') 
    },
    { 
      id: 'act-nav-vault', 
      title: 'Quantum Vault Cryptographic Storage', 
      category: 'Security', 
      targetBadge: 'VAULT',
      icon: Lock, 
      action: () => navigate('/vault') 
    },
  ], [allTools, onOpenTerminalWithTool, navigate]);

  // Helper to determine tool target
  const getToolTarget = (toolId) => {
    if (NATIVE_TOOL_IDS.has(toolId)) return 'HOST_NATIVE';
    if (BROWSER_TOOL_IDS.has(toolId)) return 'CLIENT_BROWSER';
    if (BLOCKED_TOOL_IDS.has(toolId)) return 'BLOCKED_DEPENDENCY';
    return 'CYBERSHIELD_API_ENGINE';
  };

  // Filter items based on user query
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return [
        ...systemActions,
        ...allTools.slice(0, 14).map(t => {
          const targetBadge = getToolTarget(t.id);
          const isBlocked = targetBadge === 'BLOCKED_DEPENDENCY';
          return {
            id: t.id,
            title: t.name,
            category: t.category,
            tagline: isBlocked ? 'Dependency missing on host • Remediation available' : (t.tagline || t.description),
            targetBadge,
            isBlocked,
            icon: Cpu,
            action: () => onOpenTerminalWithTool?.(t, t.defaultTarget || 'example.com')
          };
        })
      ];
    }

    const matchedActions = systemActions.filter(a => 
      a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );

    const matchedTools = allTools.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.tagline && t.tagline.toLowerCase().includes(q))
    ).map(t => {
      const targetBadge = getToolTarget(t.id);
      const isBlocked = targetBadge === 'BLOCKED_DEPENDENCY';
      return {
        id: t.id,
        title: t.name,
        category: t.category,
        tagline: isBlocked ? 'Dependency missing on host • Remediation available' : (t.tagline || t.description),
        targetBadge,
        isBlocked,
        icon: Cpu,
        action: () => onOpenTerminalWithTool?.(t, t.defaultTarget || 'example.com')
      };
    });

    return [...matchedActions, ...matchedTools].slice(0, 25);
  }, [search, systemActions, allTools, onOpenTerminalWithTool]);

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#020714]/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.25)] overflow-hidden flex flex-col font-mono text-xs"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-cyan-500/20 bg-[#030919]">
            <Search size={16} className="text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${allTools.length} security tools, CLI commands, or actions (e.g. nmap, syscheck, ssl)...`}
              className="w-full bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 select-none">
              ESC
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No tools or commands found matching "{search}".</p>
                <p className="text-[10px] text-slate-600 mt-1">Try searching by category, tool name, or command alias.</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const ItemIcon = item.icon || Cpu;
                const isBlocked = item.isBlocked;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? isBlocked
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                          : 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                        : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${
                        isSelected 
                          ? isBlocked ? 'bg-amber-500 text-slate-950' : 'bg-cyan-400 text-slate-950' 
                          : 'bg-white/5 text-cyan-400'
                      }`}>
                        <ItemIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white tracking-wide truncate">{item.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400">
                            {item.category}
                          </span>
                          {item.targetBadge && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                              item.targetBadge === 'HOST_NATIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              item.targetBadge === 'CLIENT_BROWSER' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                              item.targetBadge === 'BLOCKED_DEPENDENCY' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                              'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
                            }`}>
                              [{item.targetBadge}]
                            </span>
                          )}
                        </div>
                        {item.tagline && (
                          <p className={`text-[10px] truncate mt-0.5 ${isBlocked ? 'text-amber-300/80 font-semibold' : 'text-slate-400'}`}>
                            {isBlocked && <AlertTriangle size={10} className="inline mr-1 text-amber-400" />}
                            {item.tagline}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {isSelected && (
                        <span className={`text-[9px] flex items-center gap-0.5 font-bold ${isBlocked ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {isBlocked ? 'Inspect' : 'Run'} <CornerDownLeft size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="bg-[#01040a] px-4 py-2 border-t border-cyan-500/15 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↵</kbd> Select</span>
            </div>
            <span className="text-cyan-400 font-bold">{allTools.length} Canonical Tools Indexed</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
