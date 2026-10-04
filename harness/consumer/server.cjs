const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

http.createServer((request, response) => {
  if (request.url !== '/') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(fs.readFileSync(path.join(__dirname, 'site/index.html')));
}).listen(Number(process.env.HARNESS_PORT), '127.0.0.1');
