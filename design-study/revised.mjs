import {projectColors} from './revised-colors.mjs';
import {sampleForScenario,timePosition} from './model.mjs';
const data=await (await fetch('fixture.json')).json();
const query=new URLSearchParams(location.search);
let lang=query.get('lang')||localStorage.getItem('edu-revised-lang')||'ja';
let view=query.get('view')||'week',project=query.get('project')||'',search='';
const fixture=sampleForScenario(data,query.get('scenario')||'normal');
const words={
 ja:{name:'研究計画',sample:'比較用・仮データ',old:'初稿と比較',all:'全体',projects:'プロジェクト',week:'今週',quarter:'3か月',long:'博士全体',search:'検索',task:'作業',state:'状態',date:'締切・目標',points:'見積もり',period:'期間',deadline:'正式締切',target:'目標日',event:'開催日',doing:'進行中',todo:'未着手',blocked:'返答待ち',done:'完了',undated:'日付未定',empty:'該当する作業はありません',unknown:'未見積もり',close:'閉じる',summary:'作業内容',feedback:'フィードバック',minutes:'実作業時間（分・任意）',save:'保存',complete:'完了にする',log:'作業記録',saved:'比較用の記録を保存しました。外部サービスは更新していません。',waiting:'待ち理由'},
 en:{name:'Research plan',sample:'Fictional data',old:'Initial concepts',all:'All projects',projects:'Projects',week:'This week',quarter:'3 months',long:'PhD overview',search:'Search',task:'Task',state:'Status',date:'Due / target',points:'Estimate',period:'Period',deadline:'Deadline',target:'Target',event:'Event',doing:'In progress',todo:'Not started',blocked:'Awaiting reply',done:'Completed',undated:'Unscheduled',empty:'No matching tasks',unknown:'Not estimated',close:'Close',summary:'Work completed',feedback:'Feedback',minutes:'Actual time (minutes, optional)',save:'Save',complete:'Mark complete',log:'Work log',saved:'Sample record saved. External services were not updated.',waiting:'Waiting for'}
};
const $=id=>document.getElementById(id),make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const w=()=>words[lang],projectFor=id=>fixture.projects.find(p=>p.id===id);
const colorFor=id=>projectColors[id]||{color:'#0072B2',tint:'#E8F3FB'};
const decorate=(element,id)=>{const c=colorFor(id);element.style.setProperty('--project-color',c.color);element.style.setProperty('--project-tint',c.tint);return element;};
const stored=()=>JSON.parse(localStorage.getItem('edu-revised-records')||'{}');
const date=s=>new Intl.DateTimeFormat(lang==='ja'?'ja-JP':'en-US',{month:lang==='ja'?'numeric':'short',day:'numeric',timeZone:'Asia/Tokyo'}).format(new Date(s+'T00:00:00Z'));
function bounds(){return view==='all'?['2026-04-01','2034-04-01']:view==='quarter'?['2027-06-07','2027-09-07']:['2027-06-07','2027-06-14'];}
function position(value){const [start,end]=bounds();return timePosition(value,start,end,100);}
function ticks(){
 if(view==='week')return Array.from({length:7},(_,i)=>{const d='2027-06-'+String(7+i).padStart(2,'0');return{date:d,label:date(d)+'\n'+new Intl.DateTimeFormat(lang==='ja'?'ja-JP':'en-US',{weekday:'short'}).format(new Date(d+'T00:00:00Z'))};});
 if(view==='quarter')return['2027-06-07','2027-07-01','2027-08-01','2027-09-01'].map(d=>({date:d,label:new Intl.DateTimeFormat(lang==='ja'?'ja-JP':'en-US',{month:'short'}).format(new Date(d+'T00:00:00Z'))}));
 return Array.from({length:8},(_,i)=>({date:(2026+i)+'-04-01',label:(2026+i)+'\n'+(i===0?'B4':i<6?(lang==='ja'?'博士'+i+'年':'PhD '+i):(lang==='ja'?'その後':'After PhD'))}));
}
function plot(periods=[],points=[],long=false){
 const e=make('div',undefined,'time-plot'+(long?' long':''));
 for(const t of ticks()){const l=make('i',undefined,'gridline');l.style.left=position(t.date)+'%';e.append(l);}
 const [start,end]=bounds();
 for(const period of periods){if(period.start>=end||period.end<start)continue;const from=Math.max(0,position(period.start)),to=Math.min(100,position(period.end)+100/((Date.parse(end)-Date.parse(start))/86400000));const bar=make('span',undefined,'duration'+(period.tentative?' tentative':''));bar.style.left=from+'%';bar.style.width=(to-from)+'%';bar.title=period[lang]+' / '+period.start+' - '+period.end;bar.setAttribute('role','img');bar.setAttribute('aria-label',bar.title);if(long){bar.append(make('span',period[lang]));}e.append(bar);}
 for(const point of points){if(point.date<start||point.date>=end)continue;const m=make('span',undefined,'milestone '+point.kind);m.style.left=`calc(${position(point.date)}% - 5.5px)`;m.title=point[lang]+' / '+point.date+' / '+w()[point.kind==='deadline'?'deadline':point.kind==='event'?'event':'target'];m.setAttribute('role','img');m.setAttribute('aria-label',m.title);if(long)m.append(make('span',point[lang],'point-label'));e.append(m);}
 return e;
}
function button(text,action,pressed){const b=make('button',text);b.type='button';b.onclick=action;if(pressed!==undefined)b.setAttribute('aria-pressed',String(pressed));return b;}
function openTask(id){
 const t=fixture.tasks.find(t=>t.id===id);if(!t)return;
 const record=stored()[id];decorate($('detail'),t.project);$('record').reset();$('detail').dataset.task=id;
 $('task-name').textContent=t[lang];$('project-name').textContent=projectFor(t.project)[lang];
 const meta=$('task-meta');meta.replaceChildren();
 for(const [key,value]of [[w().state,record?.completed?w().done:w()[t.state]],[t.kind==='deadline'?w().deadline:w().target,t.date?date(t.date):w().undated],[w().points,t.estimate===null?w().unknown:t.estimate+' pt'],[w().waiting,t[lang==='ja'?'blockerJa':'blockerEn']]])if(value)meta.append(make('dt',key),make('dd',value));
 for(const [id,label]of [['work-label',w().summary],['feedback-label',w().feedback],['time-label',w().minutes]])$(id).firstChild.textContent=label;
 $('save').textContent=w().save;$('complete').textContent=w().complete;$('close').setAttribute('aria-label',w().close);$('save-status').textContent='';
 if(record){$('record').elements.summary.value=record.summary;$('record').elements.feedback.value=record.feedback;$('record').elements.minutes.value=record.actualMinutes??'';}
 $('detail').showModal();
}
function render(){
 if(!words[lang])lang='ja';if(!['week','quarter','all'].includes(view))view='week';
 document.documentElement.lang=lang;document.body.dataset.view=view;document.body.classList.toggle('lang-en',lang==='en');localStorage.setItem('edu-revised-lang',lang);
 document.querySelector('.name').textContent=w().name;$('sample').textContent=w().sample;$('previous').textContent=w().old;$('language').textContent=lang==='ja'?'English':'日本語';
 const nav=$('projects');nav.setAttribute('aria-label',w().projects);nav.replaceChildren(button(w().all,()=>{project='';render();},!project),make('p',w().projects));
 for(const p of fixture.projects){const b=decorate(button(p[lang],()=>{project=p.id;render();},project===p.id),p.id);b.classList.add('project-link');nav.append(b);}
 $('heading').textContent=project?projectFor(project)?.[lang]:w()[view==='all'?'long':view];
 $('range').textContent=view==='all'?(lang==='ja'?'2026年度 - 2033年度':'Academic years 2026-2033'):view==='quarter'?(lang==='ja'?'2027年6月7日 - 9月6日':'June 7 - September 6, 2027'):(lang==='ja'?'2027年6月7日 - 6月13日':'June 7-13, 2027');
 const views=$('views');views.setAttribute('aria-label',lang==='ja'?'期間':'Time range');views.replaceChildren(...['week','quarter','all'].map(v=>button(w()[v==='all'?'long':v],()=>{view=v;render();},view===v)));
 const mobile=$('mobile-project');mobile.replaceChildren(...[{id:'',...{[lang]:w().all}},...fixture.projects].map(p=>{const o=make('option',p[lang]);o.value=p.id;return o;}));mobile.value=project;$('mobile-project-label').textContent=w().projects;mobile.setAttribute('aria-label',w().projects);$('search-label').textContent=w().search;$('search').setAttribute('aria-label',lang==='ja'?'作業を検索':'Search tasks');
 $('notice').textContent=query.get('scenario')==='error'?(lang==='ja'?'GitHubから取得できませんでした。前回の内容を表示しています。':'Could not fetch from GitHub. Showing the previous snapshot.') : '';
 const target=$('table');target.replaceChildren();
 const tasks=fixture.tasks.filter(t=>t.start&&(!project||t.project===project)&&(!search||t[lang].toLowerCase().includes(search.toLowerCase())));
 const groups=fixture.projects.filter(p=>(!project||p.id===project)&&[...fixture.periods,...fixture.milestones].some(v=>v.project===p.id)&&(!search||[p[lang],...fixture.periods.filter(v=>v.project===p.id).map(v=>v[lang]),...fixture.milestones.filter(v=>v.project===p.id).map(v=>v[lang])].join(' ').toLowerCase().includes(search.toLowerCase())));
 const scroller=make('div',undefined,'table-scroll'),sheet=make('table',undefined,'sheet'+(view==='all'?' long':''));sheet.setAttribute('aria-label',lang==='ja'?'作業と時間軸':'Tasks and timeline');
 const head=sheet.createTHead().insertRow();
 for(const [label,cls]of (view==='all'?[[w().projects,'work']]:[[w().task,'work'],[w().state,'state'],[w().date,'date'],[w().points,'points']])){const th=make('th',label,cls);th.scope='col';head.append(th);}
 const axis=make('th',undefined,'time');axis.scope='col';const scale=make('div',undefined,'time-scale');for(const tick of ticks()){const t=make('span',tick.label,'tick');t.style.left=position(tick.date)+'%';scale.append(t);}axis.append(scale);head.append(axis);
 const body=sheet.createTBody(),records=stored();
 if(view==='all')for(const p of groups){const row=decorate(body.insertRow(),p.id);row.dataset.project=p.id;const label=row.insertCell();label.className='work project-title';label.textContent=p[lang];const cell=row.insertCell();cell.className='time';cell.append(plot(fixture.periods.filter(v=>v.project===p.id),fixture.milestones.filter(v=>v.project===p.id),true));}
 else for(const task of tasks){const row=decorate(body.insertRow(),task.project);row.dataset.project=task.project;row.dataset.task=task.id;const work=row.insertCell();work.className='work';const title=button(task[lang],()=>openTask(task.id));title.className='task';title.setAttribute('aria-label',task[lang]);title.append(make('small',projectFor(task.project)[lang],'project-sub'));work.append(title);
  const state=row.insertCell();state.className='state';state.textContent=records[task.id]?.completed?w().done:w()[task.state];if(task.state==='blocked'&&!records[task.id]?.completed)state.append(make('small',task[lang==='ja'?'blockerJa':'blockerEn'],'blocker-note'));
  const due=row.insertCell();due.className='date';due.append(make('span',task.kind==='deadline'?w().deadline:w().target,'date-kind'),make('span',date(task.date)));
  const points=row.insertCell();points.className='points';points.textContent=task.estimate===null?'—':task.estimate+' pt';points.title=task.estimate===null?w().unknown:w().points;
  const time=row.insertCell();time.className='time';time.append(plot([task],[task]));
 }
 scroller.append(sheet);target.append(scroller);if(!(view==='all'?groups.length:tasks.length))target.append(make('p',w().empty,'empty'));
 $('legend').replaceChildren();const period=make('span');period.append(make('i',undefined,'line'),document.createTextNode(w().period));$('legend').append(period,make('span','◆ '+w().deadline),make('span','◇ '+w().target),...(view==='all'?[make('span','● '+w().event)]:[]));
 const undated=fixture.tasks.filter(t=>!t.date&&(!project||t.project===project));$('undated').querySelector('summary').textContent=w().undated+' '+undated.length;const undatedList=$('undated').querySelector('div');undatedList.replaceChildren(...undated.map(t=>button(t[lang],()=>openTask(t.id))));
 const recent=$('recent');recent.replaceChildren();const entries=Object.entries(records).filter(([id])=>fixture.tasks.some(t=>t.id===id&&(!project||t.project===project)));if(entries.length){recent.append(make('summary',w().log+' '+entries.length));for(const [id,record]of entries){recent.append(make('p',fixture.tasks.find(t=>t.id===id)[lang]+' — '+record.summary));}}
 history.replaceState(null,'','?'+new URLSearchParams({lang,view,...(project?{project}:{}),...(query.get('scenario')?{scenario:query.get('scenario')}:{} )}));
}
$('mobile-project').onchange=e=>{project=e.target.value;render();};$('language').onclick=()=>{lang=lang==='ja'?'en':'ja';render();};$('search').oninput=e=>{search=e.target.value;render();};$('close').onclick=()=>$('detail').close();
$('record').onsubmit=e=>{e.preventDefault();const task=$('detail').dataset.task,f=new FormData(e.currentTarget),records=stored();records[task]={summary:f.get('summary'),feedback:f.get('feedback'),actualMinutes:f.get('minutes')===''?null:Number(f.get('minutes')),completed:e.submitter?.id==='complete'||!!records[task]?.completed};localStorage.setItem('edu-revised-records',JSON.stringify(records));$('save-status').textContent=w().saved;render();};
render();
