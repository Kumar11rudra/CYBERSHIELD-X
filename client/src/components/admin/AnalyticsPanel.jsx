import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function AnalyticsPanel() {
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [scanTypes, setScanTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [ov, da, st] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/daily-activity'),
        api.get('/analytics/scan-types'),
      ]);
      setAnalyticsOverview(ov.data.overview);
      setDailyActivity(da.data.dailyActivity);
      setScanTypes(st.data.scanTypes.map((t, i) => ({ 
        ...t, 
        fill: ['#00d4ff','#00ff88','#ff8c00','#ff2244','#a855f7','#f59e0b'][i % 6] 
      })));
    } catch {
      toast.error('Analytics feed offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analyticsOverview) {
    return (
      <div className="text-center py-16">
        <p className="font-mono text-[11px] text-cyber-muted uppercase tracking-widest">
          » Analytics feed offline — Connect Nexus Data Core
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: analyticsOverview.totalUsers, color: '#00d4ff' },
          { label: 'New Users (7d)', value: analyticsOverview.newUsersLast7Days, color: '#00ff88' },
          { label: 'Total Scans', value: analyticsOverview.totalScans, color: '#a855f7' },
          { label: '2FA Adoption', value: analyticsOverview.twoFAAdoptionRate, color: '#ff8c00' },
        ].map((k) => (
          <div key={k.label} className="cyber-card p-5 text-center">
            <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mb-2">{k.label}</p>
            <p className="text-3xl font-display font-black" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Activity Chart */}
      <div className="cyber-card p-6">
        <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Daily Activity (14 Days)</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dailyActivity} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4a5568', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
              labelStyle={{ color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar dataKey="users" fill="#00d4ff" name="New Users" radius={[3,3,0,0]} />
            <Bar dataKey="scans" fill="#a855f7" name="Scans" radius={[3,3,0,0]} />
            <Bar dataKey="logins" fill="#00ff88" name="Logins" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scan Type Pie */}
      {scanTypes.length > 0 && (
        <div className="cyber-card p-6">
          <h4 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6">Scan Type Distribution</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={scanTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                {scanTypes.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
