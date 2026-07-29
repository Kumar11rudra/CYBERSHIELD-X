import React from 'react';

/**
 * PasswordRotationSection Component
 * Handles rotation of keys/passwords.
 */
const PasswordRotationSection = React.memo(({
  passForm,
  setPassForm,
  passLoading,
  onPasswordUpdate,
}) => {
  return (
    <section className="cyber-bento-card p-8">
      <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
        Neural Key Rotation
      </h2>
      <form onSubmit={onPasswordUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
              Current Key
            </label>
            <input
              type="password"
              value={passForm.current}
              onChange={(e) => setPassForm((p) => ({ ...p, current: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
              Next Gen Key
            </label>
            <input
              type="password"
              value={passForm.next}
              onChange={(e) => setPassForm((p) => ({ ...p, next: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
              Confirm Key
            </label>
            <input
              type="password"
              value={passForm.confirm}
              onChange={(e) => setPassForm((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={passLoading || !passForm.current || !passForm.next}
          className="w-full py-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent font-mono text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-cyber-accent/20 transition-all disabled:opacity-50"
        >
          {passLoading ? 'Rotating...' : 'Rotate Security Key →'}
        </button>
      </form>
    </section>
  );
});

export default PasswordRotationSection;
