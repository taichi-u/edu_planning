import { z } from 'zod';

const text = z.string().max(12000);
const url = z.string().max(2000).refine(v => !v || /^https:\/\//.test(v) && URL.canParse(v), 'httpsのURLを入力してください');
const ids = z.array(z.string().min(1).max(200)).max(30);
export const readingStates = { unknown: '読了状況未確認', planned: '読む予定', reading: '精読中', read: '読了', applied: '適用済み' } as const;

export function driveFileId(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'drive.google.com' || u.username || u.password) return null;
    const id = u.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1] ?? (u.pathname === '/open' ? u.searchParams.get('id') : null);
    return id && /^[\w-]+$/.test(id) ? id : null;
  } catch { return null; }
}
export function driveFolderId(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'drive.google.com' && !u.username && !u.password ? u.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)(?:\/|$)/)?.[1] ?? null : null;
  } catch { return null; }
}
export const paperSchema = z.object({
  id: z.string().min(1).max(200), title: z.string().trim().min(1).max(600),
  authors: z.string().max(600).default(''), year: z.number().int().min(1500).max(2200).nullable().default(null),
  doi: z.string().trim().max(300).refine(v => !v || /^10\.\d{4,9}\/\S+$/i.test(v), 'DOIを確認してください').default(''),
  sourceUrl: url.default(''), driveUrl: url.refine(v => !v || !!driveFileId(v), 'DriveのファイルURLを入力してください').default(''),
  folderUrl: url.refine(v => !v || !!driveFolderId(v), 'DriveのフォルダURLを入力してください').default(''),
  fileName: z.string().max(600).default(''), mimeType: z.enum(['', 'application/pdf']).default(''),
  fileSize: z.number().int().positive().nullable().default(null), checkedAt: z.string().datetime().nullable().default(null),
  projectIds: ids.default([]), taskIds: ids.default([]), purpose: text.default(''), recommendedBy: z.string().max(300).default(''),
  readingState: z.enum(['unknown', 'planned', 'reading', 'read', 'applied']).default('unknown'),
  notes: text.default(''), archived: z.boolean().default(false), updatedAt: z.string().datetime().nullable().default(null),
}).superRefine((p, ctx) => {
  if (!p.driveUrl && (p.mimeType || p.fileSize !== null || p.checkedAt)) ctx.addIssue({ code: 'custom', path: ['driveUrl'], message: 'PDFの確認情報にはDrive URLが必要です' });
});
export type Paper = z.infer<typeof paperSchema>;
export function savePaper(papers: Paper[], raw: Paper, tasks: { id: string }[], now: string) {
  const paper = paperSchema.parse(raw), prior = papers.find(p => p.id === paper.id);
  const duplicate = papers.find(p => p.id !== paper.id && (paper.doi && p.doi.toLowerCase() === paper.doi.toLowerCase() || paper.driveUrl && driveFileId(p.driveUrl) === driveFileId(paper.driveUrl)));
  if (duplicate) throw new Error(`同じ論文は登録済みです：「${duplicate.title}」を編集してください`);
  if (paper.taskIds.some(id => !tasks.some(t => t.id === id))) throw new Error('関連タスクが見つかりません');
  if (prior && prior.driveUrl !== paper.driveUrl && prior.checkedAt && prior.checkedAt === paper.checkedAt) throw new Error('Drive URLの変更時はPDFの確認情報を再取得するか未確認に戻してください');
  const next = { ...paper, projectIds: [...new Set(paper.projectIds)], taskIds: [...new Set(paper.taskIds)], updatedAt: now };
  return prior ? papers.map(p => p.id === paper.id ? next : p) : [...papers, next];
}
export function selectPapers(papers: Paper[], tasks: { id: string; title: string; projectIds: string[] }[], scope: string, query: string) {
  const q = query.trim().toLowerCase();
  return papers.filter(p => !p.archived && (!scope || p.projectIds.includes(scope) || tasks.some(t => p.taskIds.includes(t.id) && t.projectIds.includes(scope))) && (!q || [p.title, p.authors, p.doi, p.purpose, p.recommendedBy, ...tasks.filter(t => p.taskIds.includes(t.id)).map(t => t.title)].join(' ').toLowerCase().includes(q))).sort((a,b) => a.title.localeCompare(b.title, 'ja'));
}
