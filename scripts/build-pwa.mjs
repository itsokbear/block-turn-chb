import { readdir, readFile, writeFile, access, rename, rmdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='dist/client';
const base=process.env.NEXT_PUBLIC_BASE_PATH||'';
if(base&&!/^\/[a-zA-Z0-9_.-]+$/.test(base))throw Error('Invalid base path');
// vinext beta skips prerendering '/' with basePath, but serves the prefixed
// route correctly. Export that route through its supported production server.
if(base){
 const {startProdServer}=await import('vinext/server/prod-server');
 const {server,port}=await startProdServer({port:0,host:'127.0.0.1',outDir:resolve('dist'),silent:true});
 try{
  const response=await fetch(`http://127.0.0.1:${port}${base}/`,{signal:AbortSignal.timeout(15000)});
  const html=await response.text();
  if(!response.ok||!html.includes('ТВОЙ СЧЁТ'))throw Error('Could not export prefixed game route');
  await writeFile(join(root,'index.html'),html);
 }finally{server.closeAllConnections();await new Promise((done,reject)=>server.close(error=>error?reject(error):done()));}
 // Pages mounts the artifact under base already; avoid a doubled base directory.
 const nested=join(root,base.slice(1),'_next');
 await access(nested);await rename(nested,join(root,'_next'));await rmdir(join(root,base.slice(1)));
}
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||/\.(gz|br|map)$/.test(e.name)||e.name==='sw.js')continue;const path=join(dir,e.name);files.push(...(e.isDirectory()?await walk(path):[path]));}return files;}
const files=(await walk(root)).sort();
if(!files.includes(join(root,'index.html')))throw Error('Missing exported game');
const hash=createHash('sha256');
for(const path of files){hash.update(relative(root,path));hash.update(await readFile(path));}
const template=await readFile('scripts/sw-template.js','utf8');hash.update(template);hash.update(base);
const revision=hash.digest('hex').slice(0,16);
const assets=files.map(path=>base+'/'+relative(root,path));assets.push(base+'/');
await writeFile(join(root,'sw.js'),template.replace('__CACHE_NAME__','brunya-offline-'+encodeURIComponent(base+'/')+'-'+revision).replace('__ASSET_LIST__',JSON.stringify(assets)));
console.log(`PWA: ${assets.length} offline assets, revision ${revision}`);
