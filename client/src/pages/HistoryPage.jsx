import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import { useTranslation } from 'react-i18next';

const RISK_COLORS = { safe: '#00ff88', low: '#ffdd00', medium: '#ff8c00', dangerous: '#ff2244' };

export default function HistoryPage() {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ riskLevel: '', targetType: '', search: '' });
  const [draftFilters, setDraftFilters] = useState({ riskLevel: '', targetType: '', search: '' });
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/history', { params });
      setScans(res.data.scans);
      setPagination(res.data.pagination);
    } catch {
      toast.error(t('history.error'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('history.confirmDelete', 'Delete this scan record?'))) return;
    setDeleting(id);
    try {
      await api.delete(`/history/${id}`);
      setScans((prev) => prev.filter((s) => s._id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success(t('history.deleteSuccess', 'Scan deleted'));
    } catch {
      toast.error(t('history.deleteFailed', 'Delete failed'));
    } finally {
      setDeleting(null);
    }
  };

  const handleExportPDF = async (id) => {
    try {
      const res = await api.get(`/history/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cybershield-scan-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('toast.exportSuccess'));
    } catch {
      toast.error(t('history.exportFailed', 'PDF export failed'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-cyber-text tracking-widest">{t('history.title')}</h1>
          <p className="font-mono text-cyber-muted text-xs mt-1">
            {pagination.total} {t('history.totalScans', 'total scan')}{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/dashboard" className="font-mono text-xs text-cyber-muted hover:text-cyber-accent uppercase tracking-widest transition-colors">
          ← {t('navigation.dashboard')}
        </Link>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t('history.searchPlaceholder', 'Search targets...')}
          value={draftFilters.search}
          onChange={(e) => setDraftFilters({ ...draftFilters, search: e.target.value })}
          className="cyber-input flex-1 min-w-[200px] h-10 text-sm"
        />
        <select
          value={draftFilters.riskLevel}
          onChange={(e) => setDraftFilters({ ...draftFilters, riskLevel: e.target.value })}
          className="cyber-input w-40 h-10 text-sm"
        >
          <option value="">{t('history.allRiskLevels', 'All Risk Levels')}</option>
          {['safe', 'low', 'medium', 'dangerous'].map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          value={draftFilters.targetType}
          onChange={(e) => setDraftFilters({ ...draftFilters, targetType: e.target.value })}
          className="cyber-input w-36 h-10 text-sm"
        >
          <option value="">{t('history.allTypes', 'All Types')}</option>
          <option value="url">URL</option>
          <option value="ip">IP</option>
          <option value="domain">Domain</option>
          <option value="hash">Hash</option>
        </select>
        <button
          onClick={() => {
            const cleared = { riskLevel: '', targetType: '', search: '' };
            setDraftFilters(cleared);
            setFilters(cleared);
          }}
          className="font-mono text-xs text-cyber-muted hover:text-cyber-text border border-cyber-border/40 px-3 h-10 transition-colors">
          {t('common.cancel')}
        </button>
        <button
          onClick={() => setFilters(draftFilters)}
          className="cyber-button-primary text-xs py-2 h-10"
        >
          {t('history.applyFilters', 'Apply Filters')}
        </button>
      </div>

      {/* Table */}
      <div className="cyber-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-mono text-cyber-muted">{t('history.noScans')}</p>
            <Link to="/dashboard" className="font-mono text-xs text-cyber-accent mt-2 inline-block hover:underline">
              {t('history.runFirstScan', 'Run your first scan →')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-surface/50">
                  {[
                    t('history.target'),
                    t('history.type'),
                    t('history.riskScore'),
                    t('history.riskLevelHeader', 'Risk Level'),
                    t('history.date'),
                    t('history.actions'),
                  ].map((h) => (
                    <th key={h} className="font-mono text-cyber-muted text-xs uppercase tracking-wider p-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan._id} className="border-b border-cyber-border/30 hover:bg-cyber-surface/40 transition-colors group">
                    <td className="p-4 max-w-xs">
                      <Link to={`/history/${scan._id}`} className="font-mono text-xs text-cyber-text hover:text-cyber-accent truncate block">
                        {scan.target}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs border border-cyber-border/40 px-2 py-0.5 text-cyber-muted rounded uppercase">
                        {scan.targetType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-display text-lg font-bold" style={{ color: RISK_COLORS[scan.riskLevel] }}>
                        {scan.threatScore}
                      </span>
                    </td>
                    <td className="p-4"><RiskBadge level={scan.riskLevel} size="sm" /></td>
                    <td className="p-4 font-mono text-xs text-cyber-muted whitespace-nowrap">
                      {new Date(scan.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/history/${scan._id}`} className="font-mono text-xs text-cyber-accent hover:underline">
                          {t('history.view')}
                        </Link>
                        <button onClick={() => handleExportPDF(scan._id)} className="font-mono text-xs text-cyber-muted hover:text-cyber-text">
                          PDF
                        </button>
                        <button
                          onClick={() => handleDelete(scan._id)}
                          disabled={deleting === scan._id}
                          className="font-mono text-xs text-cyber-red/60 hover:text-cyber-red disabled:opacity-40"
                        >
                          {deleting === scan._id ? '...' : t('history.delete')}
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchHistory(p)}
              className={`w-8 h-8 font-mono text-xs border transition-all ${
                p === pagination.page
                  ? 'border-cyber-accent text-cyber-accent bg-cyber-accent/10'
                  : 'border-cyber-border text-cyber-muted hover:border-cyber-accent/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
