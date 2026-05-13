import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

import toast from 'react-hot-toast';

const VaultAssetCard = ({ asset, onToggleLock, onDelete, onTakedown }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`cyber-card p-6 border-l-4 transition-all ${asset.isLocked ? 'border-l-cyber-accent bg-cyber-accent/5' : 'border-l-cyber-red bg-cyber-red/5'}`}
  >
    <div className="flex justify-between items-start mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">{asset.type}</span>
          {asset.isLocked && <span className="text-[8px] bg-cyber-accent/20 text-cyber-accent px-2 py-0.5 rounded border border-cyber-accent/30 font-black animate-pulse">PQC_ARMOR: {asset.pqcArmor}</span>}
        </div>
        <h3 className="text-xl font-black text-white">{asset.label}</h3>
        <p className="font-mono text-xs text-cyber-muted tracking-tight mt-1">{asset.value}</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onToggleLock(asset._id)}
          className={`p-2 rounded-lg border transition-all ${
            asset.isLocked 
            ? 'bg-cyber-accent text-black border-cyber-accent shadow-lg shadow-cyber-accent/20' 
            : 'bg-white/5 text-cyber-muted border-white/10 hover:border-cyber-accent hover:text-cyber-accent'
          }`}
        >
          {asset.isLocked ? '🔓 UNLOCK' : '🔒 LOCKDOWN'}
        </button>
        <button 
          onClick={() => onTakedown(asset._id)}
          className="p-2 px-3 rounded-lg bg-cyber-red/10 text-cyber-red border border-cyber-red/20 hover:bg-cyber-red hover:text-white transition-all text-[10px] font-black"
        >
          🛡️ SHIELD & REMOVE
        </button>
        <button 
          onClick={() => onDelete(asset._id)}
          className="p-2 rounded-lg bg-white/5 text-cyber-muted border border-white/10 hover:border-cyber-red hover:text-cyber-red transition-all"
        >
          🗑️
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
      <div>
        <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">Risk Score</p>
        <div className="flex items-end gap-2">
          <span className={`text-lg font-black ${asset.riskScore > 70 ? 'text-cyber-red' : asset.riskScore > 40 ? 'text-yellow-500' : 'text-cyber-green'}`}>
            {asset.riskScore}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">Dark Web Mentions</p>
        <p className="text-sm text-white font-bold">{asset.threatIntelligence.mentionsInDarkWeb}</p>
      </div>
      <div>
        <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">Market Value</p>
        <p className="text-sm text-cyber-red font-black animate-pulse">{asset.threatIntelligence.marketValueEstimate}</p>
      </div>
      <div>
        <p className="text-[9px] font-mono text-cyber-muted uppercase mb-1">Status</p>
        <p className={`text-[10px] font-bold ${asset.threatIntelligence.activeTargeting ? 'text-cyber-red uppercase animate-bounce' : 'text-cyber-green uppercase'}`}>
          {asset.threatIntelligence.activeTargeting ? '⚠️ Targeted' : '✅ Monitored'}
        </p>
      </div>
    </div>
  </motion.div>
);

const VaultPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAsset, setNewAsset] = useState({ type: 'email', label: '', value: '' });

  const fetchAssets = async () => {
    try {
      const res = await api.get('/vault');
      setAssets(res.data.assets);
    } catch (err) {
      console.error('Failed to load vault assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vault/add', newAsset);
      setNewAsset({ type: 'email', label: '', value: '' });
      setShowAdd(false);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add asset');
    }
  };

  const handleToggleLock = async (id) => {
    try {
      await api.patch(`/vault/lockdown/${id}`);
      fetchAssets();
    } catch (err) {
      console.error('Lockdown toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this asset from Nexus monitoring?')) return;
    try {
      await api.delete(`/vault/${id}`);
      fetchAssets();
    } catch (err) {
      console.error('Delete failed');
    }
  };

  const handleTakedown = async (id) => {
    const loadingToast = toast.loading('Initiating Autonomous Response Engine...');
    try {
      const res = await api.post(`/vault/${id}/takedown`);
      toast.success(res.data.message, { id: loadingToast, duration: 5000 });
      fetchAssets();
    } catch (err) {
      toast.error('Takedown sequence failed', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-[#01060f] text-cyber-text font-tech px-4 py-24">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              QUANTUM <span className="text-cyber-accent">VAULT</span>
            </h1>
            <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.3em]">Neural Identity Protection & Tokenized Assets</p>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="cyber-button-primary px-8 py-3 text-xs font-black"
          >
            {showAdd ? 'CANCEL' : '+ ADD NEW IDENTITY'}
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd} 
              className="cyber-card p-6 md:p-8 mb-12 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-mono text-cyber-muted uppercase mb-2">Asset Type</label>
                  <select 
                    value={newAsset.type}
                    onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyber-accent outline-none"
                  >
                    <option value="email">📧 Email Address</option>
                    <option value="phone">📱 Mobile Number</option>
                    <option value="device">💻 Trusted Device</option>
                    <option value="key">🔑 Encryption Key</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-cyber-muted uppercase mb-2">Custom Label</label>
                  <input 
                    type="text"
                    placeholder="e.g. Primary Gmail"
                    value={newAsset.label}
                    onChange={(e) => setNewAsset({...newAsset, label: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyber-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-cyber-muted uppercase mb-2">Value</label>
                  <input 
                    type="text"
                    placeholder={newAsset.type === 'email' ? 'your@email.com' : 'Value'}
                    value={newAsset.value}
                    onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyber-accent outline-none"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" className="cyber-button-primary px-12 py-3 text-sm font-black">
                  ENROLL IN VAULT
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-24 font-mono text-cyber-accent animate-pulse">Initializing Neural Secure Storage...</div>
        ) : (
          <div className="grid gap-6">
            {assets.length === 0 ? (
              <div className="cyber-card p-12 text-center border-dashed border-white/10">
                <p className="text-cyber-muted font-mono text-sm uppercase">Vault is empty. Add your first identity to enable Nexus Monitoring.</p>
              </div>
            ) : (
              assets.map(asset => (
                <VaultAssetCard 
                  key={asset._id} 
                  asset={asset} 
                  onToggleLock={handleToggleLock}
                  onDelete={handleDelete}
                  onTakedown={handleTakedown}
                />
              ))
            )}
          </div>
        )}

        {/* VAULT STATS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <p className="text-[10px] font-mono text-cyber-muted uppercase mb-2">Encryption Status</p>
            <p className="text-xl font-black text-white tracking-tighter uppercase">AES-256 Sovereign</p>
          </div>
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <p className="text-[10px] font-mono text-cyber-muted uppercase mb-2">Identity Shielding</p>
            <p className="text-xl font-black text-white tracking-tighter uppercase">Active Pulse</p>
          </div>
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <p className="text-[10px] font-mono text-cyber-muted uppercase mb-2">Nexus Node</p>
            <p className="text-xl font-black text-white tracking-tighter uppercase">Secure Connection</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
