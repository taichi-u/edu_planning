// Integration tests target only the disposable local Worker DB. Never run against a hosted Site.
import assert from 'node:assert/strict';
import { blankProject, blankMilestone } from '../lib/domain';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8787';
if(!/^http:\/\/127\.0\.0\.1:(5173|8787)$/.test(base))throw new Error('Local QA only');
const owner={'oai-authenticated-user-id':'local_seedy','oai-authenticated-user-email':'seedy@sites.test'};
const viewer={'oai-authenticated-user-id':'qa-advisor','oai-authenticated-user-email':'advisor@example.org'};
async function request(path:string,body?:unknown,identity=owner) {const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...identity,'Content-Type':'application/json',Origin:base},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json() as any};}
async function call(name:string,args:unknown={},identity=owner) {const r=await request('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},identity);const result=r.data.result;return result.isError?{error:result.content[0].text}:JSON.parse(result.content[0].text);}
let state=(await request('/api/plan')).data;
assert.equal(state.role,'owner','Initialize local preview as local_seedy before running');
const p=blankProject();p.id='qa-'+crypto.randomUUID();p.name='QA_PRIVATE_NAME';p.shortName='QA';p.publicName='共有テスト';p.theme='QA_PRIVATE_THEME';p.notes='QA_PRIVATE_NOTE';p.shareable=true;p.viewerEmails=['advisor@example.org'];p.category='travel';
const m={...blankMilestone('travel'),id:'qa-event',title:'QA_PRIVATE_MILESTONE',publicTitle:'共有節目',kind:'event' as const,precision:'day' as const,start:'2030-01-20',end:'2030-01-22',calendarSync:true,confirmed:true};
p.milestones=[m,{...m,id:'qa-hidden',title:'QA_PRIVATE_HIDDEN',shared:false,calendarSync:false}];
let revision=state.revision;
try {
 const created=await call('create_project',{revision,project:p});assert.ok(!created.error,created.error);revision=created.revision;
 const persisted=(await request('/api/plan')).data;assert.equal(persisted.plan.projects.find((x:any)=>x.id===p.id).notes,p.notes);console.log('PASS MCP create → persistent API read');
 const stale=await request('/api/plan',{action:'update_project',revision:revision-1,project:p});assert.equal(stale.status,409);console.log('PASS stale revision rejected');
 const shared=(await request('/api/plan',undefined,viewer)).data;assert.equal(shared.role,'viewer');assert.equal(shared.plan.projects.length,1);assert.equal(JSON.stringify(shared).includes('QA_PRIVATE'),false);assert.equal(shared.plan.projects[0].milestones.length,1);
 const denied=await request('/api/plan',{action:'update_project',revision,project:p},viewer);assert.equal(denied.status,403);assert.ok((await call('archive_project',{revision,projectId:p.id},viewer)).error);assert.equal((await request('/api/history',undefined,viewer)).status,403);console.log('PASS viewer projection and REST/MCP write denial');
 const outsider=(await request('/api/plan',undefined,{'oai-authenticated-user-id':'qa-other','oai-authenticated-user-email':'other@example.org'})).data;assert.equal(outsider.plan.projects.length,0);
 const meeting=(await request('/api/plan?view=meeting')).data;assert.equal(JSON.stringify(meeting).includes('QA_PRIVATE'),false);assert.equal(meeting.plan.projects.flatMap((p:any)=>p.milestones).some((m:any)=>m.category==='research'),false);
 const pdf=await (await fetch(base+'/print',{headers:owner})).text();assert.equal(pdf.includes('QA_PRIVATE'),false);console.log('PASS meeting and PDF payload redact private content');
 const first=await call('calendar_prepare',{projectId:p.id,milestoneId:m.id,calendarId:'qa-calendar'});assert.equal(first.action,'search_before_create');assert.ok(first.marker);assert.equal(first.payload.end_date,'2030-01-23');
 const concurrent=await call('calendar_prepare',{projectId:p.id,milestoneId:m.id,calendarId:'qa-calendar'});assert.ok(concurrent.error);
 const receipt=await call('calendar_record',{...first.receipt,eventId:'qa-fake-event-no-google-write'});assert.equal(receipt.saved,true);
 const same=await call('calendar_prepare',{projectId:p.id,milestoneId:m.id,calendarId:'qa-calendar'});assert.equal(same.action,'unchanged');
 p.milestones[0].start='2030-01-21';const changed=await call('update_project',{revision,project:p});assert.ok(!changed.error);revision=changed.revision;
 const second=await call('calendar_prepare',{projectId:p.id,milestoneId:m.id,calendarId:'qa-calendar'});assert.equal(second.action,'update');assert.equal(second.eventId,'qa-fake-event-no-google-write');assert.equal(second.marker,first.marker);
 assert.ok((await call('calendar_record',{...first.receipt,eventId:'stale'})).error);
 await call('calendar_record',{...second.receipt,eventId:second.eventId});console.log('PASS sync lease, stable marker, retry no-op, in-place update, stale receipt rejection');
 const history=await call('history',{projectId:p.id});assert.equal(history.length,2);const schema=await call('get_schema');assert.ok(schema.properties?.milestones);console.log('PASS history and conversation schema');
} finally {
 state=(await request('/api/plan')).data;
 if(state.plan.projects.some((x:any)=>x.id===p.id)) {await call('archive_project',{revision:state.revision,projectId:p.id});console.log('Archived local QA case');}
}
