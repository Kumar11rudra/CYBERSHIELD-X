import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link2, ShieldCheck, AlertCircle, ArrowUpRight, ArrowRight } from 'lucide-react';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from './toolThemes';
import AnimatedToolAvatar from './AnimatedToolAvatar';
import { getAlternativesForTool, isToolOnline, getOfficialRepository } from './externalAlternatives';

/**
 * 🛡️ CyberToolCard
 * High-fidelity, pastel card presentation matching design img..png authoritative reference.
 *
 * Visual Reference Spec:
 * - 4-column responsive desktop card
 * - Colorful pastel background and border
 * - Top-left category pill with high-contrast category badge
 * - Top-right expressive 3D character/avatar face with props & gestures
 * - Bold left-aligned tool title & concise clamped description
 * - Metadata row: link icon + external tools count, shield/alert + login requirement
 * - Horizontal colored progress / accent bar
 * - Dual Action row: "Open Tool ↗" primary solid pill button + "View Alternatives →" link
 *
 * Architectural Boundary:
 * - Preserves Step 4A/4B test contracts (data-testid="external-badge", card click, alternatives)
 * - Safe external verification routing without sensitive data leakage
 */
function CyberToolCard({
  tool = {},
  onOpen,
  onAlternatives,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  // Safe read of metadata fields with robust defaults
  const safeTool = tool && typeof tool === 'object' ? tool : {};
  const toolName = safeTool.name || 'Unnamed Tool';
  const toolDesc = safeTool.description || safeTool.tagline || 'Security tool';
  const toolCategory = safeTool.category || 'General Security';
  const avatarArchetype =
    safeTool.avatarArchetype || CATEGORY_ARCHETYPE_MAP[toolCategory] || 'Cyber Scout';

  // Resolve centralized theme tokens (pastel & dark tokens)
  const theme = getCategoryTheme(toolCategory);

  // Dynamic external status
  const isOnline = isToolOnline(safeTool.id);
  const repoUrl = getOfficialRepository(safeTool.id);
  const alternatives = getAlternativesForTool(safeTool.id);
  const extCount = isOnline ? 1 : (repoUrl ? 1 : 0);

  // Login indicator (true if tool requires authentication)
  const requiresLogin = Boolean(
    safeTool.requiresAuth || safeTool.authRequired || safeTool.requiresApiKey
  );

  // Authoritative external discovery invocation: routes to alternatives modal
  const triggerAlternatives = () => {
    (onAlternatives || onOpen)?.(safeTool);
  };

  // Handler for card container click
  const handleCardClick = () => {
    triggerAlternatives();
  };

  // Keyboard accessibility: Enter or Space activates external discovery
  const handleKeyDown = (e) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      triggerAlternatives();
    }
  };

  // Handler for primary external action button ("External Website ↗")
  const handleActionClick = (e) => {
    e.stopPropagation();
    triggerAlternatives();
  };

  return (
    <motion.article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${toolName} - External Tool Discovery Card`}
      className={`group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 w-full h-full min-h-[310px] select-none cursor-pointer transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${className}`}
      style={{
        backgroundColor: theme.pastelBg || '#eff6ff',
        borderColor: theme.pastelBorder || '#bfdbfe',
        borderWidth: '1.5px',
        borderStyle: 'solid',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12)',
            }
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ── Top Row: Category Pill (Left) & Expressive 3D Avatar (Right) ── */}
      <div className="flex items-start justify-between gap-2 mb-3 w-full">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase truncate max-w-[calc(100%-60px)] shadow-xs shrink"
          style={{
            backgroundColor: theme.pastelPillBg || '#dbeafe',
            color: theme.pastelPillText || '#1d4ed8',
          }}
          title={toolCategory}
        >
          {toolCategory}
        </span>

        {/* Top-Right 3D Character Avatar matching design reference */}
        <div className="shrink-0 -mt-1 -mr-1">
          <AnimatedToolAvatar
            archetype={avatarArchetype}
            accent={theme.accent}
            size={52}
          />
        </div>
      </div>

      {/* ── Tool Identity & Description ── */}
      <div className="flex-1 flex flex-col justify-start text-left mb-3 overflow-hidden">
        <h3
          className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2 break-words mb-1.5"
          title={toolName}
        >
          {toolName}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal break-words">
          {toolDesc}
        </p>
      </div>

      {/* ── Metadata Row: External Tool Count & Login Indicator ── */}
      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-medium text-slate-700 mb-3 pt-2 border-t border-slate-900/5">
        <span
          data-testid="external-badge"
          className="inline-flex items-center gap-1.5 shrink-0 truncate"
        >
          <Link2 size={13} className="text-slate-600 shrink-0" />
          <span>{isOnline ? 'External Service' : (repoUrl ? 'External: Repo Available' : 'External: Coming Soon')}</span>
        </span>

        <span className="inline-flex items-center gap-1 shrink-0 text-slate-600 truncate">
          {requiresLogin ? (
            <>
              <AlertCircle size={13} className="text-amber-600 shrink-0" />
              <span>Requires login</span>
            </>
          ) : (
            <>
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>No login</span>
            </>
          )}
        </span>
      </div>

      {/* ── Horizontal Progress / Accent Bar ── */}
      <div className="w-full h-1.5 rounded-full bg-slate-900/10 overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${theme.progress || 70}%`,
            backgroundColor: theme.btnColor || theme.accent,
          }}
        />
      </div>

      {/* ── Action Row: Truthful Policy Representation ── */}
      <div className="pt-1 w-full mt-auto">
        <button
          type="button"
          onClick={handleActionClick}
          aria-label={`View alternatives for ${toolName}`}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all duration-150 hover:opacity-95 active:scale-[0.98] flex items-center justify-center gap-2 group/btn cursor-pointer"
          style={{
            backgroundColor: isOnline ? (theme.btnColor || theme.accent) : '#475569',
          }}
        >
          {isOnline ? (
            <>
              <span>External Website</span>
              <span className="sr-only"> — View Alternatives</span>
              <ArrowUpRight
                size={14}
                strokeWidth={2.5}
                className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform shrink-0"
              />
            </>
          ) : (
            <>
              <span>COMING SOON</span>
              <span className="sr-only"> — View Alternatives</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

export default React.memo(CyberToolCard);
export { CyberToolCard };
