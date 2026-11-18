import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Start serve.js on a random port; returns get(path, { method, headers }). */
async function startServer(t) {
  const child = spawn(process.execPath, ['serve.js'], {cwd:root, env:{...process.env,PORT:'0'}, stdio:['ignore','pipe','pipe']});
  const stopped = once(child, 'exit');
  t.after(async () => {child.kill(); await stopped;});
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const startup = await new Promise((resolve,reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
    child.on('error', reject);
    child.on('exit', (code) => reject(new Error(`Server exited: ${code}`)));
    child.stdout.on('data', chunk => {text += chunk; if (text.includes('http://')) {clearTimeout(timer);resolve(text);}});
  });
  const port = Number(startup.match(/127\.0\.0\.1:(\d+)/)[1]);
  const get = (urlPath, {method='GET', headers={}}={}) => new Promise((resolve,reject) => {
    const req = request({hostname:'127.0.0.1',port,path:urlPath,method,headers}, res => {
      let body='';res.on('data', x => body+=x);res.on('end',()=>resolve({status:res.statusCode,body,type:res.headers['content-type'],headers:res.headers}));
    });req.on('error',reject);req.end();
  });
  get.stderr = () => stderr;
  return get;
}

test('local server boots as ESM and serves only expected paths', async (t) => {
  const get = await startServer(t);
  const home = await get('/'); assert.equal(home.status,200);assert.match(home.body,/HoliBooks/);assert.match(home.type,/text\/html/);
  assert.equal((await get('/index.html?preview=1')).status,200);
  assert.equal((await get('/does-not-exist.html')).status,404);
  assert.equal((await get('/%2e%2e/package.json')).status,400);
  assert.equal((await get('/%E0%A4%A')).status,400);
  assert.equal((await get('/', {method:'POST'})).status,405);
  assert.equal((await get('/', {method:'HEAD'})).body,'');
});

test('local server never serves dotfiles such as the .git directory', async (t) => {
  const get = await startServer(t);
  for (const hidden of ['/.git/HEAD', '/.git/config', '/.gitignore', '/.github/workflows/ci.yml', '/religions/.hidden', '/./index.html']) {
    const res = await get(hidden);
    assert.equal(res.status, 404, `${hidden} -> ${res.status}`);
    assert.ok(!/ref:|\[core\]/.test(res.body), `${hidden} leaked repository data`);
  }
  assert.equal((await get('/sw.js')).status, 200, 'ordinary files are still served');
});

test('local server only answers requests addressed to this machine', async (t) => {
  const get = await startServer(t);
  // A page on another origin can point a hostname at 127.0.0.1 (DNS rebinding);
  // refusing foreign Host headers keeps it from reading local files.
  for (const host of ['evil.example', 'evil.example:3000', '127.0.0.1.evil.example']) {
    assert.equal((await get('/index.html', {headers:{Host:host}})).status, 400, host);
  }
  for (const host of ['localhost:3000', '127.0.0.1:8080', '[::1]:3000', 'LOCALHOST']) {
    assert.equal((await get('/index.html', {headers:{Host:host}})).status, 200, host);
  }
});

test('local server sends length, no-store and correct types', async (t) => {
  const get = await startServer(t);
  const css = await get('/css/global.css');
  assert.equal(css.headers['cache-control'], 'no-store', 'a preview server must not leave stale assets in the browser');
  assert.equal(Number(css.headers['content-length']), Buffer.byteLength(css.body));
  assert.equal(css.headers['x-content-type-options'], 'nosniff');
  const head = await get('/css/global.css', {method:'HEAD'});
  assert.equal(head.headers['content-length'], css.headers['content-length']);
  assert.match((await get('/tests/server.test.mjs')).type, /javascript/);
  assert.match((await get('/assets/icons/icon.svg')).type, /image\/svg\+xml/);
  assert.match((await get('/manifest.json')).type, /application\/json/);
});

test('local server logs the cause of a 500 so it can be debugged', async (t) => {
  const get = await startServer(t);
  // A path segment longer than NAME_MAX (255) makes stat() fail with ENAMETOOLONG: not a 404.
  const res = await get('/' + 'a'.repeat(300));
  assert.equal(res.status, 500);
  assert.equal(res.body, 'Server error', 'the client still gets no detail');
  for (let i = 0; i < 50 && !get.stderr().includes('ENAMETOOLONG'); i++) await new Promise(r => setTimeout(r, 20));
  assert.match(get.stderr(), /ENAMETOOLONG/);
});
