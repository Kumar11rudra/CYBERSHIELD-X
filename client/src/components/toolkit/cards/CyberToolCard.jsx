import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link2, ShieldCheck, AlertCircle, ArrowUpRight, ArrowRight } from 'lucide-react';
import { getCategoryTheme, CATEGORY_ARCHETYPE_MAP } from './toolThemes';
import AnimatedToolAvatar from './AnimatedToolAvatar';
import { getAlternativesForTool } from './externalAlternatives';

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

  // Dynamic external alternatives count
  const alternatives = getAlternativesForTool(safeTool.id);
  const extCount = Array.isArray(alternatives) && alternatives.length > 0 ? alternatives.length : 3;

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

  // Handler for primary "Open Tool ↗" button
  const handleOpenClick = (e) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen(safeTool);
    } else {
      triggerAlternatives();
    }
  };

  // Handler for "View Alternatives →" button
  const handleAlternativesClick = (e) => {
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
      className={`group relative flex flex-col justify-between rounded-3xl p-6 select-none cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${className}`}
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
              y: -5,
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12)',
            }
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ── Top Row: Category Pill (Left) & Expressive 3D Avatar (Right) ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase truncate max-w-[65%] shadow-xs"
          style={{
            backgroundColor: theme.pastelPillBg || '#dbeafe',
            color: theme.pastelPillText || '#1d4ed8',
          }}
          title={toolCategory}
        >
          {toolCategory}
        </span>

        {/* Top-Right 3D Character Avatar matching design img..png */}
        <div className="shrink-0 -mt-1 -mr-1">
          <AnimatedToolAvatar
            archetype={avatarArchetype}
            accent={theme.accent}
            size={58}
          />
        </div>
      </div>

      {/* ── Tool Identity & Description ── */}
      <div className="flex-1 flex flex-col justify-start text-left mb-4">
        <h3
          className="text-lg font-extrabold text-slate-900 tracking-tight truncate mb-1.5"
          title={toolName}
        >
          {toolName}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
          {toolDesc}
        </p>
      </div>

      {/* ── Metadata Row: External Tool Count & Login Indicator ── */}
      <div className="flex items-center gap-4 text-[11px] font-medium text-slate-700 mb-3 pt-1 border-t border-slate-900/5">
        <span
          data-testid="external-badge"
          className="inline-flex items-center gap-1.5 shrink-0"
        >
          <Link2 size={13} className="text-slate-600" />
          <span>{extCount} External tools</span>
        </span>

        <span className="inline-flex items-center gap-1 shrink-0 text-slate-600">
          {requiresLogin ? (
            <>
              <AlertCircle size={13} className="text-amber-600" />
              <span>May require login</span>
            </>
          ) : (
            <>
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>No login required</span>
            </>
          )}
        </span>
      </div>

      {/* ── Horizontal Progress / Accent Bar ── */}
      <div className="w-full h-1.5 rounded-full bg-slate-900/10 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${theme.progress || 70}%`,
            backgroundColor: theme.btnColor || theme.accent,
          }}
        />
      </div>

      {/* ── Action Row: Dual CTAs ("Open Tool ↗" + "View Alternatives →") ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Primary Action Button: "Open Tool ↗" */}
        <button
          type="button"
          onClick={handleOpenClick}
          aria-label={`Launch ${toolName}`}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-150 hover:opacity-95 active:scale-95 inline-flex items-center gap-1.5 shrink-0"
          style={{
            backgroundColor: theme.btnColor || theme.accent,
          }}
        >
          <span>Open Tool</span>
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </button>

        {/* Secondary Action Link: "View Alternatives →" */}
        <button
          type="button"
          onClick={handleAlternativesClick}
          aria-label={`View alternatives for ${toolName}`}
          className="text-xs font-bold hover:underline inline-flex items-center gap-1 transition-colors shrink-0"
          style={{
            color: theme.btnColor || theme.accent,
          }}
        >
          <span>View Alternatives</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </motion.article>
  );
}

export default React.memo(CyberToolCard);
export { CyberToolCard };
