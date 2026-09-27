import React from 'react';
import CyberToolCard from './CyberToolCard';

/**
 * 🔲 ToolGrid
 * Reusable responsive CSS grid component for rendering the CyberShield X tool catalog.
 *
 * Architecture:
 * - 4-column desktop grid matching design img..png reference
 * - Responsive layout: 1 col (<640px), 2 cols (640-1023px), 3 cols (1024-1279px), 4 cols (>=1280px)
 * - Safe data isolation (filters non-object entries without mutating source)
 * - Clean neutral empty state for 0 items
 * - Card interactions route to external discovery or onOpenTool
 */
function ToolGrid({
  tools = [],
  onExternalDiscovery,
  onOpenTool,
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
        className={`w-full py-16 px-4 flex flex-col items-center justify-center text-center rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-sm ${className}`}
      >
        <div className="w-12 h-12 mb-3 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
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
        <p className="text-sm font-medium text-slate-500 max-w-sm">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Security Tools Grid" className="w-full">
      <div
        role="list"
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full ${className}`}
      >
        {safeTools.map((tool, index) => {
          const stableKey = tool.id || `tool-${index}-${tool.name || 'unnamed'}`;

          return (
            <div key={stableKey} role="listitem" className="w-full">
              <CyberToolCard
                tool={tool}
                onAlternatives={onExternalDiscovery}
                onOpen={onOpenTool}
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
