import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api, { resolveRealtimeServerUrl } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// ─── Components ─────────────────────────────────────────────────────────────
const ConsoleOutput = ({ logs }) => {
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={containerRef}
      className="bg-black/80 rounded-xl border border-white/5 p-4 font-mono text-[10px] h-64 overflow-y-auto custom-scrollbar"
    >
      {logs.map((log, i) => (
        <div key={i} className="mb-1 flex gap-3">
          <span className="text-cyber-muted">[{new Date().toLocaleTimeString()}]</span>
          <span className={log.type === 'error' ? 'text-cyber-red' : log.type === 'success' ? 'text-cyber-green' : 'text-cyber-accent'}>
            {log.message}
          </span>
        </div>
      ))}
      {logs.length === 0 && <span className="text-white/20 uppercase tracking-widest animate-pulse">Awaiting system initialization...</span>}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ToolDetailPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState('');
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize Socket Connection
  useEffect(() => {
    const SERVER_URL = resolveRealtimeServerUrl();
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    newSocket.on('tool_log', (log) => {
      setLogs(prev => [...prev, log]);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!target) return toast.error('Target is required');

    setLoading(true);
    setLogs([]);
    setResult(null);

    try {
      const response = await api.post('/toolkit/execute', {
        toolId,
        target,
        socketId: socket?.id
      });

      if (response.data.success) {
        setResult({
          status: 'complete',
          raw: response.data.rawOutput,
          findings: response.data.rawOutput.split('\n').filter(l => l.includes('/') && l.includes('open')).slice(0, 5)
        });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Execution failed';
      toast.error(msg);
      setLogs(prev => [...prev, { message: `[SYSTEM_ERROR] ${msg}`, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-4 pb-20 px-4 sm:px-6 relative">
      <div className="bloom-bg top-[-10%] left-[-10%] bg-cyber-accent/5" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Navigation */}
        <button 
          onClick={() => navigate('/toolkit')}
          className="flex items-center gap-2 text-cyber-muted hover:text-cyber-accent transition-colors mb-8 font-mono text-[10px] uppercase tracking-widest"
        >
          <span>←</span> Back to Toolkit Hub
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="cyber-bento-card p-6">
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                Module <span className="text-cyber-accent">{toolId}</span>
              </h2>
              <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest leading-relaxed mb-6">
                Advanced diagnostic interface for {toolId} operations. Ensure target authorization before execution.
              </p>

              <form onSubmit={handleExecute} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">Target Identifier</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 192.168.1.1 or example.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white focus:border-cyber-accent outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent font-mono text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-cyber-accent/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Executing...' : 'Launch Module →'}
                </button>
              </form>
            </div>

            <div className="cyber-bento-card p-6 border-cyber-red/20 bg-cyber-red/5">
              <h3 className="text-xs font-mono font-bold text-cyber-red uppercase tracking-widest mb-2">Restricted Protocol</h3>
              <p className="text-[9px] font-mono text-cyber-muted uppercase leading-relaxed">
                Usage of this module is logged under your operator ID. Unauthorized scanning of external networks is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Right Column: Execution & Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Console */}
            <div className="cyber-bento-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
                  Neural Execution Trace
                </h3>
                {loading && <span className="text-[9px] font-mono text-cyber-accent uppercase tracking-widest">Processing...</span>}
              </div>
              <ConsoleOutput logs={logs} />
            </div>

            {/* Analysis Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="cyber-bento-card p-6 border-cyber-green/20"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Analysis Verdict</h3>
                      <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mt-1">Generated by CyberShield X Neural Engine</p>
                    </div>
                    <div className="px-4 py-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg text-cyber-green font-mono font-black text-xs uppercase tracking-widest">
                      SAFE / CLEAR
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.findings.map((f, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-cyber-green mt-1">✓</span>
                        <p className="text-[11px] font-mono text-white/70 uppercase leading-relaxed">{f}</p>
                      </div>
                    ))}
                  </div>

                  <button className="mt-8 w-full py-2 bg-white/5 border border-white/5 text-[9px] font-mono text-cyber-muted uppercase tracking-[0.3em] hover:text-white transition-colors">
                    Download Forensic Report (PDF)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  );
}
