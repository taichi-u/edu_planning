import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scene} from './scene.mjs';
import {themes} from './themes.mjs';
import {sampleForScenario,summary,timePosition,workRecord} from './model.mjs';
const data=JSON.parse(await readFile(new URL('./fixture.json',import.meta.url)));
const nodes=n=>[n,...(n.children||[]).flatMap(nodes)];

test('all concepts use the same five weekly tasks, in both languages',()=>{
 for(const theme of Object.keys(themes))for(const lang of ['ja','en']){
  const rows=nodes(scene(data,theme,lang,'week')).filter(n=>n.type==='taskrow');
  assert.deepEqual(rows.map(n=>n.taskId).sort(),['t1','t2','t3','t4','t5']);
  assert.equal(rows.find(n=>n.taskId==='t4').estimate,'—');
 }
});
test('18 views and adverse scenarios produce valid finite geometry',()=>{
 for(const theme of Object.keys(themes))for(const lang of ['ja','en'])for(const view of ['week','quarter','all'])for(const state of ['normal','empty','crowded','error']){
  for(const n of nodes(scene(sampleForScenario(data,state),theme,lang,view,state))){
   for(const key of ['x','y','w','h'])if(typeof n[key]==='number')assert.ok(Number.isFinite(n[key])&&n[key]>=0,`${theme}/${lang}/${view}/${state}: ${n.name}.${key}`);
  }
 }
});
test('empty state does not show tasks or timeline periods',()=>{
 const sample=sampleForScenario(data,'empty');
 assert.deepEqual(summary(sample),{tasks:0,unestimated:0,due:0,preparation:0,undated:[]});
 for(const theme of Object.keys(themes))for(const view of ['week','quarter','all']){
  const values=nodes(scene(sample,theme,'en',view,'empty'));
  assert.equal(values.filter(n=>['taskrow','bar','mark'].includes(n.type)).length,0);
 }
});
test('weekly work includes preparation for later deadlines without duplicating tasks',()=>{
 const counts=summary(data);assert.equal(counts.due,3);assert.equal(counts.preparation,2);assert.equal(counts.tasks,5);
 assert.equal(counts.unestimated,1);assert.equal(counts.undated.length,1);
});
test('crowded scenario changes both translations and does not mutate the fixture',()=>{
 const crowded=sampleForScenario(data,'crowded');assert.equal(summary(crowded).due,5);
 assert.ok(crowded.tasks[0].ja.includes('国際学会'));assert.ok(crowded.tasks[0].en.includes('research submissions'));
 assert.equal(data.tasks[0].date,'2027-06-08');
});
test('date scale respects leap days and actual distances between month ticks',()=>{
 assert.equal(timePosition('2028-02-29','2028-02-28','2028-03-01',100),50);
 const july=timePosition('2027-07-01','2027-06-07','2027-09-07',920);
 const aug=timePosition('2027-08-01','2027-06-07','2027-09-07',920);
 assert.equal(july,240);assert.equal(aug-july,310);
});
test('unrecorded minutes remain null, explicit zero is retained',()=>{
 const blank=new Map([['summary','Done'],['feedback',''],['minutes','']]);
 assert.equal(workRecord(blank,'t1').actualMinutes,null);blank.set('minutes','0');
 assert.equal(workRecord(blank,'t1').actualMinutes,0);
});
function contrast(a,b){const lum=h=>{const c=h.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const l=[lum(a),lum(b)].sort((x,y)=>y-x);return(l[0]+.05)/(l[1]+.05)}
test('body, secondary text and action text have at least 4.5:1 contrast',()=>{
 for(const t of Object.values(themes))for(const [fg,bg]of [[t.ink,t.bg],[t.muted,t.bg],[t.ink,t.surface],[t.muted,t.surface],['#FFFFFF',t.accent]])assert.ok(contrast(fg,bg)>=4.5,`${t.id} ${fg}/${bg}`);
});
