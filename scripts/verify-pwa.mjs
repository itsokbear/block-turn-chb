import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root='dist/client',base=process.env.NEXT_PUBLIC_BASE_PATH||'';
const html=await readFile(join(root,'index.html'),'utf8');
assert.ok(html.includes('ТВОЙ СЧЁТ'));
for(const [,path] of html.matchAll(/(?:src|href)="(\/[^"<>]*)"/g)){
 assert.ok(path.startsWith(base+'/'),`Unscoped resource: ${path}`);
 const file=decodeURI(path.slice(base.length+1).split('?')[0])||'index.html';
 await access(join(root,file));
}
const sw=await readFile(join(root,'sw.js'),'utf8');
const assets=JSON.parse(sw.match(/const ASSETS = (.*);/)[1]);
for(const path of assets){assert.ok(path.startsWith(base+'/'));await access(join(root,path.slice(base.length+1)||'index.html'));}
const manifest=JSON.parse(await readFile(join(root,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons){await access(join(root,icon.src));assert.ok(icon.sizes==='192x192'||icon.sizes==='512x512');}
assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
console.log(`Verified exported HTML and ${assets.length} offline resources for ${base||'/'}`);
