/**
 * Email Intelligence Service
 * 100% Local / Simulated Offline Version
 */
const verifyEmailIntegrity = async (email) => {
  const emailNorm = String(email || '').trim().toLowerCase();
  const isDisposable = emailNorm.includes('temp') || emailNorm.includes('mailinator') || emailNorm.includes('yopmail');
  const isRole = emailNorm.startsWith('admin@') || emailNorm.startsWith('support@') || emailNorm.startsWith('info@');
  
  return {
    source: 'CyberShield-X Email Lab (Local)',
    status: 'simulated',
    analysis: {
      isValid: emailNorm.includes('@') && emailNorm.split('@')[1].includes('.'),
      isDisposable,
      isRoleAccount: isRole,
      riskScore: isDisposable ? 85 : isRole ? 20 : 5
    },
    note: 'Offline email integrity scan completed.'
  };
};

module.exports = { verifyEmailIntegrity };
