import { z } from 'zod';

const id = z.string().min(1).max(200);
const text = z.string().max(12000);
const date = z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, '日付が不正です');
const instant = z.string().datetime();
const link = z.string().max(2000).refine(v => !v || /^https?:\/\//.test(v) && URL.canParse(v), 'URLが不正です');
export const points = [1, 2, 3, 5, 8, 13] as const;
const point = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8), z.literal(13)]).nullable();
export const taskStates = { todo: '未着手', doing: '進行中', blocked: '待ち', done: '完了', cancelled: '取りやめ' } as const;
export const horizonLabels = { week: '今週', month: '1か月', quarter: '3か月', half: '6か月', all: '全期間' } as const;
export type Horizon = keyof typeof horizonLabels;
export const evidenceSchema = z.object({ id, kind: z.enum(['github', 'trello', 'calendar', 'chat', 'slack', 'drive', 'gmail', 'local', 'image', 'manual']), title: z.string().max(300), url: link.default(''), checkedAt: instant, note: text.default('') });
export const taskSchema = z.object({
  id, title: z.string().min(1).max(300), purpose: text.default(''), acceptance: text.default(''),
  projectIds: z.array(id).max(30).default([]), parentId: z.string().max(200).default(''), milestoneIds: z.array(id).default([]),
  state: z.enum(['todo', 'doing', 'blocked', 'done', 'cancelled']).default('todo'), priority: z.enum(['low', 'normal', 'high']).default('normal'),
  repository: z.string().max(200).default(''), issueId: z.string().max(200).default(''), issueNumber: z.number().int().positive().nullable().default(null), url: link.default(''),
  sourceUpdatedAt: z.string().datetime().nullable().default(null), version: z.number().int().nonnegative().default(0),
  estimate: point.default(null), estimateAtStart: point.default(null), estimateOrigin: z.enum(['planned', 'retrospective']).default('planned'), scale: id.default('personal'),
  estimateHistory: z.array(z.object({ at: instant, points: point, reason: text })).default([]),
  start: date.default(''), target: date.default(''), submitted: date.default(''),
  deadline: z.object({ value: z.string().max(10).default(''), precision: z.enum(['day', 'month', 'unknown']).default('unknown'), confirmed: z.boolean().default(false), sourceUrl: link.default(''), checkedAt: date.default(''), time: z.string().default(''), timezone: z.string().default('Asia/Tokyo') }).default({}),
  startedAt: z.string().datetime().nullable().default(null), completedAt: z.string().datetime().nullable().default(null),
  blocker: z.object({ reason: text.default(''), since: date.default(''), action: text.default(''), waitingFor: z.string().max(300).default(''), reviewOn: date.default('') }).default({}),
  horizon: z.enum(['today', 'week', 'later']).default('later'), trelloSelected: z.boolean().default(false), trelloCardId: z.string().max(300).default(''), trelloUrl: link.default(''),
  calendarKinds: z.array(z.enum(['target', 'deadline'])).default([]),
  sample: z.boolean().default(false), archived: z.boolean().default(false), beneficiary: z.enum(['self', 'support', 'team']).default('self'),
  evidence: z.array(evidenceSchema).max(50).default([]),
}).superRefine((t, ctx) => {
  const d = t.deadline;
  if (d.precision === 'day' && !date.safeParse(d.value).success || d.precision === 'day' && !d.value || d.precision === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(d.value) || d.precision === 'unknown' && d.value) ctx.addIssue({ code: 'custom', message: '正式締切の日付精度を確認してください', path: ['deadline'] });
  if (d.confirmed && (d.precision !== 'day' || !d.sourceUrl || !d.checkedAt)) ctx.addIssue({ code: 'custom', message: '確定した正式締切には日付・出典・確認日が必要です', path: ['deadline'] });
  try { new Intl.DateTimeFormat('en', { timeZone: d.timezone }); } catch { ctx.addIssue({ code: 'custom', message: 'タイムゾーンが不正です' }); }
  if (d.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) ctx.addIssue({ code: 'custom', message: '時刻が不正です' });
  if (d.time && d.precision !== 'day') ctx.addIssue({ code: 'custom', message: '時刻は日付確定時のみ指定できます' });
  if (t.parentId === t.id) ctx.addIssue({ code: 'custom', message: '自分自身を親にできません' });
});
export type Task = z.infer<typeof taskSchema>;
export const worklogSchema = z.object({ id, taskId: id, at: instant, summary: z.string().min(1).max(12000), outcome: text.default(''), blocker: text.default(''), feedback: text.default(''), learned: text.default(''), estimateNote: text.default(''), actualMinutes: z.number().int().nonnegative().max(1000000).nullable().default(null), links: z.array(link).max(30).default([]), complete: z.boolean().default(false), githubCommentId: z.string().default(''), synced: z.boolean().default(false) });
export type Worklog = z.infer<typeof worklogSchema>;
export const changeSchema = z.object({ id, kind: z.enum(['create', 'update', 'cancel', 'split']), taskId: z.string().default(''), baseVersion: z.number().int().default(0), reason: z.string().min(1).max(5000), worklogId: z.string().default(''), after: z.array(taskSchema).min(1).max(30), status: z.enum(['proposed', 'accepted', 'rejected', 'applied']).default('proposed'), createdAt: instant });
export type PlanChange = z.infer<typeof changeSchema>;
export const operationSchema = z.object({ id, provider: z.enum(['github', 'trello']), kind: z.enum(['create_task', 'update_task', 'worklog', 'trello_card']), taskId: id, baseVersion: z.number().int(), baseSourceUpdatedAt: z.string().datetime().nullable(), desired: taskSchema.nullable(), worklogId: z.string().default(''), changeId: z.string().default(''), state: z.enum(['pending', 'running', 'uncertain', 'failed', 'done']).default('pending'), createdAt: instant, lease: z.string().default(''), leaseUntil: z.string().default(''), remoteId: z.string().default(''), error: text.default('') });
export type SyncOperation = z.infer<typeof operationSchema>;
export const sourceSchema = z.object({ id, kind: z.enum(['github', 'trello', 'calendar', 'local', 'other']), title: z.string().max(300), status: z.enum(['ok', 'partial', 'error', 'offline', 'unverified']), checkedAt: instant.nullable(), lastSuccessAt: instant.nullable(), error: text.default(''), count: z.number().int().nonnegative().default(0) });
const eventDate = z.string().max(40).refine(v => date.safeParse(v).success && !!v || /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v)), '予定の日付が不正です');
export const calendarEventSchema = z.object({ id, calendarId: id, title: z.string().min(1).max(300), start: eventDate, end: eventDate, url: link.default(''), cancelled: z.boolean().default(false), projectIds: z.array(id).default([]) });
export const configSchema = z.object({ privateRepository: z.string().regex(/^[\w.-]+\/[\w.-]+$/).default('owner/private_task'), owners: z.array(z.string()).default([]), organizations: z.array(z.string()).default([]), repositories: z.array(z.string()).default([]), trelloBoard: link.default(''), trelloLists: z.record(z.string()).default({}), trelloLabels: z.record(z.string()).default({}), calendarIds: z.array(z.string()).default([]), schedule: z.object({ time: z.literal('08:00').default('08:00'), timezone: z.literal('Asia/Tokyo').default('Asia/Tokyo'), status: z.enum(['not_configured', 'needs_connection', 'verified']).default('not_configured'), automationId: z.string().default('') }).default({}) });
export const planningSchema = z.object({ version: z.literal(1).default(1), tasks: z.array(taskSchema).max(3000).default([]), worklogs: z.array(worklogSchema).max(10000).default([]), changes: z.array(changeSchema).max(3000).default([]), operations: z.array(operationSchema).max(10000).default([]), sources: z.array(sourceSchema).default([]), events: z.array(calendarEventSchema).max(3000).default([]), config: configSchema.default({}) }).default({});
export type Planning = z.infer<typeof planningSchema>;
export const emptyPlanning = (): Planning => planningSchema.parse({});
export function blankTask(projectIds: string[] = []): Task { return taskSchema.parse({ id: crypto.randomUUID(), title: '新しいタスク', projectIds }); }
export function jstToday(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function eventDay(value:string) { return value.length===10 ? value : jstToday(new Date(value)); }
export function elapsedDays(t:Task,now=new Date()) { return t.startedAt ? Math.max(0,Math.floor((Date.parse(t.completedAt || now.toISOString())-Date.parse(t.startedAt))/86400000)) : null; }
export function shiftDay(day: string, n: number) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function shiftMonth(day: string, months: number) { const d = new Date(day + 'T00:00:00Z'), n = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months); d.setUTCDate(Math.min(n, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate())); return d.toISOString().slice(0, 10); }
export function horizonEnd(start: string, horizon: Horizon) { return horizon === 'all' ? '9999-12-31' : horizon === 'week' ? shiftDay(start, 6) : shiftDay(shiftMonth(start, horizon === 'month' ? 1 : horizon === 'quarter' ? 3 : 6), -1); }
export function taskDate(t: Task) { return t.target || (t.deadline.value ? t.deadline.value + (t.deadline.precision === 'month' ? '-01' : '') : '') || t.start; }
export function inHorizon(t: Task, start: string, horizon: Horizon) { const end = horizonEnd(start, horizon); return !t.archived && !['done', 'cancelled'].includes(t.state) && (horizon === 'all' || t.horizon === 'today' || t.horizon === 'week' || [t.start, t.target, t.deadline.value, t.blocker.reviewOn].some(d => d && d.slice(0, 10) <= end) || !taskDate(t) || t.state === 'blocked'); }
export function canWriteTask(t: Task, config: Planning['config']) { return !t.repository || t.repository.toLowerCase() === config.privateRepository.toLowerCase(); }
export function pendingFor(p: Planning, taskId: string) { return p.operations.some(o => o.taskId === taskId && o.provider === 'github' && o.state !== 'done'); }
export function taskBody(t: Task, marker: string) { return `## 目的\n${t.purpose}\n\n## 完了条件\n${t.acceptance}\n\n## 計画\n- 状態: ${taskStates[t.state]}\n- 準備開始: ${t.start || '未定'}\n- 目標日: ${t.target || '未定'}\n- 正式締切: ${t.deadline.value || '未定'}${t.deadline.confirmed ? '（確認済み）' : '（未確認）'}\n- 出典: ${t.deadline.sourceUrl}\n- 見積もり: ${t.estimate ?? '未見積もり'} / ${t.scale}\n\n<!-- ${marker} -->\n<!-- edu-planning-task:${JSON.stringify(t)} -->`; }
export function worklogBody(log: Worklog, marker: string) { return `## 実施記録\n${log.summary}\n\n### 成果\n${log.outcome}\n\n### Blocker\n${log.blocker}\n\n### Feedback\n${log.feedback}\n\n### 学んだこと\n${log.learned}\n\n### 見積もりとの差\n${log.estimateNote}\n\n実作業時間: ${log.actualMinutes === null ? '未記録' : log.actualMinutes + '分'}\n${log.links.join('\n')}\n\n<!-- ${marker} -->\n<!-- edu-planning-worklog:${JSON.stringify(log)} -->`; }
export function metrics(p: Planning, from: string, to: string) {
  const hasChildren = new Set(p.tasks.filter(t => !t.archived).map(t => t.parentId));
  const leaf = p.tasks.filter(t => !hasChildren.has(t.id) && !t.archived), scopes = [...new Set(leaf.map(t => t.scale))];
  const completed = leaf.filter(t => t.state === 'done' && t.completedAt && jstToday(new Date(t.completedAt)) >= from && jstToday(new Date(t.completedAt)) <= to);
  const minutes = p.worklogs.filter(l => l.synced && l.actualMinutes !== null && jstToday(new Date(l.at)) >= from && jstToday(new Date(l.at)) <= to);
  return { completedCount: completed.length, wip: leaf.filter(t => ['doing', 'blocked'].includes(t.state)).length, actualMinutes: minutes.length ? minutes.reduce((n, l) => n + l.actualMinutes!, 0) : null, scales: scopes.map(scale => ({ scale, planned: leaf.filter(t => t.scale === scale && t.estimateOrigin === 'planned' && t.target >= from && t.target <= to && t.state !== 'cancelled').reduce((n, t) => n + (t.estimateAtStart ?? t.estimate ?? 0), 0), completed: completed.filter(t => t.scale === scale && t.estimateOrigin === 'planned').reduce((n, t) => n + (t.estimateAtStart ?? 0), 0) })) };
}

