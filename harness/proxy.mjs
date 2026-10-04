import { createServer } from 'node:http';
import { connect } from 'node:net';

// A loopback-only HTTPS tunnel: TLS stays between the package and Slack.
// Record hosts and byte counts, never headers, paths, credentials, or bodies.
export async function startProxy() {
  const connections = [];
  const sockets = new Set();
  const server = createServer((_request, response) => {
    response.writeHead(405).end('Use CONNECT for HTTPS');
  });
  const track = socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    return socket;
  };
  server.on('connection', track);
  server.on('connect', (request, client, head) => {
    const match = /^(slack\.com|hooks\.slack\.com):443$/.exec(request.url);
    if (!match) {
      client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    const record = { host: match[1], port: 443, connected: false, bytesUp: head.length, bytesDown: 0 };
    connections.push(record);
    const upstream = track(connect({ host: record.host, port: record.port }));
    const fail = error => {
      // A child process exiting can reset an otherwise successful TLS tunnel.
      // Message delivery is checked independently through Slack's API.
      if (error.code === 'ECONNRESET' && record.connected && record.bytesUp > 0 && record.bytesDown > 0) {
        record.closeReason = 'ECONNRESET';
      } else {
        record.error = error.code || 'socket_error';
      }
      client.destroy();
      upstream.destroy();
    };
    client.on('error', fail);
    upstream.on('error', fail);
    client.on('close', () => upstream.destroy());
    upstream.on('close', () => client.destroy());
    upstream.setTimeout(30000, () => fail({ code: 'UPSTREAM_TIMEOUT' }));
    upstream.on('connect', () => {
      record.connected = true;
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      client.on('data', data => { record.bytesUp += data.length; });
      upstream.on('data', data => { record.bytesDown += data.length; });
      client.pipe(upstream);
      upstream.pipe(client);
    });
  });
  server.on('clientError', (_error, socket) => socket.destroy());
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    connections,
    async close() {
      const closed = new Promise(resolve => server.close(resolve));
      for (const socket of sockets) socket.destroy();
      await closed;
    },
  };
}
