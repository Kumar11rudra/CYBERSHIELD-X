const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Trivy Intelligence Service
 * Performs local vulnerability and misconfiguration scanning for Cloud & Containers.
 */

const scanTarget = async (target, type = 'image') => {
  try {
    // Command selection based on target type
    const command = type === 'config' 
      ? `trivy conf ${target} --format json` 
      : `trivy image ${target} --format json --severity HIGH,CRITICAL`;

    console.log(`[TRIVY] Running scan: ${command}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const results = JSON.parse(stdout);
    
    return {
      source: 'Trivy Open-Source',
      target,
      type,
      vulnerabilities: results.Results || [],
      status: 'success',
      scannedAt: new Date()
    };
  } catch (error) {
    console.error('[TRIVY ERROR]', error.message);
    return { 
      error: 'Trivy engine not found or scan failed.', 
      note: 'Ensure Trivy is installed on the local server: https://aquasecurity.github.io/trivy/',
      status: 'failed'
    };
  }
};

module.exports = { scanTarget };
