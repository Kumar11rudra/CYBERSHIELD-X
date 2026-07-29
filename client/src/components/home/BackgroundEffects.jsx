import React from "react";

/**
 * BackgroundEffects Component
 * Renders a premium, subtle radial glow matching the Cyprus/Sand design system.
 * Replaces the legacy full-page Matrix Rain and scanlines.
 */
export default function BackgroundEffects() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% -20%, rgba(0, 71, 65, 0.05) 0%, transparent 60%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}