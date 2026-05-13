import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { formatApiError, getPasswordRequirements, isPasswordStrongEnough } from '../utils/authValidation';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({
    token: tokenFromUrl,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const copy = {
    mismatch: 'Passwords do not match',
    success: 'Password reset successful',
    failed: 'Password reset failed',
    title: 'SET NEW PASSWORD',
    desc: 'Create a new password for your account',
    token: 'Reset Token',
    tokenPlaceholder: 'Paste reset token or open reset link',
    newPassword: 'New Password',
    newPlaceholder: '12+ chars with upper/lowercase, number, and @$!%*?&',
    confirm: 'Confirm Password',
    confirmPlaceholder: 'Repeat new password',
    helper: 'Reset links expire automatically for safety. If this token is expired, request a fresh one.',
    passwordNeeds: 'Use 12+ characters with uppercase, lowercase, number, and special character.',
    loading: 'Updating password...',
    submit: 'Reset Password',
    needNew: 'Need a new link?',
    again: 'Request again →',
  };
  const requirements = getPasswordRequirements(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error(copy.mismatch);
      return;
    }

    if (!isPasswordStrongEnough(form.password)) {
      toast.error(requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.label).join(' • '));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: form.token,
        password: form.password,
      });
      toast.success(res.data.message || copy.success);
      navigate('/login');
    } catch (err) {
      toast.error(formatApiError(err, copy.failed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="cyber-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-cyber-green/30 rounded mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--cyber-green-rgb))" strokeWidth="1.5">
                <path d="M12 6v6l4 2" />
                <path d="M21 12a9 9 0 1 1-3.2-6.9" />
              </svg>
            </div>
            <h1 className="font-display text-xl text-cyber-text tracking-widest">{copy.title}</h1>
            <p className="font-mono text-cyber-muted text-xs mt-1">{copy.desc}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider mb-1.5">
                {copy.token}
                </label>
              <input
                type="text"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                className="cyber-input"
                placeholder={copy.tokenPlaceholder}
                required
                autoComplete="off"
              />
            </div>

            <div>
                <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider mb-1.5">
                {copy.newPassword}
                </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="cyber-input"
                placeholder={copy.newPlaceholder}
                required
                minLength={12}
                autoComplete="new-password"
              />
              {form.password && (
                <div className="mt-3 space-y-2">
                  <p className="font-mono text-[10px] text-cyber-muted">
                    {copy.passwordNeeds}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {requirements.map((requirement) => (
                      <div key={requirement.label} className="flex items-center gap-1.5">
                        <span className={`text-[10px] ${requirement.met ? 'text-cyber-green' : 'text-cyber-muted/50'}`}>
                          {requirement.met ? '✓' : '○'}
                        </span>
                        <span className={`font-mono text-[9px] ${requirement.met ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                          {requirement.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
                <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider mb-1.5">
                {copy.confirm}
                </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="cyber-input"
                placeholder={copy.confirmPlaceholder}
                required
                autoComplete="new-password"
              />
            </div>

            <p className="font-mono text-xs text-cyber-muted">
              {copy.helper}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button-primary py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                <><div className="w-4 h-4 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" /> {copy.loading}</>
              ) : copy.submit}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-cyber-muted text-xs">
            {copy.needNew}{' '}
            <Link to="/forgot-password" className="text-cyber-accent hover:underline">{copy.again}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
