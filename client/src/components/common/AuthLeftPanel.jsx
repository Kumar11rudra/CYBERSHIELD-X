import React from 'react';

/**
 * AuthLeftPanel
 * Shared left panel shell for authentication pages.
 * Provides: grid background, animated logo slot, title slot, children slot, HUD slot.
 *
 * Props:
 *   children    — main content (logo + heading + steps)
 *   hud         — optional HUD element at bottom-left
 */
export default function AuthLeftPanel({ children, hud }) {
  return (
    <div className="hidden lg:flex w-1/2 relative bg-[#020814] flex-col items-center justify-center p-12 border-r border-cyber-green/10">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMGZmODgiLz48L3N2Zz4=')] bg-[length:24px_24px]"
        aria-hidden="true"
      />
      <div className="z-10 flex flex-col items-center w-full">
        {children}
      </div>
      {hud && (
        <div className="absolute bottom-8 left-8 border-l border-cyber-green/40 pl-4 z-10">
          {hud}
        </div>
      )}
    </div>
  );
}
