import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success(t('auth.login.success'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="cyber-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-cyber-accent/30 rounded mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="font-display text-xl text-cyber-text tracking-widest">{t('auth.login.title')}</h1>
            <p className="font-mono text-cyber-muted text-xs mt-1">{t('auth.login.desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider mb-1.5">
                {t('auth.login.email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="cyber-input"
                placeholder={t('auth.login.emailPlaceholder')}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider">
                  {t('auth.login.password')}
                </label>
                <Link to="/forgot-password" className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-accent hover:underline">
                  {t('auth.login.forgot')}
                </Link>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="cyber-input"
                placeholder={"••••••••"}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button-primary mt-6 disabled:opacity-50"
            >
              {loading ? t('auth.login.loading') : t('auth.login.button')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-cyber-border/40 text-center">
            <p className="font-mono text-cyber-muted text-xs mb-3">
              {t('auth.login.noAccount')}
            </p>
            <Link to="/signup" className="font-mono text-xs uppercase tracking-widest text-cyber-accent hover:underline">
              {t('auth.login.create')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
