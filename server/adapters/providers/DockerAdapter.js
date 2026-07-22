const CapabilityAdapter = require('../CapabilityAdapter');
const AdapterResponseDTO = require('../dto/AdapterResponseDTO');

class DockerAdapter extends CapabilityAdapter {
    async initialize() {
        return true;
    }

    async resolveContract(request) {
        return { plannedExecution: 'docker_execution', status: 'ready' };
    }

    async execute(request) {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const image = request.parameters.image;
            const command = request.parameters.command || [];
            
            if (!image) {
                return resolve(AdapterResponseDTO.failure({
                    stderr: 'Missing docker image parameter',
                    exitCode: 1,
                    metadata: { provider: 'DockerAdapter' }
                }));
            }

            const startTime = Date.now();
            const args = ['run', '--rm', image, ...command];
            
            const child = spawn('docker', args, { shell: false });
            let stdout = '';
            let stderr = '';

            let timeoutId = setTimeout(() => {
                child.kill('SIGKILL');
                resolve(AdapterResponseDTO.failure({
                    stderr: `Docker execution timed out after ${request.timeout}ms`,
                    duration: Date.now() - startTime,
                    exitCode: 124,
                    metadata: { provider: 'DockerAdapter', timeout: true }
                }));
            }, request.timeout || 30000);

            child.stdout.on('data', data => stdout += data.toString());
            child.stderr.on('data', data => stderr += data.toString());

            child.on('error', (err) => {
                clearTimeout(timeoutId);
                resolve(AdapterResponseDTO.failure({
                    stderr: `Docker error: ${err.message}`,
                    duration: Date.now() - startTime,
                    exitCode: 1,
                    metadata: { provider: 'DockerAdapter' }
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
                        metadata: { provider: 'DockerAdapter' }
                    }));
                } else {
                    resolve(AdapterResponseDTO.failure({
                        stdout,
                        stderr,
                        duration,
                        exitCode: code,
                        metadata: { provider: 'DockerAdapter' }
                    }));
                }
            });
        });
    }
}
module.exports = DockerAdapter;
