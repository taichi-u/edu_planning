import test from 'node:test';
import assert from 'node:assert/strict';
import { samplePlan } from '../lib/sample';
import { planSchema, projectPlan, validDay, dateBounds, addDays, calendarPayload, fingerprint, milestoneSchema, canEdit, categories } from '../lib/domain';

test('sample data obeys schema and contains no verified official deadlines',()=>{
 const plan=samplePlan();assert.ok(planSchema.safeParse(plan).success);
 assert.ok(plan.projects.every(p=>p.sample));
 assert.ok(plan.projects.flatMap(p=>p.milestones).filter(m=>m.kind==='deadline').every(m=>!m.confirmed&&!m.sourceUrl));
});
test('date precision preserves month, leap year and unknown dates',()=>{
 assert.equal(validDay('2027-02-29'),false);assert.equal(validDay('2032-02-29'),true);
 const m=samplePlan().projects.find(p=>p.id==='fund')!.milestones[1];
 assert.deepEqual(dateBounds({...m,start:'2032-02'}),['2032-02-01','2032-02-29']);
 assert.deepEqual(dateBounds({...m,start:'2027-12',end:'2028-01'}),['2027-12-01','2028-01-31']);
 assert.equal(dateBounds({...m,precision:'unknown',start:'',end:''}),null);
 assert.equal(addDays('2026-12-31',1),'2027-01-01');
});
test('official deadline validation requires source and checked day; moving preparation leaves it intact',()=>{
 const p=samplePlan().projects.find(p=>p.id==='conference-a')!;
 const m=p.milestones.find(m=>m.kind==='deadline')!;
 assert.equal(milestoneSchema.safeParse({...m,confirmed:true}).success,false);
 assert.ok(milestoneSchema.safeParse({...m,confirmed:true,sourceUrl:'https://example.org/deadline',checkedAt:'2026-10-23'}).success);
 const before=structuredClone(m);p.milestones[0].start='2026-10-27';assert.deepEqual(p.milestones.find(x=>x.id===m.id),before);
});
test('owner-only editing uses stable site identity, not email',()=>{assert.equal(canEdit('owner','viewer'),false);assert.equal(canEdit('owner',null),false);assert.equal(canEdit('owner','owner'),true);});
test('viewer projection cannot obtain another recipient, private milestones, or private fields',()=>{
 const plan=samplePlan(), p=plan.projects.find(p=>p.id==='conference-a')!;
 p.viewerEmails=['advisor@example.org'];p.theme='SECRET_THEME';p.notes='SECRET_NOTES';p.name='SECRET_NAME';p.links=[{label:'SECRET_LINK',url:'https://example.org/private'}];
 p.milestones[0].title='SECRET_MILESTONE';p.milestones[0].shared=false;
 const visible=projectPlan(plan,false,'advisor@example.org',false);
 assert.equal(visible.projects.length,1);assert.equal(JSON.stringify(visible).includes('SECRET'),false);
 assert.deepEqual(projectPlan(plan,false,'other@example.org',false).projects,[]);
 assert.equal(visible.projects[0].viewerEmails.length,0);
 assert.equal(projectPlan(plan,true,'owner',false).projects[4].notes,'SECRET_NOTES');
});
test('meeting projection strips research and private fields even for owner; original data is retained',()=>{
 const plan=samplePlan();plan.projects[0].shareable=true;plan.projects[0].publicName='共有テーマ';
 const p=projectPlan(plan,true,'',true);
 assert.equal(p.projects.flatMap(p=>p.milestones).some(m=>m.category==='research'),false);
 assert.equal(p.projects.some(p=>p.theme||p.notes||p.links.length||p.viewerEmails.length),false);
 assert.ok(plan.projects[0].theme);
});
test('calendar all-day end is exclusive; marker and hash remain stable; no month-only sync',async()=>{
 const p=samplePlan().projects.find(p=>p.id==='conference-a')!,m=p.milestones.find(m=>m.kind==='event')!;
 const first=calendarPayload(p,m,'edu_planning:123');assert.equal(first.end_date,'2027-01-18');assert.equal(first.reminders.use_default,true);
 assert.equal(await fingerprint(first),await fingerprint(calendarPayload(p,m,'edu_planning:123')));
 assert.notEqual(await fingerprint(first),await fingerprint(calendarPayload(p,{...m,start:'2027-01-16'},'edu_planning:123')));
 assert.throws(()=>calendarPayload(p,{...m,precision:'month'},'id'));
});
function luminance(hex:string){const rgb=hex.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
function contrast(a:string,b:string){const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (l[0]+.05)/(l[1]+.05);}
test('body and secondary text exceed WCAG 4.5:1; category marks exceed 3:1',()=>{
 for(const text of ['#242A2E','#626765'])assert.ok(contrast(text,'#F8F7F3')>=4.5);
 for(const c of categories)assert.ok(contrast(c.color,'#F8F7F3')>=3);
});


test('timed calendar preserves multi-day duration and midnight rollover',()=>{
 const p=samplePlan().projects.find(p=>p.id==='conference-a')!,m=p.milestones.find(m=>m.kind==='event')!;
 const span=calendarPayload(p,{...m,time:'17:00'},'marker');assert.equal(span.start_local,'2027-01-15T17:00:00');assert.equal(span.end_local,'2027-01-17T17:00:00');assert.equal(span.timezone,'Asia/Tokyo');
 const point=calendarPayload(p,{...m,end:'',time:'23:45'},'marker');assert.equal(point.end_local,'2027-01-16T00:15:00');
});
