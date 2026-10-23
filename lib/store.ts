import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { emptyPlan, planSchema, projectSchema, settingsSchema, projectPlan, canEdit, calendarPayload, fingerprint, type Plan, type PlanResponse } from './domain';
import { samplePlan } from './sample';
import { z } from 'zod';

export class AppError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function db() { if (!env.DB) throw new AppError('データベースが利用できません', 503); return env.DB; }
type Row = { owner_id: string; body: string; revision: number };
export async function context() {
  const user = await getChatGPTUser();
  const row = await db().prepare('SELECT owner_id, body, revision FROM workspace WHERE id = ?').bind('main').first<Row>();
  return { user, row, owner: !!row && canEdit(row.owner_id, user?.userId ?? null), plan: row ? planSchema.parse(JSON.parse(row.body)) : emptyPlan() };
}
export async function readPlan(meeting = false): Promise<PlanResponse> {
  const ctx = await context();
  if (!ctx.user) return { plan: emptyPlan(), revision: 0, role: 'anonymous', email: '', initialized: !!ctx.row, meeting };
  return { plan: projectPlan(ctx.plan, ctx.owner, ctx.user.email, meeting), revision: ctx.row?.revision ?? 0, role: !ctx.row ? 'uninitialized' : ctx.owner ? 'owner' : 'viewer', email: ctx.user.email, initialized: !!ctx.row, meeting };
}
export async function ownerContext() { const ctx = await context(); if (!ctx.user) throw new AppError('ログインが必要です', 401); if (!ctx.owner) throw new AppError('所有者だけが編集できます', 403); return ctx; }
const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('initialize'), sample: z.boolean() }),
  z.object({ action: z.literal('create_project'), revision: z.number().int(), project: projectSchema }),
  z.object({ action: z.literal('update_project'), revision: z.number().int(), project: projectSchema }),
  z.object({ action: z.literal('archive_project'), revision: z.number().int(), projectId: z.string() }),
  z.object({ action: z.literal('settings'), revision: z.number().int(), settings: settingsSchema }),
]);
export async function mutate(raw: unknown) {
  const input = mutation.parse(raw);
  if (input.action === 'initialize') {
    const user = await getChatGPTUser(); if (!user) throw new AppError('ログインが必要です', 401);
    // Site must remain owner-private until initialized. The unique singleton prevents a second owner.
    const plan = input.sample ? samplePlan() : emptyPlan(); planSchema.parse(plan);
    const now = new Date().toISOString();
    const result = await db().prepare('INSERT OR IGNORE INTO workspace (id, owner_id, body, revision, updated_at) VALUES (?, ?, ?, 1, ?)').bind('main', user.userId, JSON.stringify(plan), now).run();
    if (!result.meta.changes) throw new AppError('初期化済みです。再読み込みしてください', 409);
    return readPlan();
  }
  const ctx = await ownerContext();
  if (ctx.row!.revision !== input.revision) throw new AppError('別の変更が保存されています。再読み込みしてから編集してください', 409);
  const plan: Plan = structuredClone(ctx.plan);
  let projectId: string | null = null; let summary = '';
  if (input.action === 'settings') { plan.settings = input.settings; summary = '学年の開始日を変更'; }
  else if (input.action === 'archive_project') { const p = plan.projects.find(p => p.id === input.projectId); if (!p) throw new AppError('案件が見つかりません', 404); p.archived = true; projectId = p.id; summary = `${p.shortName}をアーカイブ`; }
  else {
    projectId = input.project.id;
    const at = plan.projects.findIndex(p => p.id === projectId);
    if (input.action === 'create_project') { if (at >= 0) throw new AppError('案件IDが重複しています', 409); plan.projects.push(input.project); summary = `${input.project.shortName}を追加`; }
    else { if (at < 0) throw new AppError('案件が見つかりません', 404); plan.projects[at] = input.project; summary = `${input.project.shortName}を変更`; }
  }
  planSchema.parse(plan);
  const revision = input.revision + 1; const now = new Date().toISOString();
  const result = await db().batch([
    db().prepare('INSERT INTO history (id, revision, actor_id, action, project_id, created_at, summary) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM workspace WHERE id = ? AND revision = ?)').bind(crypto.randomUUID(), revision, ctx.user!.userId, input.action, projectId, now, summary, 'main', input.revision),
    db().prepare('UPDATE workspace SET body = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(JSON.stringify(plan), revision, now, 'main', input.revision),
  ]);
  if (!result[1].meta.changes) throw new AppError('同時編集を検出しました。再読み込みしてください', 409);
  return readPlan();
}
export async function readHistory(projectId?: string) {
  await ownerContext();
  const query = projectId ? db().prepare('SELECT revision, action, project_id, created_at, summary FROM history WHERE project_id = ? ORDER BY revision DESC LIMIT 100').bind(projectId) : db().prepare('SELECT revision, action, project_id, created_at, summary FROM history ORDER BY revision DESC LIMIT 100');
  return (await query.all()).results;
}
export async function calendarTargets() {
  const ctx = await ownerContext();
  const targets = ctx.plan.projects.filter(p => !p.archived).flatMap(p => p.milestones.filter(m => m.calendarSync).map(m => ({ projectId: p.id, milestoneId: m.id, title: m.title, precision: m.precision, eligible: m.precision === 'day', sample: p.sample })));
  return { targets, links: (await db().prepare('SELECT calendar_id, milestone_id, event_id, updated_at FROM calendar_links').all()).results };
}
const syncInput = z.object({ projectId: z.string(), milestoneId: z.string(), calendarId: z.string().min(1).max(300) });
export async function prepareCalendar(raw: unknown) {
  const input = syncInput.parse(raw); const ctx = await ownerContext();
  const project = ctx.plan.projects.find(p => p.id === input.projectId && !p.archived);
  const m = project?.milestones.find(m => m.id === input.milestoneId && m.calendarSync);
  if (!project || !m) throw new AppError('同期対象が見つかりません', 404);
  if (project.sample) throw new AppError('仮データは同期できません。実際の計画として保存し直してください');
  const id = await fingerprint([project.id, m.id, input.calendarId]);
  const marker = `edu_planning:${id}`;
  const payload = calendarPayload(project, m, marker); const hash = await fingerprint(payload);
  const now = new Date().toISOString(); const lease = crypto.randomUUID();
  await db().prepare('INSERT OR IGNORE INTO calendar_links (id, calendar_id, milestone_id, fingerprint, updated_at) VALUES (?, ?, ?, ?, ?)').bind(id, input.calendarId, m.id, '', now).run();
  const prior = await db().prepare('SELECT * FROM calendar_links WHERE id = ?').bind(id).first<{ event_id: string | null; fingerprint: string; pending_fingerprint: string | null; lease_until: string | null }>();
  if (prior?.fingerprint === hash && prior.event_id && !prior.pending_fingerprint) return { action: 'unchanged', eventId: prior.event_id, marker };
  const acquired = await db().prepare('UPDATE calendar_links SET lease = ?, lease_until = ?, pending_fingerprint = ? WHERE id = ? AND (lease_until IS NULL OR lease_until < ?)').bind(lease, new Date(Date.now() + 5 * 60000).toISOString(), hash, id, now).run();
  if (!acquired.meta.changes) throw new AppError('別の同期が処理中です。5分後に登録状態を確認してください', 409);
  return { action: prior?.event_id ? 'update' : 'search_before_create', recoveryRequired: !!prior?.pending_fingerprint, calendarId: input.calendarId, eventId: prior?.event_id, marker, payload, receipt: { id, lease, fingerprint: hash }, instructions: '必ず対象カレンダーでdescriptionのmarkerを完全一致で確認する。既存イベントは更新する。検索が失敗/不完全、または前回の作成結果が不明なら新規作成しない。start_localとend_localがあるときはtimezoneで解釈して時刻付き予定にする。日付のみなら終日（end_dateは排他的）。通知use_default:true、参加者なし。成功後にcalendar_recordでイベントIDを記録する。自動削除は行わない。' };
}
export async function recordCalendar(raw: unknown) {
  await ownerContext();
  const input = z.object({ id: z.string(), lease: z.string(), fingerprint: z.string(), eventId: z.string().min(1).max(1000) }).parse(raw);
  const result = await db().prepare('UPDATE calendar_links SET event_id = ?, fingerprint = ?, pending_fingerprint = NULL, lease = NULL, lease_until = NULL, updated_at = ? WHERE id = ? AND lease = ? AND pending_fingerprint = ?').bind(input.eventId, input.fingerprint, new Date().toISOString(), input.id, input.lease, input.fingerprint).run();
  if (!result.meta.changes) throw new AppError('同期の確認情報が古くなっています。登録状態を再確認してください', 409);
  return { saved: true, eventId: input.eventId };
}
export function errorResponse(error: unknown) { return Response.json({ error: error instanceof z.ZodError ? error.issues.map(x => x.message).join(' / ') : error instanceof Error ? error.message : '処理に失敗しました' }, { status: error instanceof AppError ? error.status : error instanceof z.ZodError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } }); }
