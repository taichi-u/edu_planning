'use client';
import { useState } from 'react';
import { categories, kinds, stages, blankMilestone, projectSchema, type Project, type Milestone } from '@/lib/domain';
export default function Editor({ project, projects, onSave, busy }: { project: Project; projects: Project[]; onSave: (p: Project) => Promise<void>; busy: boolean }) {
  const [draft,setDraft]=useState<Project>(structuredClone(project)); const [error,setError]=useState(''); const [emailsText,setEmailsText]=useState(project.viewerEmails.join(', ')); const [linksText,setLinksText]=useState(project.links.map(l=>l.url).join('\n'));
  const patch=(value:Partial<Project>)=>setDraft(d=>({...d,...value}));
  const milestone=(id:string,value:Partial<Milestone>)=>setDraft(d=>({...d,milestones:d.milestones.map(m=>m.id===id?{...m,...value}:m)}));
  async function submit(e:React.FormEvent) { e.preventDefault(); const result=projectSchema.safeParse({...draft,viewerEmails:emailsText.split(/[,\n]/).map(v=>v.trim()).filter(Boolean),links:linksText.split(/\n/).map(v=>v.trim()).filter(Boolean).map(url=>project.links.find(l=>l.url===url)||({label:'関連資料',url}))}); if(!result.success) {setError(result.error.issues.map(x=>x.message).join(' / '));return;} try{await onSave(result.data);}catch(e){setError(e instanceof Error?e.message:'保存に失敗しました');} }
  return <form onSubmit={submit} className="edit-form">
    <label>正式名称<input required value={draft.name} onChange={e=>patch({name:e.target.value})} maxLength={300}/></label>
    <div className="field-pair"><label>短縮表示名<input required value={draft.shortName} onChange={e=>patch({shortName:e.target.value})} maxLength={60}/></label><label>カテゴリー<select value={draft.category} onChange={e=>patch({category:e.target.value as Project['category']})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>
    <label>研究テーマ<input value={draft.theme} onChange={e=>patch({theme:e.target.value})}/></label>
    <label>進行状態<select value={draft.stage} onChange={e=>patch({stage:e.target.value as Project['stage']})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>メモ<textarea rows={3} value={draft.notes} onChange={e=>patch({notes:e.target.value})}/></label>
    <fieldset><legend>関連プロジェクト</legend><div className="checks">{projects.filter(p=>p.id!==draft.id&&!p.archived).map(p=><label key={p.id}><input type="checkbox" checked={draft.relatedProjectIds?.includes(p.id)||false} onChange={e=>patch({relatedProjectIds:e.target.checked?[...(draft.relatedProjectIds||[]),p.id]:(draft.relatedProjectIds||[]).filter(id=>id!==p.id)})}/>{p.shortName}</label>)}</div></fieldset>
    <label>関連資料URL（1行に1件）<textarea rows={2} value={linksText} onChange={e=>setLinksText(e.target.value)}/></label>
    <div className="check-line"><label><input type="checkbox" checked={draft.sample} onChange={e=>patch({sample:e.target.checked})}/>仮データ</label><label><input type="checkbox" checked={draft.shareable} onChange={e=>patch({shareable:e.target.checked})}/>面談・閲覧共有の対象</label></div>
    {draft.shareable&&<fieldset><legend>共有</legend><label>共有用名称<input required value={draft.publicName} onChange={e=>patch({publicName:e.target.value})}/></label><label>閲覧者メール（カンマ区切り）<input value={emailsText} onChange={e=>setEmailsText(e.target.value)}/></label><p className="help">サイトの閲覧権限も別途必要です。共有画面には研究テーマ・メモ・関連資料を含めません。</p></fieldset>}
    <div className="section-line"><h3>期間・節目</h3><button type="button" onClick={()=>patch({milestones:[...draft.milestones,blankMilestone(draft.category)]})}>＋ 追加</button></div>
    {draft.milestones.map((m,i)=><fieldset key={m.id} className="milestone-editor"><legend>{i+1}. {m.title||'新しい節目'}</legend>
      <label>名称<input required value={m.title} onChange={e=>milestone(m.id,{title:e.target.value})}/></label>
      <div className="field-pair"><label>カテゴリー<select value={m.category} onChange={e=>milestone(m.id,{category:e.target.value as Milestone['category']})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>日付の種類<select value={m.kind} onChange={e=>milestone(m.id,{kind:e.target.value as Milestone['kind']})}>{Object.entries(kinds).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
      <label>日付の精度<select value={m.precision} onChange={e=>milestone(m.id,{precision:e.target.value as Milestone['precision'],start:'',end:'',time:'',confirmed:false})}><option value="day">日付指定</option><option value="month">月のみ</option><option value="unknown">未定</option></select></label>
      {m.precision!=='unknown'&&<><div className="field-pair"><label>開始・実施日<input type={m.precision==='month'?'month':'date'} required value={m.start} onChange={e=>milestone(m.id,{start:e.target.value})}/></label><label>終了日（任意）<input type={m.precision==='month'?'month':'date'} value={m.end} onChange={e=>milestone(m.id,{end:e.target.value})}/></label></div>
      {m.precision==='day'&&<div className="field-pair"><label>時刻（任意）<input type="time" value={m.time} onChange={e=>milestone(m.id,{time:e.target.value})}/></label><label>タイムゾーン<input value={m.timezone} onChange={e=>milestone(m.id,{timezone:e.target.value})} placeholder="Asia/Tokyo"/></label></div>}</>}
      {m.kind==='deadline'&&<><label>出典URL<input type="url" value={m.sourceUrl} onChange={e=>milestone(m.id,{sourceUrl:e.target.value})}/></label><label>確認日<input type="date" value={m.checkedAt} onChange={e=>milestone(m.id,{checkedAt:e.target.value})}/></label><p className="help">準備期間を変更しても正式締切は変わりません。</p></>}
      <div className="checks"><label><input type="checkbox" checked={m.confirmed} onChange={e=>milestone(m.id,{confirmed:e.target.checked})}/>日付を確認済み</label><label><input type="checkbox" checked={m.done} onChange={e=>milestone(m.id,{done:e.target.checked})}/>完了</label><label><input type="checkbox" checked={m.important} onChange={e=>milestone(m.id,{important:e.target.checked})}/>全期間で表示</label><label><input type="checkbox" checked={m.shared} onChange={e=>milestone(m.id,{shared:e.target.checked})}/>共有対象</label><label><input type="checkbox" checked={m.calendarSync} onChange={e=>milestone(m.id,{calendarSync:e.target.checked})}/>カレンダー同期対象</label></div>
      {m.shared&&<label>共有用名称<input value={m.publicTitle} onChange={e=>milestone(m.id,{publicTitle:e.target.value})}/></label>}
      <button type="button" className="text-button danger" onClick={()=>patch({milestones:draft.milestones.filter(v=>v.id!==m.id)})}>この節目を削除</button>
    </fieldset>)}
    {error&&<p className="error" role="alert">{error}</p>}
    <button className="primary save-button" type="submit" disabled={busy}>{busy?'保存中…':'保存'}</button>
  </form>;
}
