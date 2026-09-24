import React from 'react';
import CyberToolCard from './CyberToolCard';

/**
 * 🔲 ToolGrid
 * Reusable responsive CSS grid component for rendering the CyberShield X tool catalog.
 *
 * Architecture (Step 4B Final Contract Hardening - P1-4B-01):
 * - Pure presentational collection container
 * - Responsive layout: 1 col (<640px), 2 cols (640-767px), 2-3 cols (768-1279px), 4 cols (>=1280px)
 * - Safe data isolation (filters non-object entries without mutating source)
 * - Clean neutral empty state for 0 items
 * - All card interactions route strictly and exclusively to external discovery
 * - Single authoritative external callback: onExternalDiscovery ONLY
 * - onAlternatives is completely removed from public contract; zero callback fallbacks
 * - Explicitly rejects and ignores arbitrary onOpen callbacks to eliminate internal execution paths
 *
 * @param {Object} props
 * @param {Array<Object>} [props.tools=[]] - Array of tool metadata objects
 * @param {Function} [props.onExternalDiscovery] - Authoritative callback invoked when external discovery is triggered
 * @param {string} [props.className=''] - Additional CSS classes for the grid container
 * @param {string} [props.emptyMessage='No security tools found.'] - Custom message when tools array is empty
 */
function ToolGrid({
  tools = [],
  onExternalDiscovery,
  className = '',
  emptyMessage = 'No security tools found.',
}) {
  // Defensive normalization: guarantee array and filter null / non-object entries safely
  const safeTools = Array.isArray(tools)
    ? tools.filter((tool) => tool && typeof tool === 'object')
    : [];

  // Empty state handling
  if (safeTools.length === 0) {
    return (
      <section
        aria-label="Security Tools Grid"
        className={`w-full py-16 px-4 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-800/80 bg-[#0c162d]/40 backdrop-blur-sm ${className}`}
      >
        <div className="w-12 h-12 mb-3 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400 max-w-sm">
          {emptyMessage}
        </p>
      </section>
    );
  }

  // Single authoritative external discovery callback contract (Step 4B Final Contract Hardening)
  // onExternalDiscovery is forwarded directly to child CyberToolCard onAlternatives prop.
  // Zero fallback expressions between callback names exist.
  // onAlternatives and onOpen are not accepted in the contract and are never forwarded.
  return (
    <section aria-label="Security Tools Grid" className="w-full">
      <div
        role="list"
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full ${className}`}
      >
        {safeTools.map((tool, index) => {
          // Stable key: use unique tool.id if present, fallback deterministically
          const stableKey = tool.id || `tool-${index}-${tool.name || 'unnamed'}`;

          return (
            <div key={stableKey} role="listitem" className="w-full">
              <CyberToolCard
                tool={tool}
                onAlternatives={onExternalDiscovery}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(ToolGrid);
export { ToolGrid };
