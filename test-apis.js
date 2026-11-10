/** Optional network smoke checks. The CLI is separate from offline CI. */
import https from 'node:https';
import { pathToFileURL } from 'node:url';

// One URL for every endpoint shape and every edition the readers offer, so a
// renamed upstream ID shows up here instead of as a broken reader.
const BIBLE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';
export const APIS = [
  {name:'Quran: surah list (AlQuran Cloud)',url:'https://api.alquran.cloud/v1/surah'},
  {name:'Quran: Arabic surah',url:'https://api.alquran.cloud/v1/surah/1'},
  {name:'Quran: default translation en.sahih',url:'https://api.alquran.cloud/v1/surah/1/en.sahih'},
  {name:'Quran: Swahili edition sw.barwani',url:'https://api.alquran.cloud/v1/surah/1/sw.barwani'},
  {name:'Bible: en-kjv (wldeh via jsDelivr)',url:`${BIBLE}/en-kjv/books/genesis/chapters/1.json`},
  {name:'Bible: en-web',url:`${BIBLE}/en-web/books/genesis/chapters/1.json`},
  {name:'Bible: en-asv',url:`${BIBLE}/en-asv/books/genesis/chapters/1.json`},
  {name:'Bible: numbered book ID 1samuel',url:`${BIBLE}/en-kjv/books/1samuel/chapters/1.json`},
  {name:'Bible: songofsolomon',url:`${BIBLE}/en-kjv/books/songofsolomon/chapters/1.json`},
  {name:'Torah: en-ojps (JPS 1917)',url:`${BIBLE}/en-ojps/books/genesis/chapters/1.json`},
  {name:'Torah: he-wlc (Hebrew)',url:`${BIBLE}/he-wlc/books/deuteronomy/chapters/34.json`},
  {name:'Bhagavad Gita: one verse',url:'https://vedicscriptures.github.io/slok/1/1/'},
  {name:'GurbaniNow: one Ang',url:'https://api.gurbaninow.com/v2/ang/1'}
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
