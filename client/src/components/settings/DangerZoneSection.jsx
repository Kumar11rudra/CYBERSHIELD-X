import React from 'react';

/**
 * DangerZoneSection Component
 * Displays dangerous account configuration options like deleting account data.
 */
const DangerZoneSection = React.memo(({ onDeleteTrigger, t }) => {
  return (
    <section className="cyber-bento-card p-8 border-red-500/20 bg-red-500/5">
      <h2 className="text-sm font-display font-bold text-cyber-red uppercase tracking-widest mb-6 border-b border-red-500/10 pb-4">
        {t('settings.dangerPerimeter', 'Danger Perimeter')}
      </h2>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold text-white mb-1">
            {t('settings.eraseNeuralData', 'Erase All Neural Core Data')}
          </p>
          <p className="text-xs text-cyber-muted max-w-md">
            {t(
              'settings.eraseDescription',
              'This will permanently delete your account and all scan history. This action cannot be reversed.'
            )}
          </p>
        </div>
        <button
          onClick={onDeleteTrigger}
          className="px-6 py-3 rounded-xl bg-red-600/20 border border-red-600/30 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
        >
          {t('settings.terminateAccount', 'Terminate Account')}
        </button>
      </div>
    </section>
  );
});

export default DangerZoneSection;
