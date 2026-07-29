import React from 'react';

export default function EmailOtpSection({
  email,
  emailOtp,
  emailOtpSent,
  emailOtpVerified,
  emailOtpVerifying,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  updateForm,
}) {
  return (
    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-6">
      {!emailOtpVerified && (
        <div className="space-y-6">
          {!emailOtpSent ? (
            <button
              type="button"
              onClick={handleSendEmailOtp}
              disabled={emailOtpVerifying}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-cyber-green font-mono text-xs font-bold uppercase tracking-widest hover:bg-cyber-green/10 transition-colors"
            >
              {emailOtpVerifying
                ? 'Generating OTP...'
                : `Send OTP to ${email}`}
            </button>
          ) : (
            <div className="space-y-4">
              <input
                maxLength={6}
                value={emailOtp}
                onChange={(e) =>
                  updateForm(
                    'emailOtp',
                    e.target.value.replace(/\D/g, '')
                  )
                }
                className="w-full bg-black/40 border border-cyber-green/30 rounded-2xl px-5 py-4 font-mono text-center tracking-[1em] text-cyber-green text-xl outline-none"
                placeholder="------"
              />
              <button
                type="button"
                onClick={handleVerifyEmailOtp}
                disabled={emailOtpVerifying}
                className="w-full py-4 bg-cyber-green text-black font-mono font-bold uppercase tracking-widest rounded-xl"
              >
                {emailOtpVerifying ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          )}
        </div>
      )}

      {emailOtpVerified && (
        <div className="text-center text-cyber-green font-mono text-sm">
          ✓ Email Authenticated
        </div>
      )}
    </div>
  );
}
