const http = require('http');
const { HttpClient, CsiHttpError } = require('../../../../server/csi/network/HttpClient');
const { NetworkExecutionContext } = require('../../../../server/csi/network/NetworkExecutionContext');
const { ResponseTooLargeError, NetworkContextExpiredError } = require('../../../../server/csi/errors/CsiErrors');

describe('HttpClient Performance and Stress', () => {
    let server;
    let client;
    let port;
    let baseUrl;

    beforeAll((done) => {
        client = new HttpClient({ maxRedirects: 3 });
        server = http.createServer((req, res) => {
            if (req.url === '/2mb-exact') {
                const data = Buffer.alloc(2 * 1024 * 1024, 'A');
                res.writeHead(200, { 'Content-Length': data.length });
                res.end(data);
            } else if (req.url === '/2mb-exceeded') {
                const data = Buffer.alloc(2 * 1024 * 1024 + 1, 'B'); // 2MB + 1 byte
                res.writeHead(200, { 'Content-Length': data.length });
                res.end(data);
            } else if (req.url === '/chunked') {
                res.writeHead(200, { 'Transfer-Encoding': 'chunked' });
                res.write('chunk1');
                setTimeout(() => {
                    res.write('chunk2');
                    res.end();
                }, 10);
            } else if (req.url === '/redirect-loop') {
                res.writeHead(302, { 'Location': '/redirect-loop' });
                res.end();
            } else if (req.url === '/timeout') {
                // Do not respond, wait for client timeout
            } else if (req.url === '/connection-reset') {
                req.socket.destroy();
            } else if (req.url === '/early-close') {
                res.writeHead(200, { 'Content-Length': 1000 });
                res.write('too short');
                req.socket.destroy();
            } else if (req.url === '/invalid-content-length') {
                res.writeHead(200, { 'Content-Length': 'invalid' });
                res.end('data');
            } else if (req.url === '/malformed-headers') {
                // Node.js HTTP server makes it hard to send truly malformed headers via writeHead.
                // But we can send duplicate/weird ones.
                res.setHeader('Weird-Header', 'a\nb');
                res.writeHead(200);
                res.end('ok');
            }
        });

        server.listen(0, () => {
            port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    const createCtx = (urlPath, timeout = 5000, responseLimit = 2 * 1024 * 1024) => {
        return new NetworkExecutionContext({
            executionId: 'test-exec',
            targetId: `${baseUrl}${urlPath}`,
            timeout,
            retryPolicy: { maxRetries: 0, backoffMs: 0 },
            responseLimit
        });
    };

    it('should successfully download exactly 2MB payload', async () => {
        const ctx = createCtx('/2mb-exact');
        const res = await client.query(ctx);
        expect(res.statusCode).toBe(200);
        expect(Buffer.byteLength(res.body, 'utf8')).toBe(2 * 1024 * 1024);
    });

    it('should throw ResponseTooLargeError for payload > 2MB', async () => {
        const ctx = createCtx('/2mb-exceeded');
        await expect(client.query(ctx)).rejects.toThrow(ResponseTooLargeError);
    });

    it('should handle chunked transfer encoding correctly', async () => {
        const ctx = createCtx('/chunked');
        const res = await client.query(ctx);
        expect(res.statusCode).toBe(200);
        expect(res.body).toBe('chunk1chunk2');
    });

    it('should throw CsiHttpError on redirect loops', async () => {
        const ctx = createCtx('/redirect-loop');
        await expect(client.query(ctx)).rejects.toThrow(CsiHttpError);
        await expect(client.query(ctx)).rejects.toThrow(/Too many redirects/);
    });

    it('should throw NetworkContextExpiredError on timeout', async () => {
        const ctx = createCtx('/timeout', 100);
        await expect(client.query(ctx)).rejects.toThrow(NetworkContextExpiredError);
    });

    it('should throw CsiHttpError on connection reset', async () => {
        const ctx = createCtx('/connection-reset');
        await expect(client.query(ctx)).rejects.toThrow(CsiHttpError);
        await expect(client.query(ctx)).rejects.toThrow(/socket hang up/);
    });

    it('should throw CsiHttpError on early socket close', async () => {
        const ctx = createCtx('/early-close');
        await expect(client.query(ctx)).rejects.toThrow(CsiHttpError);
        await expect(client.query(ctx)).rejects.toThrow(/socket hang up|premature close/);
    });

    it('should handle invalid content length gracefully by throwing CsiHttpError instead of crashing', async () => {
        const ctx = createCtx('/invalid-content-length');
        await expect(client.query(ctx)).rejects.toThrow(CsiHttpError);
    });
});
