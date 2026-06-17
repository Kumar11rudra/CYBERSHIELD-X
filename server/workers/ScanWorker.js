const { scanQueue } = require('./queueProvider');

scanQueue.process(async (jobData) => {
  // Dynamic require at runtime breaks circular require chain
  const toolkitController = require('../controllers/toolkitController');
  await toolkitController.runScanJob(jobData);
});

console.log('👷 [Workers] ScanWorker initialized and processing scans.');
