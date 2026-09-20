const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname);

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  try {
    // Strip query strings and hash anchors cleanly
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);

    // Default to index.html for root or SPA fallback
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

    // Security check: ensure requests stay within PUBLIC_DIR
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // If file not found, fall back gracefully to index.html
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, data) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
          });
          res.end(data);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff'
      });

      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
        }
        res.end('Server Error');
      });
      stream.pipe(res);
    });
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Internal Server Error');
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Retrying or process will wait.`);
  } else {
    console.error('Server error occurred:', e.message);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception trapped:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection trapped:', reason);
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio server is live and running at http://localhost:${PORT}`);
});
