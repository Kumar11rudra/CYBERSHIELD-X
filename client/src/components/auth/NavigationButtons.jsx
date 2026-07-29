import React from 'react';

export default function NavigationButtons({
  onBack,
  submitDisabled,
  loading,
  backText = 'Back',
  submitText = 'Complete Registration',
  loadingText = 'Finalizing Registry...',
}) {
  return (
    <div className="flex gap-4 pt-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-5 border border-white/10 text-white font-mono text-xs uppercase rounded-2xl"
        >
          {backText}
        </button>
      )}
      <button
        type="submit"
        disabled={submitDisabled || loading}
        className={`${
          onBack ? 'flex-[2]' : 'w-full'
        } py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl disabled:opacity-20 transition-all active:scale-95`}
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}
