const CapabilityAdapter = require('../CapabilityAdapter');
const AdapterResponseDTO = require('../dto/AdapterResponseDTO');
const http = require('http');
const https = require('https');

class HttpAdapter extends CapabilityAdapter {
    async initialize() {
        return true;
    }

    async resolveContract(request) {
        return { plannedExecution: 'http_request', status: 'ready' };
    }

    async execute(request) {
        return new Promise((resolve) => {
            const url = request.parameters.url;
            const method = request.parameters.method || 'GET';
            const headers = request.parameters.headers || {};
            const body = request.parameters.body;
            
            if (!url) {
                return resolve(AdapterResponseDTO.failure({
                    stderr: 'Missing url parameter',
                    exitCode: 1,
                    metadata: { provider: 'HttpAdapter' }
                }));
            }

            const startTime = Date.now();
            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch (err) {
                return resolve(AdapterResponseDTO.failure({
                    stderr: `Invalid URL: ${err.message}`,
                    exitCode: 1,
                    metadata: { provider: 'HttpAdapter' }
                }));
            }

            const client = parsedUrl.protocol === 'https:' ? https : http;
            const options = {
                method,
                headers,
                timeout: request.timeout || 30000
            };

            const req = client.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const duration = Date.now() - startTime;
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(AdapterResponseDTO.success({
                            stdout: data,
                            duration,
                            exitCode: 0,
                            metadata: { provider: 'HttpAdapter', statusCode: res.statusCode }
                        }));
                    } else {
                        resolve(AdapterResponseDTO.failure({
                            stdout: data,
                            stderr: `HTTP Error: ${res.statusCode} ${res.statusMessage}`,
                            duration,
                            exitCode: res.statusCode,
                            metadata: { provider: 'HttpAdapter', statusCode: res.statusCode }
                        }));
                    }
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(AdapterResponseDTO.failure({
                    stderr: `Request timed out after ${options.timeout}ms`,
                    duration: Date.now() - startTime,
                    exitCode: 124,
                    metadata: { provider: 'HttpAdapter', timeout: true }
                }));
            });

            req.on('error', (err) => {
                resolve(AdapterResponseDTO.failure({
                    stderr: `Request error: ${err.message}`,
                    duration: Date.now() - startTime,
                    exitCode: 1,
                    metadata: { provider: 'HttpAdapter' }
                }));
            });

            if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                req.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
            req.end();
        });
    }
}
module.exports = HttpAdapter;
