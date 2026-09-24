import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Shield, Cpu, Play } from 'lucide-react';
import { getToolConfig } from './toolConfig';

/**
 * 🛰️ ComingSoonView — CyberShield X
 * Defensive execution fallback when a tool dossier indicates terminal launcher mode.
 * Centralized on /terminal workstation (Step 4C).
 */
export default function ComingSoonView({ toolId }) {
  const navigate = useNavigate();
  const tool = getToolConfig(toolId);
  const [target, setTarget] = useState('');

  if (!tool) return null;

  const defaultPlaceholder =
    tool.inputType === 'domain'
      ? 'example.com'
      : tool.inputType === 'ip'
      ? '8.8.8.8'
      : 'scanme.nmap.org';

  const handleLaunch = (e) => {
    e.preventDefault();
    const targetParam = target.trim() || defaultPlaceholder;
    navigate(`/terminal?tool=${encodeURIComponent(tool.id)}&target=${encodeURIComponent(targetParam)}`);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Terminal Ready Banner */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>DIAGNOSTIC ENGINE :: TERMINAL READY</span>
        </span>
      </div>

      {/* Terminal Launcher Card */}
      <div className="p-6 rounded-2xl bg-[#0c162d]/90 border border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Execute {tool.name} in CyberSOC Terminal
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Live interactive CLI probe with real-time stream telemetry and host-native execution.
          </p>
        </div>

        <form onSubmit={handleLaunch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center bg-[#071126] border border-slate-700 rounded-xl px-4 py-3 focus-within:border-cyan-500">
            <span className="text-cyan-400 text-xs font-bold mr-2 select-none">
              nexus@cybershield:~$
            </span>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`Enter target for ${tool.name} (e.g. ${defaultPlaceholder})...`}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              aria-label="Terminal Target"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#020814] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all font-mono"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>&gt;_ Launch Terminal</span>
          </button>
        </form>
      </div>

      {/* Module Overview */}
      <div className="p-6 rounded-2xl bg-[#0c162d]/80 border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Module Overview: {tool.name}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {tool.description ||
            `${tool.name} operates as part of the CyberShield X Active Security Grid across the ${tool.category} domain.`}
        </p>
      </div>
    </div>
  );
}
