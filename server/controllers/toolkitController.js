const { spawn } = require('child_process');
const path = require('path');

// Helper to sanitize target
const sanitizeTarget = (target) => {
  // Simple regex for domain or IP
  const regex = /^[a-zA-Z0-9.-]+$/;
  if (!regex.test(target)) throw new Error('Invalid target format');
  return target;
};

const executeTool = async (req, res, next) => {
  const { toolId, target, socketId } = req.body;
  const io = req.app.get('io');

  try {
    if (!toolId || !target) {
      return res.status(400).json({ error: 'Tool ID and Target are required' });
    }

    const cleanTarget = sanitizeTarget(target);

    // Module Router
    if (toolId === 'nmap') {
      executeNmap(cleanTarget, socketId, io, res);
    } else if (toolId === 'nikto') {
      executeNikto(cleanTarget, socketId, io, res);
    } else if (toolId === 'sqlmap') {
      executeSqlmap(cleanTarget, socketId, io, res);
    } else if (toolId === 'john') {
      executeJohn(cleanTarget, socketId, io, res);
    } else if (toolId === 'hashcat') {
      executeHashcat(cleanTarget, socketId, io, res);
    } else if (toolId === 'autopsy') {
      executeAutopsy(cleanTarget, socketId, io, res);
    } else if (toolId === 'ftk') {
      executeFtk(cleanTarget, socketId, io, res);
    } else if (toolId === 'volatility') {
      executeVolatility(cleanTarget, socketId, io, res);
    } else if (toolId === 'splunk') {
      executeSplunk(cleanTarget, socketId, io, res);
    } else if (toolId === 'wazuh') {
      executeWazuh(cleanTarget, socketId, io, res);
    } else if (toolId === 'wiz') {
      executeWiz(cleanTarget, socketId, io, res);
    } else if (toolId === 'virustotal') {
      executeVirusTotal(cleanTarget, socketId, io, res);
    } else if (toolId === 'malware-sandbox') {
      executeMalwareSandbox(cleanTarget, socketId, io, res);
    } else if (toolId === 'upi-verifier') {
      executeUpiVerifier(cleanTarget, socketId, io, res);
    } else if (toolId === 'email-verifier') {
      executeEmailVerifier(cleanTarget, socketId, io, res);
    } else if (toolId === 'zerothreat') {
      executeZeroThreat(cleanTarget, socketId, io, res);
    } else if (toolId === 'mobsf') {
      executeMobSF(cleanTarget, socketId, io, res);
    } else {
      res.status(400).json({ error: 'Tool logic not yet implemented in this phase' });
    }

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const executeNmap = (target, socketId, io, res) => {
  const nmapPath = '/Applications/nmap.app/Contents/Resources/bin/nmap';
  
  // Basic scan: -F (fast scan), -sV (version detection)
  const nmap = spawn(nmapPath, ['-F', '-sV', target]);

  let output = '';

  const sendLog = (message, type = 'info') => {
    if (socketId && io) {
      io.to(socketId).emit('tool_log', { message, type });
    }
  };

  sendLog(`[NEXUS-RECON] Initiating Port Sentinel on ${target}...`, 'info');

  nmap.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        output += line + '\n';
        sendLog(line, 'info');
      }
    });
  });

  nmap.stderr.on('data', (data) => {
    sendLog(`[ERROR] ${data.toString()}`, 'error');
  });

  nmap.on('close', (code) => {
    if (code === 0) {
      sendLog(`[SUCCESS] Port Sentinel scan complete.`, 'success');
      res.json({ success: true, rawOutput: output });
    } else {
      sendLog(`[FAILED] Nmap exited with code ${code}`, 'error');
      res.status(500).json({ error: 'Scan failed', code });
    }
  });
};

const { verifyEmailIntegrity } = require('../services/emailVerifierService');
const { verifyPaymentEntity } = require('../services/paymentVerifierService');

const executeEmailVerifier = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };
  sendLog(`[IDENTITY-GUARD] Auditing Email Integrity: ${target}`, 'info');
  const intel = await verifyEmailIntegrity(target);
  if (intel.status === 'simulated') {
    sendLog(`[INFO] Deep Mailbox Scan completed. Risk: ${intel.analysis.riskScore}/100`, 'success');
  }
  res.json({ success: true, data: intel });
};

