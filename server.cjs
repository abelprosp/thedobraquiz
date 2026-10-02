const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handleLead } = require('./leads.cjs');
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const root = path.join(__dirname, 'dist');
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/leads') return handleLead(req, res);
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!['GET', 'HEAD'].includes(req.method) || !['index.html', 'style.css', 'app.js', 'logo.png'].includes(name)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.setHeader('Content-Type', ({ html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', png: 'image/png' })[name.split('.').pop()]);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(path.join(root, name));
  stream.on('error', () => { res.statusCode = 500; res.end(); });
  stream.pipe(res);
}).listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () => console.log('TheDobra quiz iniciado.'));
