/**

 * 🛡️ ToolPageLayout — CyberShield X

 * Shared Execution-First Layout Wrapper for all /toolkit/:toolId routes.

 *

 * Features:

 * - Direct visual alignment with approved dark navy cyber-glass design language (#020814 / #0c162d)

 * - Navigation header with 'Back to Security Tools' breadcrumb (preserves category state)

 * - Header with AnimatedToolAvatar, dynamic category theme, execution target badge, and capabilities

 * - Graceful fallback when toolId is unregistered in the catalog

 * - Partial capability integration warning if tool requires external provider credentials

 */



import React from 'react';

import { Link, useParams, useLocation } from 'react-router-dom';

import { ChevronLeft, Shield, AlertTriangle, Cpu, Terminal, Sparkles, Layers } from 'lucide-react';

import { getToolConfig, getStatusBadge, TOOL_TYPES } from './toolConfig';

import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from './cards/toolThemes';

import AnimatedToolAvatar from './cards/AnimatedToolAvatar';



export default function ToolPageLayout({ toolId: toolIdProp, children }) {

  const params = useParams();

  const location = useLocation();

  const toolId = toolIdProp || params.toolId;

  const tool = getToolConfig(toolId);



  const backTarget = location.state?.fromCategory

    ? `/toolkit?category=${encodeURIComponent(location.state.fromCategory)}`

    : '/toolkit';



  // Defensive fallback if tool is not found

  if (!tool) {

    return (

      <div className="min-h-screen bg-[#020814] text-slate-100 flex items-center justify-center p-4">

        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0c162d]/90 border border-red-500/30 text-center space-y-4 shadow-2xl">

          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">

            <AlertTriangle className="w-6 h-6" />

          </div>

          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">

            Tool Dossier Not Found

          </h2>

          <p className="text-xs text-slate-400 font-mono">

            No security engine registered with module identifier <code className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">{toolId}</code>.

          </p>

          <Link

            to={backTarget}

            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-all"

          >

            <ChevronLeft className="w-4 h-4" />

            <span>Return to Security Toolkit</span>

          </Link>

        </div>

      </div>

    );

  }



  const theme = getCategoryTheme(tool.category);

  const archetype = tool.avatarArchetype || CATEGORY_ARCHETYPE_MAP[tool.category] || 'Cyber Scout';

  const badge = getStatusBadge(tool.status);



  // Execution Type Label

  let executionTypeLabel = 'DIAGNOSTIC ENGINE';

  let executionTypeColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  if (tool.type === TOOL_TYPES.SCANNER) {

    executionTypeLabel = 'SCANNER ENGINE';

    executionTypeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  } else if (tool.type === TOOL_TYPES.ANALYZER) {

    executionTypeLabel = 'ANALYSIS ENGINE';

    executionTypeColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  } else if (tool.type === TOOL_TYPES.UTILITY) {

    executionTypeLabel = 'CLIENT-SIDE UTILITY';

    executionTypeColor = 'text-purple-400 border-purple-500/30 bg-purple-500/10';

  }



  return (

    <div className="min-h-screen bg-[#020814] text-slate-100 relative pb-20 overflow-x-hidden font-sans">

      {/* Tactical Glow Backdrops */}

      <div

        aria-hidden="true"

        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"

      />

      <div

        aria-hidden="true"

        className="pointer-events-none absolute top-40 -right-40 w-96 h-96 rounded-full blur-3xl"

        style={{ backgroundColor: `${theme.accent}15` }}

      />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 relative z-10 space-y-6">



        {/* Top Breadcrumb Bar */}

        <div className="flex items-center justify-between gap-4">

          <Link

            to={backTarget}

            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors group"

          >

            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />

            <span className="uppercase tracking-wider font-semibold">Back to Security Tools</span>

          </Link>



          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">

            <span className="hidden sm:inline">Toolkit</span>

            <span className="hidden sm:inline">/</span>

            <span className="text-slate-400">{tool.category}</span>

            <span>/</span>

            <span className="text-cyan-400 font-bold">{tool.id}</span>

          </div>

        </div>



        {/* Tool Header Dossier Card */}

        <header

          className="p-6 sm:p-8 rounded-2xl bg-[#0c162d]/80 border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden"

          style={{

            borderColor: `${theme.accent}30`,

            boxShadow: `0 0 35px ${theme.accent}10`,

          }}

        >

          <div

            aria-hidden="true"

            className="absolute top-0 right-0 w-80 h-80 pointer-events-none"

            style={{

              background: `radial-gradient(circle at top right, ${theme.accent}18, transparent 70%)`

            }}

          />



          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">

            {/* Animated Tool Avatar */}

            <div

              className="p-3 rounded-2xl border flex-shrink-0 self-start md:self-center"

              style={{

                backgroundColor: `${theme.accent}10`,

                borderColor: `${theme.accent}40`,

                boxShadow: `0 0 25px ${theme.accent}20`

              }}

            >

              <AnimatedToolAvatar

                archetype={archetype}

                accent={theme.accent}

                size={68}

                alt={`${tool.name} avatar`}

              />

            </div>



            {/* Tool Identity Details */}

            <div className="space-y-2 flex-1 min-w-0">

              {/* Badges Row */}

              <div className="flex items-center gap-2 flex-wrap">

                {/* Category Badge */}

                <span

                  className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border"

                  style={{

                    backgroundColor: theme.badgeBg,

                    borderColor: theme.badgeBorder,

                    color: theme.badgeText,

                  }}

                >

                  {tool.category}

                </span>



                {/* Execution Type Badge */}

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border ${executionTypeColor}`}>

                  {executionTypeLabel}

                </span>



                {/* Target Type Badge */}

                {tool.inputType && (

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase bg-white/5 border border-white/10 text-slate-300">

                    TARGET: {tool.inputType.toUpperCase()}

                  </span>

                )}



                {/* Operational Status Badge */}

                <span

                  className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border flex items-center gap-1.5"

                  style={{

                    backgroundColor: badge.bg,

                    borderColor: `${badge.color}40`,

                    color: badge.color,

                  }}

                >

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                  <span>{badge.label}</span>

                </span>

              </div>



              {/* Tool Title */}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">

                {tool.name}

              </h1>



              {/* Tagline */}

              {tool.tagline && (

                <p className="text-cyan-400/90 text-xs sm:text-sm font-mono font-medium">

                  {tool.tagline}

                </p>

              )}



              {/* Description */}

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-4xl">

                {tool.description}

              </p>



              {/* Capabilities Pills */}

              {Array.isArray(tool.capabilities) && tool.capabilities.length > 0 && (

                <div className="pt-2 flex items-center gap-1.5 flex-wrap">

                  <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">

                    Capabilities:

                  </span>

                  {tool.capabilities.map((cap) => (

                    <span

                      key={cap}

                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#071126] text-slate-300 border border-slate-800"

                    >

                      {cap}

                    </span>

                  ))}

                </div>

              )}

            </div>

          </div>

        </header>



        {/* Partial Capability Integration Alert */}

        {tool.status === 'partial' && (

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs font-mono">

            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />

            <div className="space-y-0.5">

              <span className="font-bold tracking-wider uppercase">PARTIAL CAPABILITY INTEGRATION</span>

              <p className="text-slate-400 text-[11px]">

                {tool.configRequiredMessage || 'Operational in baseline mode. Configure external provider API credentials for deep enrichment telemetry.'}

              </p>

            </div>

          </div>

        )}



        {/* Main Tool Execution Content */}

        <main className="space-y-6">

          {children}

        </main>

      </div>

    </div>

  );

}
