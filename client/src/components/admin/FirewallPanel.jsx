import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function FirewallPanel() {
  const { t } = useTranslation();
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/firewall');
      setBlockedIPs(res.data.blockedIPs || []);
    } catch {
      toast.error('Firewall data unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const blockIP = async () => {
    if (!newIP.trim()) return;
    setLoading(true);
    try {
      await api.post('/admin/firewall', { ip: newIP.trim() });
      toast.success(`IP ${newIP.trim()} blocked successfully`);
      setNewIP('');
      fetchBlockedIPs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block IP');
      setLoading(false);
    }
  };

  const unblockIP = async (ip) => {
    setLoading(true);
    try {
      await api.delete('/admin/firewall', { data: { ip } });
      toast.success(`IP ${ip} unblocked successfully`);
      fetchBlockedIPs();
    } catch {
      toast.error('Failed to unblock IP');
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-6 border-l-4 border-l-red-500">
      <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-1">{t('admin.globalFirewall')}</h3>
      <p className="text-[10px] font-mono text-cyber-muted mb-6">Block any IP address from accessing the platform. Changes take effect immediately.</p>
      <div className="flex gap-3 mb-6">
        <input
          type="text" value={newIP} onChange={e => setNewIP(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && blockIP()}
          placeholder="Enter IP address (e.g. 192.168.1.1)"
          className="cyber-input flex-1 h-10"
        />
        <button onClick={blockIP} disabled={loading || !newIP.trim()}
          className="font-mono text-xs bg-red-600/20 text-red-500 border border-red-500/50 px-4 py-2 hover:bg-red-600 hover:text-black transition-all uppercase tracking-widest disabled:opacity-40">
          Block IP
        </button>
      </div>
      {loading && blockedIPs.length === 0 ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : blockedIPs.length === 0 ? (
        <p className="text-center font-mono text-xs text-cyber-muted py-8 uppercase">No IPs currently blocked. Firewall perimeter is open.</p>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest mb-3">{blockedIPs.length} IP(s) Blocked</p>
          {blockedIPs.map(ip => (
            <div key={ip} className="flex items-center justify-between bg-red-900/10 border border-red-900/30 px-4 py-2.5 rounded">
              <span className="font-mono text-sm text-red-300">{ip}</span>
              <button onClick={() => unblockIP(ip)}
                className="font-mono text-[10px] text-red-500/60 hover:text-red-400 uppercase tracking-widest transition-colors">
                {t('admin.unblockIP')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
