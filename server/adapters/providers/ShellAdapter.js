const CapabilityAdapter = require('../CapabilityAdapter');
const AdapterResponseDTO = require('../dto/AdapterResponseDTO');

class ShellAdapter extends CapabilityAdapter {
    async initialize() {
        return true;
    }

    async resolveContract(request) {
        return { plannedExecution: 'shell_execution', status: 'ready' };
    }

    async execute(request) {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            const command = request.parameters.command;
            
            if (!command) {
                return resolve(AdapterResponseDTO.failure({
                    stderr: 'Missing command parameter',
                    exitCode: 1,
                    metadata: { provider: 'ShellAdapter' }
                }));
            }

            const startTime = Date.now();
            
            const child = exec(command, { timeout: request.timeout || 30000 }, (error, stdout, stderr) => {
                const duration = Date.now() - startTime;
                
                if (error) {
                    if (error.killed) {
                        return resolve(AdapterResponseDTO.failure({
                            stderr: `Execution timed out after ${request.timeout}ms`,
                            duration,
                            exitCode: 124,
                            metadata: { provider: 'ShellAdapter', timeout: true }
                        }));
                    }
                    return resolve(AdapterResponseDTO.failure({
                        stdout,
                        stderr: stderr || error.message,
                        duration,
                        exitCode: error.code || 1,
                        metadata: { provider: 'ShellAdapter' }
                    }));
                }

                resolve(AdapterResponseDTO.success({
                    stdout,
                    stderr,
                    duration,
                    exitCode: 0,
                    metadata: { provider: 'ShellAdapter' }
                }));
            });
        });
    }
}
module.exports = ShellAdapter;
