import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=ts.createSourceFile('page.tsx',readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const keys={};
function visit(node){
 if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
  const tag=node.tagName.getText(source);
  const attrs=node.attributes.properties;
  const event=tag==='div'&&attrs.some(a=>ts.isJsxAttribute(a)&&a.name.text==='className'&&a.initializer?.getText(source).includes('move-event'));
  if(tag==='SandBurst'||tag==='SnakeLayer'||event){
   const key=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='key');
   assert.ok(key?.initializer&&ts.isJsxExpression(key.initializer));
   keys[event?'event':tag]=new Function('sand','snakeRun','event',`return ${key.initializer.expression.getText(source)}`);
  }
 }
 ts.forEachChild(node,visit);
}
visit(source);
test('board sibling keys stay distinct when restart, sand and celebration counters coincide',()=>{
 assert.equal(Object.keys(keys).length,3);
 for(const run of [0,1,2,10]){
  const values=Object.values(keys).map(key=>String(key({id:run},run,{id:run})));
  assert.equal(new Set(values).size,3,`duplicate board keys at counter ${run}: ${values}`);
 }
});
test('effect counters never change the identity of the existing snake',()=>{
 assert.equal(keys.SnakeLayer({id:1},1,{id:1}),keys.SnakeLayer({id:2},1,{id:2}));
 assert.notEqual(keys.SnakeLayer(null,1,null),keys.SnakeLayer(null,2,null));
});
