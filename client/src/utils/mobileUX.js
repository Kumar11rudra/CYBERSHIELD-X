/**
 * CyberShield Mobile UX Engine (Web-Safe Stub)
 * This version prevents build-time errors when Capacitor plugins are missing.
 */
export const mobileUX = {
  impact: async () => { console.log('[HAPTICS] Web bypass'); },
  vibrate: async () => { console.log('[VIBRATE] Web bypass'); },
  initNotifications: async () => { console.log('[PUSH] Web bypass'); }
};
