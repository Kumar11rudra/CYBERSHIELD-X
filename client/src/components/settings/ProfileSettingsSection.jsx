import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

/**
 * ProfileSettingsSection Component
 * Displays user identity profile card, avatar upload, and readonly credentials.
 */
const ProfileSettingsSection = React.memo(({
  user,
  avatarUploading,
  onAvatarUpload,
  t,
}) => {
  return (
    <section className="cyber-bento-card p-8">
      <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
        {t('settings.identityProfile', 'Identity Profile')}
      </h2>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-cyber-accent/30 bg-black/50">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-2xl font-bold text-cyber-accent">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] font-mono text-white text-center">
              {avatarUploading ? 'UPLOADING...' : 'CHANGE'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarUpload}
              disabled={avatarUploading}
            />
          </label>
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{user?.username}</h3>
          <p className="text-xs text-cyber-muted font-mono">
            {user?.role?.toUpperCase()} / {user?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
            {t('settings.account.username')}
          </label>
          <input
            type="text"
            disabled
            aria-label="Username"
            value={user?.username || ''}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
            {t('settings.account.email')}
          </label>
          <input
            type="text"
            disabled
            aria-label="Email"
            value={user?.email || ''}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
            {t('settings.mobileIdentifier', 'Mobile Identifier')}
          </label>
          {user?.mobileNumber ? (
            <PhoneInput
              disabled
              value={user.mobileNumber}
              containerClass="cyber-phone-input !opacity-60"
              inputClass="!w-full !bg-white/5 !border-white/10 !rounded-xl !px-4 !py-3 !text-xs !text-cyber-text !font-mono !h-auto"
              buttonClass="!bg-transparent !border-white/10 !rounded-l-xl !border-r-0"
              dropdownClass="!bg-[#0a0f18] !text-white !border-white/10"
            />
          ) : (
            <input
              type="text"
              disabled
              value={t('settings.notLinked', 'Not Linked')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed"
            />
          )}
        </div>
        <div>
          <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
            {t('settings.account.role')}
          </label>
          <input
            type="text"
            disabled
            aria-label="Role"
            value={user?.role?.toUpperCase() || 'USER'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
});

export default ProfileSettingsSection;
