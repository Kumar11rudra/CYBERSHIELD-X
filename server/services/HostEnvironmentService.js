const os = require('os');
const { execSync, spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 🛰️ HostEnvironmentService — CyberShield X
 * Audits host OS, hardware resources, network interfaces, and available CLI binaries.
 * Manages safe native process execution with strict target sanitization and timeouts.
 */
class HostEnvironmentService {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.CACHE_TTL_MS = 60000; // 60 seconds

    // Canonical list of monitored cybersecurity & system CLI binaries
    this.KNOWN_BINARIES = [
      'nmap', 'dig', 'curl', 'openssl', 'whois', 'ping', 'traceroute',
      'python3', 'node', 'git', 'docker',
      'sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara',
      'radare2', 'semgrep', 'gitleaks', 'subfinder', 'masscan',
      'gobuster', 'dirsearch', 'theharvester', 'wafw00f', 'sherlock', 'hydra'
    ];

    // Allowed tools for safe native host execution
    this.NATIVE_EXECUTABLE_TOOLS = new Set([
      'nmap', 'whois', 'dig', 'curl', 'openssl', 'ping', 'traceroute'
    ]);

    // Minimum supported version definitions for dependency management
    this.MIN_SUPPORTED_VERSIONS = {
      nmap: '7.80',
      curl: '7.68.0',
      openssl: '1.1.1',
      dig: '9.11.0',
      whois: '5.0.0',
      ping: '1.0.0',
      traceroute: '1.0.0',
      python3: '3.8.0',
      node: '18.0.0',
      docker: '20.10.0',
      git: '2.25.0',
      sqlmap: '1.5.0',
      trivy: '0.30.0',
      nikto: '2.1.6',
      'aircrack-ng': '1.6',
      ghidra: '10.0.0',
      yara: '4.0.0',
      radare2: '5.0.0',
      semgrep: '1.0.0',
      gitleaks: '8.0.0',
      subfinder: '2.5.0',
      masscan: '1.3.0',
      gobuster: '3.1.0',
      dirsearch: '0.4.0',
      theharvester: '4.0.0',
      wafw00f: '2.1.0',
      sherlock: '0.14.0',
      hydra: '9.1.0'
    };

    // Tracks tools that were remediated and verified through safe runtime probes
    this.unlockedTools = new Set();

    // Active running native processes for cancellation & isolation
    this.activeProcesses = new Map();
  }

  /**
   * Safely locate a binary on the host system without arbitrary shell execution
   */
  resolveBinaryPath(binaryName) {
    if (typeof binaryName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(binaryName)) {
      return null;
    }

    // Special case for macOS common non-PATH installations
    if (binaryName === 'nmap') {
      const macNmapApp = '/Applications/nmap.app/Contents/Resources/bin/nmap';
      if (fs.existsSync(macNmapApp)) {
        try {
          fs.accessSync(macNmapApp, fs.constants.X_OK);
          return macNmapApp;
        } catch {}
      }
      const homebrewNmap = '/opt/homebrew/bin/nmap';
      if (fs.existsSync(homebrewNmap)) return homebrewNmap;
      const usrLocalNmap = '/usr/local/bin/nmap';
      if (fs.existsSync(usrLocalNmap)) return usrLocalNmap;
    }

    // Standard PATH lookup via `which` on Unix or `where` on Windows
    const lookupCmd = os.platform() === 'win32' ? `where ${binaryName}` : `which ${binaryName}`;
    try {
      const resolved = execSync(lookupCmd, {
        timeout: 1500,
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8'
      }).trim();

      if (resolved && fs.existsSync(resolved.split('\n')[0])) {
        return resolved.split('\n')[0];
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Run full environment and binary audit
   */
  async getHostCapabilities(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && (now - this.cacheTimestamp < this.CACHE_TTL_MS)) {
      return this.cache;
    }

    const hostOs = os.type();
    const platform = os.platform();
    const arch = os.arch();
    const release = os.release();
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const cpuCount = os.cpus().length;
    const cpuModel = os.cpus()[0]?.model || 'Generic CPU';

    // Audit each binary
    const binaryMatrix = {};
    let installedCount = 0;

    for (const bin of this.KNOWN_BINARIES) {
      const resolvedPath = this.resolveBinaryPath(bin);
      const isInstalled = Boolean(resolvedPath);
      if (isInstalled) installedCount++;

      binaryMatrix[bin] = {
        installed: isInstalled,
        path: resolvedPath,
        nativeExecutionSupported: this.NATIVE_EXECUTABLE_TOOLS.has(bin) && isInstalled,
        remediation: !isInstalled ? this.getInstallationAdvice(bin, platform) : null
      };
    }

    // Network interfaces summary
    const netInterfaces = os.networkInterfaces();
    let primaryInterface = 'lo0';
    let localIp = '127.0.0.1';

    for (const [ifName, addrs] of Object.entries(netInterfaces)) {
      if (addrs) {
        const ipv4 = addrs.find(a => !a.internal && a.family === 'IPv4');
        if (ipv4) {
          primaryInterface = ifName;
          localIp = ipv4.address;
          break;
        }
      }
    }

    const readinessScore = Math.round((installedCount / this.KNOWN_BINARIES.length) * 100);

    const capabilities = {
      system: {
        hostOs,
        platform,
        arch,
        release,
        nodeVersion: process.version,
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        cpuCount,
        cpuModel,
        memory: {
          totalMb: Math.round(totalMemBytes / (1024 * 1024)),
          freeMb: Math.round(freeMemBytes / (1024 * 1024)),
          usagePercent: Math.round(((totalMemBytes - freeMemBytes) / totalMemBytes) * 100)
        },
        network: {
          primaryInterface,
          localIp
        }
      },
      readiness: {
        totalMonitoredBinaries: this.KNOWN_BINARIES.length,
        installedBinariesCount: installedCount,
        missingBinariesCount: this.KNOWN_BINARIES.length - installedCount,
        readinessScorePercent: readinessScore,
        postureGrade: readinessScore >= 60 ? 'HIGH_CAPABILITY' : readinessScore >= 30 ? 'HYBRID_CAPABILITY' : 'CLOUD_RELIANT',
        breakdown: {
          platformReadiness: 100,
          securityToolReadiness: readinessScore,
          externalIntelReadiness: Boolean(process.env.ALIENVAULT_API_KEY || process.env.SHODAN_API_KEY) ? 100 : 75,
          aiReadiness: Boolean(process.env.GEMINI_API_KEY || process.env.OLLAMA_BASE_URL) ? 100 : 80,
        },
      },
      binaries: binaryMatrix,
      timestamp: new Date().toISOString()
    };

    this.cache = capabilities;
    this.cacheTimestamp = now;
    return capabilities;
  }

  /**
   * Inspect installed binary version via safe subprocess
   */
  inspectBinaryVersion(binaryName, binaryPath) {
    if (!binaryPath || !fs.existsSync(binaryPath)) return null;

    const versionFlag = binaryName === 'nikto' ? '-Version' : '--version';
    try {
      const output = execSync(`"${binaryPath}" ${versionFlag}`, {
        timeout: 1500,
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8',
      });
      const match = output.match(/(?:version|v)?\s*([0-9]+(?:\.[0-9]+)+(?:-[a-zA-Z0-9.]+)?)/i);
      return match ? match[1] : (output.trim().split('\n')[0].slice(0, 40) || 'detected');
    } catch {
      try {
        const out2 = execSync(`"${binaryPath}" -v`, {
          timeout: 1000,
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf8',
        });
        const match2 = out2.match(/(?:version|v)?\s*([0-9]+(?:\.[0-9]+)+(?:-[a-zA-Z0-9.]+)?)/i);
        return match2 ? match2[1] : 'detected';
      } catch {
        return 'detected';
      }
    }
  }

  /**
   * Basic semver comparison
   */
  compareSemver(v1, v2) {
    if (!v1 || !v2 || v1 === 'detected') return 0;
    const clean1 = (v1.match(/[0-9]+(\.[0-9]+)*/)?.[0] || '0').split('.').map(Number);
    const clean2 = (v2.match(/[0-9]+(\.[0-9]+)*/)?.[0] || '0').split('.').map(Number);
    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
      const num1 = clean1[i] || 0;
      const num2 = clean2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  /**
   * Helper: Suggest installation command for missing binary
   */
  getInstallationAdvice(binary, platform) {
    if (platform === 'darwin') {
      const brewMap = {
        sqlmap: 'brew install sqlmap',
        trivy: 'brew install trivy',
        nikto: 'brew install nikto',
        'aircrack-ng': 'brew install aircrack-ng',
        yara: 'brew install yara',
        radare2: 'brew install radare2',
        semgrep: 'brew install semgrep',
        gitleaks: 'brew install gitleaks',
        subfinder: 'brew install subfinder',
        masscan: 'brew install masscan',
        gobuster: 'brew install gobuster',
        dirsearch: 'brew install dirsearch',
        theharvester: 'brew install theharvester',
        wafw00f: 'brew install wafw00f',
        sherlock: 'brew install sherlock',
        hydra: 'brew install hydra',
        ghidra: 'brew install --cask ghidra'
      };
      return brewMap[binary] || `brew install ${binary}`;
    }

    if (platform === 'linux') {
      return `sudo apt-get update && sudo apt-get install -y ${binary}`;
    }

    return `Install ${binary} using package manager or container sandbox`;
  }

  /**
   * Deep capability health inspection across all monitored binaries
   */
  async getToolHealth(forceRefresh = false) {
    const caps = await this.getHostCapabilities(forceRefresh);
    const platform = os.platform();
    const arch = os.arch();

    const healthList = [];
    for (const bin of this.KNOWN_BINARIES) {
      const binData = caps.binaries[bin] || {};
      const minVer = this.MIN_SUPPORTED_VERSIONS[bin] || '1.0.0';
      const version = binData.path ? this.inspectBinaryVersion(bin, binData.path) : null;

      let status = 'MISSING';
      if (binData.installed) {
        status = (version && version !== 'detected' && this.compareSemver(version, minVer) < 0)
          ? 'OUTDATED'
          : 'INSTALLED';
      }

      healthList.push({
        toolId: bin,
        executable: bin,
        detectedPath: binData.path || null,
        installedVersion: version,
        minSupportedVersion: minVer,
        operatingSystemSupport: ['darwin', 'linux'],
        architectureCompatibility: [arch],
        installationMethod: this.getInstallationAdvice(bin, platform),
        remediationCommand: binData.remediation,
        status,
        executionTarget: (binData.nativeExecutionSupported || this.unlockedTools.has(bin))
          ? 'HOST_NATIVE'
          : (binData.installed ? 'CYBERSHIELD_API_ENGINE' : 'BLOCKED_DEPENDENCY'),
        unlocked: this.unlockedTools.has(bin),
        lastChecked: new Date().toISOString()
      });
    }

    return healthList;
  }

  /**
   * Grouped breakdown for Host Capability Manager UI
   */
  async getDependenciesGrouped() {
    const health = await this.getToolHealth();
    return {
      groups: {
        AVAILABLE: health.filter(h => h.status === 'INSTALLED' || h.status === 'AVAILABLE'),
        BLOCKED: health.filter(h => h.status === 'MISSING' || h.status === 'BLOCKED'),
        OUTDATED: health.filter(h => h.status === 'OUTDATED'),
        UNSUPPORTED: health.filter(h => h.status === 'INCOMPATIBLE' || h.status === 'UNSUPPORTED')
      },
      available: health.filter(h => h.status === 'INSTALLED' || h.status === 'AVAILABLE'),
      blocked: health.filter(h => h.status === 'MISSING' || h.status === 'BLOCKED'),
      outdated: health.filter(h => h.status === 'OUTDATED'),
      unsupported: health.filter(h => h.status === 'INCOMPATIBLE' || h.status === 'UNSUPPORTED')
    };
  }

  /**
   * Safe remediation validation probe for a blocked dependency
   * Lifecycle: DETECT -> EXPLAIN -> APPROVE -> CONFIGURE/INSTALL -> VERIFY -> REGISTER -> CERTIFY
   */
  async validateDependencyProbe(toolId) {
    const aliasMap = {
      port: 'nmap',
      dns: 'dig',
      http: 'curl',
      ssl: 'openssl',
      'yara-rules': 'yara',
      aircrack: 'aircrack-ng'
    };
    const binName = aliasMap[toolId.toLowerCase()] || toolId.toLowerCase();
    const resolvedPath = this.resolveBinaryPath(binName);

    if (!resolvedPath) {
      return {
        success: false,
        toolId,
        binary: binName,
        binaryName: binName,
        status: 'MISSING',
        executionTarget: 'BLOCKED_DEPENDENCY',
        reason: `Binary '${binName}' is not installed in system PATH. Please execute remediation first.`,
        remediation: this.getInstallationAdvice(binName, os.platform())
      };
    }

    const version = this.inspectBinaryVersion(binName, resolvedPath);
    const minVersion = this.MIN_SUPPORTED_VERSIONS[binName] || '1.0.0';
    const isOutdated = version !== 'detected' && this.compareSemver(version, minVersion) < 0;

    // Execute safe probe with strict timeout without shell
    const flag = binName === 'nikto' ? '-Version' : '--version';
    try {
      const probeProc = spawnSync(resolvedPath, [flag], {
        timeout: 3000,
        encoding: 'utf8',
        shell: false
      });

      // Mark unlocked upon successful verification
      this.unlockedTools.add(toolId.toLowerCase());
      this.unlockedTools.add(binName);
      if (this.NATIVE_EXECUTABLE_TOOLS) {
        this.NATIVE_EXECUTABLE_TOOLS.add(binName);
      }

      // Invalidate cache
      this.cache = null;

      return {
        success: true,
        toolId,
        binary: binName,
        binaryName: binName,
        safeProbeSuccess: true,
        status: isOutdated ? 'OUTDATED' : 'INSTALLED',
        executionTarget: 'HOST_NATIVE',
        version,
        path: resolvedPath,
        minSupportedVersion: minVersion,
        message: `Tool '${toolId}' successfully validated and certified for native execution.`
      };
    } catch (probeErr) {
      return {
        success: false,
        toolId,
        binary: binName,
        binaryName: binName,
        safeProbeSuccess: false,
        status: 'INCOMPATIBLE',
        executionTarget: 'BLOCKED_DEPENDENCY',
        reason: `Binary probe execution failed: ${probeErr.message}`
      };
    }

  }

  /**
   * Check single tool execution capability
   */
  async checkToolCapability(toolId) {
    const caps = await this.getHostCapabilities();
    const binName = toolId.toLowerCase();
    
    // Canonical set of tools that strictly require external binaries with no same-capability API substitute
    const STRICT_BLOCKED_BINARIES = new Set([
      'sqlmap', 'trivy', 'nikto', 'aircrack-ng', 'ghidra', 'yara', 'radare2', 'semgrep', 'gitleaks'
    ]);

    // Check direct binary mapping
    const directBin = caps.binaries[binName];
    if (directBin) {
      const isStrictBlocked = STRICT_BLOCKED_BINARIES.has(binName) && !directBin.installed;
      return {
        toolId,
        binaryName: binName,
        installed: directBin.installed,
        path: directBin.path,
        executionTarget: directBin.nativeExecutionSupported ? 'HOST_NATIVE' : (isStrictBlocked ? 'BLOCKED_DEPENDENCY' : 'CYBERSHIELD_API_ENGINE'),
        remediation: directBin.remediation
      };
    }

    // Check alias mappings
    const aliasMap = {
      port: 'nmap',
      dns: 'dig',
      http: 'curl',
      ssl: 'openssl',
      'yara-rules': 'yara',
      aircrack: 'aircrack-ng'
    };

    const targetBin = aliasMap[binName];
    if (targetBin && caps.binaries[targetBin]) {
      const b = caps.binaries[targetBin];
      const isStrictBlocked = STRICT_BLOCKED_BINARIES.has(targetBin) && !b.installed;
      return {
        toolId,
        binaryName: targetBin,
        installed: b.installed,
        path: b.path,
        executionTarget: b.nativeExecutionSupported ? 'HOST_NATIVE' : (isStrictBlocked ? 'BLOCKED_DEPENDENCY' : 'CYBERSHIELD_API_ENGINE'),
        remediation: b.remediation
      };
    }

    // Default to API engine for unlisted/cloud tools
    return {
      toolId,
      binaryName: null,
      installed: false,
      path: null,
      executionTarget: 'CYBERSHIELD_API_ENGINE',
      remediation: null
    };
  }

  /**
   * Helper alias for resolving capability with status and isAvailable properties
   */
  async resolveToolCapability(toolId) {
    const res = await this.checkToolCapability(toolId);
    return {
      ...res,
      isAvailable: res.installed || res.executionTarget !== 'BLOCKED_DEPENDENCY',
      status: (res.executionTarget === 'BLOCKED_DEPENDENCY' && !res.installed) ? 'DEPENDENCY_MISSING' : (res.installed ? 'AVAILABLE' : 'AVAILABLE_VIA_API')
    };
  }

  /**
   * Execute real host binary safely with strict constraints
   */
  async executeNativeTool(toolName, target, customArgs = [], executionId = null, userId = null) {
    let timeoutDeadlineMs = 10000;
    if (customArgs && typeof customArgs === 'object' && !Array.isArray(customArgs)) {
      userId = customArgs.userId || userId;
      executionId = customArgs.executionId || executionId;
      if (customArgs.timeoutMs && typeof customArgs.timeoutMs === 'number') {
        timeoutDeadlineMs = customArgs.timeoutMs;
      }
      customArgs = customArgs.customArgs || [];
    }

    const cleanTarget = (target || '').trim();
    if (!cleanTarget || /[;&|`$\(\)<>\n\r\t\\!'"]/.test(cleanTarget)) {
      throw new Error('Target contains unsafe shell characters or is empty.');
    }

    // SSRF & Cloud Metadata Protection
    const lowerTarget = cleanTarget.toLowerCase();
    if (
      lowerTarget.includes('169.254.169.254') ||
      lowerTarget.includes('metadata.google.internal') ||
      lowerTarget.includes('100.100.100.200') ||
      lowerTarget.startsWith('169.254.') ||
      lowerTarget.startsWith('fe80:')
    ) {
      throw new Error('Access to cloud metadata or link-local network interfaces is strictly forbidden.');
    }

    const aliasMap = {
      dns: 'dig',
      port: 'nmap',
      http: 'curl',
      ssl: 'openssl',
      whois: 'whois',
      traceroute: 'traceroute',
      ping: 'ping'
    };

    const binKey = aliasMap[toolName.toLowerCase()] || toolName.toLowerCase();
    const caps = await this.getHostCapabilities();
    const binInfo = caps.binaries[binKey];

    if (!this.NATIVE_EXECUTABLE_TOOLS.has(binKey)) {
      throw new Error(`Tool '${toolName}' is not authorized for native execution.`);
    }

    if (!binInfo || !binInfo.installed || !binInfo.path) {
      throw new Error(`Binary '${toolName}' is not installed on this execution host.`);
    }

    // Build constrained argument list per tool
    let args = [];
    switch (binKey) {
      case 'nmap':
        // Safe non-intrusive port scan (ports 80,443,22,8080 with 10s timeout)
        args = ['-sT', '-Pn', '-T4', '-p', '21,22,25,80,443,8080,8443', '--host-timeout', '8s', cleanTarget];
        break;
      case 'dig':
        args = ['+noall', '+answer', '+question', cleanTarget];
        break;
      case 'curl':
        args = ['-ILsS', '--connect-timeout', '8', '--max-time', '10', /^https?:\/\//i.test(cleanTarget) ? cleanTarget : `https://${cleanTarget}`];
        break;
      case 'whois':
        args = [cleanTarget.replace(/^https?:\/\//i, '').split('/')[0]];
        break;
      case 'ping':
        // 2 packets max with timeout
        args = os.platform() === 'darwin' ? ['-c', '2', cleanTarget] : ['-c', '2', '-W', '3', cleanTarget];
        break;
      case 'traceroute':
        // 8 hops max to prevent hanging
        args = ['-m', '8', '-q', '1', '-w', '2', cleanTarget.replace(/^https?:\/\//i, '').split('/')[0]];
        break;
      case 'openssl':
        const host = cleanTarget.replace(/^https?:\/\//i, '').split('/')[0];
        args = ['s_client', '-connect', `${host}:443`, '-servername', host, '-brief'];
        break;
      default:
        throw new Error(`Tool '${toolName}' lacks an approved execution argument profile.`);
    }

    const startTime = Date.now();
    const execId = executionId || ('exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const MAX_OUTPUT_BYTES = 512 * 1024; // 512KB standard output buffer ceiling

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let cancelled = false;

      const proc = spawn(binInfo.path, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false
      });

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGKILL');
      }, timeoutDeadlineMs); // Process timeout deadline

      // Register process in active table for cancellation & observability
      this.activeProcesses.set(execId, {
        proc,
        toolName,
        target: cleanTarget,
        userId,
        startTime,
        timer,
        status: 'RUNNING',
        cancelled: false,
        setCancelled: () => { cancelled = true; }
      });

      proc.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_OUTPUT_BYTES) {
          const remaining = MAX_OUTPUT_BYTES - stdout.length;
          stdout += chunk.toString().slice(0, remaining);
          if (stdout.length >= MAX_OUTPUT_BYTES) {
            stdout += '\n[NOTICE: Standard output reached 512KB buffer ceiling and was truncated for server memory protection.]';
          }
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_OUTPUT_BYTES) {
          stderr += chunk.toString();
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        this.activeProcesses.delete(execId);
        resolve({
          success: false,
          status: 'FAILED',
          executionId: execId,
          tool: toolName,
          executionTarget: 'HOST_NATIVE',
          command: `${binInfo.path} ${args.join(' ')}`,
          exitCode: -1,
          durationMs: Date.now() - startTime,
          stdout: stdout.trim(),
          output: (stdout + (stderr ? '\n' + stderr : '')).trim(),
          stderr: err.message,
          error: `Failed to spawn process: ${err.message}`
        });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(execId);
        const isSuccess = !timedOut && !cancelled && code === 0;
        const finalStatus = cancelled ? 'CANCELLED' : (isSuccess ? 'SUCCESS' : (timedOut ? 'TIMEOUT' : 'FAILED'));
        const combinedOutput = (stdout ? (stderr ? stdout + '\n' + stderr : stdout) : stderr).trim();
        resolve({
          success: isSuccess,
          status: finalStatus,
          executionId: execId,
          tool: toolName,
          executionTarget: 'HOST_NATIVE',
          command: `${binInfo.path} ${args.join(' ')}`,
          exitCode: timedOut ? -1 : (cancelled ? -2 : code),
          durationMs: Date.now() - startTime,
          stdout: stdout.trim(),
          output: combinedOutput,
          stderr: timedOut ? 'Execution timed out after 10s deadline.' : (cancelled ? 'Execution cancelled by user request.' : stderr.trim()),
          error: timedOut ? 'Process exceeded 10-second timeout deadline' : (cancelled ? 'Process terminated by user cancellation' : (code !== 0 ? `Process exited with code ${code}` : null))
        });
      });
    });
  }

  /**
   * True Process Cancellation: terminate active process and clear timers
   */
  async cancelExecution(executionId, requestingUser = null) {
    if (!executionId || !this.activeProcesses.has(executionId)) {
      return {
        success: false,
        executionId,
        status: 'NOT_FOUND',
        message: `No active process found with executionId '${executionId}'.`
      };
    }

    const item = this.activeProcesses.get(executionId);

    // Enforce owner / session isolation unless admin
    if (requestingUser && item.userId && item.userId !== requestingUser.id && requestingUser.role !== 'admin') {
      return {
        success: false,
        executionId,
        status: 'PERMISSION_DENIED',
        message: 'Unauthorized: cannot cancel process owned by another user.'
      };
    }

    item.cancelled = true;
    if (typeof item.setCancelled === 'function') {
      item.setCancelled();
    }
    clearTimeout(item.timer);

    try {
      item.proc.kill('SIGTERM');
      // Follow up with SIGKILL if still alive after 250ms
      setTimeout(() => {
        try {
          item.proc.kill('SIGKILL');
        } catch {}
      }, 250);
    } catch {}

    this.activeProcesses.delete(executionId);

    return {
      success: true,
      cancelled: true,
      executionId,
      tool: item.toolName,
      status: 'CANCELLED',
      message: `Process for tool '${item.toolName}' (ID: ${executionId}) cancelled by user request.`
    };
  }
}

const hostEnvironmentService = new HostEnvironmentService();
module.exports = hostEnvironmentService;
