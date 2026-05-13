import React from 'react';

/**
 * ErrorBoundary — Production-grade React Error Boundary.
 * Catches any rendering errors in child components and displays
 * a premium defense-themed fallback UI instead of a blank screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[NEXUS_CORE_ERROR]', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020508] px-6 text-center relative overflow-hidden">
        {/* Scanline background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,34,68,0.015) 2px, rgba(255,34,68,0.015) 4px)',
          }}
        />

        {/* Warning icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center animate-pulse">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div className="absolute -inset-4 rounded-full border border-red-500/10 animate-ping" />
        </div>

        <p className="font-mono text-[10px] text-red-400 uppercase tracking-[0.4em] mb-3 animate-pulse">
          NEXUS_CORE :: CRITICAL_EXCEPTION
        </p>
        <h1 className="font-display text-4xl font-black text-white mb-4 tracking-widest uppercase">
          System Fault
        </h1>
        <p className="font-mono text-sm text-white/50 max-w-md leading-relaxed mb-8">
          An unhandled exception disrupted the Nexus rendering pipeline. The incident has been logged. Please reinitialize the module.
        </p>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 max-w-2xl w-full text-left">
            <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest mb-2">Error Details (Dev Mode Only)</p>
            <p className="font-mono text-xs text-red-300 break-all">{this.state.error.toString()}</p>
          </div>
        )}

        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
          className="px-8 py-3.5 rounded-xl bg-red-600/20 border border-red-600/40 text-red-400 font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all"
        >
          ↻ Reinitialize Module
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
