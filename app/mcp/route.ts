import { readPlan, mutate, readHistory, calendarTargets, prepareCalendar, prepareTaskCalendar, recordCalendar, readPlanning, mutatePlanning, dailyBrief } from '@/lib/store';
import { planningActionSchema, taskSchema, worklogSchema, changeSchema, planningSchema } from '@/lib/planning';
import { zodToJsonSchema } from 'zod-to-json-schema';
export const dynamic = 'force-dynamic';
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const str = { type: 'string' }; const rev = { type: 'integer', description: 'list_projectsで取得したrevision。同時変更時は再取得して差分を確認。' };
const tools = [
  { name: 'initialize_owner', description: 'サーバー設定で指定された本人の空の計画を初期化。初期化済みなら実行しない。', inputSchema: object({}) },
  { name: 'list_projects', description: '研究ロードマップを一覧取得。日付精度・共有範囲・revisionを返す。未確認の締切を確定情報として扱わない。', inputSchema: object({ meeting: { type: 'boolean' } }) },
  { name: 'get_project', description: '案件と関連する期間・締切の詳細を取得。取得権限のない項目は返さない。', inputSchema: object({ projectId: str }, ['projectId']) },
  { name: 'create_project', description: '案件を追加。projectは既存案件と同じ構造。最初にlist_projectsとget_schemaを取得する。実計画sample:false。', inputSchema: object({ revision: rev, project: { type: 'object' } }, ['revision', 'project']) },
  { name: 'update_project', description: '案件を変更。get_projectの完全なprojectを編集して渡す。正式締切は準備期間の移動と独立して保持。明示依頼のない日付を動かさない。', inputSchema: object({ revision: rev, project: { type: 'object' } }, ['revision', 'project']) },
  { name: 'archive_project', description: '案件をアーカイブ。カレンダーからは自動削除しない。', inputSchema: object({ revision: rev, projectId: str }, ['revision', 'projectId']) },
  { name: 'get_schema', description: '案件・節目の入力仕様を取得。', inputSchema: object({}) },
  { name: 'history', description: '所有者向けの変更履歴。', inputSchema: object({ projectId: str }) },
  { name: 'calendar_targets', description: 'Google Calendar同期対象を取得。依頼または承認済みの定期処理で使用。仮データは書き込まない。', inputSchema: object({}) },
  { name: 'calendar_prepare', description: '1項目の同期ロックを取得しイベントID・検索マーカー・payloadを返す。Google Calendarツールで既存を確認して作成/更新する。通信結果が不明なら再作成禁止。実行後calendar_record必須。', inputSchema: object({ projectId: str, milestoneId: str, calendarId: str }, ['projectId','milestoneId','calendarId']) },
  { name: 'calendar_record', description: 'Google Calendar作成/更新成功後のeventIdとcalendar_prepareのreceiptを保存。入力id,lease,fingerprintはreceiptをそのまま渡す。', inputSchema: object({ id: str, lease: str, fingerprint: str, eventId: str }, ['id','lease','fingerprint','eventId']) },
  { name: 'list_tasks', description: '所有者専用。タスク、実施記録、変更案、同期状態、連携設定とrevisionを取得。共有先には返さない。', inputSchema: object({}) },
  { name: 'get_task', description: '所有者専用。タスクと関連記録・変更案を取得。', inputSchema: object({ taskId: str }, ['taskId']) },
  { name: 'get_planning_schema', description: 'タスク、実施記録、計画変更、同期操作の入力仕様を取得。', inputSchema: object({}) },
  { name: 'planning_mutate', description: '所有者専用。actionはconfigure/queue_task/record_worklog/propose_changes/review_changes/ingest_snapshot/sync_prepare/sync_record。まずget_planning_schemaを取得。GitHub等への実操作は接続ツールで行い、確認後にsync_record。推測した変更案は採用前に実行しない。外部取得は全ページを確認し失敗を空データとして保存しない。', inputSchema: object({ revision: rev, input: { type: 'object' } }, ['revision', 'input']) },
  { name: 'daily_brief', description: '所有者専用。今日と今週の予定・タスク、準備開始、待ち、変更案、失敗、前週の実績を取得。毎朝の通知向け。', inputSchema: object({}) },
  { name: 'task_calendar_prepare', description: '所有者専用。選択したタスクの目標日または正式締切をCalendarへ反映する準備。外部操作後はcalendar_record。', inputSchema: object({ taskId:str, kind:{type:'string',enum:['target','deadline']}, calendarId:str },['taskId','kind','calendarId']) },
];
export async function POST(request: Request) {
  let id: unknown = null;
  try {
    const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'この送信元からは更新できません'},{status:403});
    const raw = await request.text(); if (raw.length > 1500000) throw new Error('入力が大きすぎます');
    const body = JSON.parse(raw); id = body.id ?? null;
    let result: unknown;
    if (body.method === 'server/discover') result = { supportedVersions: ['2026-07-28'], capabilities: { tools: {} } };
    else if (body.method === 'tools/list') result = { tools };
    else if (body.method === 'tools/call') {
      const { name, arguments: args = {} } = body.params; let value: unknown;
      try {
        if (name === 'initialize_owner') value = await mutate({ action: 'initialize', sample: false });
        else if (name === 'list_projects') value = await readPlan(args.meeting === true);
        else if (name === 'get_project') { const data = await readPlan(); const project = data.plan.projects.find(p => p.id === args.projectId); if (!project) throw new Error('案件が見つかりません'); value = { project, revision: data.revision }; }
        else if (['create_project','update_project','archive_project'].includes(name)) value = await mutate({ ...args, action: name });
        else if (name === 'history') value = await readHistory(args.projectId);
        else if (name === 'calendar_targets') value = await calendarTargets();
        else if (name === 'calendar_prepare') value = await prepareCalendar(args);
        else if (name === 'calendar_record') value = await recordCalendar(args);
        else if (name === 'list_tasks') value = await readPlanning();
        else if (name === 'get_task') { const d = await readPlanning(); const task = d.planning.tasks.find(t => t.id === args.taskId); if (!task) throw new Error('タスクが見つかりません'); value = { task, revision: d.revision, worklogs: d.planning.worklogs.filter(l => l.taskId === task.id), changes: d.planning.changes.filter(c => c.taskId === task.id) }; }
        else if (name === 'planning_mutate') value = await mutatePlanning({ ...args.input, revision: args.revision });
        else if (name === 'daily_brief') value = await dailyBrief();
        else if (name === 'task_calendar_prepare') value = await prepareTaskCalendar(args);
        else if (name === 'get_planning_schema') value = { task: zodToJsonSchema(taskSchema), worklog: zodToJsonSchema(worklogSchema), change: zodToJsonSchema(changeSchema), action: zodToJsonSchema(planningActionSchema), planning: zodToJsonSchema(planningSchema) };
        else if (name === 'get_schema') { const { zodToJsonSchema } = await import('zod-to-json-schema'); const { projectSchema } = await import('@/lib/domain'); value = zodToJsonSchema(projectSchema); }
        else throw new Error('不明な操作です');
        result = { content: [{ type: 'text', text: JSON.stringify(value) }] };
      } catch (e) { result = { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : '処理に失敗しました' }] }; }
    } else return Response.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
    return Response.json({ jsonrpc: '2.0', id, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid request' } }, { status: 400 }); }
}
