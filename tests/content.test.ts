import test from 'node:test';
import assert from 'node:assert/strict';
import { organizeTasks, referenceKind } from '../lib/content';
import { blankTask, emptyPlanning } from '../lib/planning';
const options = { scope: '', search: '', anchor: '2026-10-26', horizon: 'week' as const, filter: 'active' as const };

test('unplanned external issues and PRs never become personal weekly work', () => {
  const p = emptyPlanning(); p.config.privateRepository = 'example/private_task';
  p.tasks = [{...blankTask(),id:'reference',title:'PR: Add solver',repository:'example/solver',url:'https://github.com/example/solver/pull/1'}, {...blankTask(),id:'personal',repository:p.config.privateRepository,horizon:'week'}];
  const original = structuredClone(p), result = organizeTasks(p, options);
  assert.deepEqual(result.tasks.map(t => t.id), ['personal']); assert.equal(result.references.length, 1);
  assert.equal(referenceKind(result.references[0]), 'PR'); assert.deepEqual(p, original);
});
test('undated unplanned work is separate; active and blocked undated work remain visible', () => {
  const p = emptyPlanning(); p.tasks = ['todo','doing','blocked'].map(state=>({...blankTask(),id:state,state:state as 'todo'|'doing'|'blocked'}));
  const result = organizeTasks(p, options);
  assert.deepEqual(result.undated.map(t=>t.id), ['todo']); assert.deepEqual(result.tasks.map(t=>t.id).sort(), ['blocked','doing']);
});
test('preparation for a far deadline is weekly work; completed tasks use the completed view', () => {
  const p = emptyPlanning();p.tasks = [{...blankTask(['a','b']),id:'prep',start:'2026-10-28',target:'2027-05-01'}, {...blankTask(['a']),id:'done',state:'done'}];
  assert.deepEqual(organizeTasks(p,{...options,scope:'a'}).tasks.map(t=>t.id), ['prep']);
  assert.deepEqual(organizeTasks(p,{...options,scope:'b'}).tasks.map(t=>t.id), ['prep']);
  assert.deepEqual(organizeTasks(p,{...options,filter:'done'}).tasks.map(t=>t.id), ['done']);
});
