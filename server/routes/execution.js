const express = require('express');
const router = express.Router();
const { authenticate, requireCapability } = require('../middleware/auth');

module.exports = (executionController) => {
    
    // Capability Source Resolver: extract capabilityId from request body
    const dynamicCapabilityResolver = (req) => req.body.capabilityId;

    router.post(
        '/start', 
        authenticate, 
        requireCapability(dynamicCapabilityResolver), 
        executionController.start
    );

    router.get(
        '/jobs', 
        authenticate, 
        executionController.listJobs
    );

    router.get(
        '/jobs/:jobId', 
        authenticate, 
        executionController.getJob
    );

    router.delete(
        '/jobs/:jobId', 
        authenticate, 
        executionController.cancelJob
    );

    router.get(
        '/jobs/:jobId/result', 
        authenticate, 
        executionController.getJobResult
    );

    return router;
};
