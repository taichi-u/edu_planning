import test from 'node:test';
import { withTaskMarks } from '../lib/planning-timeline';
import assert from 'node:assert/strict';
import { applyPlanningAction as apply, blankTask, taskSchema, emptyPlanning, worklogSchema, changeSchema, metrics, horizonEnd, inHorizon, shiftMonth, taskBody, worklogBody, eventDay } from '../lib/planning';
import { emptyPlan, projectPlan, planSchema } from '../lib/domain';
const now = '2026-10-26T00:00:00.000Z';
function fixture() { const p = emptyPlanning(); p.config.privateRepository = 'example/private_task'; p.tasks = [taskSchema.parse({ ...blankTask(), id: 't', title: '比較結果を整理する', repository: p.config.privateRepository, issueId: 'I_1', issueNumber: 1, sourceUpdatedAt: now, estimate: 3 })]; return p; }
function log(complete = false) { return worklogSchema.parse({ id: 'l', taskId: 't', at: now, summary: '条件を比較した', complete }); }

test('legacy plans migrate without changing projects; private planning never enters viewer or meeting projection', () => {
  const p = planSchema.parse({ settings: emptyPlan().settings, projects: [] }); p.planning = fixture(); p.planning.worklogs = [log()];
  assert.equal(projectPlan(p, false, 'viewer@example.org', false).planning.tasks.length, 0);
  assert.equal(projectPlan(p, true, '', true).planning.worklogs.length, 0);
  assert.equal(projectPlan(p, true, '', false).planning.tasks.length, 1);
});
test('calendar-month windows clamp month ends; preparation for far deadlines enters this week', () => {
  assert.equal(shiftMonth('2028-01-31', 1), '2028-02-29');
  assert.equal(horizonEnd('2026-10-26', 'week'), '2026-11-01');
  const t = taskSchema.parse({ ...blankTask(), start: '2026-10-28', target: '2027-05-01' });
  assert.equal(inHorizon(t, '2026-10-26', 'week'), true);
});
test('invalid dates and confirmed deadlines without evidence are rejected', () => {
  assert.equal(taskSchema.safeParse({ ...blankTask(), start: '2026-13-01' }).success, false);
  assert.equal(taskSchema.safeParse({ ...blankTask(), deadline: { value: '2026-11-01', precision: 'day', confirmed: true } }).success, false);
  assert.equal(taskSchema.safeParse({ ...blankTask(), estimate: 4 }).success, false);
});
test('queued changes preserve canonical state until verified; external issues cannot be written', () => {
  const p = fixture(), t = p.tasks[0]; const d = apply(p, { action: 'queue_task', task: { ...t, state: 'doing' }, reason: '今週着手' }, now);
  assert.equal(d.planning.tasks[0].state, 'todo'); assert.equal(d.planning.operations[0].desired!.state, 'doing'); assert.equal(d.planning.operations[0].desired!.estimateAtStart, 3);
  assert.throws(() => apply(d.planning, { action: 'queue_task', task: t, reason: '重複' }, now));
  p.tasks[0].repository = 'someone/research'; assert.throws(() => apply(p, { action: 'queue_task', task: p.tasks[0], reason: '閉じる' }, now), /参照専用/);
});
test('starting estimates remain fixed after later estimate changes', () => {
  const p = fixture(); p.tasks[0] = { ...p.tasks[0], state: 'doing', startedAt: now, estimateAtStart: 3 };
  const d = apply(p, { action: 'queue_task', task: { ...p.tasks[0], estimate: 8 }, reason: '範囲を見直した' }, now);
  assert.equal(d.planning.operations[0].desired!.estimateAtStart, 3); assert.equal(d.planning.operations[0].desired!.estimateHistory[0].points, 8);
});
test('unknown actual time stays null; post-completion feedback is append-only and not duplicated', () => {
  const p = fixture(); p.tasks[0].state = 'done'; const d = apply(p, { action: 'record_worklog', worklog: log() }, now);
  assert.equal(d.planning.worklogs[0].actualMinutes, null); assert.equal(d.planning.tasks[0].state, 'done');
  assert.throws(() => apply(d.planning, { action: 'record_worklog', worklog: log() }, now), /登録済み/);
  assert.match(worklogBody(log(), 'marker'), /未記録/);
});
test('proposals have no side effects until selected, and rejected items stay unchanged', () => {
  const p = fixture(), c = changeSchema.parse({ id: 'c', kind: 'update', taskId: 't', baseVersion: 0, reason: 'feedback', after: [{ ...p.tasks[0], title: '追加条件を比較する' }], createdAt: now });
  const proposed = apply(p, { action: 'propose_changes', changes: [c] }, now).planning;
  assert.equal(proposed.operations.length, 0); assert.equal(proposed.tasks[0].title, p.tasks[0].title);
  const accepted = apply(proposed, { action: 'review_changes', accepted: ['c'], rejected: [] }, now).planning;
  assert.equal(accepted.operations.length, 1); assert.equal(accepted.changes[0].status, 'accepted');
  const rejected = apply(proposed, { action: 'review_changes', accepted: [], rejected: ['c'] }, now).planning;
  assert.equal(rejected.operations.length, 0);
});
test('stale proposal batches fail atomically; parent cycles are refused', () => {
  const p = fixture(); p.changes = [changeSchema.parse({ id: 'c', kind: 'cancel', taskId: 't', baseVersion: 3, reason: '取りやめ', after: [p.tasks[0]], createdAt: now })];
  assert.throws(() => apply(p, { action: 'review_changes', accepted: ['c'], rejected: [] }, now)); assert.equal(p.operations.length, 0);
  assert.equal(taskSchema.safeParse({ ...p.tasks[0], parentId: 't' }).success, false);
});
test('sync lease prevents races, stale receipt rejected, repeat success is no-op', () => {
  let p = fixture(); p = apply(p, { action: 'queue_task', task: { ...p.tasks[0], state: 'doing' }, reason: '開始' }, now).planning;
  const id = p.operations[0].id, prepared = apply(p, { action: 'sync_prepare', operationId: id }, now); p = prepared.planning;
  assert.throws(() => apply(p, { action: 'sync_prepare', operationId: id }, now), /処理中/);
  assert.throws(() => apply(p, { action: 'sync_record', operationId: id, lease: 'wrong', status: 'done', remoteId: 'I_1', error: '', task: p.tasks[0] }, now));
  const finished = apply(p, { action: 'sync_record', operationId: id, lease: p.operations[0].lease, status: 'done', remoteId: 'I_1', error: '', task: taskSchema.parse({ ...p.operations[0].desired, sourceUpdatedAt: '2026-10-26T00:01:00.000Z' }) }, now).planning;
  assert.equal(finished.tasks[0].state, 'doing'); assert.equal(finished.tasks[0].estimateAtStart, 3); assert.equal(finished.tasks[0].version, 1);
  assert.deepEqual(apply(finished, { action: 'sync_prepare', operationId: id }, now).result, { action: 'unchanged', remoteId: 'I_1' });
});
test('uncertain writes require recovery and stable operation markers', () => {
  let p = fixture(); p = apply(p, { action: 'queue_task', task: p.tasks[0], reason: '更新' }, now).planning; const id = p.operations[0].id;
  p = apply(p, { action: 'sync_prepare', operationId: id }, now).planning;
  p = apply(p, { action: 'sync_record', operationId: id, lease: p.operations[0].lease, status: 'uncertain', error: '通信失敗', remoteId: '' }, now).planning;
  const recovered = apply(p, { action: 'sync_prepare', operationId: id }, now).result as { recoveryRequired: boolean; marker: string };
  assert.equal(recovered.recoveryRequired, true); assert.ok(taskBody(p.tasks[0], recovered.marker).includes(id));
});
test('failed or old snapshots do not erase tasks or overwrite pending local intent', () => {
  const p = fixture(), source = { id: 'gh', kind: 'github' as const, title: 'GitHub', status: 'error' as const, checkedAt: now, lastSuccessAt: null, error: '403', count: 0 };
  assert.equal(apply(p, { action: 'ingest_snapshot', source, tasks: [] }, now).planning.tasks.length, 1);
  p.tasks[0].sourceUpdatedAt = '2026-10-27T00:00:00.000Z';
  const d = apply(p, { action: 'ingest_snapshot', source: { ...source, status: 'ok' }, tasks: [{ ...p.tasks[0], state: 'todo', sourceUpdatedAt: now }] }, now).planning;
  assert.equal(d.tasks[0].sourceUpdatedAt, '2026-10-27T00:00:00.000Z');
});
test('metrics exclude parent, cancelled, retrospective; preserve separate scales and unknown time', () => {
  const p = fixture(); p.tasks = [
    { ...p.tasks[0], id: 'parent', state: 'done', estimateAtStart: 13, completedAt: now },
    { ...p.tasks[0], parentId: 'parent', state: 'done', estimateAtStart: 3, completedAt: now },
    { ...p.tasks[0], id: 'cancel', state: 'cancelled', estimateAtStart: 8, completedAt: now },
    { ...p.tasks[0], id: 'retro', state: 'done', estimateAtStart: 5, estimateOrigin: 'retrospective', completedAt: now },
    { ...p.tasks[0], id: 'other', scale: 'team-b', state: 'done', estimateAtStart: 8, completedAt: now },
  ]; const m = metrics(p, '2026-10-26', '2026-11-01');
  assert.equal(m.actualMinutes, null); assert.equal(m.scales.find(s => s.scale === 'personal')!.completed, 3); assert.equal(m.scales.find(s => s.scale === 'team-b')!.completed, 8);
});
test('unchanged refresh preserves proposal versions; calendar UTC midnight is interpreted in Japan',()=>{
 const p=fixture();p.tasks[0].version=3;
 const refreshed=apply(p,{action:'ingest_snapshot',source:{id:'gh',kind:'github',title:'GitHub',status:'ok',checkedAt:now,lastSuccessAt:null,count:1,error:''},tasks:[p.tasks[0]]},now).planning;
 assert.equal(refreshed.tasks[0].version,3);assert.equal(eventDay('2026-10-26T20:00:00Z'),'2026-10-27');
});
test('Trello complete queues only personal task state, archive does not complete and deadline stays fixed',()=>{
 const p=fixture();p.tasks[0].trelloSelected=true;p.tasks[0].trelloCardId='card';p.tasks[0].deadline={...p.tasks[0].deadline,value:'2027-04-01',precision:'day'};
 const input={action:'ingest_trello' as const,taskId:'t',baseVersion:0,cardId:'card',cardUrl:'https://trello.com/c/example',complete:true,archived:false,horizon:'week' as const,state:'todo' as const,target:'2026-11-01'};
 const next=apply(p,input,now).planning;assert.equal(next.tasks[0].state,'todo');assert.equal(next.operations[0].desired!.state,'done');assert.equal(next.operations[0].desired!.deadline.value,'2027-04-01');
 assert.equal(apply(p,{...input,archived:true},now).planning.operations.length,0);
 p.tasks[0].repository='someone/research';assert.throws(()=>apply(p,input,now),/参照専用/);
});
test('closing waits for worklog and mismatching readback cannot claim success',()=>{
 let p=fixture();p=apply(p,{action:'record_worklog',worklog:log(true)},now).planning;const close=p.operations.find(o=>o.kind==='update_task')!;
 assert.throws(()=>apply(p,{action:'sync_prepare',operationId:close.id},now),/実施記録/);
 p=fixture();p=apply(p,{action:'queue_task',task:{...p.tasks[0],state:'doing'},reason:'開始'},now).planning;p=apply(p,{action:'sync_prepare',operationId:p.operations[0].id},now).planning;
 assert.throws(()=>apply(p,{action:'sync_record',operationId:p.operations[0].id,lease:p.operations[0].lease,status:'done',remoteId:'I_1',error:'',task:p.tasks[0]},now),/一致しません/);
});
test('snapshot bundle imports all sources together and preserves original on invalid later snapshot',()=>{
 const p=fixture(),source={id:'gh',kind:'github' as const,title:'GitHub',status:'ok' as const,checkedAt:now,lastSuccessAt:null,count:1,error:''};
 const q=apply(p,{action:'ingest_bundle',snapshots:[{source,tasks:[{...p.tasks[0],id:'extra'}]},{source:{...source,id:'offline',status:'offline'},tasks:[]}]},now).planning;
 assert.equal(q.tasks.length,2);assert.equal(q.sources.length,2);assert.equal(p.tasks.length,1);
 const invalid={...p.tasks[0],id:'invalid',parentId:'invalid'};
 assert.throws(()=>apply(p,{action:'ingest_bundle',snapshots:[{source,tasks:[{...p.tasks[0],id:'extra'}]},{source:{...source,id:'bad'},tasks:[invalid]}]},now));
 assert.equal(p.tasks.length,1);
});
test('complete calendar window removes cancelled/missing occurrences, partial/error never erase cached events',()=>{
 const p=fixture();p.events=[{id:'cancelled-instance',calendarId:'primary',title:'旧予定',start:'2026-10-27',end:'2026-10-28',url:'',cancelled:false,projectIds:[]},{id:'outside',calendarId:'primary',title:'期間外',start:'2027-01-01',end:'2027-01-02',url:'',cancelled:false,projectIds:[]}];
 const a={action:'ingest_snapshot' as const,source:{id:'cal',kind:'calendar' as const,title:'Calendar',status:'ok' as const,checkedAt:now,lastSuccessAt:null,count:0,error:''},window:{calendarId:'primary',start:'2026-10-26',end:'2026-11-01'},events:[]};
 assert.deepEqual(apply(p,a,now).planning.events.map(e=>e.id),['outside']);
 assert.equal(apply(p,{...a,source:{...a.source,status:'partial'}},now).planning.events.length,2);
 assert.equal(apply(p,{...a,source:{...a.source,status:'error'}},now).planning.events.length,2);
});

