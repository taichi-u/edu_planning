import { readPlan, mutate, readHistory, calendarTargets, prepareCalendar, recordCalendar } from '@/lib/store';
export const dynamic = 'force-dynamic';
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const str = { type: 'string' }; const rev = { type: 'integer', description: 'list_projectsで取得したrevision。同時変更時は再取得して差分を確認。' };
const tools = [
  { name: 'list_projects', description: '研究ロードマップを一覧取得。日付精度・共有範囲・revisionを返す。未確認の締切を確定情報として扱わない。', inputSchema: object({ meeting: { type: 'boolean' } }) },
  { name: 'get_project', description: '案件と関連する期間・締切の詳細を取得。取得権限のない項目は返さない。', inputSchema: object({ projectId: str }, ['projectId']) },
  { name: 'create_project', description: '案件を追加。projectは既存案件と同じ構造。最初にlist_projectsとget_schemaを取得する。実計画sample:false。', inputSchema: object({ revision: rev, project: { type: 'object' } }, ['revision', 'project']) },
  { name: 'update_project', description: '案件を変更。get_projectの完全なprojectを編集して渡す。正式締切は準備期間の移動と独立して保持。明示依頼のない日付を動かさない。', inputSchema: object({ revision: rev, project: { type: 'object' } }, ['revision', 'project']) },
  { name: 'archive_project', description: '案件をアーカイブ。カレンダーからは自動削除しない。', inputSchema: object({ revision: rev, projectId: str }, ['revision', 'projectId']) },
  { name: 'get_schema', description: '案件・節目の入力仕様を取得。', inputSchema: object({}) },
  { name: 'history', description: '所有者向けの変更履歴。', inputSchema: object({ projectId: str }) },
  { name: 'calendar_targets', description: 'Google Calendar同期対象を取得。同期は人間の依頼時のみ。仮データは書き込まない。', inputSchema: object({}) },
  { name: 'calendar_prepare', description: '1項目の同期ロックを取得しイベントID・検索マーカー・payloadを返す。Google Calendarツールで既存を確認して作成/更新する。通信結果が不明なら再作成禁止。実行後calendar_record必須。', inputSchema: object({ projectId: str, milestoneId: str, calendarId: str }, ['projectId','milestoneId','calendarId']) },
  { name: 'calendar_record', description: 'Google Calendar作成/更新成功後のeventIdとcalendar_prepareのreceiptを保存。入力id,lease,fingerprintはreceiptをそのまま渡す。', inputSchema: object({ id: str, lease: str, fingerprint: str, eventId: str }, ['id','lease','fingerprint','eventId']) },
];
export async function POST(request: Request) {
  let id: unknown = null;
  try {
    const raw = await request.text(); if (raw.length > 1500000) throw new Error('入力が大きすぎます');
    const body = JSON.parse(raw); id = body.id ?? null;
    let result: unknown;
    if (body.method === 'server/discover') result = { supportedVersions: ['2026-07-28'], capabilities: { tools: {} } };
    else if (body.method === 'tools/list') result = { tools };
    else if (body.method === 'tools/call') {
      const { name, arguments: args = {} } = body.params; let value: unknown;
      try {
        if (name === 'list_projects') value = await readPlan(args.meeting === true);
        else if (name === 'get_project') { const data = await readPlan(); const project = data.plan.projects.find(p => p.id === args.projectId); if (!project) throw new Error('案件が見つかりません'); value = { project, revision: data.revision }; }
        else if (['create_project','update_project','archive_project'].includes(name)) value = await mutate({ ...args, action: name });
        else if (name === 'history') value = await readHistory(args.projectId);
        else if (name === 'calendar_targets') value = await calendarTargets();
        else if (name === 'calendar_prepare') value = await prepareCalendar(args);
        else if (name === 'calendar_record') value = await recordCalendar(args);
        else if (name === 'get_schema') { const { zodToJsonSchema } = await import('zod-to-json-schema'); const { projectSchema } = await import('@/lib/domain'); value = zodToJsonSchema(projectSchema); }
        else throw new Error('不明な操作です');
        result = { content: [{ type: 'text', text: JSON.stringify(value) }] };
      } catch (e) { result = { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : '処理に失敗しました' }] }; }
    } else return Response.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
    return Response.json({ jsonrpc: '2.0', id, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid request' } }, { status: 400 }); }
}
