const CapabilityAdapter = require('../CapabilityAdapter');
const AdapterResponseDTO = require('../dto/AdapterResponseDTO');

class LocalProcessAdapter extends CapabilityAdapter {
    async initialize() {
        return true;
    }

    async resolveContract(request) {
        return { plannedExecution: 'local_process', status: 'ready' };
    }

    async execute(request) {
        // Mock implementation satisfying requirements since we shouldn't actually spawn unverified commands
        // in a mock-only phase, wait, the prompt says "Replace mock execution adapters with real adapter implementations".
        // Okay, I will implement a real local process spawn using child_process.
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            
            const command = request.parameters.command;
            const args = request.parameters.args || [];
            
            if (!command) {
                return resolve(AdapterResponseDTO.failure({
                    stderr: 'Missing command parameter',
                    exitCode: 1,
                    metadata: { provider: 'LocalProcessAdapter' }
                }));
            }

            const startTime = Date.now();
            let stdout = '';
            let stderr = '';

            const child = spawn(command, args, { shell: false });
            
            let timeoutId = setTimeout(() => {
                child.kill('SIGTERM');
                resolve(AdapterResponseDTO.failure({
                    stderr: `Execution timed out after ${request.timeout}ms`,
                    duration: Date.now() - startTime,
                    exitCode: 124,
                    metadata: { provider: 'LocalProcessAdapter', timeout: true }
                }));
            }, request.timeout || 30000);

            child.stdout.on('data', data => stdout += data.toString());
            child.stderr.on('data', data => stderr += data.toString());

            child.on('error', (err) => {
                clearTimeout(timeoutId);
                resolve(AdapterResponseDTO.failure({
                    stderr: err.message,
                    duration: Date.now() - startTime,
                    exitCode: 1,
                    metadata: { provider: 'LocalProcessAdapter' }
                }));
            });

            child.on('close', code => {
                clearTimeout(timeoutId);
                const duration = Date.now() - startTime;
                if (code === 0) {
                    resolve(AdapterResponseDTO.success({
                        stdout,
                        stderr,
                        duration,
                        exitCode: code,
                        metadata: { provider: 'LocalProcessAdapter' }
                    }));
                } else {
                    resolve(AdapterResponseDTO.failure({
                        stdout,
                        stderr,
                        duration,
                        exitCode: code,
                        metadata: { provider: 'LocalProcessAdapter' }
                    }));
                }
            });
        });
    }
}
module.exports = LocalProcessAdapter;
