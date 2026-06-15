const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
// Absolute path to the backend task log file where OTPs are logged in dev mode
const LOG_FILE_PATH = '/Users/anil/.gemini/antigravity/brain/d8e39b0e-d529-46fb-a30a-37e31a10481d/.system_generated/tasks/task-633.log';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract the latest verification code matching the target email from logs
function getLatestVerificationCode(email, type = 'signup') {
  if (!fs.existsSync(LOG_FILE_PATH)) {
    throw new Error(`Log file not found at ${LOG_FILE_PATH}`);
  }
  const content = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
  const lines = content.split('\n');
  
  if (type === 'signup') {
    // Look for:
    // 📧 [DEV] Verification email skipped — would send to: <email>
    //    Verification Code: 123456
    let foundEmail = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('[DEV] Verification email skipped') && line.includes(email)) {
        foundEmail = true;
      }
      if (foundEmail && lines[i + 1] && lines[i + 1].includes('Verification Code:')) {
        const match = lines[i + 1].match(/Verification Code:\s*(\d{6})/);
        if (match) return match[1];
      }
    }
  } else if (type === 'reset') {
    // Look for:
    // 📧 [DEV] Password reset OTP skipped — would send to: <email>
    //    OTP: 123456
    let foundEmail = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('[DEV] Password reset OTP skipped')) {
        foundEmail = true;
      }
      if (foundEmail && lines[i + 1] && lines[i + 1].includes('OTP:')) {
        const match = lines[i + 1].match(/OTP:\s*(\d{6})/);
        if (match) return match[1];
      }
    }
  }
  return null;
}

async function runFlowTest() {
  console.log('======================================================');
  console.log('🧪 Starting CyberShield X Multi-Step Auth Flow Tests');
  console.log('======================================================');

  const randomId = Math.floor(Math.random() * 1000000);
  const testUser = {
    username: `auth_flow_test_${randomId}`,
    email: `auth_flow_test_${randomId}@gmail.com`,
    password: `P@ssw0rd_${randomId}`,
    fullName: 'Integration Flow User',
    age: 28,
    gender: 'Female',
    country: 'United States',
    mobileNumber: '1234567890'
  };

  try {
    // Step 1: Request Signup OTP
    console.log(`\n[1/7] Requesting signup OTP for: ${testUser.email}...`);
    const otpRequestRes = await axios.post(`${BASE_URL}/auth/request-email-otp`, {
      email: testUser.email
    });
    console.log(`✅ Request sent: ${otpRequestRes.data.message}`);

    // Wait for file updates
    await sleep(2000);

    // Step 2: Retrieve OTP and Verify
    console.log('[2/7] Retrieving verification OTP from server console log...');
    const signupOtp = getLatestVerificationCode(testUser.email, 'signup');
    if (!signupOtp) {
      throw new Error(`Failed to retrieve verification code from logs for ${testUser.email}`);
    }
    console.log(`🔑 Retrieved OTP: ${signupOtp}`);

    console.log('[3/7] Confirming signup OTP...');
    const verifyOtpRes = await axios.post(`${BASE_URL}/auth/verify-email-otp`, {
      email: testUser.email,
      otp: signupOtp
    });
    const { verificationToken } = verifyOtpRes.data;
    console.log(`✅ OTP verified! Token: ${verificationToken}`);

    // Step 3: Complete Signup
    console.log('[4/7] Registering user account...');
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      ...testUser,
      verificationToken
    });
    console.log(`✅ Signup successful! User ID: ${signupRes.data.user.id}`);

    // Step 4: Login with credentials
    console.log('[5/7] Logging in to verify credentials...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identity: testUser.username,
      password: testUser.password
    });
    console.log(`✅ Login successful! User Role: ${loginRes.data.user.role}`);

    // Step 5: Password Reset Flow
    console.log('\n[6/7] Requesting password reset OTP...');
    const resetRequestRes = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
      identity: testUser.email
    });
    console.log(`✅ Reset requested: ${resetRequestRes.data.message}`);

    await sleep(2000);

    const resetOtp = getLatestVerificationCode(testUser.email, 'reset');
    if (!resetOtp) {
      throw new Error(`Failed to retrieve password reset OTP from logs for ${testUser.email}`);
    }
    console.log(`🔑 Retrieved Reset OTP: ${resetOtp}`);

    console.log('Verifying password reset OTP...');
    const verifyResetRes = await axios.post(`${BASE_URL}/auth/verify-reset-otp`, {
      identity: testUser.email,
      otp: resetOtp
    });
    const { resetToken } = verifyResetRes.data;
    console.log(`✅ Reset OTP verified! Token: ${resetToken}`);

    const newPassword = `NewP@ssw0rd_${randomId}`;
    console.log('Submitting new password reset...');
    const resetPasswordRes = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: resetToken,
      password: newPassword
    });
    console.log(`✅ ${resetPasswordRes.data.message}`);

    // Step 6: Verify new password login
    console.log('\n[7/7] Logging in with the new password...');
    const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identity: testUser.username,
      password: newPassword
    });
    console.log(`🎉 Login successful! Welcome back, ${newLoginRes.data.user.username}`);

    console.log('\n======================================================');
    console.log('🎉 Integration tests for all auth flows passed 100%!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration flow test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runFlowTest();