test('comment readback advances queued close timestamp only when task content is unchanged', () => {
  const recorded=apply(fixture(),{action:'record_worklog',worklog:log(true)},now).planning;
  const work=recorded.operations.find(o=>o.kind==='worklog')!, close=recorded.operations.find(o=>o.kind==='update_task')!;
  const prepared=apply(recorded,{action:'sync_prepare',operationId:work.id},now).planning;
  const lease=prepared.operations.find(o=>o.id===work.id)!.lease, later='2026-10-26T00:01:00.000Z';
  const synced=apply(prepared,{action:'sync_record',operationId:work.id,lease,status:'done',remoteId:'comment-1',error:'',task:{...prepared.tasks[0],sourceUpdatedAt:later}},now).planning;
  assert.equal(synced.tasks[0].sourceUpdatedAt,later);
  assert.equal(synced.operations.find(o=>o.id===close.id)!.baseSourceUpdatedAt,later);
  assert.doesNotThrow(()=>apply(synced,{action:'sync_prepare',operationId:close.id},now));
  const conflict=apply(prepared,{action:'sync_record',operationId:work.id,lease,status:'done',remoteId:'comment-1',error:'',task:{...prepared.tasks[0],title:'別の編集',sourceUpdatedAt:later}},now).planning;
  assert.equal(conflict.tasks[0].sourceUpdatedAt,now);
  assert.equal(conflict.tasks[0].title,fixture().tasks[0].title);
  assert.equal(conflict.worklogs[0].synced,true);
});


