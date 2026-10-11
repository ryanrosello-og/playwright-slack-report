import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Use the installed package, just like the reporter/CLI, in a fresh process.
// The proxy answers locally; example.invalid must never be resolved directly.
const { ProxyAgent, fetch } = await import('undici/index.js');
const sockets = new Set();
let proxyRequests = 0;
const server = createServer((request, response) => {
  assert.equal(request.url, 'http://example.invalid/unit');
  proxyRequests++;
  response.end('ok');
});
server.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});
server.on('connect', (request, socket) => {
  assert.equal(request.url, 'example.invalid:80');
  proxyRequests++;
  socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
  socket.once('data', () =>
    socket.end(
      'HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok',
    ),
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const agent = new ProxyAgent(`http://127.0.0.1:${server.address().port}`);
try {
  const response = await fetch('http://example.invalid/unit', {
    dispatcher: agent,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(await response.text(), 'ok');
  assert.equal(proxyRequests, 1);
} finally {
  await agent.close();
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => server.close(resolve));
}
