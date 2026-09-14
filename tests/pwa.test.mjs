import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const template=await readFile('scripts/sw-template.js','utf8');
function worker(base='/',fail=false){
 const events={},stores=new Map(),prefix='brunya-offline-'+encodeURIComponent(base)+'-',name=prefix+'new';let claimed=false,skipped=false,online=true;
 const key=r=>typeof r==='string'?r:new URL(r.url).pathname;
 const caches={open:async id=>{if(!stores.has(id))stores.set(id,new Map());const store=stores.get(id);return {addAll:async requests=>{if(fail)throw Error('Incomplete download');for(const r of requests)store.set(key(r),new Response('cached:'+key(r)));},match:async request=>store.get(key(request))?.clone()};},keys:async()=>[...stores.keys()],delete:async id=>stores.delete(id)};
 const assets=[base,base+'index.html',base+'assets/game.js',base+'icon-192.png'];
 const self={location:{origin:'https://example.github.io'},registration:{scope:'https://example.github.io'+base},clients:{claim:async()=>{claimed=true;}},skipWaiting:()=>{skipped=true;},addEventListener:(name,fn)=>events[name]=fn};
 class LocalRequest extends Request{constructor(url,opts){super(new URL(url,self.location.origin),opts);}}
 vm.runInNewContext(template.replace('__CACHE_NAME__',name).replace('__ASSET_LIST__',JSON.stringify(assets)),{self,caches,Request:LocalRequest,Response,URL,encodeURIComponent,fetch:async()=>{if(!online)throw Error('offline');return new Response('network');}});
 return {stores,assets,name,prefix,get claimed(){return claimed;},get skipped(){return skipped;},offline(){online=false;},async life(type){let pending;events[type]({waitUntil:p=>pending=p});await pending;},message:data=>events.message({data}),async get(path,mode='navigate',method='GET'){let pending;events.fetch({request:{url:'https://example.github.io'+path,mode,method},respondWith:p=>pending=p});return pending?await (await pending).text():null;}};
}
for(const base of ['/','/block-turn-chb/']){
 test(`complete offline reload and assets under ${base}`,async()=>{const w=worker(base);await w.life('install');await w.life('activate');w.offline();assert.equal(await w.get(base+'?installed=1'),'cached:'+base);assert.equal(await w.get(base+'index.html'),'cached:'+base);assert.equal(await w.get(base+'assets/game.js','cors'),'cached:'+base+'assets/game.js');assert.equal(w.claimed,true);assert.equal(w.skipped,false);await assert.rejects(w.get(base+'missing'));assert.equal(await w.get(base,'navigate','POST'),null);});
}
test('failed install removes partial cache and preserves previous version',async()=>{const w=worker('/block-turn-chb/',true);w.stores.set(w.prefix+'old',new Map());await assert.rejects(w.life('install'));assert.equal(w.stores.has(w.name),false);assert.equal(w.stores.has(w.prefix+'old'),true);});
test('update activates only on request and removes only this app scope caches',async()=>{const w=worker('/block-turn-chb/');w.stores.set(w.prefix+'old',new Map());w.stores.set('brunya-offline-%2Fother%2F-old',new Map());await w.life('install');assert.equal(w.skipped,false);w.message({type:'ACTIVATE_UPDATE'});assert.equal(w.skipped,true);await w.life('activate');assert.equal(w.stores.has(w.prefix+'old'),false);assert.equal(w.stores.has('brunya-offline-%2Fother%2F-old'),true);});
