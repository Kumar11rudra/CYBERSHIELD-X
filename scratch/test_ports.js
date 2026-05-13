const net = require('net');
const server = net.createServer();

server.on('error', (err) => {
  console.log(`Port ${server.address()?.port} failed: ${err.code}`);
});

const ports = [3000, 3001, 5000, 5001, 8000, 8080, 9000, 9999];

function testPort(index) {
  if (index >= ports.length) {
    console.log('All tests done');
    process.exit(0);
  }
  const port = ports[index];
  const s = net.createServer();
  s.listen(port, '127.0.0.1', () => {
    console.log(`Port ${port} is AVAILABLE`);
    s.close(() => testPort(index + 1));
  });
  s.on('error', (err) => {
    console.log(`Port ${port} is NOT available: ${err.code}`);
    testPort(index + 1);
  });
}

testPort(0);