export const planningActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('configure'), config: configSchema }),
  z.object({ action: z.literal('queue_task'), task: taskSchema, reason: z.string().min(1).max(5000) }),
  z.object({ action: z.literal('record_worklog'), worklog: worklogSchema }),
  z.object({ action: z.literal('propose_changes'), changes: z.array(changeSchema).min(1).max(30) }),
  z.object({ action: z.literal('review_changes'), accepted: z.array(id), rejected: z.array(id) }),
  z.object({ action: z.literal('ingest_snapshot'), source: sourceSchema, tasks: z.array(taskSchema).optional(), events: z.array(calendarEventSchema).optional(), worklogs: z.array(worklogSchema).optional() }),
  z.object({ action: z.literal('sync_prepare'), operationId: id }),
  z.object({ action: z.literal('ingest_trello'), taskId: id, baseVersion: z.number().int(), cardId: id, cardUrl: link, complete: z.boolean(), archived: z.boolean(), horizon: z.enum(['today', 'week', 'later']), state: z.enum(['todo', 'doing', 'blocked']), target: date }),
  z.object({ action: z.literal('sync_record'), operationId: id, lease: id, status: z.enum(['done', 'failed', 'uncertain']), remoteId: z.string().max(300).default(''), task: taskSchema.optional(), error: text.default('') }),
]);
export type PlanningAction = z.infer<typeof planningActionSchema>;
export function applyPlanningAction(current: Planning, input: PlanningAction, now = new Date().toISOString()): { planning: Planning; result: unknown; summary: string } {
  const p = structuredClone(current); let result: unknown = { saved: true }; let summary = input.action as string;
  function find(id: string) { const t = p.tasks.find(t => t.id === id); if (!t) throw new Error('タスクが見つかりません'); return t; }
  function queue(desired: Task, changeId = '') {
    if (p.config.privateRepository === 'owner/private_task') throw new Error('先に連携状況で個人タスクのリポジトリを設定してください');
    const prior = p.tasks.find(t => t.id === desired.id);
    if (!canWriteTask(prior ?? desired, p.config) || !canWriteTask(desired, p.config)) throw new Error('private_task以外のIssueは参照専用です');
    if (desired.sample) throw new Error('仮データは外部同期できません');
    if (pendingFor(p, desired.id)) throw new Error('このタスクには未反映の操作があります');
    if (prior && desired.version !== prior.version) throw new Error('タスクが変更されています。差分を確認してください');
    const next = taskSchema.parse({ ...desired, repository: p.config.privateRepository, version: prior?.version ?? 0 });
    if (prior?.startedAt) { next.startedAt = prior.startedAt; next.estimateAtStart = prior.estimateAtStart; next.estimateOrigin = prior.estimateOrigin; }
    if (!prior?.startedAt && ['doing', 'blocked', 'done'].includes(next.state)) { next.startedAt = now; next.estimateAtStart = next.estimate; if (next.state === 'done' && !prior) next.estimateOrigin = 'retrospective'; }
    if (prior && prior.estimate !== next.estimate) next.estimateHistory = [...prior.estimateHistory, { at: now, points: next.estimate, reason: '計画の変更' }];
    if (next.state === 'done') next.completedAt = prior?.completedAt || now; else next.completedAt = null;
    if (!prior) p.tasks.push({ ...next, repository: '', issueId: '', issueNumber: null, state: 'todo' });
    p.operations.push({ id: crypto.randomUUID(), provider: 'github', kind: prior?.issueId ? 'update_task' : 'create_task', taskId: next.id, baseVersion: prior?.version ?? 0, baseSourceUpdatedAt: prior?.sourceUpdatedAt ?? null, desired: next, worklogId: '', changeId, state: 'pending', createdAt: now, lease: '', leaseUntil: '', remoteId: '', error: '' });
  }
  if (input.action === 'configure') { if (p.tasks.some(t => t.issueId && t.repository.toLowerCase() === p.config.privateRepository.toLowerCase()) && input.config.privateRepository !== p.config.privateRepository) throw new Error('連携済みタスクがあるため正本リポジトリを変更できません'); p.config = input.config; summary = '連携設定を保存'; }
  if (input.action === 'queue_task') { queue(input.task); summary = `${input.task.title}の変更を反映待ちに登録：${input.reason}`; }
  if (input.action === 'record_worklog') {
    const t = find(input.worklog.taskId); if (!canWriteTask(t, p.config)) throw new Error('参照Issueには記録できません。個人タスクを作成してください');
    if (p.worklogs.some(l => l.id === input.worklog.id)) throw new Error('同じ実施記録は登録済みです');
    if (pendingFor(p, t.id)) throw new Error('先にタスクの反映待ち操作を同期してください');
    p.worklogs.push({ ...input.worklog, at: now, synced: false, githubCommentId: '' });
    const desired = input.worklog.complete ? taskSchema.parse({ ...t, state: 'done' }) : t;
    if (input.worklog.complete) queue(desired);
    p.operations.push({ id: crypto.randomUUID(), provider: 'github', kind: 'worklog', taskId: t.id, baseVersion: t.version, baseSourceUpdatedAt: t.sourceUpdatedAt, desired: null, worklogId: input.worklog.id, changeId: '', state: 'pending', createdAt: now, lease: '', leaseUntil: '', remoteId: '', error: '' });
    summary = `${t.title}の実施記録を反映待ちに登録`;
  }
  if (input.action === 'propose_changes') {
    for (const c of input.changes) { if (p.changes.some(v => v.id === c.id)) throw new Error('変更案IDが重複しています'); if (c.taskId && find(c.taskId).version !== c.baseVersion) throw new Error('変更案の参照が古くなっています'); if (c.worklogId && !p.worklogs.some(l => l.id === c.worklogId)) throw new Error('元の実施記録がありません'); p.changes.push({ ...c, status: 'proposed', createdAt: now }); }
    summary = '計画変更案を作成';
  }
  if (input.action === 'review_changes') {
    if (input.accepted.some(id => input.rejected.includes(id))) throw new Error('採用と不採用が重複しています');
    for (const id of [...input.accepted, ...input.rejected]) { const c = p.changes.find(c => c.id === id); if (!c || c.status !== 'proposed') throw new Error('未確認の変更案が見つかりません'); if (input.rejected.includes(id)) { c.status = 'rejected'; continue; } if (c.taskId && find(c.taskId).version !== c.baseVersion) throw new Error('変更対象が更新されています。再提案してください');
      if (c.kind === 'cancel' || c.kind === 'split') { const t = find(c.taskId); queue({ ...t, state: 'cancelled' }, c.id); }
      if (c.kind !== 'cancel') for (const t of c.after) queue(c.kind === 'split' ? { ...t, parentId: c.taskId } : t, c.id);
      c.status = 'accepted';
    }
    summary = '採用した計画変更を反映待ちに登録';
  }
  if (input.action === 'ingest_snapshot') {
    const source = input.source; const priorSource = p.sources.find(s => s.id === source.id); if (priorSource?.checkedAt && source.checkedAt && priorSource.checkedAt > source.checkedAt) throw new Error('古い取得結果です');
    p.sources = p.sources.filter(s => s.id !== source.id); p.sources.push({ ...source, lastSuccessAt: source.status === 'ok' ? source.checkedAt : priorSource?.lastSuccessAt ?? null });
    if (['ok', 'partial'].includes(source.status)) {
      for (const raw of input.tasks ?? []) { const t = taskSchema.parse(raw), prior = p.tasks.find(v => v.id === t.id); if (prior && prior.sourceUpdatedAt && (!t.sourceUpdatedAt || prior.sourceUpdatedAt >= t.sourceUpdatedAt)) continue;
        if (prior && pendingFor(p, t.id)) { if (t.sourceUpdatedAt !== prior.sourceUpdatedAt) p.sources.find(s => s.id === source.id)!.error = '同期待ちのタスクに外部変更があります。差分を確認してください'; continue; }
        if (prior) { t.version = prior.version + 1; if (prior.startedAt) { t.estimateAtStart = prior.estimateAtStart; t.startedAt = prior.startedAt; t.estimateOrigin = prior.estimateOrigin; } p.tasks[p.tasks.indexOf(prior)] = t; } else {if(t.state==='done'&&!t.startedAt)t.estimateOrigin='retrospective';p.tasks.push(t);}
      }
      for (const e of input.events ?? []) { p.events = p.events.filter(v => !(v.id === e.id && v.calendarId === e.calendarId)); p.events.push(e); }
      for (const log of input.worklogs ?? []) { if (!p.worklogs.some(l => l.id === log.id)) p.worklogs.push({ ...log, synced: true }); }
    }
    summary = `${source.title}の取得状態を記録`;
  }
  if (input.action === 'ingest_trello') {
    const t = find(input.taskId);
    if (!t.trelloSelected || t.trelloCardId !== input.cardId || t.version !== input.baseVersion) throw new Error('対応カードまたは参照が一致しません');
    if (!input.archived) { const next = { ...t, state: input.complete ? 'done' as const : input.state, horizon: input.horizon, target: input.target }; if (next.state !== t.state || next.target !== t.target || next.horizon !== t.horizon) queue(next); }
    summary = input.archived ? 'カードのアーカイブを確認（完了状態は変更しない）' : 'Trelloの変更を反映待ちに登録';
  }
  if (input.action === 'sync_prepare') {
    const op = p.operations.find(o => o.id === input.operationId); if (!op) throw new Error('操作が見つかりません');
    if (op.state === 'done') result = { action: 'unchanged', remoteId: op.remoteId };
    else {
      if (op.leaseUntil && op.leaseUntil > now) throw new Error('別の同期が処理中です'); const t = find(op.taskId);
      if (t.sample || !canWriteTask(t, p.config)) throw new Error('このタスクには外部書き込みできません');
      if (op.kind === 'worklog' && !t.issueId) throw new Error('先に個人Issueを作成してください');
      if (op.kind === 'update_task' && op.desired?.state === 'done' && p.worklogs.some(l => l.taskId === t.id && l.complete && !l.synced)) throw new Error('先に完了時の実施記録をGitHubへ保存してください');
      if (op.kind === 'update_task' && (t.version !== op.baseVersion || t.sourceUpdatedAt !== op.baseSourceUpdatedAt)) throw new Error('更新対象が変わっています。差分を確認してください');
      const recoveryRequired = op.state === 'uncertain' || op.state === 'running'; op.state = 'running'; op.lease = crypto.randomUUID(); op.leaseUntil = new Date(Date.parse(now) + 300000).toISOString();
      const marker = `edu_planning:operation:${op.id}`;
      result = { operation: op, task: t, config: op.provider === 'trello' ? p.config : undefined, repository: p.config.privateRepository, marker, recoveryRequired, body: op.kind === 'worklog' ? worklogBody(p.worklogs.find(l => l.id === op.worklogId)!, marker) : taskBody(op.desired ?? t, marker), instructions: '更新前に正本の最新状態を取得しsourceUpdatedAtを比較。作成・コメントはmarkerまたはIssue URLで全ページを確認して重複防止。通信結果不明ならuncertainを記録し、確認できるまで再作成しない。成功後はreadbackしたtaskとremoteIdをsync_recordへ渡す。Trelloのdueはtargetだけ、正式締切は説明に表示。' };
    }
    summary = '同期操作を準備';
  }
  if (input.action === 'sync_record') {
    const op = p.operations.find(o => o.id === input.operationId); if (!op || op.lease !== input.lease || op.state !== 'running' || op.leaseUntil < now) throw new Error('同期の確認情報が古くなっています');
    if (input.status === 'done') {
      if (!input.remoteId) throw new Error('外部IDが必要です');
      if (op.kind === 'worklog') { const log = p.worklogs.find(l => l.id === op.worklogId)!; log.synced = true; log.githubCommentId = input.remoteId; }
      else if (op.provider === 'trello') { const t = find(op.taskId); if (t.version !== op.baseVersion) throw new Error('正本が変更されています。最新内容でカードを確認してください'); t.trelloCardId = input.remoteId; t.trelloUrl = input.task?.trelloUrl || t.trelloUrl; }
      else {
        if (!input.task || !input.task.issueId || !input.task.sourceUpdatedAt || input.task.id !== op.taskId || input.task.repository.toLowerCase() !== p.config.privateRepository.toLowerCase()) throw new Error('GitHubから再取得したIssueが必要です');
        const prior = find(op.taskId); if (prior.version !== op.baseVersion) throw new Error('保存中にタスクが変更されました'); const desired = op.desired!;
        if (input.task.title !== desired.title || input.task.state !== desired.state || input.task.estimate !== desired.estimate || prior.issueId && input.task.issueId !== prior.issueId) throw new Error('GitHubの再取得結果が変更内容と一致しません');
        const t = taskSchema.parse({ ...input.task, ...desired, issueId: input.task.issueId, issueNumber: input.task.issueNumber, url: input.task.url, repository: p.config.privateRepository, sourceUpdatedAt: input.task.sourceUpdatedAt, version: prior.version + 1 }); p.tasks[p.tasks.indexOf(prior)] = t;
        if (t.trelloSelected && p.config.trelloBoard) { p.operations.push({ id: crypto.randomUUID(), provider: 'trello', kind: 'trello_card', taskId: t.id, baseVersion: t.version, baseSourceUpdatedAt: t.sourceUpdatedAt, desired: t, worklogId: '', changeId: '', state: 'pending', createdAt: now, lease: '', leaseUntil: '', remoteId: '', error: '' }); }
      }
      op.remoteId = input.remoteId;
    }
    op.state = input.status; op.error = input.error; op.lease = ''; op.leaseUntil = '';
    if (op.changeId) { const c = p.changes.find(c => c.id === op.changeId); if (c && p.operations.filter(v => v.changeId === c.id).every(v => v.state === 'done')) c.status = 'applied'; }
    summary = input.status === 'done' ? '外部反映を確認' : '同期失敗・未確認を記録';
  }
  const ids = p.tasks.map(t => t.id); if (new Set(ids).size !== ids.length) throw new Error('タスクIDが重複しています');
  for (const t of p.tasks) { const seen = new Set([t.id]); let parent = t.parentId; while (parent) { if (seen.has(parent)) throw new Error('親子関係が循環しています'); seen.add(parent); parent = p.tasks.find(v => v.id === parent)?.parentId ?? ''; } }
  return { planning: planningSchema.parse(p), result, summary };
}
