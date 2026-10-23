'use client';
import { useState } from 'react';
import { categories,dateBounds,dateLabel,kinds,type Category,type PlanResponse } from '@/lib/domain';
import Timeline from './timeline';
export default function PrintView({data,start,end,filters}:{data:PlanResponse;start:string;end:string;filters:Category[]}) {
  const [from,setFrom]=useState(start),[to,setTo]=useState(end),[cats,setCats]=useState(filters);
  const plan={...data.plan,projects:data.plan.projects.map(p=>({...p,milestones:p.milestones.filter(m=>{const b=dateBounds(m);return b&&b[0]<=to&&b[1]>=from&&cats.includes(m.category);})})).filter(p=>p.milestones.length)};
  return <main className="print-page"><div className="print-controls"><a href="/">← ロードマップ</a><label>開始<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>終了<input type="date" min={from} value={to} onChange={e=>setTo(e.target.value)}/></label>{categories.map(c=><label key={c.id}><input type="checkbox" checked={cats.includes(c.id)} onChange={()=>setCats(v=>v.includes(c.id)?v.filter(x=>x!==c.id):[...v,c.id])}/>{c.label}</label>)}<button className="primary" onClick={()=>window.print()}>印刷 / PDFに保存</button></div><h1>研究ロードマップ</h1><p className="subtle">面談用・研究内容非表示　{from} — {to}{plan.projects.some(p=>p.sample)?'　仮データを含む':''}</p>
    {data.role==='anonymous'?<a href="/signin-with-chatgpt?return_to=%2Fprint" target="_top">ログインが必要です</a>:<>{!plan.projects.length?<p>この期間に共有対象の予定はありません。</p>:<><Timeline plan={plan} range="all" anchor={from} selected={null} onSelect={()=>{}} filters={cats} bounds={[from,to]} compact/><table><thead><tr><th>日付</th><th>案件</th><th>節目</th><th>種類・確認状態</th></tr></thead><tbody>{plan.projects.flatMap(p=>p.milestones.map(m=>({p,m}))).sort((a,b)=>a.m.start.localeCompare(b.m.start)).map(({p,m})=><tr key={p.id+m.id}><td>{dateLabel(m)}</td><td>{p.publicName}</td><td>{m.publicTitle}</td><td>{kinds[m.kind]} / {m.confirmed?'確認済み':'予定'}{m.done?' / 完了':''}</td></tr>)}</tbody></table></>}</>}
  </main>;
}
