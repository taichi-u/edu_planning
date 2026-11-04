'use client';

import { useState } from 'react';
import { projectColor } from '@/lib/content';
import { dateBounds, kinds, type Project } from '@/lib/domain';
import { jstToday, periodActivity, shiftDay, sprintWeek, type Planning } from '@/lib/planning';

const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
const scaleLabel = (scale: string) => scale === 'personal' ? '個人尺度' : scale;

function ScoreChart({ days, totals }: { days: string[]; totals: number[] }) {
  const peak = totals.at(-1) ?? 0;
  const step = 10 ** Math.floor(Math.log10(Math.max(peak, 1)));
  const ceiling = Math.max(2, Math.ceil(peak / step) * step);
  const points = totals.map((n, i) => ({ x: 5 + 95 * i, y: 112 - 100 * n / ceiling }));
  const last = points[points.length - 1];
  const path = points.map((p, i) => i ? `H${p.x}V${p.y}` : `M${p.x} 112V${p.y}`).join(' ');
  const description = totals.map((v, i) => `${days[i]}：${v} pt`).join('、');
  return <div className="score-plot">
    <div className="score-axis" aria-hidden="true"><span>{ceiling}</span><span>{ceiling / 2}</span><span>0</span></div>
    <svg viewBox="0 0 580 120" preserveAspectRatio="none" role="img" aria-label={`日別の累計。 ${description}`}>
      {[12, 62, 112].map(y => <path key={y} className="plot-grid" d={`M5 ${y}H575`}/>)}
      {days.map((day, i) => <path key={day} className="plot-grid" d={`M${5 + 95 * i} 12V112`}/>)}
      {last && <><path d={`${path} V112 H5 Z`} fill="currentColor" opacity=".12"/><path className="score-line" d={path}/></>}
      {points.map((p, i) => <circle className="score-point" key={days[i]} cx={p.x} cy={p.y} r="3.4"/>)}
    </svg>
    <div className="score-days" aria-hidden="true">{days.map((day, i) => <span key={day}>{daysOfWeek[i]} {day.slice(-2)}</span>)}</div>
  </div>;
}

export default function WeeklyRecord({ planning, projects, scope, today, review, onSelect }: {
  planning: Planning; projects: Project[]; scope: string; today: string; review: boolean; onSelect: (id: string) => void;
}) {
  const [choice, setChoice] = useState('personal');
  const week = sprintWeek(today);
  const { stats, completed, scored } = periodActivity(planning, week.from, week.to, scope);
  const scales = stats.scales.filter(s => s.completed > 0);
  const selected = scales.find(s => s.scale === choice) ?? scales[0];
  const days = daysOfWeek.map((_, i) => shiftDay(week.from, i));
  const daily = new Map<string, number>();
  for (const t of scored) {
    if (t.scale !== selected?.scale) continue;
    const day = jstToday(new Date(t.completedAt!));
    daily.set(day, (daily.get(day) ?? 0) + t.estimateAtStart!);
  }
  const totals: number[] = [];
  for (const day of days) {
    if (day > today) break;
    totals.push((totals.at(-1) ?? 0) + (daily.get(day) ?? 0));
  }
  const unscoredOnly = stats.completedCount > 0 && scored.length === 0;
  const next = review ? projects.filter(p => !p.archived && (!scope || scope === p.id)).flatMap(p =>
    p.milestones.filter(m => !m.done && m.kind !== 'period' && m.kind !== 'submitted' && (dateBounds(m)?.[1] ?? '') >= today)
      .map(m => ({ project: p, milestone: m }))).sort((a, b) => a.milestone.start.localeCompare(b.milestone.start)).slice(0, 3) : [];

  return <section className="week-record" aria-label="週の作業記録">
    <header className="week-heading"><div><small>WEEKLY RECORD</small><h2>週の作業記録</h2></div><p>{week.from.replaceAll('-', '.')} — {week.to.slice(5).replace('-', '.')}<small>日本時間</small></p></header>
    <div className="week-instrument">
      <div className="week-readout"><span className="instrument-index">01 ─ SPRINT</span><h3>今週の完了ポイント</h3>
        <div className={unscoredOnly ? 'score-unavailable' : 'score-digits'}>{unscoredOnly ? '点数未集計' : <>{selected?.completed ?? 0} <span>pt</span></>}</div>
        <small>完了 {stats.completedCount}件{stats.unscoredCount > 0 && `（点数対象外 ${stats.unscoredCount}件）`}</small>
      </div>
      <div className="week-chart"><div className="chart-caption"><h3>完了ポイントの累計</h3>
        {scales.length > 1 ? <select aria-label="表示する見積もり尺度" value={selected.scale} onChange={e => setChoice(e.target.value)}>{scales.map(s => <option key={s.scale} value={s.scale}>{scaleLabel(s.scale)} · {s.completed} pt</option>)}</select>
          : <small>{selected ? scaleLabel(selected.scale) : '着手時の見積もり'}</small>}</div>
        {unscoredOnly ? <p className="no-score">着手時の見積もりがある完了タスクはありません。</p> : <ScoreChart days={days} totals={totals}/>}
      </div>
    </div>
    <details className="weekly-summary"><summary>今週の記録・見積もり</summary>
      <div className="weekly-metrics"><span>進行中 {stats.wip}件</span>{stats.scales.map(s => <span key={s.scale}>{scaleLabel(s.scale)}：計画 {s.planned} pt</span>)}<span>実作業 {stats.actualMinutes === null ? '未記録' : `${stats.actualMinutes}分`}</span></div>
    </details>
    {review && <div className="week-lists">
      <section><span className="instrument-index">02 ─ LOG</span><h3>完了したタスク</h3>
        {completed.length ? <ul>{completed.slice().sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!)).map(t => <li key={t.id}>
          <time dateTime={t.completedAt!}>{jstToday(new Date(t.completedAt!)).slice(5).replace('-', '.')}</time>
          <button className="text-button" style={{borderLeftColor: t.projectIds.length ? projectColor(t.projectIds[0]) : 'var(--muted)'}} onClick={() => onSelect(t.id)}>{t.title}</button>
          <small>{t.estimateOrigin === 'planned' && t.estimateAtStart !== null ? `${t.estimateAtStart} pt${scales.length > 1 ? ' · ' + scaleLabel(t.scale) : ''}` : '点数対象外'}</small></li>)}</ul>
          : <p>今週完了したタスクはありません。</p>}
      </section>
      <section><span className="instrument-index">03 ─ MILESTONES</span><h3>次の節目</h3>
        {next.length ? <ul>{next.map(({ project, milestone: m }) => <li key={project.id + '/' + m.id}>
          <time dateTime={m.start}>{m.start.replaceAll('-', '.')}</time><div><small>{m.kind === 'deadline' ? '◆ ' : m.kind === 'target' ? '◇ ' : '● '}{kinds[m.kind]}{m.confirmed ? '' : '・予定'} ／ {project.shortName}</small>{m.title}</div></li>)}</ul>
          : <p>日付が決まっている節目はありません。</p>}
      </section>
    </div>}
  </section>;
}
