'use client';
import { useId } from 'react';
import { categories, kinds, dateBounds, addYears, addDays, type Plan, type Project, type Milestone, type Category } from '@/lib/domain';
export type Range = 'all' | 'year' | '90';
export function visibleRange(plan: Plan, range: Range, anchor: string): [string,string] { return range === 'all' ? [plan.settings.b4Start, addDays(addYears(plan.settings.phdStart, 6), -1)] : [anchor, addDays(anchor, range === 'year' ? 365 : 89)]; }
type Mark = { project: Project; milestone: Milestone; x: number; endX: number; y: number; labelX: number; anchor: 'start' | 'end'; label: string; period: boolean };
export default function Timeline({ plan, range, anchor, selected, onSelect, filters, compact = false, bounds }: { plan: Plan; range: Range; anchor: string; selected: string | null; onSelect: (id: string) => void; filters: Category[]; compact?: boolean; bounds?: [string,string] }) {
  const clip = useId().replaceAll(':','');
  const [start, end] = bounds ?? visibleRange(plan, range, anchor);
  const left = 138, width = 1120, right = 28, plot = width-left-right;
  const first = Date.parse(start), last = Date.parse(addDays(end,1)), span = last-first;
  const x = (date: string) => left + (Date.parse(date)-first)/span*plot;
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const years = [ {label:'B4',start:plan.settings.b4Start,end:plan.settings.phdStart}, ...Array.from({length:5},(_,i)=>({label:`博士${i+1}年`,start:addYears(plan.settings.phdStart,i),end:addYears(plan.settings.phdStart,i+1)})),{label:'その後',start:addYears(plan.settings.phdStart,5),end:addYears(plan.settings.phdStart,6)} ];
  const ticks: {date:string; label:string}[]=[];
  if (range==='all') years.forEach(y=>ticks.push({date:y.start,label:y.start.slice(0,4)}));
  else { let tick = start.slice(0,7)+'-01'; while(tick<=end) { if(tick>=start) ticks.push({date:tick,label:`${tick.slice(0,4)}/${Number(tick.slice(5,7))}`}); const d=new Date(tick); d.setUTCMonth(d.getUTCMonth()+1); tick=d.toISOString().slice(0,10); } ticks.unshift({date:start,label:start.replaceAll('-','/')}); }
  let cursor=96; const marks:Mark[]=[]; const lanes:{id:Category;label:string;color:string;top:number;height:number}[]=[];
  for(const cat of categories.filter(c=>filters.includes(c.id))) {
    const candidates = plan.projects.filter(p=>!p.archived).flatMap(p=>p.milestones.filter(m=>m.category===cat.id && (range!=='all'||m.important||p.id===selected)).map(m=>({p,m,bounds:dateBounds(m)}))).filter(v=>v.bounds && v.bounds[0]<=end && v.bounds[1]>=start).sort((a,b)=>a.bounds![0].localeCompare(b.bounds![0]));
    const laneMarks: typeof candidates = [];
    for (const item of candidates) {
      const cluster = range === 'all' && item.p.id !== selected ? laneMarks.find(v => v.p.id === item.p.id && v.m.kind !== 'period' && item.m.kind !== 'period' && Math.abs(x(v.bounds![0])-x(item.bounds![0])) < 35) : undefined;
      if (cluster) { const count = Number(cluster.m.title.match(/（(\d+)件）$/)?.[1] || 1) + 1; cluster.m = { ...cluster.m, title: `${item.p.shortName}（${count}件）` }; }
      else laneMarks.push({ ...item, m: { ...item.m } });
    }
    const ends:number[]=[];
    for(const {p,m,bounds} of laneMarks) {
      const px=Math.max(left,x(bounds![0])), ex=Math.min(width-right,x(addDays(bounds![1],1)));
      const period=m.kind==='period'||m.kind==='event'&&!!m.end||m.precision==='month';
      const label=m.title.length>20?m.title.slice(0,19)+'…':m.title;
      const labelWidth=Math.max(50,label.length*13+(!m.confirmed?30:0));
      const labelX=period?px+7:px+13;
      const over=labelX+labelWidth>width-right;
      const visualLeft=over?Math.max(left,px-labelWidth-13):px;
      const visualEnd=over?Math.max(px+8,ex):Math.max(ex,labelX+labelWidth);
      let slot=ends.findIndex(v=>v<=visualLeft+.5); if(slot<0)slot=ends.length; ends[slot]=visualEnd;
      marks.push({project:p,milestone:m,x:px,endX:ex,y:cursor+25+slot*38,labelX:over?px-13:labelX,anchor:over?'end':'start',label,period});
    }
    const height=Math.max(compact?65:82,ends.length*38+30);lanes.push({...cat,top:cursor,height});cursor+=height;
  }
  const chosen=marks.filter(m=>m.project.id===selected).sort((a,b)=>a.x-b.x);
  return <div className="timeline-scroll"><svg className="timeline" viewBox={`0 0 ${width} ${cursor+12}`} role="img" aria-label={`${start}から${end}の研究ロードマップ。期間は帯、正式締切は菱形、開催日は丸。各項目は選択できます。`}>
    <defs><clipPath id={clip}><rect x={left} y="0" width={plot} height={cursor}/></clipPath></defs>
    <text x="14" y="27" className="axis-label">カテゴリー</text>
    {years.filter(y=>y.start<=end&&y.end>=start).map(y=><g key={y.label}><rect x={Math.max(left,x(y.start))} y="39" width={Math.max(0,Math.min(width-right,x(y.end))-Math.max(left,x(y.start)))} height="31" fill="#efeee8" stroke="#d8d9d3"/><text x={Math.max(left,x(y.start))+8} y="59" className="phase-label">{y.label}</text></g>)}
    {ticks.map((t,i)=><g key={t.date+i}><line x1={x(t.date)} x2={x(t.date)} y1="73" y2={cursor} stroke="#e1e2dc"/><text x={x(t.date)+7} y="27" className="axis-label">{t.label}</text></g>)}
    {range==='90'&&Array.from({length:13},(_,i)=>addDays(start,i*7)).map(t=><line key={t} x1={x(t)} x2={x(t)} y1="73" y2={cursor} stroke="#e5e6e1" strokeDasharray="2 5"/>)}
    {lanes.map(l=><g key={l.id}><line x1="0" x2={width} y1={l.top} y2={l.top} stroke="#d8d9d3"/><rect x="14" y={l.top+22} width="8" height="8" fill={l.color}/><text x="31" y={l.top+31} className="lane-label">{l.label}</text></g>)}
    <line x1={left} x2={left} y1="0" y2={cursor} stroke="#d8d9d3"/>
    {selected&&chosen.length>1&&<path d={chosen.map((m,i)=>`${i?'L':'M'}${m.x} ${m.y}`).join(' ')} stroke="#737b7a" strokeWidth="1.3" strokeDasharray="4 4" fill="none" opacity=".65" clipPath={`url(#${clip})`}/>}
    {today>=start&&today<=end&&<g><line x1={x(today)} x2={x(today)} y1="73" y2={cursor} stroke="#242a2e" strokeWidth="1"/><rect x={x(today)-17} y="72" width="34" height="19" fill="#242a2e"/><text x={x(today)} y="86" textAnchor="middle" fill="white" fontSize="12">今日</text></g>}
    {marks.map(({project:p,milestone:m,x:px,endX,y,labelX,anchor:labelAnchor,label,period})=>{
      const c=categories.find(c=>c.id===m.category)!; const active=selected===p.id; const marker = m.kind==='deadline'||m.kind==='target';
      return <g key={p.id+m.id} className={`timeline-item ${active?'selected':''}`} role="button" tabIndex={0} aria-label={`${p.shortName}、${m.title}、${kinds[m.kind]}、${m.start}${!m.confirmed?'、予定':''}`} onClick={()=>onSelect(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id);}}}>
        <title>{p.name} / {m.title} / {m.start}{m.end?' – '+m.end:''}</title>
        <rect x={Math.min(px,labelX-(labelAnchor==='end'?label.length*13:0))-4} y={y-21} width={Math.max(44,endX-px+label.length*8)} height="39" fill="transparent"/>
        {period?<><rect x={px} y={y-7} width={Math.max(5,endX-px)} height="13" rx="2" fill={c.color} fillOpacity={active?.75:.45} stroke={c.color} strokeWidth={active?2:1} strokeDasharray={m.confirmed?undefined:'4 3'}/><text x={labelX} y={y-13} textAnchor={labelAnchor} className="mark-label">{label}{!m.confirmed?' · 予定':''}{m.done?' ✓':''}</text></>:<>
          {marker?<path d={`M${px} ${y-7}l7 7-7 7-7-7z`} fill={m.kind==='target'?'#F8F7F3':c.color} stroke={c.color} strokeWidth="2" strokeDasharray={m.confirmed?undefined:'3 2'}/>:m.kind==='submitted'?<text x={px-7} y={y+6} fontSize="20" fontWeight="600">✓</text>:<circle cx={px} cy={y} r="6" fill={c.color} stroke={active?'#242A2E':c.color} strokeWidth="1.5"/>}
          <text x={labelX} y={y+5} textAnchor={labelAnchor} className="mark-label">{label}{m.done?' ✓':''}<tspan className="mark-status">{!m.confirmed?' · 予定':''}</tspan></text>
        </>}
      </g>;
    })}
    <line x1="0" x2={width} y1={cursor} y2={cursor} stroke="#d8d9d3"/>
  </svg></div>;
}
