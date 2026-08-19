const request = require('supertest');
const { app } = require('../index');

describe('CyberBot Conversational Intelligence & Knowledge API (/api/chatbot/chat)', () => {
    it('should respond warmly and politely to greetings (Hi / Hello)', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({
                messages: [
                    { role: 'user', content: 'Hi, how are you?' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.content).toContain('CyberBot');
        expect(res.body.content).toMatch(/hello|doing great|assist/i);
    });

    it('should introduce CyberShield X platform capabilities when asked who it is', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({
                messages: [
                    { role: 'user', content: 'Who are you and what is CyberShield X?' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.content).toMatch(/CyberShield X/i);
        expect(res.body.content).toMatch(/110/);
    });

    it('should list tool categories when asked about tools catalog', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({
                messages: [
                    { role: 'user', content: 'What tools are available in the catalog?' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.content).toMatch(/Recon/i);
        expect(res.body.content).toMatch(/110/);
    });

    it('should explain all 7 automated SOC playbooks when queried', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({
                messages: [
                    { role: 'user', content: 'Tell me about the automated playbooks' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.content).toMatch(/7.*Playbook|Playbook/i);
        expect(res.body.content).toMatch(/Perimeter/i);
    });

    it('should provide polite cybersecurity guidance when receiving arbitrary or unclear queries', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({
                messages: [
                    { role: 'user', content: 'random unexpected query 12345 xyz' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.content).toMatch(/CyberShield X/i);
        expect(res.body.content).toMatch(/110|security|tools/i);
    });

    it('should return 400 if messages array is missing or empty', async () => {
        const res = await request(app)
            .post('/api/chatbot/chat')
            .send({});

        expect(res.status).toBe(400);
    });
});
