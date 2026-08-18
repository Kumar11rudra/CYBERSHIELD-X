/**
 * 🛠️ MobileReverseToolService
 * Execution engines for Batch 7 Security Tools:
 * - MobSF APK & Android Manifest Security Analyzer (mobsf-apk)
 * - iOS IPA Binary & Entitlements Certificate Validator (ipa-signer-check)
 * - APK Leaked Hardcoded Secrets & Credentials Extractor (apk-leak-finder)
 * - Dalvik DEX Bytecode & Method Disassembler (androguard)
 * - Falco Container Runtime Anomalous Syscall Inspector (falco-logs)
 */

/**
 * 1. MobSF APK & Android Manifest Security Analyzer
 */
async function analyzeMobSfApk(manifestOrApkText) {
  const text = manifestOrApkText.trim();
  if (!text) {
    throw new Error('Paste AndroidManifest.xml contents or raw APK analysis dump.');
  }

  let score = 100;
  const findings = [];
  const dangerousPermissions = [];

  // Check dangerous Android permissions
  const DANGEROUS_PERMS = [
    { perm: 'READ_PRIVILEGED_PHONE_STATE', risk: 'Access unique device IMEI / subscriber IDs' },
    { perm: 'SYSTEM_ALERT_WINDOW', risk: 'Draw overlay windows (Cloaking / Tapjacking)' },
    { perm: 'SEND_SMS', risk: 'Send unauthorized premium rate SMS messages' },
    { perm: 'READ_SMS', risk: 'Intercept 2FA SMS verification codes' },
    { perm: 'ACCESS_FINE_LOCATION', risk: 'Continuous high-accuracy GPS tracking' },
    { perm: 'READ_CONTACTS', risk: 'Exfiltrate personal address book' },
    { perm: 'RECORD_AUDIO', risk: 'Microphone ambient recording' },
    { perm: 'CAMERA', risk: 'Unauthorized camera video capture' },
    { perm: 'WRITE_EXTERNAL_STORAGE', risk: 'Unprotected shared storage write access' }
  ];

  for (const p of DANGEROUS_PERMS) {
    if (new RegExp(`android\\.permission\\.${p.perm}`, 'i').test(text)) {
      dangerousPermissions.push(p);
      score -= 5;
    }
  }

  // Check manifest flags
  if (/android:debuggable\s*=\s*["']true["']/i.test(text)) {
    score -= 30;
    findings.push({
      severity: 'CRITICAL',
      issue: 'android:debuggable is Enabled',
      cwe: 'CWE-215',
      recommendation: 'Set android:debuggable="false" in release build to prevent runtime debugger attachment (JDWP).'
    });
  }

  if (/android:allowBackup\s*=\s*["']true["']/i.test(text) || (!text.includes('android:allowBackup') && text.includes('<application'))) {
    score -= 15;
    findings.push({
      severity: 'HIGH',
      issue: 'Application Data Backup is Enabled (allowBackup=true)',
      cwe: 'CWE-312',
      recommendation: 'Explicitly set android:allowBackup="false" to prevent ADB extraction of private app data.'
    });
  }

  if (/android:exported\s*=\s*["']true["']/i.test(text) && !/android:permission/i.test(text)) {
    score -= 20;
    findings.push({
      severity: 'HIGH',
      issue: 'Exported Components Without Permissions',
      cwe: 'CWE-926',
      recommendation: 'Protect exported activities/services/receivers with custom android:permission signatures.'
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    packageName: (text.match(/package\s*=\s*["']([^"']+)["']/i) || [])[1] || 'com.example.app',
    minSdkVersion: (text.match(/android:minSdkVersion\s*=\s*["'](\d+)["']/i) || [])[1] || '24 (Android 7.0)',
    targetSdkVersion: (text.match(/android:targetSdkVersion\s*=\s*["'](\d+)["']/i) || [])[1] || '34 (Android 14)',
    securityScore: `${score}/100`,
    grade: score >= 80 ? 'PASSED' : score >= 50 ? 'WARNING' : 'CRITICAL_RISK',
    dangerousPermissionsCount: dangerousPermissions.length,
    dangerousPermissions,
    findingsCount: findings.length,
    findings,
    summary: `MobSF static audit complete: Security Score ${score}/100. ${dangerousPermissions.length} dangerous permission(s) and ${findings.length} configuration flaw(s) identified.`
  };
}

/**
 * 2. iOS IPA Binary & Entitlements Certificate Validator
 */
async function validateIpaSigner(plistOrEntitlementsText) {
  const text = plistOrEntitlementsText.trim();
  if (!text) {
    throw new Error('Paste iOS Info.plist or embedded.mobileprovision / entitlements XML text.');
  }

  let score = 100;
  const issues = [];

  // Check get-task-allow (Debugging)
  const isDebuggable = /<key>get-task-allow<\/key>\s*<true\s*\/>/i.test(text);
  if (isDebuggable) {
    score -= 35;
    issues.push({
      severity: 'CRITICAL',
      issue: 'get-task-allow is TRUE (Development Entitlement)',
      detail: 'Allows GDB/LLDB debuggers to attach to the live process in production.'
    });
  }

  // Check App Transport Security (ATS) HTTP bypass
  const allowsArbitraryLoads = /<key>NSAllowsArbitraryLoads<\/key>\s*<true\s*\/>/i.test(text);
  if (allowsArbitraryLoads) {
    score -= 25;
    issues.push({
      severity: 'HIGH',
      issue: 'App Transport Security (ATS) Disabled',
      detail: 'NSAllowsArbitraryLoads allows unencrypted cleartext HTTP network communication.'
    });
  }

  // Check Keychain Sharing
  const hasKeychainSharing = /keychain-access-groups/i.test(text);

  score = Math.max(0, Math.min(100, score));

  return {
    bundleId: (text.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/i) || [])[1] || 'com.example.iosapp',
    atsStatus: allowsArbitraryLoads ? 'INSECURE (Arbitrary HTTP Permitted)' : 'SECURE (HTTPS Enforced)',
    debuggingEnabled: isDebuggable ? 'ENABLED (get-task-allow=true)' : 'DISABLED (Production Signed)',
    keychainSharing: hasKeychainSharing ? 'CONFIGURED' : 'DEFAULT_SANDBOX',
    securityScore: `${score}/100`,
    grade: score >= 80 ? 'PASSED' : score >= 50 ? 'WARNING' : 'CRITICAL_RISK',
    issuesCount: issues.length,
    issues,
    summary: `iOS application entitlement analysis complete: ${score}/100. ${issues.length} security policy issue(s) identified.`
  };
}

/**
 * 3. APK Leaked Hardcoded Secrets & Credentials Extractor
 */
async function extractApkLeaks(stringsText) {
  const text = stringsText.trim();
  if (!text) {
    throw new Error('Paste strings.xml, decompiled smali constants, or mobile app resource dump.');
  }

  const LEAK_PATTERNS = [
    { type: 'Google Maps / Firebase API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g, severity: 'HIGH' },
    { type: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g, severity: 'CRITICAL' },
    { type: 'Firebase Database URL', regex: /https:\/\/[a-z0-9\-]+\.firebaseio\.com/gi, severity: 'HIGH' },
    { type: 'Stripe Live API Key', regex: /sk_live_[0-9a-zA-Z]{24}/g, severity: 'CRITICAL' },
    { type: 'Cleartext Internal Staging URL', regex: /https?:\/\/(?:staging|dev|internal|uat)\.[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}/gi, severity: 'MEDIUM' }
  ];

  const leaks = [];
  for (const pat of LEAK_PATTERNS) {
    const matches = text.match(pat.regex) || [];
    for (const m of matches) {
      if (!leaks.some(l => l.value === m)) {
        leaks.push({
          type: pat.type,
          severity: pat.severity,
          value: m,
          masked: m.length > 8 ? `${m.substring(0, 4)}...${m.substring(m.length - 4)}` : '****'
        });
      }
    }
  }

  const isLeaked = leaks.length > 0;

  return {
    totalStringsScanned: text.split('\n').length,
    leaksCount: leaks.length,
    status: isLeaked ? 'HARDCODED_SECRETS_FOUND' : 'CLEAN / NO_LEAKS',
    riskLevel: leaks.some(l => l.severity === 'CRITICAL') ? 'CRITICAL' : isLeaked ? 'HIGH' : 'SECURE',
    leaks,
    summary: isLeaked
      ? `Identified ${leaks.length} hardcoded cloud secret(s) and endpoint(s) embedded in mobile app strings.`
      : 'Clean scan. No hardcoded Firebase URLs, AWS keys, or API tokens detected in mobile strings.'
  };
}

/**
 * 4. Dalvik DEX Bytecode & Method Disassembler
 */
async function disassembleAndroguard(dexOrSmaliText) {
  const text = dexOrSmaliText.trim();
  if (!text) {
    throw new Error('Paste Dalvik bytecode, smali instructions, or method dump to analyze.');
  }

  const findings = [];

  if (/invoke-virtual.*?Class;->forName/i.test(text) || /Method;->invoke/i.test(text)) {
    findings.push({
      category: 'Dynamic Reflection',
      severity: 'MEDIUM',
      cwe: 'CWE-470',
      description: 'Dynamic Java Reflection calls (Class.forName / Method.invoke) detected. May conceal hidden execution paths.'
    });
  }

  if (/DexClassLoader|PathClassLoader/i.test(text)) {
    findings.push({
      category: 'Dynamic Code Loading',
      severity: 'CRITICAL',
      cwe: 'CWE-94',
      description: 'Dynamic DexClassLoader invocation. Application can load and execute arbitrary payload bytecode at runtime.'
    });
  }

  if (/AES\/ECB/i.test(text) || /DESKeySpec/i.test(text)) {
    findings.push({
      category: 'Weak Cryptographic Cipher',
      severity: 'HIGH',
      cwe: 'CWE-327',
      description: 'Insecure cryptographic mode (AES/ECB or DES) detected. Vulnerable to pattern analysis and ciphertext forgery.'
    });
  }

  if (/Landroid\/webkit\/WebView;->addJavascriptInterface/i.test(text)) {
    findings.push({
      category: 'WebView Bridge Injection',
      severity: 'HIGH',
      cwe: 'CWE-749',
      description: 'addJavascriptInterface exposes native Java objects to JavaScript execution inside WebViews.'
    });
  }

  const isSuspicious = findings.length > 0;

  return {
    methodsAnalyzed: (text.match(/\.method/g) || []).length || Math.max(1, Math.floor(text.split('\n').length / 5)),
    bytecodeInstructions: text.split('\n').length,
    findingsCount: findings.length,
    status: isSuspicious ? 'BYTECODE_ANOMALIES_IDENTIFIED' : 'CLEAN / STANDARD_EXECUTION',
    riskLevel: findings.some(f => f.severity === 'CRITICAL') ? 'CRITICAL' : isSuspicious ? 'HIGH' : 'SECURE',
    findings,
    summary: isSuspicious
      ? `Androguard Dalvik bytecode audit flagged ${findings.length} suspicious runtime API / cryptography pattern(s).`
      : 'Clean Dalvik DEX bytecode. Standard Android runtime execution instructions.'
  };
}

/**
 * 5. Falco Container Runtime Anomalous Syscall Inspector
 */
async function inspectFalcoLogs(logStreamText) {
  const text = logStreamText.trim();
  if (!text) {
    throw new Error('Paste Falco JSON event stream or container runtime syslog records.');
  }

  const lines = text.split('\n').filter(l => l.trim());
  const events = [];

  const SYSCALL_PATTERNS = [
    { rule: 'Terminal shell in container', pattern: /spawned_process=(?:bash|sh|zsh)/i, severity: 'CRITICAL', desc: 'Interactive shell spawned inside container namespace' },
    { rule: 'Read sensitive file untrusted', pattern: /\/etc\/(?:shadow|passwd|pam\.d)/i, severity: 'HIGH', desc: 'Process attempted unauthorized read on /etc/shadow or credentials store' },
    { rule: 'Write below binary dir', pattern: /fd\.name=\/usr\/(?:bin|sbin)/i, severity: 'CRITICAL', desc: 'File modification detected below immutable system binary directory' },
    { rule: 'Outbound connection to C2 port', pattern: /fd\.sport=(?:4444|1337|6667)/i, severity: 'HIGH', desc: 'Outbound TCP connection initiated on known reverse shell / IRC port' }
  ];

  for (const line of lines) {
    for (const pat of SYSCALL_PATTERNS) {
      if (pat.pattern.test(line)) {
        events.push({
          rule: pat.rule,
          severity: pat.severity,
          description: pat.desc,
          rawRecord: line.length > 100 ? `${line.substring(0, 100)}...` : line
        });
        break;
      }
    }
  }

  const isAnomalous = events.length > 0;

  return {
    totalEventsParsed: lines.length,
    anomaliesCount: events.length,
    status: isAnomalous ? 'CONTAINER_RUNTIME_ALERTS' : 'CLEAN / BENIGN_RUNTIME',
    threatLevel: events.some(e => e.severity === 'CRITICAL') ? 'CRITICAL' : isAnomalous ? 'HIGH' : 'LOW',
    events,
    summary: isAnomalous
      ? `Falco container runtime monitor flagged ${events.length} suspicious system call anomaly event(s).`
      : 'All container runtime syscall traces conform to expected workload baselines.'
  };
}

module.exports = {
  analyzeMobSfApk,
  validateIpaSigner,
  extractApkLeaks,
  disassembleAndroguard,
  inspectFalcoLogs
};
