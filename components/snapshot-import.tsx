'use client';
import { useState } from 'react';
import { snapshotBundleSchema, type PlanningAction } from '@/lib/planning';
import type { z } from 'zod';

export default function SnapshotImport({ onSave, busy }: { onSave: (a: PlanningAction) => Promise<void>; busy: boolean }) {
  const [bundle,setBundle]=useState<z.infer<typeof snapshotBundleSchema>|null>(null),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  return <details className="snapshot-import"><summary>取得データの取り込み</summary><p className="help">会話から受け取ったJSONファイルを選択し、取得先と件数を確認して保存します。外部サービスへの書き込みは行いません。</p><label>取得結果ファイル<input type="file" accept=".json,application/json" onChange={async e=>{setError('');setBundle(null);setSaved(false);const file=e.currentTarget.files?.[0];if(!file)return;try{if(file.size>3000000)throw new Error('ファイルは3MB以内にしてください');setBundle(snapshotBundleSchema.parse(JSON.parse(await file.text())));}catch(e){setError(e instanceof Error?e.message:'ファイルを確認してください');}}}/></label>
    {bundle&&<><table><thead><tr><th>取得先</th><th>状態</th><th>タスク</th><th>予定</th></tr></thead><tbody>{bundle.snapshots.map(s=><tr key={s.source.id}><td>{s.source.title}</td><td>{s.source.status}</td><td>{s.tasks?.length??0}</td><td>{s.events?.length??0}</td></tr>)}</tbody></table><button className="primary" disabled={busy||saved} onClick={async()=>{try{await onSave({action:'ingest_bundle',snapshots:bundle.snapshots});setSaved(true);setError('');}catch(e){setError(e instanceof Error?e.message:'取り込めませんでした');}}}>確認した取得結果を保存</button></>}{saved&&<p role="status">取り込みました</p>}{error&&<p className="error" role="alert">{error}</p>}
  </details>;
}
