const { integrationQueue } = require('./queueProvider');
const OutboundDispatchService = require('../services/soc/OutboundDispatchService');

integrationQueue.process(async (task) => {
  if (task && task.jobType === 'OUTBOUND_DISPATCH') {
    try {
      return await OutboundDispatchService.processJob(task);
    } catch (err) {
      console.error(`⚠️ [IntegrationWorker] Outbound job processing failed: ${err.message}`);
      return;
    }
  }
  // Dynamic require at runtime breaks circular require chain
  const actionQueue = require('../integrations/actionQueue');
  await actionQueue.runTask(task);
});

console.log('👷 [Workers] IntegrationWorker initialized and processing SOAR playbook tasks & Phase 81 outbound dispatch jobs.');
