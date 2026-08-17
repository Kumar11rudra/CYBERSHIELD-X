/**
 * 🛠️ ToolkitPage — CyberShield X
 * Tools Hub interface implementing:
 * - 4-Column Reference UI Card Grid with hashtags and Category Badges
 * - Option 1: In-Modal Cyber Terminal Launchers
 * - Option 6: AI-Powered Copilot Mode
 * - Option 8: Automated Chained Multi-Vector Playbooks
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Search, Sparkles, Layers, Terminal, Shield, Activity } from 'lucide-react';
import { getAllTools, CATEGORY_METADATA } from '../components/toolkit/toolConfig';
import ToolkitModelCard from '../components/toolkit/ToolkitModelCard';
import ToolkitStats from '../components/toolkit/ToolkitStats';
import CyberTerminalModal from '../components/terminal/CyberTerminalModal';

// Reference UI Category Pills List
const CATEGORY_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'network', label: 'Network', match: ['DNS & Network Intelligence', 'Network'] },
  { id: 'web', label: 'Web', match: ['Web Security', 'Web'] },
  { id: 'password', label: 'Password', match: ['Authentication & Identity Security', 'Identity Security'] },
  { id: 'forensics', label: 'Forensics', match: ['Digital Forensics', 'Malware Analysis', 'Forensics'] },
  { id: 'recon', label: 'Recon', match: ['Reconnaissance', 'OSINT', 'Recon'] },
  { id: 'ids', label: 'IDS', match: ['Security Monitoring', 'Incident Response', 'IDS'] },
  { id: 'intel', label: 'Threat Intel', match: ['Threat Intelligence', 'Intel'] },
  { id: 'ai', label: 'AI Security', match: ['AI / LLM Security', 'AI'] },
  { id: 'cloud', label: 'Cloud & DevOps', match: ['Cloud Security', 'DevSecOps / Supply Chain Security', 'Container & Kubernetes Security'] },
  { id: 'utilities', label: 'Utilities', match: ['Utilities / Encoding / Cryptography', 'Privacy & Data Security'] }
];

export default function ToolkitPage() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activePill, setActivePill] = useState('all');

  // Terminal Modal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalTool, setTerminalTool] = useState(null);
  const [terminalTarget, setTerminalTarget] = useState('');

  // Extract ?category= query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      const matchedPill = CATEGORY_PILLS.find(p => p.match && p.match.includes(cat));
      if (matchedPill) {
        setActivePill(matchedPill.id);
      } else {
        setActivePill('all');
      }
    }
  }, [location.search]);

  // Filter tools based on active pill and search query
  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();

    return getAllTools().filter(tool => {
      const nameMatch = (tool.name || '').toLowerCase().includes(q);
      const taglineMatch = (tool.tagline || '').toLowerCase().includes(q);
      const descMatch = (tool.description || '').toLowerCase().includes(q);
      const catMatch = (tool.category || '').toLowerCase().includes(q);
      const tagMatch = (tool.tags || []).some(t => t.toLowerCase().includes(q));

      const matchesSearch = !q || nameMatch || taglineMatch || descMatch || catMatch || tagMatch;

      let matchesPill = true;
      if (activePill !== 'all') {
        const pillConfig = CATEGORY_PILLS.find(p => p.id === activePill);
        if (pillConfig && pillConfig.match) {
          matchesPill = pillConfig.match.some(m => (tool.category || '').toLowerCase().includes(m.toLowerCase()));
        }
      }

      return matchesSearch && matchesPill;
    });
  }, [search, activePill]);

  // Handler to launch terminal for a specific tool
  const handleLaunchTerminal = (tool) => {
    setTerminalTool(tool);
    setTerminalTarget(tool.defaultTarget || 'scanme.nmap.org');
    setIsTerminalOpen(true);
  };

  // Handler for full chained playbook
  const handleLaunchPlaybook = () => {
    setTerminalTool(null);
    setTerminalTarget('scanme.nmap.org');
    setIsTerminalOpen(true);
  };

  return (
    <div className="min-h-screen pt-4 pb-20 px-4 sm:px-6 relative">
      {/* Ambient background glow */}
      <div className="bloom-bg top-[-10%] left-[-10%] bg-cyber-accent/5 pointer-events-none" />
      <div className="bloom-bg bottom-[-10%] right-[-10%] bg-[#00ff88]/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[10px] font-mono text-cyber-accent tracking-[0.25em] uppercase font-bold">
                CyberSOC Diagnostic Grid
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider">
              Tools Hub & Security Models
            </h1>
            <p className="text-xs font-mono text-cyber-muted mt-1">
              Deploy passive diagnostic engines, real-time threat telemetry, and automated multi-vector audit terminals.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleLaunchPlaybook}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88]/20 to-[#00bfff]/20 border border-[#00ff88]/50 text-[#00ff88] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#00ff88] hover:text-[#020814] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] transition-all"
            >
              <Layers size={14} />
              <span>⚡ RUN FULL PLAYBOOK</span>
            </button>

            <button
              onClick={() => {
                setTerminalTool({ id: 'copilot', name: 'AI Copilot' });
                setTerminalTarget('scan open ports on example.com');
                setIsTerminalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-cyber-accent hover:text-cyber-accent hover:bg-cyber-accent/5 transition-all"
            >
              <Sparkles size={14} className="text-cyber-accent" />
              <span>🤖 AI Copilot CLI</span>
            </button>
          </div>
        </div>

        {/* Dynamic Catalog Statistics */}
        <ToolkitStats />

        {/* Search Bar & Category Filter Pills */}
        <div className="my-6 space-y-4">
          {/* Universal Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools, categories, tags (e.g. nmap, #port-scan, ssl, whois, #osint)..."
              className="w-full bg-[#050b18] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-mono text-white placeholder-white/25 focus:outline-none focus:border-cyber-accent focus:shadow-[0_0_20px_rgba(0,191,255,0.15)] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-cyber-muted hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Reference UI Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activePill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActivePill(pill.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyber-accent text-[#020814] font-bold shadow-[0_0_15px_rgba(0,191,255,0.4)]'
                      : 'bg-[#060e20] text-cyber-muted border border-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Hub Grid (4 Columns Layout) */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredTools.map(tool => (
              <ToolkitModelCard 
                key={tool.id} 
                tool={tool} 
                onLaunchTerminal={handleLaunchTerminal} 
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#050b18]/60 border border-white/5 rounded-3xl mt-6">
            <span className="text-4xl mb-4 opacity-40">🛸</span>
            <p className="font-mono text-sm text-white font-bold mb-1">
              No matching security tools found
            </p>
            <p className="font-mono text-xs text-cyber-muted">
              Try adjusting your search query or select "All" from the category filter pills.
            </p>
            <button
              onClick={() => { setSearch(''); setActivePill('all'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-cyber-accent font-mono text-xs hover:bg-cyber-accent/10"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Cyber Terminal Modal Overlay (Option 1 + 6 + 8 Engine) */}
      <CyberTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        initialTool={terminalTool}
        initialTarget={terminalTarget}
      />
    </div>
  );
}
