import test from 'node:test';
import assert from 'node:assert/strict';
import { paperSchema, driveFileId, driveFolderId, selectPapers } from '../lib/papers';
import { applyPlanningAction, emptyPlanning, planningSchema, taskSchema } from '../lib/planning';
import { emptyPlan, projectPlan } from '../lib/domain';

const at = '2026-10-28T00:00:00.000Z';
const paper = () => paperSchema.parse({ id: 'paper-a', title: 'Example paper', doi: '10.1234/example', driveUrl: 'https://drive.google.com/file/d/example-pdf/view', projectIds: ['project-a'], taskIds: ['task-a'] });
function planning() { const p = emptyPlanning(); p.tasks.push(taskSchema.parse({ id: 'task-a', title: '静的パラメータを実装', projectIds: ['project-a'] })); return p; }

test('old saved plans default to no papers; unknown references do not invent reading progress', () => {
  assert.deepEqual(planningSchema.parse({}).papers, []);
  const p = paperSchema.parse({ id: 'unknown', title: '未特定の推薦論文' });
  assert.equal(p.readingState, 'unknown'); assert.equal(p.year, null); assert.equal(p.checkedAt, null); assert.equal(p.driveUrl, '');
});
test('Drive URLs identify files across link variants and reject folders or lookalike hosts', () => {
  assert.equal(driveFileId('https://drive.google.com/open?id=example-pdf'), 'example-pdf');
  assert.equal(driveFolderId('https://drive.google.com/drive/folders/example-folder'), 'example-folder');
  for (const v of ['https://drive.google.com.evil.test/file/d/x/view', 'https://evil.test/file/d/x/view', 'javascript:alert(1)', 'https://drive.google.com/drive/folders/x']) assert.equal(driveFileId(v), null);
  assert.equal(paperSchema.safeParse({ ...paper(), driveUrl: 'https://example.org/not-drive' }).success, false);
});
test('paper updates persist separately from task operations; duplicate DOI and file IDs are rejected', () => {
  let p = applyPlanningAction(planning(), { action: 'upsert_paper', paper: paper() }, at).planning;
  p = applyPlanningAction(p, { action: 'upsert_paper', paper: { ...p.papers[0], readingState: 'read' } }, at).planning;
  assert.equal(p.papers.length, 1); assert.equal(p.papers[0].readingState, 'read'); assert.equal(p.tasks[0].state, 'todo'); assert.equal(p.operations.length, 0);
  assert.throws(() => applyPlanningAction(p, { action: 'upsert_paper', paper: { ...paper(), id: 'other', doi: '10.1234/EXAMPLE', driveUrl: '' } }, at), /登録済み/);
  assert.throws(() => applyPlanningAction(p, { action: 'upsert_paper', paper: { ...paper(), id: 'other', doi: '', driveUrl: 'https://drive.google.com/open?id=example-pdf' } }, at), /登録済み/);
  assert.throws(() => applyPlanningAction(p, { action: 'upsert_paper', paper: { ...paper(), id: 'other', doi: '', driveUrl: '', taskIds: ['missing'] } }, at), /タスク/);
});
test('changing PDF links cannot retain stale verified metadata', () => {
  const p = applyPlanningAction(planning(), { action: 'upsert_paper', paper: { ...paper(), checkedAt: at, mimeType: 'application/pdf', fileSize: 123 } }, at).planning;
  const moved = { ...p.papers[0], driveUrl: 'https://drive.google.com/file/d/new-pdf/view' };
  assert.throws(() => applyPlanningAction(p, { action: 'upsert_paper', paper: moved }, at), /確認情報/);
  assert.doesNotThrow(() => applyPlanningAction(p, { action: 'upsert_paper', paper: { ...moved, checkedAt: null, mimeType: '', fileSize: null } }, at));
});
test('project and text filters include linked tasks; viewer and meeting projections exclude all paper records', () => {
  const plan = emptyPlan(); plan.planning = applyPlanningAction(planning(), { action: 'upsert_paper', paper: { ...paper(), projectIds: [] } }, at).planning;
  assert.equal(selectPapers(plan.planning.papers, plan.planning.tasks, 'project-a', '静的').length, 1);
  assert.equal(selectPapers(plan.planning.papers, plan.planning.tasks, 'other', '').length, 0);
  assert.equal(selectPapers(plan.planning.papers, plan.planning.tasks, '', '10.1234').length, 1);
  for (const projected of [projectPlan(plan, false, 'viewer@example.org', false), projectPlan(plan, true, '', true)]) {
    assert.deepEqual(projected.planning.papers, []); assert.equal(JSON.stringify(projected).includes('example-pdf'), false);
  }
  assert.equal(projectPlan(plan, true, '', false).planning.papers.length, 1);
});
