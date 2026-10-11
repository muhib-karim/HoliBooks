import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
test('local server boots as ESM and serves only expected paths', async (t) => {
  const child = spawn(process.execPath, ['serve.js'], {cwd:root, env:{...process.env,PORT:'0'}, stdio:['ignore','pipe','pipe']});
  const stopped = once(child, 'exit');
  t.after(async () => {child.kill(); await stopped;});
  const startup = await new Promise((resolve,reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
    child.on('error', reject);
    child.on('exit', (code) => reject(new Error(`Server exited: ${code}`)));
    child.stdout.on('data', chunk => {text += chunk; if (text.includes('http://')) {clearTimeout(timer);resolve(text);}});
  });
  const port = Number(startup.match(/127\.0\.0\.1:(\d+)/)[1]);
  const get = (urlPath, method='GET') => new Promise((resolve,reject) => {
    const req = request({hostname:'127.0.0.1',port,path:urlPath,method}, res => {
      let body='';res.on('data', x => body+=x);res.on('end',()=>resolve({status:res.statusCode,body,type:res.headers['content-type']}));
    });req.on('error',reject);req.end();
  });
  const home = await get('/'); assert.equal(home.status,200);assert.match(home.body,/HoliBooks/);assert.match(home.type,/text\/html/);
  assert.equal((await get('/index.html?preview=1')).status,200);
  assert.equal((await get('/does-not-exist.html')).status,404);
  assert.equal((await get('/%2e%2e/package.json')).status,400);
  assert.equal((await get('/%E0%A4%A')).status,400);
  assert.equal((await get('/', 'POST')).status,405);
  assert.equal((await get('/', 'HEAD')).body,'');
});
