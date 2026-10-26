// Disposable localhost data only. No external GitHub/Trello/Calendar writes.
import assert from 'node:assert/strict';
import { taskSchema, worklogSchema, changeSchema } from '../lib/planning';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
if(!/^http:\/\/127\.0\.0\.1:(5173|8787)$/.test(base))throw new Error('Local QA only');
const owner={'oai-authenticated-user-id':'local_seedy','oai-authenticated-user-email':'seedy@sites.test'};
const other={'oai-authenticated-user-id':'qa-outsider','oai-authenticated-user-email':'other@example.org'};
async function req(path:string,body?:unknown,identity=owner){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...identity,Origin:base,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json() as any};}
async function read(){const r=await req('/api/planning');assert.equal(r.status,200);return r.data;}
async function mutate(input:Record<string,unknown>){const {revision}=await read();const r=await req('/api/planning',{revision,...input});assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
let d=await read();
if(d.planning.config.privateRepository==='owner/private_task')await mutate({action:'configure',config:{...d.planning.config,privateRepository:'qa/private_task'}});
d=await read(); const repo=d.planning.config.privateRepository,id='qa-'+crypto.randomUUID();
let t=taskSchema.parse({id,title:'QA_PRIVATE_TASK',acceptance:'比較結果を記録',repository:repo,issueId:id,issueNumber:999,sourceUpdatedAt:'2026-10-25T00:00:00.000Z',estimate:3,target:'2026-11-01'});
await mutate({action:'ingest_snapshot',source:{id:'qa-github',kind:'github',title:'QA GitHub',status:'ok',checkedAt:new Date().toISOString(),lastSuccessAt:null,count:1,error:''},tasks:[t]});
assert.equal((await read()).planning.tasks.find((v:any)=>v.id===id).title,t.title);
assert.equal((await req('/api/planning',undefined,other)).status,403);
const outsider=(await req('/api/plan',undefined,other)).data;assert.equal(JSON.stringify(outsider).includes('QA_PRIVATE_TASK'),false);
const meeting=(await req('/api/plan?view=meeting')).data;assert.equal(meeting.plan.planning.tasks.length,0);
const pdf=await(await fetch(base+'/print',{headers:owner})).text();assert.equal(pdf.includes('QA_PRIVATE_TASK'),false);
const mcp=await req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'list_tasks',arguments:{}}},other);assert.equal(mcp.data.result.isError,true);
console.log('PASS persisted tasks, owner-only REST/MCP, meeting/PDF redaction');
const old=(await read()).revision;await mutate({action:'queue_task',task:{...t,state:'doing'},reason:'QA着手'});
assert.equal((await req('/api/planning',{action:'queue_task',revision:old,task:t,reason:'stale'})).status,409);
d=await read();let op=d.planning.operations.find((o:any)=>o.taskId===id&&o.state==='pending');let prepared=await mutate({action:'sync_prepare',operationId:op.id});
await mutate({action:'sync_record',operationId:op.id,lease:prepared.result.operation.lease,status:'done',remoteId:id,task:{...prepared.result.operation.desired,sourceUpdatedAt:'2026-10-26T00:00:00.000Z'}});
t=(await read()).planning.tasks.find((v:any)=>v.id===id);assert.equal(t.state,'doing');assert.equal(t.estimateAtStart,3);
const log=worklogSchema.parse({id:'qa-log-'+crypto.randomUUID(),taskId:id,at:new Date().toISOString(),summary:'QA_PRIVATE_RESULT',feedback:'条件を追加する',complete:true});
await mutate({action:'record_worklog',worklog:log});d=await read();
const close=d.planning.operations.find((o:any)=>o.taskId===id&&o.kind==='update_task'&&o.state==='pending');
const blocked=await req('/api/planning',{revision:d.revision,action:'sync_prepare',operationId:close.id});assert.equal(blocked.status,409);
op=d.planning.operations.find((o:any)=>o.taskId===id&&o.kind==='worklog');prepared=await mutate({action:'sync_prepare',operationId:op.id});
assert.ok(prepared.result.body.includes('QA_PRIVATE_RESULT'));await mutate({action:'sync_record',operationId:op.id,lease:prepared.result.operation.lease,status:'done',remoteId:'qa-comment'});
prepared=await mutate({action:'sync_prepare',operationId:close.id});await mutate({action:'sync_record',operationId:close.id,lease:prepared.result.operation.lease,status:'done',remoteId:id,task:{...prepared.result.operation.desired,sourceUpdatedAt:'2026-10-26T00:01:00.000Z'}});
t=(await read()).planning.tasks.find((v:any)=>v.id===id);assert.equal(t.state,'done');assert.equal(t.estimateAtStart,3);assert.equal((await read()).planning.worklogs.find((l:any)=>l.id===log.id).actualMinutes,null);
console.log('PASS optimistic revision, sync lease, worklog before close, frozen estimate and unknown time');
const c=changeSchema.parse({id:'qa-change-'+crypto.randomUUID(),kind:'create',reason:'feedbackから追加',worklogId:log.id,after:[{id:'qa-follow-'+crypto.randomUUID(),title:'QA追加条件の比較',acceptance:'比較表を残す'}],createdAt:new Date().toISOString()});
await mutate({action:'propose_changes',changes:[c]});assert.equal((await read()).planning.tasks.some((v:any)=>v.id===c.after[0].id),false);
await mutate({action:'review_changes',accepted:[c.id],rejected:[]});assert.equal((await read()).planning.tasks.some((v:any)=>v.id===c.after[0].id),true);
const ext=taskSchema.parse({id:'qa-ext-'+crypto.randomUUID(),title:'QA external',repository:'someone/research',issueId:'external'});
await mutate({action:'ingest_snapshot',source:{id:'qa-external',kind:'github',title:'QA外部',status:'ok',checkedAt:new Date().toISOString(),lastSuccessAt:null,count:1,error:''},tasks:[ext]});
assert.equal((await req('/api/planning',{revision:(await read()).revision,action:'queue_task',task:{...ext,state:'done'},reason:'外部は不可'})).status,409);
console.log('PASS proposals only apply selected changes; external Issue remains read-only');
