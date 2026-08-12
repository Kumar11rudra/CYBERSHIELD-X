import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import GlassCard from '../common/GlassCard';
import SignupStep1 from './SignupStep1';
import SignupStep2 from './SignupStep2';

export default function SignupFormContainer({
  step,
  t,
  form,
  errors,
  updateForm,
  setStep,
  loading,
  termsAccepted,
  setTermsAccepted,
  usernameChecking,
  usernameAvailable,
  usernameSuggestions,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  emailOtpSent,
  emailOtpVerified,
  emailOtpVerifying,
  handleNext,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  handleSubmit,
  COUNTRY_CODES,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative z-10 bg-gradient-to-l from-black/80 to-transparent">
      <div className="absolute top-8 right-8 z-20">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[560px]"
      >
        {/* Mobile Header Logo */}
        <div className="text-center mb-8 lg:hidden">
          <BrandLogo size={60} />
          <h2 className="font-display text-2xl font-bold text-white tracking-widest mt-2 uppercase">
            Nexus Registry
          </h2>
        </div>

        <GlassCard padding="lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <SignupStep1
                  t={t}
                  form={form}
                  errors={errors}
                  updateForm={updateForm}
                  usernameChecking={usernameChecking}
                  usernameAvailable={usernameAvailable}
                  usernameSuggestions={usernameSuggestions}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  loading={loading}
                  handleNext={handleNext}
                />
              )}
              {step === 2 && (
                <SignupStep2
                  t={t}
                  form={form}
                  errors={errors}
                  updateForm={updateForm}
                  setStep={setStep}
                  loading={loading}
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                  emailOtpSent={emailOtpSent}
                  emailOtpVerified={emailOtpVerified}
                  emailOtpVerifying={emailOtpVerifying}
                  handleSendEmailOtp={handleSendEmailOtp}
                  handleVerifyEmailOtp={handleVerifyEmailOtp}
                  handleSubmit={handleSubmit}
                  COUNTRY_CODES={COUNTRY_CODES}
                />
              )}
            </AnimatePresence>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