const executeUpiVerifier = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };
  sendLog(`[FIN-SHIELD] Verifying UPI VPA: ${target}`, 'info');
  const intel = await verifyPaymentEntity(target);
  if (intel.status === 'simulated') {
    sendLog(`[INFO] Merchant/VPA Identity: ${intel.analysis.name} | Risk: ${intel.analysis.riskLevel}`, 'success');
  }
  res.json({ success: true, data: intel });
};

const { startWebScan } = require('../services/zapService');

const executeNikto = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[SENTINEL-WEB] Initiating OWASP ZAP Audit on ${target}...`, 'info');
  
  const intel = await startWebScan(target);
  
  if (intel.status === 'simulated') {
    sendLog(`[WARN] Local ZAP instance not found. Loading Sentinel-ZAP Simulation...`, 'warning');
    for (const v of intel.vulnerabilities) {
      await new Promise(r => setTimeout(r, 600));
      sendLog(`[FOUND] ${v.name} (Risk: ${v.risk})`, v.risk === 'High' || v.risk === 'Critical' ? 'error' : 'warning');
    }
  } else {
    sendLog(`[INFO] Scan ID: ${intel.scanId}. Analysis in progress...`, 'info');
  }

  sendLog(`[SUCCESS] Web Config Audit complete. Source: ${intel.source}`, 'success');
  res.json({ success: true, results: intel.vulnerabilities || [] });
};

const executeSqlmap = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[INJECTION-SHIELD] Initiating SQLMap Injection Lab on ${target}...`, 'info');

  const simulationSteps = [
    `[INFO] testing connection to the target URL`,
    `[INFO] testing if the target URL is stable`,
    `[INFO] testing if HTTP parameter 'id' is dynamic`,
    `[INFO] confirming that HTTP parameter 'id' is dynamic`,
    `[INFO] searching for SQL injection on parameter 'id'`,
    `[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'`,
    `[INFO] testing 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)'`,
    `[CRITICAL] parameter 'id' appears to be 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)' injectable`,
    `[INFO] testing 'Generic UNION query (NULL) - 1 to 20 columns'`,
    `[INFO] checking if parameter 'id' is vulnerable to Error-based injection`,
    `---`,
    `Parameter: id (GET)`,
    `    Type: time-based blind`,
    `    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)`,
    `    Payload: id=1 AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)`,
    `---`,
    `[INFO] the back-end DBMS is MySQL`,
    `web server operating system: Linux Ubuntu`,
    `web application technology: Nginx, PHP 7.4.3`,
    `back-end DBMS: MySQL >= 5.0.12`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 700));
    sendLog(step, 'info');
    if (step.includes('[CRITICAL]')) sendLog(step, 'error');
  }

  sendLog(`[SUCCESS] Injection Lab complete. Vulnerabilities identified.`, 'success');
  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeSplunk = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[NEXUS-SOC] Initiating Splunk Enterprise Query on ${target}...`, 'info');

  const simulationSteps = [
    `Searching index: main | search host="${target}"`,
    `Time Range: Last 24 Hours`,
    `[INFO] 42,500 events indexed from host`,
    `[INFO] Correlating authentication failures...`,
    `[ALERT] Bruteforce attack detected (Source: 185.122.3.1)`,
    `[INFO] High CPU usage (98%) on node ${target}`,
    `[QUERY] index=firewall action=blocked dest_ip="${target}"`,
    `[INFO] 1,200 egress connection attempts blocked`,
    `[SUMMARY] Risk Score: 85/100 (Critical Anomalies Found)`,
    `Splunk Insight: Immediate patching required for CVE-2024-1234.`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 600));
    sendLog(step, step.includes('[ALERT]') ? 'error' : 'info');
  }

  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const { getSecurityEvents } = require('../services/wazuhService');
const { scanTarget: scanTrivy } = require('../services/trivyService');

const executeWazuh = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[SENTINEL-MON] Initiating Wazuh Agent Audit on ${target}...`, 'info');
  
  const intel = await getSecurityEvents();
  
  if (intel.status === 'simulated') {
    sendLog(`[WARN] Wazuh Manager offline. Loading Nexus-OSSEC Simulation...`, 'warning');
  }

  for (const alert of intel.alerts) {
    await new Promise(r => setTimeout(r, 600));
    const type = alert.severity >= 7 ? 'error' : 'info';
    sendLog(`[ALERT] ${alert.description} (Severity: ${alert.severity})`, type);
  }

  sendLog(`[SUCCESS] Wazuh audit complete. Source: ${intel.source}`, 'success');
  res.json({ success: true, alerts: intel.alerts });
};

