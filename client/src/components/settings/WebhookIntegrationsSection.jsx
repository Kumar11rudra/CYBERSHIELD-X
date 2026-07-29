import React from 'react';

/**
 * WebhookIntegrationsSection Component
 * Configures threat alert integration hooks for third-party systems like Slack or Discord.
 */
const WebhookIntegrationsSection = React.memo(({
  webhookUrl,
  setWebhookUrl,
  webhookSaving,
  webhookTesting,
  onWebhookSave,
  onWebhookTest,
  t,
}) => {
  return (
    <section className="cyber-bento-card p-8">
      <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
        {t('settings.integrations', 'External Integrations')}
      </h2>

      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
        <div>
          <p className="text-sm font-bold text-white mb-1">
            {t('settings.webhookAlerts', 'Webhook Threat Alerts')}
          </p>
          <p className="text-xs text-cyber-muted">
            {t(
              'settings.webhookDescription',
              'Receive real-time notifications on Discord, Slack, or custom endpoints when high-risk threats are detected.'
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyber-accent transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={onWebhookSave}
              disabled={webhookSaving}
              className="px-6 py-3 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent/20 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {webhookSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </button>
            <button
              onClick={onWebhookTest}
              disabled={webhookTesting || !webhookUrl}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {webhookTesting ? 'Ping...' : 'Test'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default WebhookIntegrationsSection;
