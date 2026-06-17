import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AssetsPage() {
  const navigate = useNavigate();

  // Assets states
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [savingAsset, setSavingAsset] = useState(false);

  // Schedules states
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Asset Form fields
  const [assetForm, setAssetForm] = useState({
    hostname: '',
    ip: '',
    assetType: 'Website',
    criticality: 'Medium',
    environment: 'Production',
    owner: 'SOC-Team',
    tags: '',
    status: 'active'
  });

  // Schedule Form fields
  const [scheduleForm, setScheduleForm] = useState({
    target: '',
    targetType: 'domain',
    frequency: 'weekly',
    scanMode: 'quick',
    tools: ['nmap', 'ssl']
  });

  // Fetch all Assets and Schedules
  const fetchAssets = async () => {
    try {
      setLoadingAssets(true);
      const res = await api.get('/assets');
      if (res.data && res.data.success) {
        setAssets(res.data.assets);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      toast.error('Failed to load assets inventory.');
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const res = await api.get('/schedules');
      if (res.data && res.data.success) {
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      toast.error('Failed to load scan schedules.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchSchedules();
  }, []);

  // Handle Add Asset
  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.hostname) {
      return toast.error('Hostname/Target is required.');
    }

    setSavingAsset(true);
    try {
      const parsedTags = assetForm.tags
        ? assetForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...assetForm,
        tags: parsedTags
      };

      const res = await api.post('/assets', payload);
      if (res.data && res.data.success) {
        toast.success('Asset successfully registered.');
        setAssetForm({
          hostname: '',
          ip: '',
          assetType: 'Website',
          criticality: 'Medium',
          environment: 'Production',
          owner: 'SOC-Team',
          tags: '',
          status: 'active'
        });
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add asset.');
    } finally {
      setSavingAsset(false);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to stop managing this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset removed from inventory.');
      fetchAssets();
    } catch (err) {
      toast.error('Failed to remove asset.');
    }
  };

  // Handle Instant Scan
  const handleInstantScan = async (hostname, assetType) => {
    const toastId = toast.loading(`Initiating scanning sequence on ${hostname}...`);
    try {
      const targetType = assetType === 'Server' ? 'ip' : (assetType === 'Domain' ? 'domain' : 'url');
      const res = await api.post('/scan', { target: hostname, targetType });
      if (res.data && res.data.success) {
        toast.success('Scan completed successfully.', { id: toastId });
        navigate(`/history/${res.data.scan.id}`);
      } else {
        toast.error('Scan failed to execute.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Scan execution failed.', { id: toastId });
    }
  };

  // Handle Add Schedule
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.target) {
      return toast.error('Schedule Target is required.');
    }

    setSavingSchedule(true);
    try {
      const res = await api.post('/schedules', scheduleForm);
      if (res.data && res.data.success) {
        toast.success('Scan schedule configured successfully.');
        setScheduleForm({
          target: '',
          targetType: 'domain',
          frequency: 'weekly',
          scanMode: 'quick',
          tools: ['nmap', 'ssl']
        });
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to configure scan schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Toggle Schedule State (Active/Inactive)
  const handleToggleSchedule = async (schedule) => {
    try {
      await api.put(`/schedules/${schedule._id}`, { isActive: !schedule.isActive });
      toast.success(`Schedule ${!schedule.isActive ? 'activated' : 'deactivated'}.`);
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to update schedule status.');
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this scheduled scan configuration?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Scheduled scan deleted.');
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to remove scheduled scan.');
    }
  };

  // Helper styles
  const getRiskColor = (score) => {
    if (score >= 75) return 'text-red-400 bg-red-950/20 border-red-500/20';
    if (score >= 50) return 'text-orange-400 bg-orange-950/20 border-orange-500/20';
    if (score >= 20) return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/20';
    return 'text-green-400 bg-green-950/20 border-green-500/20';
  };

  const getCriticalityColor = (level) => {
    const colors = {
      Critical: 'text-red-400 border-red-500/30 bg-red-500/10',
      High: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      Medium: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      Low: 'text-gray-400 border-gray-500/30 bg-gray-500/10'
    };
    return colors[level] || colors.Medium;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-[#e0e6ff] relative z-10 space-y-8">
      
      {/* Header */}
      <div className="border border-[#00bfff]/20 bg-[#070f21]/70 rounded-xl p-6 shadow-[0_0_20px_rgba(0,191,255,0.05)]">
        <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase font-display flex items-center gap-2">
          <span>🛡️</span> ASSET INVENTORY & SCAN SCHEDULER <span className="text-[#00bfff]">V4.0</span>
        </h1>
        <p className="text-xs text-[#5a7fa8] mt-1.5 uppercase tracking-wider">
          Provision servers, websites, and APIs into continuous threat perception cycles. Set automated daily, weekly, or monthly passive scanners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Inventory List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Asset Directory */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-[#224466]/30 pb-3">
              <h3 className="text-xs font-bold text-white tracking-widest uppercase">MANAGED ENDPOINTS DIRECTORY</h3>
              <span className="text-[10px] text-cyan-400 font-bold">{assets.length} ACTIVE ASSETS</span>
            </div>

            {loadingAssets ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Querying Inventory Catalog...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#224466]/30 rounded-lg bg-black/20">
                <p className="text-xs text-[#5a7fa8] uppercase tracking-wider">No endpoints are currently provisioned.</p>
                <p className="text-[10px] text-cyan-400/50 mt-1 uppercase tracking-widest">Register targets via the sidebar to initiate continuous defense monitoring.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#224466]/30 text-[#5a7fa8] text-[10px] tracking-wider uppercase">
                      <th className="py-2.5">Hostname</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Criticality</th>
                      <th className="py-2.5">Env</th>
                      <th className="py-2.5 text-center">Risk Score</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#224466]/10">
                    {assets.map((asset) => (
                      <tr key={asset._id} className="hover:bg-cyan-950/10 transition-colors">
                        <td className="py-3 pr-2">
                          <p className="text-white font-bold font-tech break-all">{asset.hostname}</p>
                          <p className="text-[9px] text-[#5a7fa8] font-mono mt-0.5">{asset.ip || 'No Static IP'}</p>
                        </td>
                        <td className="py-3">
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#224466]/50 bg-black/40 text-[#8892b0]">{asset.assetType}</span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getCriticalityColor(asset.criticality)}`}>
                            {asset.criticality}
                          </span>
                        </td>
                        <td className="py-3 text-[#8892b0] text-[10px]">{asset.environment}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getRiskColor(asset.lastRiskScore)}`}>
                            {asset.lastRiskScore}/100
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleInstantScan(asset.hostname, asset.assetType)}
                              className="text-[10px] font-bold text-cyan-400 border border-cyan-400/20 hover:border-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded transition-all"
                            >
                              ⚡ Scan
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset._id)}
                              className="text-[10px] font-bold text-red-400 border border-red-500/20 hover:border-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Scheduler List */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-[#224466]/30 pb-3">
              <h3 className="text-xs font-bold text-white tracking-widest uppercase">ACTIVE MONITORING SCHEDULES</h3>
              <span className="text-[10px] text-cyan-400 font-bold">{schedules.length} SCHEDULES ACTIVE</span>
            </div>

            {loadingSchedules ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Reading Cron Gates...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#224466]/30 rounded-lg bg-black/20">
                <p className="text-xs text-[#5a7fa8] uppercase tracking-wider">No cron loops configured.</p>
                <p className="text-[10px] text-cyan-400/50 mt-1 uppercase tracking-widest">Define custom monitoring frequencies using the scheduler panel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule._id} className="border border-[#224466]/20 bg-black/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${schedule.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-xs font-bold text-white font-tech break-all">{schedule.target}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 uppercase font-bold">{schedule.frequency}</span>
                      </div>
                      <p className="text-[9px] text-[#8892b0] uppercase tracking-wider">
                        Tools: {schedule.tools.join(', ')} | Mode: {schedule.scanMode}
                      </p>
                      <p className="text-[9px] text-[#5a7fa8] uppercase tracking-wider">
                        Next check: {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleSchedule(schedule)}
                        className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
                          schedule.isActive
                            ? 'border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10'
                            : 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {schedule.isActive ? '⏸ Pause' : '▶ Resume'}
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-[9px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-all"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Forms Panel */}
        <div className="space-y-8">
          
          {/* Add Asset Form */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase border-b border-[#224466]/30 pb-2">PROVISION NEW ASSET</h3>
            <form onSubmit={handleAddAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Hostname / Domain *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. secure.mycompany.com"
                  value={assetForm.hostname}
                  onChange={(e) => setAssetForm({ ...assetForm, hostname: e.target.value })}
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">IP Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100"
                  value={assetForm.ip}
                  onChange={(e) => setAssetForm({ ...assetForm, ip: e.target.value })}
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Asset Type</label>
                  <select
                    value={assetForm.assetType}
                    onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {['Website', 'Domain', 'Server', 'API', 'Mobile App', 'Cloud Resource'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Criticality</label>
                  <select
                    value={assetForm.criticality}
                    onChange={(e) => setAssetForm({ ...assetForm, criticality: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Environment</label>
                  <select
                    value={assetForm.environment}
                    onChange={(e) => setAssetForm({ ...assetForm, environment: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {['Production', 'Staging', 'Development'].map((env) => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {['active', 'inactive', 'maintenance'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Owner</label>
                  <input
                    type="text"
                    value={assetForm.owner}
                    onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Tags (Comma Sep)</label>
                  <input
                    type="text"
                    placeholder="db, web, auth"
                    value={assetForm.tags}
                    onChange={(e) => setAssetForm({ ...assetForm, tags: e.target.value })}
                    className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingAsset}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase py-2 px-3 rounded tracking-widest disabled:opacity-50 transition-all font- tech mt-2 text-[10px]"
              >
                {savingAsset ? 'Saving to Database...' : '🛡️ Add to Asset Inventory'}
              </button>
            </form>
          </div>

          {/* Add Scan Schedule Form */}
          <div className="border border-[#00bfff]/15 bg-[#0a1223]/80 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase border-b border-[#224466]/30 pb-2">SCAN SCHEDULE CONFIG</h3>
            <form onSubmit={handleAddSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Target Endpoint *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.1 or example.com"
                  value={scheduleForm.target}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, target: e.target.value })}
                  className="w-full bg-black/40 border border-[#224466]/40 rounded p-2 text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Target Type</label>
                  <select
                    value={scheduleForm.targetType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, targetType: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="domain">Domain Name</option>
                    <option value="ip">IP Address</option>
                    <option value="url">URL Endpoint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Frequency *</label>
                  <select
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="daily">Daily Loop</option>
                    <option value="weekly">Weekly Cycle</option>
                    <option value="monthly">Monthly Audit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Scan Mode</label>
                  <select
                    value={scheduleForm.scanMode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scanMode: e.target.value })}
                    className="w-full bg-[#0a1223] border border-[#224466]/40 rounded p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="quick">Fast (nmap -F)</option>
                    <option value="service">Deep (nmap -sV)</option>
                    <option value="version">Service Version Audits</option>
                    <option value="os">OS Detection Guessing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#5a7fa8] uppercase text-[9px] font-bold tracking-wider mb-1">Active Modules</label>
                  <div className="flex gap-4 pt-1 font-tech uppercase text-[9px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleForm.tools.includes('nmap')}
                        onChange={(e) => {
                          const tools = e.target.checked
                            ? [...scheduleForm.tools, 'nmap']
                            : scheduleForm.tools.filter(t => t !== 'nmap');
                          setScheduleForm({ ...scheduleForm, tools });
                        }}
                        className="rounded border-[#224466] text-cyan-500 accent-cyan-500 focus:ring-0 focus:outline-none bg-black"
                      />
                      Nmap
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleForm.tools.includes('ssl')}
                        onChange={(e) => {
                          const tools = e.target.checked
                            ? [...scheduleForm.tools, 'ssl']
                            : scheduleForm.tools.filter(t => t !== 'ssl');
                          setScheduleForm({ ...scheduleForm, tools });
                        }}
                        className="rounded border-[#224466] text-cyan-500 accent-cyan-500 focus:ring-0 focus:outline-none bg-black"
                      />
                      SSL
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSchedule}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase py-2 px-3 rounded tracking-widest disabled:opacity-50 transition-all font-tech mt-2 text-[10px]"
              >
                {savingSchedule ? 'Scheduling Scan...' : '📅 Enable Scan Schedule'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
