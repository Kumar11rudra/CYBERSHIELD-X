const axios = require('axios');

/**
 * Email Intelligence Service
 * Uses Verifalia (Free Tier) or Truemail logic for deep email validation.
 */

const VERIFALIA_BASE = 'https://api.verifalia.com/v2.4';

const verifyEmailIntegrity = async (email) => {
  const apiKey = process.env.VERIFALIA_API_KEY; // Base64 encoded 'sid:secret'
  
  if (!apiKey) {
    return {
      source: 'CyberShield-X Email Lab',
      status: 'simulated',
      analysis: {
        isValid: true,
        isDisposable: false,
        isRoleAccount: false,
        riskScore: 5
      },
      note: 'Configure VERIFALIA_API_KEY for deep mailbox-level verification.'
    };
  }

  try {
    const response = await axios.post(`${VERIFALIA_BASE}/email-validations`, {
      entries: [{ input: email }]
    }, {
      headers: { 'Authorization': `Basic ${apiKey}`, 'Content-Type': 'application/json' }
    });

    return {
      source: 'Verifalia Intel',
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error('[EMAIL VERIFY ERROR]', error.message);
    return { error: 'Email verification engine offline.', source: 'Verifalia' };
  }
};

module.exports = { verifyEmailIntegrity };
