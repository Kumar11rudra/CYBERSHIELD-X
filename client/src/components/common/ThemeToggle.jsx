import React from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * ThemeToggle Component
 * Toggles between light and dark themes using data-theme attribute on <html>.
 * Persists preference to localStorage.
 */
export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Dark" : "Light";

  return (
    <button
      data-homepage-theme-toggle
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-border/20 bg-cyber-card/50 hover:border-cyber-accent/40 transition-all text-cyber-muted hover:text-cyber-accent cursor-pointer ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <span className="text-sm" role="img" aria-hidden="true">
        {isDark ? "🌙" : "☀️"}
      </span>
      <span className="text-[9px] font-mono uppercase tracking-wider font-bold">
        {label}
      </span>
    </button>
  );
}