test('unassigned real tasks do not acquire a sample flag; derived dates never persist', () => {
  const p=emptyPlan();p.planning.tasks=[taskSchema.parse({id:'real',title:'実タスク',target:'2026-11-01'})];
  const derived=withTaskMarks(p);
  assert.equal(derived.projects.find(p=>p.id==='derived-unassigned')!.sample,false);
  assert.equal(derived.projects[0].milestones.length,1);
  assert.equal(p.projects.length,0);
});


test('unestimated tasks have no point scale totals', () => {
  const p=emptyPlanning();p.tasks=[blankTask()];
  const result=metrics(p,'2026-10-26','2026-11-01');
  assert.deepEqual(result.scales,[]);assert.equal(result.actualMinutes,null);
});
test('timeline can exclude repository references and calendar overlays without altering saved data', () => {
  const p=emptyPlan();p.planning.config.privateRepository='example/private_task';
  p.planning.tasks=[taskSchema.parse({...blankTask(),id:'personal',target:'2026-11-01'}),taskSchema.parse({...blankTask(),id:'ref',repository:'example/solver',target:'2026-11-02'})];
  p.planning.events=[{id:'event',calendarId:'c',title:'Meeting',start:'2026-11-01',end:'2026-11-02',projectIds:[],url:'',cancelled:false}];
  const original=structuredClone(p),derived=withTaskMarks(p,{references:false,calendar:false});
  assert.deepEqual(derived.projects.flatMap(p=>p.milestones).map(m=>m.id),['task-target-personal']);
  assert.deepEqual(p,original);assert.ok(withTaskMarks(p).projects.some(p=>p.id==='derived-calendar'));
});
