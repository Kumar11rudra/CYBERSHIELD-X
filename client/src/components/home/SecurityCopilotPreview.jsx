import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_LOGS = [
  { text: "⚡ [AI-COPILOT] Nexus cognitive link established on port 9042.", type: "system" },
  { text: "🔍 [INTEL-FEED] Fetching global CISA KEV feeds for Ivanti RCE vectors...", type: "info" },
  { text: "🛡️ [IOC-CORRELATION] Scanning local asset metadata registries...", type: "info" },
  { text: "🔴 [ALERT] 2 assets vulnerable to CVE-2024-21887. Critical exposure path identified.", type: "warning" },
  { text: "🧠 [REMEDIATION] Generated AI fix: Update sub-networks configurations and rotate tokens.", type: "success" }
];

export default function SecurityCopilotPreview() {
  const [logs, setLogs] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startDemo = () => {
    if (isRunning) return;
    setLogs([]);
    setActiveStep(0);
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;
    if (activeStep < DEMO_LOGS.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, DEMO_LOGS[activeStep]]);
        setActiveStep(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsRunning(false);
    }
  }, [isRunning, activeStep]);

  return (
    <section className="py-8 px-5 md:px-6 bg-cyber-bg border-t border-cyber-border/10">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Section Header */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-mono text-cyber-accent uppercase tracking-[0.3em]">AI Integration</p>
          <h2 className="font-display text-2xl font-black text-cyber-text uppercase tracking-tight">
            Security Copilot Preview
          </h2>
          <p className="max-w-xl mx-auto text-xs text-cyber-muted font-body leading-relaxed">
            Experience our real-time AI security triage console. Input endpoints to automatically correlate zero-day exposures and generate instant remediation plans.
          </p>
        </div>

        {/* Console Box */}
        <div className="rounded-2xl border border-cyber-border/15 bg-cyber-card backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Console Title Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border/10 bg-cyber-primary/5">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-cyber-red/20 border border-cyber-red/30" />
              <span className="w-3 h-3 rounded-full bg-cyber-yellow/20 border border-cyber-yellow/30" />
              <span className="w-3 h-3 rounded-full bg-cyber-green/20 border border-cyber-green/30" />
            </div>
            <span className="font-mono text-[9px] text-cyber-muted tracking-wider uppercase">COGNITIVE TRIAGE CONSOLE</span>
            <div className="w-10" />
          </div>

          {/* Console Area */}
          <div className="p-5 min-h-[180px] font-mono text-xs space-y-3 flex flex-col justify-start">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-6 space-y-4">
                <p className="text-cyber-muted text-center font-mono">
                  Console idle. Press trigger to initiate autonomous security triage simulation.
                </p>
                <button
                  onClick={startDemo}
                  className="px-6 py-2.5 bg-cyber-accent text-cyber-bg font-display text-[10px] font-bold uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  🚀 Start Triage Simulation
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {logs.map((log, idx) => {
                    const textColor =
                      log.type === "warning"
                        ? "text-cyber-red"
                        : log.type === "success"
                        ? "text-cyber-green"
                        : log.type === "system"
                        ? "text-cyber-accent"
                        : "text-cyber-text";
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${textColor} leading-relaxed`}
                      >
                        {log.text}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isRunning && (
                  <div className="text-cyber-muted animate-pulse flex items-center gap-2 mt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent animate-ping" />
                    <span>Analyzing threat matrices...</span>
                  </div>
                )}

                {!isRunning && logs.length === DEMO_LOGS.length && (
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={startDemo}
                      className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent font-display text-[9px] font-bold uppercase tracking-wider rounded-lg hover:bg-cyber-accent/20 transition-colors"
                    >
                      🔁 Run Again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
