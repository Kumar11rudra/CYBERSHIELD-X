const { integrationQueue } = require('./queueProvider');

integrationQueue.process(async (task) => {
  // Dynamic require at runtime breaks circular require chain
  const actionQueue = require('../integrations/actionQueue');
  await actionQueue.runTask(task);
});

console.log('👷 [Workers] IntegrationWorker initialized and processing SOAR playbook tasks.');
