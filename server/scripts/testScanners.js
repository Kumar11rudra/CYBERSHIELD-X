require('dotenv').config();
const { executeTool } = require('../controllers/toolkitController');

const mockIo = {
  to: () => ({
    emit: (event, data) => {
      console.log(`[SOCKET_LOG] ${data.type.toUpperCase()}: ${data.message}`);
    }
  })
};

const runTest = async () => {
  console.log('--- STARTING SCANNER ENDPOINT TESTING ---');
  
  const mockRes = {
    status: function(code) {
      console.log(`[HTTP STATUS] ${code}`);
      return this;
    },
    json: function(data) {
      console.log('[HTTP RESPONSE]', JSON.stringify(data, null, 2).slice(0, 1000) + '\n... [TRUNCATED]');
      return this;
    }
  };

  // 1. Test DNS Lookup (dig)
  console.log('\n=======================================');
  console.log('Testing DNS Lookup (toolId: dig) on google.com...');
  console.log('=======================================');
  try {
    const req = { 
      body: { toolId: 'dig', target: 'google.com', socketId: 'test-socket' },
      app: { get: () => mockIo }
    };
    await executeTool(req, mockRes);
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error('DNS test error:', err);
  }

  // 2. Test SSL Certificate Scan (ssl)
  console.log('\n=======================================');
  console.log('Testing SSL Certificate Scan (toolId: ssl) on google.com...');
  console.log('=======================================');
  try {
    const req = { 
      body: { toolId: 'ssl', target: 'google.com', socketId: 'test-socket' },
      app: { get: () => mockIo }
    };
    await executeTool(req, mockRes);
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error('SSL test error:', err);
  }

  // 3. Test Subdomain Scan (subfinder)
  console.log('\n=======================================');
  console.log('Testing Subdomain Discovery (toolId: subfinder) on scanme.nmap.org...');
  console.log('=======================================');
  try {
    const req = { 
      body: { toolId: 'subfinder', target: 'scanme.nmap.org', socketId: 'test-socket' },
      app: { get: () => mockIo }
    };
    await executeTool(req, mockRes);
    await new Promise(r => setTimeout(r, 5000));
  } catch (err) {
    console.error('Subdomain test error:', err);
  }

  console.log('\n--- SCANNER ENDPOINT TESTING COMPLETED ---');
  process.exit(0);
};

runTest();
