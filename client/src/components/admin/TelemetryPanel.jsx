import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const Icon = ({ d, size = 14, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function TelemetryPanel() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/telemetry');
      setTelemetry(res.data);
    } catch {
      toast.error('Forensic telemetry offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="text-center py-16">
        <p className="font-mono text-[11px] text-cyber-muted uppercase tracking-widest">
          » Forensic telemetry stream encrypted — Awaiting SOC Handshake
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-card p-6 border-l-4 border-l-cyber-accent">
          <h4 className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-4">Core Integrity</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] text-cyber-muted uppercase">Health Score</span>
              <span className="text-xl font-display font-black text-[#00ff88]">{telemetry.system.healthScore}%</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] text-cyber-muted uppercase">API Latency</span>
              <span className="text-sm font-mono text-white">{telemetry.system.apiLatency}</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] text-cyber-muted uppercase">System Uptime</span>
              <span className="text-sm font-mono text-white">{telemetry.system.uptime}</span>
            </div>
          </div>
        </div>

        <div className="cyber-card p-6">
          <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4">Node Distribution</h4>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Mobile', value: telemetry.nodes.mobileNodes },
                  { name: 'Desktop', value: telemetry.nodes.desktopNodes }
                ]}
                dataKey="value"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={5}
              >
                <Cell fill="#00d4ff" />
                <Cell fill="#ff8c00" />
              </Pie>
              <Tooltip contentStyle={{ background: '#0a0f18', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00d4ff]" /><span className="text-[9px] font-mono text-cyber-muted uppercase">Mobile</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ff8c00]" /><span className="text-[9px] font-mono text-cyber-muted uppercase">Desktop</span></div>
          </div>
        </div>

        <div className="cyber-card p-6">
          <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4">Service Status</h4>
          <div className="flex flex-col gap-2">
            {['Database Cluster', 'Neural Engine', 'Intelligence API', 'Realtime Sockets'].map((s, i) => (
              <div key={s} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                <span className="text-[10px] font-mono text-white uppercase">{s}</span>
                <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cyber-card p-6">
        <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Geographic Signal Distribution</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            {telemetry.geography.map((g, i) => (
              <div key={g._id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-cyber-muted">0{i+1}</span>
                  <span className="text-xs font-display font-bold text-white uppercase tracking-wider">{g._id || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                  <div className="h-1 bg-white/5 rounded-full flex-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(g.count / telemetry.geography[0].count) * 100}%` }}
                      className="h-full bg-cyber-accent" 
                    />
                  </div>
                  <span className="text-[10px] font-mono text-cyber-accent w-8 text-right">{g.count}</span>
                </div>
              </div>
            ))}
            {telemetry.geography.length === 0 && <p className="text-center font-mono text-xs text-cyber-muted py-8 uppercase">No geographic signals recorded.</p>}
          </div>
          <div className="h-48 border border-white/5 rounded-2xl bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#00d4ff11_0%,_transparent_70%)]" 
            />
            <Icon d="M21 12a9 9 0 11-18 0 9 9 0 0114 0z" size={40} className="text-cyber-muted opacity-20 mb-4" />
            <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-[0.4em] z-10 font-bold">Signal Vector Visualization</p>
            <p className="text-[9px] text-white/30 uppercase z-10 italic mt-2">Connecting global nodes...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
