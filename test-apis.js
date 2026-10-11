/** Optional network smoke checks. The CLI is separate from offline CI. */
import https from 'node:https';
import { pathToFileURL } from 'node:url';

export const APIS = [
  {name:'Quran API (AlQuran Cloud)',url:'https://api.alquran.cloud/v1/surah/1'},
  {name:'Bible API (JSDelivr)',url:'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/genesis/chapters/1.json'},
  {name:'Bhagavad Gita API',url:'https://vedicscriptures.github.io/slok/1/1'},
  {name:'GurbaniNow API',url:'https://api.gurbaninow.com/v2/ang/1'}
];

export function testAPI(api, {get=https.get, timeoutMs=15000}={}) {
  return new Promise(resolve => {
    const started=Date.now(); let request; let settled=false;
    const finish=result => {if(settled)return;settled=true;clearTimeout(timer);resolve({name:api.name,success:false,...result});};
    // A wall-clock deadline bounds DNS, connect, TLS, and the complete response,
    // including a peer that keeps the socket active by sending partial data.
    const timer=setTimeout(() => {
      finish({status:'timeout',error:`Request exceeded ${timeoutMs} ms`});
      request?.destroy();
    },timeoutMs);
    try {
      request=get(api.url,res => {
        let bytes=0;
        res.on('data',chunk => {bytes+=chunk.length;});
        res.on('error',err => finish({status:'error',error:err.message}));
        res.on('aborted',() => finish({status:'error',error:'Response aborted'}));
        res.on('end',() => finish({status:res.statusCode,success:res.statusCode===200 && bytes>0,hasData:bytes>0,timeMs:Date.now()-started}));
      });
      request.on('error',err => finish({status:'error',error:err.message}));
    } catch(err) {finish({status:'error',error:err.message});}
  });
}

export async function runTests(apis=APIS, options={}) {
  let failures=0;
  for(const api of apis) {
    const result=await testAPI(api, options);
    console.log(`${result.success?'OK':'FAIL'} ${result.name}: ${result.status}${result.error?' ('+result.error+')':''}`);
    if(!result.success)failures++;
  }
  return failures;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  process.exitCode=(await runTests()) ? 1 : 0;
}
