/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: 'rgb(var(--cyber-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--cyber-surface-rgb) / <alpha-value>)',
          card: 'rgb(var(--cyber-card-rgb) / <alpha-value>)',
          border: 'rgb(var(--cyber-border-rgb) / <alpha-value>)',
          text: 'rgb(var(--cyber-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--cyber-muted-rgb) / <alpha-value>)',
          accent: 'rgb(var(--cyber-accent-rgb) / <alpha-value>)',
          green: 'rgb(var(--cyber-green-rgb) / <alpha-value>)',
          red: 'rgb(var(--cyber-red-rgb) / <alpha-value>)',
          orange: 'rgb(var(--cyber-orange-rgb) / <alpha-value>)',
          yellow: 'rgb(var(--cyber-yellow-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', 'monospace'],
        body: ['"Share Tech"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00d4ff44' },
          '100%': { boxShadow: '0 0 20px #00d4ff88, 0 0 40px #00d4ff44' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
