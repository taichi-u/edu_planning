import { z } from 'zod';

export const categories = [
  { id: 'research', label: '研究', color: '#0072B2' },
  { id: 'paper', label: '論文', color: '#D55E00' },
  { id: 'travel', label: '学会・留学', color: '#009E73' },
  { id: 'funding', label: '申請・資金', color: '#9E5481' },
  { id: 'degree', label: '学位・進路', color: '#9B7400' },
] as const;
export const kinds = { period: '期間', deadline: '正式締切', target: '目標日', submitted: '提出済み', event: '開催・実施日' } as const;
export const stages = ['着想', '準備中', '実施中', '執筆中', '投稿済み', '査読中', '出版済み', '完了'] as const;
const category = z.enum(['research', 'paper', 'travel', 'funding', 'degree']);
const day = /^\d{4}-\d{2}-\d{2}$/;
export function validDay(value: string) { return day.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
const optionalDay = z.string().refine(v => v === '' || validDay(v), 'YYYY-MM-DDで入力してください');
const url = z.string().max(2000).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), 'http(s)のURLを入力してください');
export const milestoneSchema = z.object({
  id: z.string().min(1).max(100), title: z.string().min(1).max(200), publicTitle: z.string().max(200),
  category, kind: z.enum(['period', 'deadline', 'target', 'submitted', 'event']),
  precision: z.enum(['day', 'month', 'unknown']), start: z.string().max(10), end: z.string().max(10),
  time: z.string().refine(v => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), '時刻が不正です'),
  timezone: z.string().max(80).refine(v => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }, 'タイムゾーンが不正です'),
  confirmed: z.boolean(), done: z.boolean(), important: z.boolean(), shared: z.boolean(), calendarSync: z.boolean(),
  sourceUrl: url, checkedAt: optionalDay,
}).superRefine((m, ctx) => {
  const valid = (v: string) => m.precision === 'day' ? validDay(v) : /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
  if (m.precision === 'unknown' ? m.start !== '' || m.end !== '' : !valid(m.start) || !!m.end && !valid(m.end)) ctx.addIssue({ code: 'custom', message: '日付と精度を確認してください', path: ['start'] });
  if (m.end && m.end < m.start) ctx.addIssue({ code: 'custom', message: '終了日は開始日以降にしてください', path: ['end'] });
  if (m.time && m.precision !== 'day') ctx.addIssue({ code: 'custom', message: '時刻は日付確定時のみ指定できます', path: ['time'] });
  if (m.kind === 'deadline' && m.confirmed && (!m.sourceUrl || !m.checkedAt || m.precision !== 'day')) ctx.addIssue({ code: 'custom', message: '確定した正式締切には日付・出典URL・確認日が必要です', path: ['sourceUrl'] });
});
export const projectSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().min(1).max(300), shortName: z.string().min(1).max(60), publicName: z.string().max(100),
  category, theme: z.string().max(300), notes: z.string().max(5000), stage: z.enum(stages),
  links: z.array(z.object({ label: z.string().max(100), url })).max(20),
  shareable: z.boolean(), viewerEmails: z.array(z.string().email().transform(v => v.toLowerCase().trim())).max(30),
  archived: z.boolean(), sample: z.boolean(), milestones: z.array(milestoneSchema).max(80),
}).superRefine((p, ctx) => {
  if (new Set(p.milestones.map(m => m.id)).size !== p.milestones.length) ctx.addIssue({ code: 'custom', message: '節目IDが重複しています' });
  if (p.shareable && (!p.publicName || p.milestones.some(m => m.shared && !m.publicTitle))) ctx.addIssue({ code: 'custom', message: '共有用名称を入力してください' });
});
export const settingsSchema = z.object({ b4Start: z.string().refine(validDay), phdStart: z.string().refine(validDay) }).refine(v => v.phdStart > v.b4Start, '博士課程の開始日はB4開始日より後にしてください');
export const planSchema = z.object({ settings: settingsSchema, projects: z.array(projectSchema).max(300) });
export type Milestone = z.infer<typeof milestoneSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Category = Project['category'];
export type PlanResponse = { plan: Plan; revision: number; role: 'owner' | 'viewer' | 'uninitialized' | 'anonymous'; email: string; initialized: boolean; meeting: boolean };
export const emptyPlan = (): Plan => ({ settings: { b4Start: '2026-04-01', phdStart: '2027-04-01' }, projects: [] });
export function canEdit(ownerId: string, userId: string | null) { return !!userId && ownerId === userId; }
export function projectPlan(plan: Plan, owner: boolean, email: string, meeting: boolean): Plan {
  if (owner && !meeting) return structuredClone(plan);
  return { settings: plan.settings, projects: plan.projects.filter(p => !p.archived && p.shareable && (owner || p.viewerEmails.includes(email.toLowerCase()))).map(p => ({
    ...p, name: p.publicName, shortName: p.publicName, theme: '', notes: '', links: [], viewerEmails: [],
    milestones: p.milestones.filter(m => m.shared && (!meeting || m.category !== 'research')).map(m => ({ ...m, title: m.publicTitle, sourceUrl: '', checkedAt: '', calendarSync: false })),
  })).filter(p => p.milestones.length > 0) };
}
export function utcDay(value: string) { return new Date(value.slice(0, 10) + 'T00:00:00Z'); }
export function addDays(value: string, n: number) { const d = utcDay(value); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function addYears(value: string, n: number) { const d = utcDay(value); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10); }
export function dateBounds(m: Milestone): [string, string] | null {
  if (m.precision === 'unknown') return null;
  if (m.precision === 'day') return [m.start, m.end || m.start];
  const end = m.end || m.start;
  const next = new Date(Number(end.slice(0, 4)), Number(end.slice(5, 7)), 1);
  const last = new Date(Date.UTC(next.getFullYear(), next.getMonth(), 0)).toISOString().slice(0, 10);
  return [m.start + '-01', last];
}
export function dateLabel(m: Milestone) { return m.precision === 'unknown' ? '日付未定' : m.start.replaceAll('-', '/') + (m.end ? ' – ' + m.end.replaceAll('-', '/') : '') + (m.precision === 'month' ? '（月内）' : m.time ? ` ${m.time} ${m.timezone}` : ''); }
export function blankMilestone(cat: Category): Milestone { return { id: crypto.randomUUID(), title: '', publicTitle: '', category: cat, kind: 'deadline', precision: 'day', start: '', end: '', time: '', timezone: 'Asia/Tokyo', confirmed: false, done: false, important: true, shared: true, calendarSync: false, sourceUrl: '', checkedAt: '' }; }
export function blankProject(): Project { return { id: crypto.randomUUID(), name: '', shortName: '', publicName: '', category: 'research', theme: '', notes: '', stage: '着想', links: [], shareable: false, viewerEmails: [], archived: false, sample: false, milestones: [] }; }
export function calendarPayload(p: Project, m: Milestone, marker: string) {
  if (m.precision !== 'day') throw new Error('日付未定・月のみの項目は同期できません');
  const common = { title: `${m.title} / ${p.shortName}`, description: `${marker}\n${kinds[m.kind]}${m.confirmed ? '（確認済み）' : '（予定）'}\n${m.sourceUrl}`, reminders: { use_default: true } };
  if (!m.time) return { ...common, start_date: m.start, end_date: addDays(m.end || m.start, 1) };
  const startLocal = `${m.start}T${m.time}:00`;
  const endLocal = m.end && m.end > m.start ? `${m.end}T${m.time}:00` : new Date(Date.parse(startLocal + 'Z') + 30 * 60000).toISOString().slice(0, 19);
  return { ...common, start_local: startLocal, end_local: endLocal, timezone: m.timezone };
}
export async function fingerprint(value: unknown) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))); return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join(''); }
