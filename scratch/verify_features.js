const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

const toolsToTest = [
  { id: 'nmap', target: '127.0.0.1' },
  { id: 'nikto', target: 'http://localhost:3000' },
  { id: 'wazuh', target: 'soc_node_1' },
  { id: 'wiz', target: 'arn:aws:s3:::soc-assets' },
  { id: 'virustotal', target: '1.1.1.1' },
  { id: 'abuseipdb', target: '1.1.1.1' },
  { id: 'whois', target: 'google.com' },
  { id: 'email-verifier', target: 'test@example.com' },
  { id: 'upi-verifier', target: 'test@okaxis' },
  { id: 'sqlmap', target: 'http://example.com/item?id=1' },
  { id: 'splunk', target: 'system_audit_log' },
  { id: 'john', target: '5d41402abc4b2a76b9719d911017c592' },
  { id: 'hashcat', target: '5d41402abc4b2a76b9719d911017c592' },
  { id: 'autopsy', target: 'forensic_image_usb.dd' },
  { id: 'zerothreat', target: 'http://example.com' },
  { id: 'mobsf', target: 'android_operator_v1.apk' },
  { id: 'sherlock', target: 'kumar11rudra' },
  { id: 'stegano', target: 'avatar_secret.jpg' },
  { id: 'whatweb', target: 'example.com' },
  { id: 'exiftool', target: 'raw_photo_log.jpg' },
  { id: 'slither', target: 'PrimaryTokenContract.sol' },
  { id: 'metasploit', target: '127.0.0.1' },
  { id: 'trivy', target: 'postgres:15-alpine' },
  { id: 'aircrack', target: 'Office_Secure_WiFi' },
  { id: 'dirsearch', target: 'http://localhost:3000' },
  { id: 'ftk', target: '/Users/anil/Documents/evidence' },
  { id: 'volatility', target: 'memory_core_dump.raw' },
  { id: 'malware-sandbox', target: 'Win32_PE_Portable_Executable' }
];

async function runVerification() {
  console.log('==================================================');
  console.log('🧪 Starting CyberShield X Automated Feature Tests');
  console.log('==================================================');

  // Test 1: Signup without OTP
  console.log('\n[1/3] Testing Simplified Signup Flow (No OTP)...');
  const randomId = Math.floor(Math.random() * 1000000);
  const testUser = {
    username: `testuser_${randomId}`,
    email: `testuser_${randomId}@example.com`,
    password: `P@ssw0rd_${randomId}`,
    fullName: 'Test User Agent',
    age: 25,
    gender: 'Male',
    country: 'India',
    mobileNumber: '9876543210'
  };

  let cookies = [];
  try {
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log(`✅ Signup successful! User ID: ${signupRes.data.user.id}`);
    
    // Login to get session cookies
    console.log('\n[2/3] Logging in to establish authenticated session...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identity: testUser.username,
      password: testUser.password
    });
    console.log(`✅ Login successful! Session active for: ${loginRes.data.user.username}`);
    cookies = loginRes.headers['set-cookie'] || [];
  } catch (err) {
    console.error('❌ Authentication flow test failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Test 2: Tool Execution API
  console.log('\n[3/3] Testing all 20+ Threat Models execution...');
  let failedCount = 0;
  for (const tool of toolsToTest) {
    console.log(`Testing tool: ${tool.id}...`);
    try {
      const res = await axios.post(
        `${BASE_URL}/toolkit/execute`,
        { toolId: tool.id, target: tool.target },
        {
          headers: {
            Cookie: cookies.join('; '),
            'Content-Type': 'application/json'
          },
          timeout: 40000 // allow simulation steps to finish
        }
      );
      if (res.status === 200 && res.data.success) {
        console.log(`  ✅ ${tool.id} executed successfully.`);
      } else {
        console.error(`  ❌ ${tool.id} failed. Status: ${res.status}, Response:`, res.data);
        failedCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${tool.id} crashed or returned error:`, err.response?.data || err.message);
      failedCount++;
    }
  }

  console.log('\n==================================================');
  if (failedCount === 0) {
    console.log('🎉 All automated tests passed successfully!');
  } else {
    console.log(`⚠️  Verification completed with ${failedCount} failures.`);
  }
  console.log('==================================================');
  
  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
