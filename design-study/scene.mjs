import { summary, timePosition } from './model.mjs';
import { themes, words } from './themes.mjs';
export const W=1280,H=1000;
const d=s=>Date.parse(s+'T00:00:00Z');
const fmt=(s,l)=>s?new Intl.DateTimeFormat(l==='ja'?'ja-JP':'en-US',{month:l==='ja'?'numeric':'short',day:'numeric',timeZone:'Asia/Tokyo'}).format(new Date(s+'T00:00:00Z')):'';
export function scene(fixture,themeId,lang='ja',view='week',scenario='normal'){
 const counts=summary(fixture),t=themes[themeId],w=words[lang],font=lang==='ja'?t.bodyJa:t.bodyEn,head=lang==='ja'?t.headingJa:t.headingEn;
 const text=(value,width=200,size=15,fg=t.ink,weight='Regular',opts={})=>({type:'text',name:opts.name||String(value).slice(0,50),text:String(value),w:width,size:Math.max(13,size),fg,font:opts.heading?head:font,weight,lineHeight:Math.round(Math.max(13,size)*1.6),...opts});
 const frame=(name,layout,children=[],opts={})=>({type:'frame',name,layout,children,gap:12,pad:0,bg:null,...opts});
 const line=(width)=>({type:'rect',name:'Divider',w:width,h:1,bg:t.line});
 const button=(label,kind='secondary',action)=>({type:'button',name:label,text:label,w:Math.max(lang==='ja'?88:102,label.length*(lang==='ja'?14:8)+36),h:38,kind,action,font,size:14,weight:'Medium',bg:kind==='primary'?t.accent:t.bg,fg:kind==='primary'?'#FFFFFF':t.ink,radius:t.radius});
 const p=id=>fixture.projects.find(p=>p.id===id);
 const taskRow=(task,width=900)=>({type:'taskrow',name:task[lang],w:width,h:t.density+10,taskId:task.id,project:p(task.project)[lang],title:task[lang],date:task.date?fmt(task.date,lang):w.undated,dateKind:task.kind==='deadline'?w.deadline:w.target,status:w[task.state],estimate:task.estimate===null?'—':String(task.estimate),color:p(task.project).color,font,fg:t.ink,muted:t.muted,line:t.line,bg:t.bg,lang,role:'taskrow'});
 const subtitle=lang==='ja'?'2027年6月7日 — 6月13日':'June 7–13, 2027';
 const header=frame('App header','HORIZONTAL',[text(w.brand,250,18,t.ink,'Medium'),text(w.sample,120,12,t.muted),frame('Header actions','HORIZONTAL',[button(w.meeting,'secondary','meeting'),button(lang==='ja'?'English':'日本語','secondary','lang'),button(w.add,'primary','add')],{align:'end',grow:true})],{w:W,h:72,pad:16,padX:themeId==='b'?32:24,gap:16,bg:t.bg,border:true});
 const nav=frame('Navigation','VERTICAL',[text(w.overview,160,16,t.ink,'Medium'),text(w.week,160,15,t.accent,'Medium'),text(w.review,160,15,t.muted),text(w.log,160,15,t.muted),text(w.connections,160,15,t.muted),frame('Nav projects','VERTICAL',[text(w.project,160,12,t.muted),...fixture.projects.map(project=>text(project[lang],160,14,t.ink,'Regular'))],{gap:15,padTop:32})],{w:200,h:928,pad:24,gap:22,bg:t.surface});
 const controls=frame('View controls','HORIZONTAL',[...['week','quarter','all'].map(v=>button(w[v],view===v?'primary':'secondary','view:'+v)),frame('Today control','HORIZONTAL',[button(w.today,'secondary','today')],{grow:true,align:'end'})],{h:44,w:'fill',gap:8});
 const heading=frame('Page heading','VERTICAL',[text(view==='week'?w.weekTitle:view==='quarter'?w.quarterTitle:w.longTitle,themeId==='a'?1000:1160,themeId==='b'?36:28,t.ink,'Medium',{heading:true}),text(view==='week'?subtitle:view==='quarter'?(lang==='ja'?'2027年6月7日 — 9月6日':'June 7 – September 6, 2027'):(lang==='ja'?'2026年度 — 2033年度':'Academic years 2026–2033'),1000,14,t.muted)],{w:'fill',gap:4,h:themeId==='b'?94:76});
 function chart(width,compact=false){
  const label=themeId==='b'?180:200,plot=width-label,range=view==='week'?['2027-06-07','2027-06-14']:view==='quarter'?['2027-06-07','2027-09-07']:['2026-04-01','2034-04-01'];
  const span=d(range[1])-d(range[0]),x=s=>timePosition(s,range[0],range[1],plot);
  const yearLabels=lang==='ja'?['B4','博士1年','博士2年','博士3年','博士4年','博士5年','その後','その後']:['B4','PhD 1','PhD 2','PhD 3','PhD 4','PhD 5','After PhD','After PhD'];
  const ticks=view==='week'?Array.from({length:7},(_,i)=>({x:plot*i/7,label:lang==='ja'?['7 月','8 火','9 水','10 木','11 金','12 土','13 日'][i]:['Mon 7','Tue 8','Wed 9','Thu 10','Fri 11','Sat 12','Sun 13'][i]})):view==='quarter'?[{x:0,label:lang==='ja'?'6月':'June'},{x:x('2027-07-01'),label:lang==='ja'?'7月':'July'},{x:x('2027-08-01'),label:lang==='ja'?'8月':'August'},{x:x('2027-09-01'),label:lang==='ja'?'9月':'Sept'}]:Array.from({length:8},(_,i)=>({x:plot*i/8,label:String(2026+i)+'\n'+yearLabels[i]}));
  let items=view==='all'?[...fixture.periods.map(v=>({...v,period:true})),...fixture.milestones]:view==='quarter'?[...fixture.tasks.filter(v=>v.start).map(v=>({...v,period:true})),...fixture.milestones]:[...fixture.tasks.filter(v=>v.start).map(v=>({...v,period:true})),...fixture.tasks.filter(v=>v.date).map(v=>({...v,point:true}))];
  if(scenario==='empty')items=[];
  const groups=fixture.projects.map(project=>({...project,items:items.filter(v=>v.project===project.id&&(v.period?v.start<range[1]&&v.end>=range[0]:v.date>=range[0]&&v.date<range[1]))})).filter(g=>g.items.length);
  const rows=[frame('Axis','HORIZONTAL',[text(view==='all'?w.project:(lang==='ja'?'プロジェクト・準備':'Projects and preparation'),label,12,t.muted),{type:'plot',name:'Time labels',w:plot,h:view==='all'?62:42,children:ticks.map(k=>({...text(k.label,view==='all'?plot/8-6:100,13,t.muted),x:k.x+5,y:10}))}],{w:width,h:view==='all'?62:42,gap:0,bg:t.surface})];
  for(const g of groups){const rowH=view==='all'?72:compact?46:60;const marks=[];
   for(let i=0;i<g.items.length;i++){const v=g.items[i];const title=v.point?'':v[lang];if(v.period){const start=Math.max(0,x(v.start)),end=Math.min(plot,x(v.end)+plot/(span/86400000)),valid=end>start; if(valid)marks.push({type:'bar',name:title,w:Math.max(4,end-start),h:themeId==='b'?8:12,x:start,y:rowH-22,bg:g.color,tentative:!!v.tentative,text:title,font,size:12,fg:t.ink});}
    else marks.push({type:'mark',name:title,text:title,accessibleText:v[lang]+' / '+v.date+' / '+(v.kind==='deadline'?w.deadline:v.kind==='target'?w.target:(lang==='ja'?'開催日':'Event')),kind:v.kind,x:Math.min(plot-8,Math.max(8,x(v.date))),y:rowH-18,w:12,h:12,bg:g.color,fg:t.ink,font,size:12});
   }
   rows.push(frame('Timeline row '+g.id,'HORIZONTAL',[frame('Project label','VERTICAL',[text(g[lang],label-18,13,t.ink,'Medium')],{w:label,h:rowH,pad:10,borderBottom:true}),{type:'plot',name:'Timeline plot '+g.id,w:plot,h:rowH,bg:null,ticks:ticks.map(k=>k.x),children:marks,borderBottom:true}],{w:width,h:rowH,gap:0}));
  }
  if(!groups.length)rows.push(frame('Empty timeline','VERTICAL',[text(lang==='ja'?'この期間の予定はありません':'No events in this period',width-32,15,t.muted)],{w:width,h:76,pad:16}));
  return frame('Timeline','VERTICAL',rows,{w:width,gap:0,border:true});
 }
 const mainWidth=themeId==='a'?1080:1280,inner=mainWidth-(themeId==='a'?56:96);
 const active=fixture.tasks.filter(t=>t.start),shownTasks=scenario==='empty'?[]:active;
 const titleRow=frame('Work section heading','HORIZONTAL',[text(w.tasks,inner-190,18,t.ink,'Medium'),text(lang==='ja'?counts.tasks+'件・未見積もり'+counts.unestimated+'件':counts.tasks+' tasks · '+counts.unestimated+' not estimated',190,12,t.muted)],{w:inner,h:36,gap:0});
 const list=width=>frame('Task list','VERTICAL',shownTasks.map(v=>taskRow(v,width)),{w:width,gap:0});
 const log=width=>frame('Recent work log','VERTICAL',[text(w.log,width-32,15,t.ink,'Medium'),text(fixture.log[lang],width-32,14,t.ink),text(w.timeUnknown,width-32,12,t.muted),text(w.pending,width-32,12,t.muted)],{w:width,pad:16,gap:8,bg:t.surface});
 const legend=frame('Timeline legend','HORIZONTAL',[text('━ '+(lang==='ja'?'準備・研究期間':'Preparation / research period'),300,12,t.muted),text('◆ '+w.deadline+'    ◇ '+w.target+'    ● '+(lang==='ja'?'開催日':'Event'),inner-300,12,t.muted)],{w:inner,h:28,gap:0});
 const error=scenario==='error'?frame('Source failure','VERTICAL',[text(lang==='ja'?'GitHubから取得できませんでした。前回取得した内容を表示しています。':'Could not fetch from GitHub. Showing the previous snapshot.',inner-24,14,'#873B28')],{w:inner,pad:12,bg:'#FBEDE7'}):null;
 let content=[];
 if(themeId==='c'&&view==='week'){
  const half=(inner-32)/2;
  const days=Array.from({length:7},(_,i)=>{const date='2027-06-'+String(7+i).padStart(2,'0'),events=fixture.events.filter(e=>e.date===date);return frame('Day '+date,'HORIZONTAL',[text(fmt(date,lang),74,14,t.ink,'Medium'),frame('Events','VERTICAL',events.length?events.map(e=>text(e.time+'  '+e[lang],half-110,14,t.ink)): [text('—',half-110,14,t.muted)],{w:half-100,gap:6})],{w:half,h:64,gap:8,borderBottom:true,pad:10});});
  content=[frame('Weekly columns','HORIZONTAL',[frame('Weekly schedule','VERTICAL',[text(w.schedule,half,18,t.ink,'Medium'),...days,log(half)],{w:half,gap:14}),frame('Weekly tasks','VERTICAL',[text(w.tasks,half,18,t.ink,'Medium'),list(half)],{w:half,gap:14})],{w:inner,gap:32})];
 }else if(view==='all')content=[chart(inner),legend,frame('Next milestones','HORIZONTAL',fixture.milestones.slice(0,3).map(v=>frame('Milestone note','VERTICAL',[text(v.date,inner/3-20,14,t.accent,'Medium'),text(v[lang],inner/3-20,16,t.ink,'Medium')],{w:inner/3,gap:5})),{w:inner,gap:0,padTop:16}),...(counts.undated.length?[text(lang==='ja'?'日付未定：研究滞在の候補先を整理':'Unscheduled: Review research visit options',inner,14,t.muted)]:[])];
 else if(view==='quarter')content=[chart(inner),legend,frame('Quarter notes','HORIZONTAL',[frame('Quarter work','VERTICAL',[text(lang==='ja'?'準備と締切':'Preparation and deadlines',inner*.62-12,18,t.ink,'Medium'),...shownTasks.map(v=>taskRow(v,inner*.62-12))],{w:inner*.62,gap:8}),frame('Quarter detail','VERTICAL',[text(scenario==='empty'?(lang==='ja'?'作業はありません':'No tasks'):(lang==='ja'?'推薦書の返答待ち':'Awaiting reference letter'),inner*.38-24,18,t.ink,'Medium'),text(scenario==='empty'?'—':(lang==='ja'?'奨学金A・正式締切 7月15日':'Fellowship A · submission deadline July 15'),inner*.38-24,14,t.ink),text(scenario==='empty'?'—':(lang==='ja'?'次の確認：6月11日':'Next check: June 11'),inner*.38-24,14,t.muted),log(inner*.38-24)],{w:inner*.38-24,gap:16})],{w:inner,gap:24})];
 else {content=themeId==='b'?[chart(inner,true),legend,titleRow,list(inner)]:[frame('Dates and work','HORIZONTAL',[text(lang==='ja'?'締切・目標 '+counts.due+'件':counts.due+' deadlines / targets',inner*.5,16,t.ink,'Medium'),text(lang==='ja'?'先の締切に向けた着手 '+counts.preparation+'件':counts.preparation+' preparations for later deadlines',inner*.5,15,t.muted)],{w:inner,h:32,gap:0}),chart(inner,true),legend,titleRow,list(inner)];}
 const main=frame('Main content','VERTICAL',[heading,controls,...(error?[error]:[]),...content],{w:mainWidth,pad:themeId==='a'?28:48,gap:16});
 const body=frame('Application body','HORIZONTAL',themeId==='a'?[nav,main]:[main],{w:W,gap:0});
 return frame('Option '+t.label+' / '+lang+' / '+view,'VERTICAL',[header,body],{w:W,h:H,gap:0,bg:t.bg,themeId,lang,view,scenario,clip:false});
}