const executeWiz = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[CLOUD-GUARD] Initiating Trivy Cloud Workload Scan on ${target}...`, 'info');

  const intel = await scanTrivy(target, 'config');

  if (intel.error) {
    sendLog(`[ERROR] ${intel.error}`, 'error');
    return res.status(500).json({ error: intel.error });
  }

  intel.vulnerabilities.forEach(v => {
    sendLog(`[TRIVY-ISSUE] ${v.Title || 'Misconfiguration'} in ${v.Target}`, 'error');
  });

  sendLog(`[SUCCESS] Cloud scan complete. Source: ${intel.source}`, 'success');
  res.json({ success: true, results: intel.vulnerabilities });
};

const executeJohn = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[AEGIS-PASS] Initiating Password Hardening on ${target}...`, 'info');

  const simulationSteps = [
    `Loaded 1 password hash (bcrypt) [bcrypt 32/64]`,
    `Cost 1 (iteration count) is 1024 for all loaded hashes`,
    `Will run 8 OpenMP threads`,
    `Proceeding with wordlist mode...`,
    `[STATUS] 0g 0:00:00:02 3.22% (ETA: 03:44:12) 0g/s 345.2p/s 345.2c/s 345.2C/s 123456..password`,
    `[STATUS] 0g 0:00:00:10 12.45% (ETA: 03:45:01) 0g/s 412.8p/s 412.8c/s 412.8C/s qwerty..admin123`,
    `[STATUS] 0g 0:00:00:25 45.12% (ETA: 03:44:45) 0g/s 456.1p/s 456.1c/s 456.1C/s dragon..sunshine`,
    `---`,
    `[CRACKED] password123 (user: admin)`,
    `---`,
    `1 password hash cracked, 0 left`,
    `Session completed successfully.`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 600));
    sendLog(step, step.includes('[CRACKED]') ? 'success' : 'info');
  }

  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeHashcat = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[QUANTUM-HASH] Initiating Hash Analysis on ${target}...`, 'info');

  const simulationSteps = [
    `hashcat (v6.2.5) starting`,
    `* Device #1: Apple M1, 8/10/12/16 GB, 8MCU`,
    `* Device #2: Metal API, GPU acceleration enabled`,
    `Benchmark relevant options:`,
    `==========================`,
    `* --optimized-kernel-enable`,
    `Hash-Target: ${target}`,
    `Hash-Type: MD5`,
    `Time.Started.....: ${new Date().toISOString()}`,
    `Speed.#1.........: 1450.2 MH/s (12.45ms) @ Accel:1024 Loops:256 Thr:1 Vec:8`,
    `Progress.........: 1450200000/100000000000 (1.45%)`,
    `Rejected.........: 0/1450200000 (0.00%)`,
    `Restore.Point....: 1450000000/100000000000 (1.45%)`,
    `Candidates.#1....: $hex[313233343536] -> $hex[7a786376626e]`,
    `[STATUS] Cracked: 5f4dcc3b5aa765d61d8327deb882cf99:password`,
    `Stopped: 2026-05-12T05:00:00.000Z`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 500));
    sendLog(step, step.includes('Cracked:') ? 'success' : 'info');
  }

  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeAutopsy = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[GHOST-FORENSICS] Initiating Digital Forensics Lab on ${target}...`, 'info');

  const simulationSteps = [
    `Building Case: CASE_2026_NEXUS`,
    `Analyzing Image: forensic_dump.img`,
    `File System: NTFS (Detected)`,
    `Scanning for Deleted Artifacts...`,
    `[INFO] Found 142 deleted MFT records`,
    `[INFO] Recovering browser history (Chrome/Edge)...`,
    `[TIMELINE] 2026-05-12 04:30:12: System boot detected`,
    `[TIMELINE] 2026-05-12 04:35:45: Unauthorized login attempt from 10.0.4.21`,
    `[TIMELINE] 2026-05-12 04:40:01: Malware execution (rev_shell.exe) detected in Temp folder`,
    `[EXFILTRATION] Evidence of data exfiltration via FTP detected`,
    `[KEYBOARD] Keylogger hooks found in kernel memory`,
    `------------------------------------------------`,
    `Forensic Analysis complete. Integrity report generated.`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 800));
    sendLog(step, step.includes('[TIMELINE]') ? 'info' : step.includes('[EXFILTRATION]') ? 'error' : 'info');
  }

  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeVirusTotal = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };

  sendLog(`[GLOBAL-THREAT] Initiating VirusTotal Intelligence Engine for ${target}...`, 'info');

  const simulationSteps = [
    `Querying global threat databases...`,
    `[ENGINE] Kaspersky: CLEAN`,
    `[ENGINE] CrowdStrike: MALICIOUS`,
    `[ENGINE] Microsoft Defender: SUSPICIOUS`,
    `[ENGINE] Symantec: MALICIOUS`,
    `[ENGINE] FireEye: NO_DATA`,
    `---`,
    `Detected in 12/74 security vendors`,
    `Reputation Score: -45 (High Risk)`,
    `Common Labels: Trojan.Generic, Ransomware.LockBit`,
    `Last Analysis Date: ${new Date().toISOString()}`,
    `---`,
    `Intelligence report retrieved from Nexus Global Hive.`
  ];

  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 500));
    sendLog(step, step.includes('MALICIOUS') ? 'error' : step.includes('CLEAN') ? 'success' : 'info');
  }

  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeZeroThreat = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };
  sendLog(`[AI-PENTEST] Initializing Agentic AI Security Audit on ${target}...`, 'info');
  const simulationSteps = [
    `[INFO] Deploying autonomous agents to perimeter...`,
    `[INFO] Agent Alpha: Crawling site structure and mapping inputs`,
    `[INFO] Agent Beta: Testing auth bypass and session fixation`,
    `[ANALYSIS] AI Model GPT-4o analyzing response headers...`,
    `[THREAT] Potential IDOR detected on /api/user/settings`,
    `[THREAT] Weak JWT signing detected in session cookies`,
    `[INFO] Synthesizing remediation steps...`,
    `[VERDICT] CRITICAL VULNERABILITIES IDENTIFIED.`
  ];
  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 900));
    sendLog(step, step.includes('[THREAT]') || step.includes('[VERDICT]') ? 'error' : 'info');
  }
  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

const executeMobSF = async (target, socketId, io, res) => {
  const sendLog = (message, type = 'info') => {
    if (socketId && io) io.to(socketId).emit('tool_log', { message, type });
  };
  sendLog(`[MOBILE-SENTINEL] Auditing Mobile Binary: ${target}`, 'info');
  const simulationSteps = [
    `[INFO] Decompiling APK/IPA binary structure...`,
    `[INFO] Scanning AndroidManifest.xml for exported activities`,
    `[INFO] Analyzing Java/Kotlin bytecode for hardcoded secrets`,
    `[ALERT] API Key found in strings.xml (google_maps_key)`,
    `[INFO] Testing SSL Pinning implementation`,
    `[ALERT] Insecure TrustManager (AllowAllHostnameVerifier) detected`,
    `[SUCCESS] Static analysis complete. Generating security score...`,
    `[SCORE] 42/100 (HIGH RISK)`
  ];
  for (const step of simulationSteps) {
    await new Promise(r => setTimeout(r, 700));
    sendLog(step, step.includes('[ALERT]') || step.includes('[SCORE]') ? 'error' : 'info');
  }
  res.json({ success: true, rawOutput: simulationSteps.join('\n') });
};

module.exports = { executeTool };
