import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * 🛰️ Nexus Mobile Notification Service
 * Handles real-time incident alerts for mobile SOC operators.
 */
class NotificationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async init() {
    if (!this.isNative) return;

    // Request permissions
    let perm = await PushNotifications.requestPermissions();
    if (perm.receive === 'granted') {
      await PushNotifications.register();
    }

    // Handle incoming notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
    });
  }

  /**
   * 📣 Trigger a local emergency alert
   */
  async sendLocalAlert(title, body) {
    if (!this.isNative) {
      console.log(`[BROWSER-ALERT] ${title}: ${body}`);
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'beep.wav',
          extra: null
        }
      ]
    });
  }
}

export default new NotificationService();
