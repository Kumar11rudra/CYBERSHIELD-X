const {
  analyzeMobSfApk,
  validateIpaSigner,
  extractApkLeaks,
  disassembleAndroguard,
  inspectFalcoLogs
} = require('../services/mobileReverseToolService');

describe('Batch 7 Mobile Security & Static Reverse Engineering Tool Tests', () => {
  describe('analyzeMobSfApk', () => {
    it('detects dangerous Android permissions and debuggable flag in manifest', async () => {
      const manifestDump = `
        <manifest package="com.vulnerable.banking"
            xmlns:android="http://schemas.android.com/apk/res/android">
            <uses-permission android:name="android.permission.SEND_SMS"/>
            <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
            <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
            <application android:debuggable="true" android:allowBackup="true">
                <activity android:name=".MainActivity" android:exported="true"/>
            </application>
        </manifest>
      `;

      const res = await analyzeMobSfApk(manifestDump);
      expect(res).toBeDefined();
      expect(res.packageName).toBe('com.vulnerable.banking');
      expect(res.dangerousPermissionsCount).toBe(3);
      expect(res.findings.some(f => f.issue.includes('debuggable'))).toBe(true);
      expect(res.findings.some(f => f.issue.includes('allowBackup'))).toBe(true);
      expect(res.grade).toBe('CRITICAL_RISK');
    });

    it('returns passed status for secure clean Android manifest', async () => {
      const cleanManifest = `
        <manifest package="com.secure.app">
            <application android:debuggable="false" android:allowBackup="false">
                <activity android:name=".MainActivity" android:exported="false"/>
            </application>
        </manifest>
      `;

      const res = await analyzeMobSfApk(cleanManifest);
      expect(res).toBeDefined();
      expect(res.grade).toBe('PASSED');
      expect(res.dangerousPermissionsCount).toBe(0);
    });
  });

  describe('validateIpaSigner', () => {
    it('identifies get-task-allow debugging entitlement and ATS arbitrary loads', async () => {
      const entitlementsDump = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <dict>
            <key>CFBundleIdentifier</key>
            <string>com.example.fintech</string>
            <key>get-task-allow</key>
            <true/>
            <key>NSAppTransportSecurity</key>
            <dict>
                <key>NSAllowsArbitraryLoads</key>
                <true/>
            </dict>
        </dict>
        </plist>
      `;

      const res = await validateIpaSigner(entitlementsDump);
      expect(res).toBeDefined();
      expect(res.bundleId).toBe('com.example.fintech');
      expect(res.debuggingEnabled).toContain('ENABLED');
      expect(res.atsStatus).toContain('INSECURE');
      expect(res.issuesCount).toBe(2);
      expect(res.grade).toBe('CRITICAL_RISK');
    });
  });

  describe('extractApkLeaks', () => {
    it('extracts hardcoded Firebase DB URL and Google Maps API key from strings dump', async () => {
      const stringsDump = `
        <resources>
            <string name="google_maps_key">AIzaSyDx93Ksl932ksl02Ksl-029Ksl92039k</string>
            <string name="firebase_db">https://internal-banking-db.firebaseio.com</string>
            <string name="backend_api">https://staging.internal.bank.com/api/v1</string>
        </resources>
      `;

      const res = await extractApkLeaks(stringsDump);
      expect(res).toBeDefined();
      expect(res.leaksCount).toBeGreaterThanOrEqual(2);
      expect(res.status).toBe('HARDCODED_SECRETS_FOUND');
      expect(res.leaks.some(l => l.type.includes('Google Maps') || l.type.includes('Firebase'))).toBe(true);
    });
  });

  describe('disassembleAndroguard', () => {
    it('detects dynamic reflection and DexClassLoader in Dalvik smali instructions', async () => {
      const smaliDump = `
        .method public loadModule(Ljava/lang/String;)V
            .registers 3
            const-string v0, "dalvik.system.DexClassLoader"
            invoke-virtual {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;
            new-instance v1, Ldalvik/system/DexClassLoader;
            return-void
        .end method
      `;

      const res = await disassembleAndroguard(smaliDump);
      expect(res).toBeDefined();
      expect(res.findingsCount).toBeGreaterThanOrEqual(1);
      expect(res.findings.some(f => f.category.includes('Dynamic Reflection') || f.category.includes('Dynamic Code Loading'))).toBe(true);
    });
  });

  describe('inspectFalcoLogs', () => {
    it('detects interactive shell spawn and /etc/shadow access in Falco log events', async () => {
      const falcoLogs = `
        14:22:01.102 Notice spawned_process=bash container_id=e192a01 user=root (Terminal shell in container)
        14:22:05.891 Warning open file=/etc/shadow container_id=e192a01 (Read sensitive file untrusted)
      `;

      const res = await inspectFalcoLogs(falcoLogs);
      expect(res).toBeDefined();
      expect(res.anomaliesCount).toBe(2);
      expect(res.threatLevel).toBe('CRITICAL');
      expect(res.events.some(e => e.rule.includes('Terminal shell'))).toBe(true);
    });
  });
});
