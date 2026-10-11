import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { testAPI, runTests } from '../test-apis.js';
const api={name:'fixture',url:'https://fixture.invalid/'};
function fixture(status,body) {
  return (_url,callback) => {
    const req=new EventEmitter();req.destroy=()=>{};
    queueMicrotask(()=>{const res=new EventEmitter();res.statusCode=status;callback(res);res.emit('data',Buffer.from(body));res.emit('end');});
    return req;
  };
}
test('accepts nonempty 200 and rejects failed or empty responses',async()=>{
  assert.equal((await testAPI(api,{get:fixture(200,'{}')})).success,true);
  assert.equal((await testAPI(api,{get:fixture(500,'error')})).success,false);
  assert.equal((await testAPI(api,{get:fixture(200,'')})).success,false);
});
test('wall-clock deadline bounds an active but unfinished response',async()=>{
  let destroyed=false;let ticker;
  const get=(_url,callback)=>{const req=new EventEmitter();req.destroy=()=>{destroyed=true;clearInterval(ticker);};queueMicrotask(()=>{const res=new EventEmitter();res.statusCode=200;callback(res);ticker=setInterval(()=>res.emit('data',Buffer.from('x')),2);});return req;};
  const result=await testAPI(api,{get,timeoutMs:25});assert.equal(result.status,'timeout');assert.equal(result.success,false);assert.equal(destroyed,true);
});
test('network and synchronous errors become failed results',async()=>{
  const get=()=>{const req=new EventEmitter();req.destroy=()=>{};queueMicrotask(()=>req.emit('error',new Error('fixture failure')));return req;};
  assert.equal((await testAPI(api,{get})).status,'error');
  assert.equal((await testAPI(api,{get:()=>{throw new Error('sync');}})).status,'error');
});
test('runner returns failure count for CLI exit status',async()=>{
  assert.equal(await runTests([api],{get:fixture(503,'failed')}),1);
});
