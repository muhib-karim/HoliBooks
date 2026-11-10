/** Local-only static preview. Not a production server. */
import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2'};
const insideRoot = (name) => name === root || name.startsWith(root + path.sep);
// Dotfiles (.git, .github, .env, ...) are never part of the site.
const hasHiddenSegment = (name) => path.relative(root, name).split(path.sep).some(segment => segment.startsWith('.'));
// The server binds to 127.0.0.1, but a page on another origin can still reach
// it by pointing a hostname at this machine (DNS rebinding). Answer only when
// the Host header names this machine.
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const isLocalHost = (host) => localHosts.has(String(host || '').toLowerCase().replace(/:\d+$/, ''));

const server = http.createServer(async (req, res) => {
  if (!isLocalHost(req.headers.host)) {
    res.writeHead(400); return res.end('Invalid Host header');
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, {Allow:'GET, HEAD'}); return res.end('Method not allowed');
  }
  try {
    // Decode before URL normalization so traversal is rejected, not silently rewritten.
    const rawPath = (req.url || '/').split('?')[0];
    const decoded = decodeURIComponent(rawPath);
    if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) {
      res.writeHead(400); return res.end('Invalid path');
    }
    if (decoded.split('/').some(segment => segment.startsWith('.'))) {
      res.writeHead(404); return res.end('Not found');
    }
    let target = path.resolve(root, '.' + decoded);
    if (!insideRoot(target)) { res.writeHead(403); return res.end('Forbidden'); }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    target = await realpath(target);
    if (!insideRoot(target)) { res.writeHead(403); return res.end('Forbidden'); }
    // Checked again on the resolved path, so a symlink cannot point at a dotfile.
    if (hasHiddenSegment(target)) { res.writeHead(404); return res.end('Not found'); }
    const content = await readFile(target);
    res.writeHead(200, {'Content-Type':types[path.extname(target).toLowerCase()] || 'application/octet-stream','Content-Length':content.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (err) {
    const status = err instanceof URIError ? 400 : ['ENOENT','ENOTDIR','EISDIR'].includes(err.code) ? 404 : 500;
    res.writeHead(status); res.end(status === 404 ? 'Not found' : status === 400 ? 'Invalid path' : 'Server error');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`HoliBooks local preview: http://127.0.0.1:${server.address().port}`));
