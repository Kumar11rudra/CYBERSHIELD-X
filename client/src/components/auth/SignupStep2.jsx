import React from 'react';
import { motion } from 'framer-motion';
import MobileInput from './MobileInput';
import EmailOtpSection from './EmailOtpSection';
import TermsCheckbox from './TermsCheckbox';
import NavigationButtons from './NavigationButtons';

export default function SignupStep2({
  t,
  form,
  errors,
  updateForm,
  setStep,
  loading,
  termsAccepted,
  setTermsAccepted,
  emailOtpSent,
  emailOtpVerified,
  emailOtpVerifying,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  handleSubmit,
  COUNTRY_CODES,
}) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="font-display text-2xl font-bold text-white">
        Profile Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
            Full Name
          </label>
          <input
            value={form.fullName}
            onChange={(e) => updateForm('fullName', e.target.value)}
            className={`w-full bg-white/[0.03] border ${
              errors.fullName ? 'border-red-500/50' : 'border-white/10'
            } rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50`}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
            Age
          </label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => updateForm('age', e.target.value)}
            className={`w-full bg-white/[0.03] border ${
              errors.age ? 'border-red-500/50' : 'border-white/10'
            } rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50`}
            placeholder="18"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
            Gender
          </label>
          <select
            value={form.gender}
            onChange={(e) => updateForm('gender', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
            Country
          </label>
          <input
            value={form.country}
            onChange={(e) => updateForm('country', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50"
            placeholder="India"
          />
        </div>
      </div>

      <MobileInput
        countryCode={form.countryCode}
        mobileNumber={form.mobileNumber}
        updateForm={updateForm}
        COUNTRY_CODES={COUNTRY_CODES}
      />

      <EmailOtpSection
        email={form.email}
        emailOtp={form.emailOtp}
        emailOtpSent={emailOtpSent}
        emailOtpVerified={emailOtpVerified}
        emailOtpVerifying={emailOtpVerifying}
        handleSendEmailOtp={handleSendEmailOtp}
        handleVerifyEmailOtp={handleVerifyEmailOtp}
        updateForm={updateForm}
      />

      <TermsCheckbox
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
      />

      <NavigationButtons
        onBack={() => setStep(1)}
        submitDisabled={!emailOtpVerified || !termsAccepted}
        loading={loading}
        submitText="Complete Registration"
        loadingText="Finalizing Registry..."
      />
    </motion.div>
  );
}