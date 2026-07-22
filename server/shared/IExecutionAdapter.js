class IExecutionAdapter {
    async execute(requestDTO) {
        throw new Error("Method not implemented.");
    }

    async executeStream(requestDTO, progressCallback) {
        throw new Error("Method not implemented.");
    }

    async healthCheck() {
        throw new Error("Method not implemented.");
    }

    supports(targetType) {
        throw new Error("Method not implemented.");
    }

    metadata() {
        throw new Error("Method not implemented.");
    }
    
    _mapToStandardResponse(result, request, duration, metrics = {}) {
        return Object.freeze({
            success: true,
            status: 'COMPLETED',
            duration,
            provider: this.metadata().provider,
            providerVersion: this.metadata().providerVersion,
            timestamp: new Date().toISOString(),
            normalizedResult: result,
            rawResponse: null, // Sanitized externally
            metrics,
            warnings: [],
            errors: []
        });
    }

    _handleProviderError(error) {
        const { AdapterExecutionError } = require('../../providers/adapters/AdapterErrors');
        // Fallback for untyped errors
        if (error.name && error.name.startsWith('Adapter')) throw error;
        throw new AdapterExecutionError(error.message);
    }
}

module.exports = IExecutionAdapter;
