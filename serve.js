/** Local-only static preview. Not a production server. */
import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
const insideRoot = (name) => name === root || name.startsWith(root + path.sep);

const server = http.createServer(async (req, res) => {
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
    let target = path.resolve(root, '.' + decoded);
    if (!insideRoot(target)) { res.writeHead(403); return res.end('Forbidden'); }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    target = await realpath(target);
    if (!insideRoot(target)) { res.writeHead(403); return res.end('Forbidden'); }
    const content = await readFile(target);
    res.writeHead(200, {'Content-Type':types[path.extname(target).toLowerCase()] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (err) {
    const status = err instanceof URIError ? 400 : ['ENOENT','ENOTDIR','EISDIR'].includes(err.code) ? 404 : 500;
    res.writeHead(status); res.end(status === 404 ? 'Not found' : status === 400 ? 'Invalid path' : 'Server error');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`HoliBooks local preview: http://127.0.0.1:${server.address().port}`));
