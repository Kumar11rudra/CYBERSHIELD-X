import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Terminal } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import NativeTerminalConsole from '../components/terminal/NativeTerminalConsole';

/**
 * 💻 Standalone Dedicated Clean Terminal Page (FIX #1)
 * Decoupled from legacy sidebar, SOC navigation, and extra workstation telemetry.
 * Provides a minimal, secure, standalone terminal interface with manual command entry.
 */
export default function TerminalPage() {
  const [searchParams] = useSearchParams();
  const initialToolParam = searchParams.get('tool');
  const initialTargetParam = searchParams.get('target');
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#020814] text-white flex flex-col">
      {/* ── Standalone Dedicated Terminal Header ── */}
      <header className="border-b border-cyan-500/20 bg-[#030c22]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <BrandLogo size={24} />
            <span className="font-display font-black text-sm tracking-wider text-white">
              CYBERSHIELD X
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold uppercase hidden md:inline">
              TERMINAL
            </span>
          </div>
        </div>

        {/* User Badge / Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {user?.username || user?.name || (user?.email ? user.email.split('@')[0] : 'Operator')}
            </span>
          </div>
        </div>
      </header>

      {/* ── Standalone Clean Terminal Screen ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 flex flex-col min-h-0">
        <div className="flex-1 h-[calc(100vh-5.5rem)] min-h-[580px] w-full">
          <NativeTerminalConsole
            cleanMode={true}
            initialTool={initialToolParam ? { id: initialToolParam } : null}
            initialTarget={initialTargetParam || ''}
            className="h-full shadow-2xl rounded-2xl border border-cyan-500/25"
          />
        </div>
      </main>
    </div>
  );
}
