const axios = require('axios');

/**
 * Payment & Identity Intelligence Service
 * Uses SurePass / Paytm Sandbox for verifying payment entities and UPI risks.
 */

const SUREPASS_BASE = 'https://api.surepass.io/api/v1';

const verifyPaymentEntity = async (vpa) => {
  const apiKey = process.env.SUREPASS_API_KEY;

  if (!apiKey) {
    return {
      source: 'Nexus-Finance Simulator',
      status: 'simulated',
      analysis: {
        vpa,
        name: 'Simulated User',
        isVerified: true,
        riskLevel: 'Low',
        merchantType: 'Individual'
      },
      note: 'Configure SUREPASS_API_KEY for real-time UPI/Merchant verification.'
    };
  }

  try {
    const response = await axios.post(`${SUREPASS_BASE}/bank-details/upi-verification`, {
      vpa: vpa
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });

    return {
      source: 'SurePass Finance Intel',
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error('[PAYMENT VERIFY ERROR]', error.message);
    return { error: 'Payment verification service unavailable.', source: 'SurePass' };
  }
};

module.exports = { verifyPaymentEntity };
