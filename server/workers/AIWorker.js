const { aiQueue } = require('./queueProvider');
const { generateSecurityGuidance } = require('../services/aiService');
const { generateRemediationPlan } = require('../services/remediationService');

aiQueue.process(async (jobData) => {
  const { type, payload } = jobData;
  if (type === 'guidance') {
    return await generateSecurityGuidance(payload.tool, payload.message, payload.context, payload.model);
  } else if (type === 'remediation') {
    return await generateRemediationPlan(payload.cve, payload.contextInfo);
  } else {
    throw new Error(`Unknown AI task type: ${type}`);
  }
});

console.log('👷 [Workers] AIWorker initialized and processing AI tasks.');
