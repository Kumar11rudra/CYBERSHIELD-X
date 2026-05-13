/**
 * 🌪️ Nexus SOAR Drill Simulator (v1.0)
 * Purpose: Validate the autonomous defense pipeline (Detection -> Classification -> SOAR -> Response)
 * Scenario: High-Severity Ransomware C2 (Command & Control) Target Detection
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'PASTE_YOUR_ADMIN_JWT_HERE'; // Requires manual injection for real test

async function runSoarDrill() {
  console.log('🌪️ INITIALIZING SOAR DRILL SIMULATION...\n');

  // Scenario 1: Malicious IP Detection (Simulation)
  const maliciousIP = '1.2.3.4'; // Test vector
  console.log(`[DRILL] Injecting High-Risk Target: ${maliciousIP}`);

  try {
    // 1. Trigger a scan that we know will return a HIGH threat (using simulated data)
    // We'll use the 'inject-threat' endpoint to set the stage
    console.log('Step 1: Setting up threat indicator...');
    await axios.post(`${BASE_URL}/admin/inject-threat`, {
      target: maliciousIP,
      type: 'ip',
      riskLevel: 'dangerous'
    }, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });

    console.log('Step 2: Executing detection pulse (Scanning target)...');
    const scanRes = await axios.post(`${BASE_URL}/scan`, { target: maliciousIP }, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });

    const { scan } = scanRes.data;
    console.log(`[DETECTION] Target: ${scan.target} | Score: ${scan.threatScore} | Tier: ${scan.incidentTier}`);

    // 3. Verify SOAR Response
    console.log('\nStep 3: Verifying Autonomous Response (Firewall Check)...');
    const settingsRes = await axios.get(`${BASE_URL}/admin/firewall`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });

    const isBlocked = settingsRes.data.blockedIPs.includes(maliciousIP);
    if (isBlocked) {
      console.log('✅ SOAR SUCCESS: Target autonomously blocked in Global Firewall.');
    } else {
      console.log('❌ SOAR FAILURE: Target was NOT blocked. Check SOAREngine logs.');
    }

    // 4. Verify Audit Trail
    console.log('\nStep 4: Checking Forensic Audit Trail...');
    const auditRes = await axios.get(`${BASE_URL}/admin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });

    const soarAction = auditRes.data.logs.find(l => l.action.startsWith('SOAR_AUTO_'));
    if (soarAction) {
      console.log(`✅ AUDIT SUCCESS: Automated action recorded: ${soarAction.action}`);
    } else {
      console.log('❌ AUDIT FAILURE: No automated action recorded in forensics.');
    }

  } catch (err) {
    console.error(`\n❌ DRILL ABORTED: ${err.response?.data?.error || err.message}`);
    console.log('\nTIP: Ensure the server is running and ADMIN_TOKEN is valid.');
  }

  console.log('\n🏁 DRILL SIMULATION COMPLETE.');
}

runSoarDrill();
