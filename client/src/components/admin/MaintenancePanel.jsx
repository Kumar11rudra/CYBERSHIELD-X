import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function MaintenancePanel() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMaintenance = async () => {
    try {
      const res = await api.get('/admin/maintenance');
      setMaintenanceMode(res.data.maintenanceMode);
      setMaintenanceMsg(res.data.maintenanceMessage || '');
    } catch {
      toast.error('Could not load maintenance status');
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const toggleMaintenance = async () => {
    setLoading(true);
    try {
      const res = await api.post('/admin/maintenance', {
        enabled: !maintenanceMode,
        message: maintenanceMsg.trim()
      });
      setMaintenanceMode(res.data.maintenanceMode);
      toast.success(res.data.maintenanceMode ? 'Maintenance Mode Activated' : 'Platform brought back LIVE');
    } catch {
      toast.error('Failed to update maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-6 border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-1">Maintenance Mode</h3>
          <p className="text-[10px] font-mono text-cyber-muted">Lock the platform for all users. Only admins can bypass.</p>
        </div>
        <div className={`px-4 py-2 rounded border font-mono text-sm font-bold uppercase tracking-widest ${maintenanceMode ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-green-500/20 border-green-500/50 text-green-400'}`}>
          {maintenanceMode ? '🔒 MAINTENANCE ON' : '✅ PLATFORM LIVE'}
        </div>
      </div>
      <div className="mb-6">
        <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Maintenance Message (shown to users)</label>
        <textarea
          value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} rows={3}
          className="cyber-input w-full resize-none p-3 text-sm"
          placeholder="e.g. CyberShield X is undergoing scheduled maintenance. Back shortly."
        />
      </div>
      <motion.button onClick={toggleMaintenance} disabled={loading}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className={`w-full py-3.5 font-bold tracking-[0.2em] uppercase text-sm border transition-all duration-300 disabled:opacity-50 ${
          maintenanceMode
            ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500 hover:text-black'
            : 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500 hover:text-black'
        }`}>
        {loading ? 'Processing...' : maintenanceMode ? '✅ Bring Platform Back LIVE' : '🔒 Activate Maintenance Mode'}
      </motion.button>
    </div>
  );
}
