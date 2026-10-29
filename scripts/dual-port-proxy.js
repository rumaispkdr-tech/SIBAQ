// Dual-Port HTTP Proxy so both port 3000 and port 3001 work seamlessly in any browser
const http = require('http');

const PROXY_PORT = 3001;
const TARGET_PORT = 3000;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (targetRes) => {
    clientRes.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end(`Gateway connecting to port ${TARGET_PORT}: ${err.message}`);
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Port forwarding active: http://0.0.0.0:${PROXY_PORT} -> http://127.0.0.1:${TARGET_PORT}`);
});
