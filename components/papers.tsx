'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, X, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/domain';
import type { Planning, PlanningAction } from '@/lib/planning';
import { paperSchema, readingStates, selectPapers, type Paper } from '@/lib/papers';

function PaperForm({ paper, projects, planning, busy, onSave, onClose }: { paper: Paper; projects: Project[]; planning: Planning; busy: boolean; onSave: (paper: Paper) => Promise<void>; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null), [error, setError] = useState('');
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="planning-dialog" onCancel={onClose}>
    <div className="section-line"><h2>論文を編集</h2><button aria-label="閉じる" onClick={onClose}><X size={18}/></button></div>
    <form className="edit-form" onSubmit={async e => {
      e.preventDefault(); setError(''); const f = new FormData(e.currentTarget), value = (key: string) => String(f.get(key) ?? '').trim(), driveUrl = value('driveUrl');
      try {
        await onSave(paperSchema.parse({ ...paper, title: value('title'), authors: value('authors'), year: value('year') ? Number(value('year')) : null, doi: value('doi').replace(/^https:\/\/doi.org\//, ''), sourceUrl: value('sourceUrl'), driveUrl, folderUrl: value('folderUrl'), purpose: value('purpose'), recommendedBy: value('recommendedBy'), notes: value('notes'), readingState: value('readingState'), projectIds: f.getAll('projectIds'), taskIds: f.getAll('taskIds'), ...(driveUrl !== paper.driveUrl ? { checkedAt: null, mimeType: '', fileSize: null, fileName: '' } : {}) }));
        onClose();
      } catch (e) { setError(e instanceof Error ? e.message : '保存できません'); }
    }}>
      <label>論文名・資料名<input name="title" required maxLength={600} defaultValue={paper.title}/></label>
      <div className="field-pair"><label>著者<input name="authors" defaultValue={paper.authors}/></label><label>出版年<input name="year" type="number" min="1500" max="2200" defaultValue={paper.year ?? ''}/></label></div>
      <label>DOI<input name="doi" defaultValue={paper.doi} placeholder="10.xxxx/…"/></label>
      <label>掲載ページURL<input name="sourceUrl" type="url" defaultValue={paper.sourceUrl}/></label>
      <label>DriveのPDF URL<input name="driveUrl" type="url" defaultValue={paper.driveUrl}/></label>
      <label>DriveのフォルダURL<input name="folderUrl" type="url" defaultValue={paper.folderUrl}/></label>
      <label>読む目的<textarea name="purpose" rows={3} defaultValue={paper.purpose}/></label>
      <div className="field-pair"><label>推薦者<input name="recommendedBy" defaultValue={paper.recommendedBy}/></label><label>読了状況<select name="readingState" defaultValue={paper.readingState}>{Object.entries(readingStates).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      <fieldset className="paper-associations"><legend>関連プロジェクト</legend>{projects.filter(p => !p.archived || paper.projectIds.includes(p.id)).map(p => <label key={p.id}><input type="checkbox" name="projectIds" value={p.id} defaultChecked={paper.projectIds.includes(p.id)}/>{p.shortName}</label>)}</fieldset>
      <fieldset className="paper-associations"><legend>関連タスク</legend>{planning.tasks.filter(t => !t.archived || paper.taskIds.includes(t.id)).map(t => <label key={t.id}><input type="checkbox" name="taskIds" value={t.id} defaultChecked={paper.taskIds.includes(t.id)}/>{t.title}</label>)}</fieldset>
      <label>読む際のメモ・未確認事項<textarea name="notes" rows={3} defaultValue={paper.notes}/></label>
      {paper.checkedAt && <p className="help">Drive確認：{paper.checkedAt.slice(0, 10)} / {paper.mimeType || '形式未確認'}{paper.fileSize ? ` / ${paper.fileSize.toLocaleString()} bytes` : ''}</p>}
      {error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>Siteに保存</button>
    </form>
  </dialog>;
}

export default function Papers({ planning, projects, scope, search, busy, onSave, onTask }: { planning: Planning; projects: Project[]; scope: string; search: string; busy: boolean; onSave: (action: PlanningAction) => Promise<void>; onTask: (id: string) => void }) {
  const [editing, setEditing] = useState<Paper | null>(null), [state, setState] = useState('all'), [error, setError] = useState('');
  const papers = selectPapers(planning.papers, planning.tasks, scope, search).filter(p => state === 'all' || p.readingState === state);
  async function save(paper: Paper) { await onSave({ action: 'upsert_paper', paper }); }
  return <div className="papers-content">
    <div className="section-line"><h2>読む論文 <span className="count">{papers.length}</span></h2><div className="inline-actions"><select aria-label="論文の読了状況で絞り込み" value={state} onChange={e => setState(e.target.value)}><option value="all">すべて</option>{Object.entries(readingStates).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><button className="primary" disabled={busy} onClick={() => setEditing(paperSchema.parse({ id: crypto.randomUUID(), title: '新しい論文', projectIds: scope ? [scope] : [] }))}><Plus size={15}/>論文を登録</button></div></div>
    <p className="help">DriveのPDF、読む目的、関連する作業を確認します。</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="papers-list">{papers.map(p => <article key={p.id} className="paper-row">
      <div className="paper-body"><h3>{p.driveUrl ? <a href={p.driveUrl} target="_blank" rel="noreferrer">{p.title}<ArrowUpRight size={14}/></a> : p.title}</h3>
        {(p.authors || p.year) && <p className="help">{p.authors}{p.year ? ` (${p.year})` : ''}</p>}
        {p.purpose && <p>{p.purpose}</p>}
        <div className="paper-links">{p.driveUrl ? <a href={p.driveUrl} target="_blank" rel="noreferrer">{p.mimeType === 'application/pdf' ? 'PDFを開く' : 'Driveで開く'} ↗</a> : <span className="subtle">PDF未登録</span>}{p.doi && <a href={'https://doi.org/' + p.doi} target="_blank" rel="noreferrer">DOI: {p.doi}</a>}{p.sourceUrl && !p.doi && <a href={p.sourceUrl} target="_blank" rel="noreferrer">掲載ページ ↗</a>}{p.folderUrl && <a href={p.folderUrl} target="_blank" rel="noreferrer">Driveフォルダ ↗</a>}</div>
        <div className="paper-context">{p.projectIds.map(id => projects.find(project => project.id === id)?.shortName).filter(Boolean).join(' / ')}{p.recommendedBy && <span>推薦：{p.recommendedBy}</span>}{p.checkedAt && <span>Drive確認 {p.checkedAt.slice(0, 10)}</span>}</div>
        {!!p.taskIds.length && <div className="paper-tasks">{p.taskIds.map(id => { const task = planning.tasks.find(t => t.id === id); return task && <button className="text-button" key={id} onClick={() => onTask(id)}>{task.title} ↗</button>; })}</div>}
        {p.notes && <details className="paper-notes"><summary>メモ・未確認事項</summary><p>{p.notes}</p></details>}
      </div>
      <div className="paper-actions"><label>読了状況<select aria-label={`${p.title}の読了状況`} value={p.readingState} disabled={busy} onChange={e => { setError(''); void save({ ...p, readingState: e.target.value as Paper['readingState'] }).catch(e => setError(e instanceof Error ? e.message : '保存できません')); }}>{Object.entries(readingStates).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><button disabled={busy} onClick={() => setEditing(p)}>編集</button></div>
    </article>)}</div>
    {!papers.length && <p className="empty">この条件の論文は未登録です。</p>}
    {editing && <PaperForm key={editing.id} paper={editing} projects={projects} planning={planning} busy={busy} onSave={save} onClose={() => setEditing(null)}/>}
  </div>;
}
