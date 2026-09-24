import React from 'react';

import { motion } from 'framer-motion';

import { ExternalLink } from 'lucide-react';

import { getCategoryTheme } from './toolThemes';

import AnimatedToolAvatar from './AnimatedToolAvatar';



/**

 * Calculates high-contrast text color (dark navy or white) for any hex accent color.

 * @param {string} hexColor - Hex color code (e.g. '#00d4ff')

 * @returns {string} High-contrast text hex color

 */

function getContrastTextColor(hexColor) {

  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {

    return '#020817';

  }

  const hex = hexColor.replace('#', '');

  if (hex.length !== 6) return '#020817';

  const r = parseInt(hex.substring(0, 2), 16);

  const g = parseInt(hex.substring(2, 4), 16);

  const b = parseInt(hex.substring(4, 6), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 135 ? '#020817' : '#ffffff';

}



/**

 * 🛡️ CyberToolCard

 * Reusable metadata-driven card component for the CyberShield X Tool Grid.

 *

 * ARCHITECTURAL BOUNDARY (Step 4A):

 * - Tool cards are strictly an EXTERNAL WEBSITE DISCOVERY surface.

 * - Clicking anywhere on the card or clicking the primary CTA opens the External Alternatives experience.

 * - The card does NOT execute native tools, does NOT call /api/terminal/execute-native,

 *   does NOT call /api/toolkit/execute, and does NOT route to internal execution workstations.

 * - Does NOT display internal executionTarget badges (Native, API, Browser, Hybrid).

 *

 * Visual Spec:

 * - Dark navy / glass surface (#0c162d / #0a1124)

 * - Rounded-2xl with subtle category-reactive border & glow

 * - Category badge & external discovery badge

 * - Animated tool avatar (64px)

 * - Prominent tool name & clamped description

 * - Action row: Unified "View Alternatives" external discovery CTA

 *

 * @param {Object} props

 * @param {Object} [props.tool={}] - Tool metadata object

 * @param {string} [props.tool.id] - Unique tool identifier

 * @param {string} [props.tool.name] - Human-readable display name

 * @param {string} [props.tool.description] - Short summary of capabilities

 * @param {string} [props.tool.tagline] - Optional fallback summary

 * @param {string} [props.tool.category] - Official Nexus category string

 * @param {string} [props.tool.avatarArchetype] - Avatar archetype name

 * @param {Function} [props.onOpen] - Callback invoked when tool is selected (routed to alternatives)

 * @param {Function} [props.onAlternatives] - Callback invoked to open External Alternatives modal

 * @param {string} [props.className=''] - Optional custom CSS classes

 */

function CyberToolCard({

  tool = {},

  onOpen,

  onAlternatives,

  className = '',

}) {

  // Safe read of metadata fields with robust defaults

  const safeTool = tool && typeof tool === 'object' ? tool : {};

  const toolName = safeTool.name || 'Unnamed Tool';

  const toolDesc = safeTool.description || safeTool.tagline || 'Security tool';

  const toolCategory = safeTool.category || 'General Security';

  const avatarArchetype = safeTool.avatarArchetype;



  // Resolve centralized theme tokens

  const theme = getCategoryTheme(toolCategory);

  const primaryTextColor = getContrastTextColor(theme.accent);



  // Authoritative external discovery invocation: routes exclusively to alternatives

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



  // Handler for primary CTA button click (stops propagation to prevent double-triggering card click)

  const handleButtonClick = (e) => {

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

      className={`group relative flex flex-col justify-between rounded-2xl p-5 min-h-[250px] select-none backdrop-blur-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020814] ${className}`}

      style={{

        backgroundColor: 'rgba(12, 22, 45, 0.88)',

        borderWidth: '1px',

        borderStyle: 'solid',

        borderColor: 'rgba(30, 41, 59, 0.8)',

        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4)',

      }}

      whileHover={{

        y: -3,

        borderColor: theme.cardBorderHover,

        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px -2px ${theme.accent}25`,

      }}

      transition={{ duration: 0.2, ease: 'easeOut' }}

    >

      {/* Top Meta Row: Category Badge + External Discovery Badge */}

      <div className="flex items-center justify-between gap-2 mb-3">

        <span

          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase truncate max-w-[65%]"

          style={{

            backgroundColor: theme.badgeBg,

            borderColor: theme.badgeBorder,

            color: theme.badgeText,

          }}

          title={toolCategory}

        >

          {toolCategory}

        </span>



        {/* External Discovery Badge (Replaces internal executionTarget presentation) */}

        <span

          data-testid="external-badge"

          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium tracking-wider bg-slate-800/80 text-cyan-400 border border-slate-700/60 uppercase shrink-0"

        >

          <ExternalLink size={10} className="text-cyan-400" />

          <span>External</span>

        </span>

      </div>



      {/* Avatar Visual Anchor */}

      <div className="flex items-center justify-center my-2">

        <AnimatedToolAvatar

          archetype={avatarArchetype}

          accent={theme.accent}

          size={64}

        />

      </div>



      {/* Tool Identity & Description */}

      <div className="mt-1 flex-1 flex flex-col justify-center text-center">

        <h3

          className="text-base font-bold text-slate-100 tracking-tight truncate px-1 group-hover:text-cyan-300 transition-colors"

          title={toolName}

        >

          {toolName}

        </h3>

        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed px-1">

          {toolDesc}

        </p>

      </div>



      {/* Action Row — Unified External Alternatives Discovery CTA */}

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">

        <button

          type="button"

          onClick={handleButtonClick}

          aria-label={`View alternatives for ${toolName}`}

          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] text-center truncate shadow-sm flex items-center justify-center gap-1.5 group/btn"

          style={{

            backgroundColor: theme.accent,

            color: primaryTextColor,

            boxShadow: `0 2px 10px -2px ${theme.accent}50`,

          }}

        >

          <span>View Alternatives</span>

          <ExternalLink size={13} className="shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />

        </button>

      </div>

    </motion.article>

  );

}



export default React.memo(CyberToolCard);

export { CyberToolCard };
