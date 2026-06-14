/**
 * Payment & Identity Intelligence Service
 * 100% Local / Simulated Offline Version
 */
const verifyPaymentEntity = async (vpa) => {
  const normalized = String(vpa || '').trim().toLowerCase();
  const parts = normalized.split('@');
  const isMerchant = normalized.includes('merchant') || normalized.includes('store') || normalized.includes('billing');
  const validBanks = ['okicici', 'okhdfcbank', 'sbi', 'paytm', 'ybl', 'ibl', 'axl', 'apl'];
  
  let riskLevel = 'Low';
  let isVerified = true;
  
  if (parts.length === 2) {
    const bank = parts[1];
    if (!validBanks.includes(bank)) {
      riskLevel = 'Medium';
      isVerified = false;
    }
  } else {
    riskLevel = 'High';
    isVerified = false;
  }

  return {
    source: 'Nexus-Finance Simulator (Local)',
    status: 'simulated',
    analysis: {
      vpa,
      name: isVerified ? 'Verified Operator Node' : 'Unrecognized Entity',
      isVerified,
      riskLevel,
      merchantType: isMerchant ? 'Merchant / Business' : 'Individual'
    },
    note: 'Offline VPA scan completed.'
  };
};

module.exports = { verifyPaymentEntity };
