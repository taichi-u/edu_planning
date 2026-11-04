import { useState } from 'react';
import { CalendarRange, CircleDot, ListChecks, PanelLeft, Rows3 } from 'lucide-react';
import { MilestoneNavigator, type Lane } from './milestone-navigator';
import { dayNumber, isoDay, monthStart } from './time-window';
import './research-preview.css';

const tasks = [
  { title: '比較結果を図表にまとめる', project: '論文執筆', points: 8, weekday: 4 },
  { title: '評価手順を自動化', project: '軌道解析', points: 5, weekday: 3 },
  { title: '観測データの単位を照合', project: '軌道解析', points: 2, weekday: 1 },
  { title: '基準ケースを再現', project: '軌道解析', points: 3, weekday: 0 },
];
const days = ['月', '火', '水', '木', '金', '土', '日'];
const navigation = [
  { icon: Rows3, label: '概要', id: 'overview' },
  { icon: CalendarRange, label: 'マイルストーン', id: 'milestones' },
  { icon: ListChecks, label: '完了したタスク', id: 'finished' },
];
const today = dayNumber(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
const month = monthStart(today);
const startYear = Number(isoDay(today).slice(0, 4)) - (isoDay(today).slice(5, 7) < '04' ? 1 : 0);
const full = { start: dayNumber(startYear + '-04-01'), span: dayNumber((startYear + 6) + '-04-01') - dayNumber(startYear + '-04-01') };
// Fictional examples relative to the current month, including a month-only goal.
const lanes: Lane[] = [
  { name: '軌道解析', milestones: [
    { day: month + 19, label: '基準ケース再現' }, { day: month + 24, label: '比較表の確定' },
    { day: monthStart(month, 1) + 1, label: '検証結果を共有' },
    { day: monthStart(month, 2), until: monthStart(month, 3), label: '手法の評価' },
    { day: monthStart(month, 10) + 10, label: '追試を完了' },
  ] },
  { name: '論文執筆', milestones: [
    { day: month + 26, label: '図表を確認' }, { day: monthStart(month, 1) + 10, label: '結果の整理' },
    { day: monthStart(month, 2) + 14, label: '初稿レビュー' },
    { day: full.start + full.span - 27, label: '論文審査' },
  ] },
];

function WeekChart() {
  const totals = days.map((_, i) => tasks.filter(t => t.weekday <= i).reduce((n, t) => n + t.points, 0));
  const steps = totals.map((n, i) => `${i === 0 ? 'M0 85' : 'H' + (i * 100)} V${85 - n * 4}`).join(' ');
  return <section className="rp-chart"><h2>完了ポイントの累計</h2><small>サンプル週・個人尺度</small>
    <svg viewBox="0 0 600 90" preserveAspectRatio="none" role="img" aria-label={'日別累計 ' + totals.join('、') + ' pt'}>
      {[13, 37, 61, 85].map(y => <path key={y} d={`M0 ${y}H600`} stroke="#303031"/>)}
      <path d={steps + 'V85H0Z'} fill="#fff" opacity=".08"/><path d={steps} fill="none" stroke="#ddd" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    </svg><div>{days.map(d => <small key={d}>{d}</small>)}</div></section>;
}

export default function ResearchPreview() {
  const [menu, setMenu] = useState(false);
  const next = lanes.flatMap(l => l.milestones).filter(m => m.day >= today).sort((a, b) => a.day - b.day)[0];
  const stats = [
    ['今週の完了ポイント', tasks.reduce((n, t) => n + t.points, 0) + ' pt', '着手時の見積もり'],
    ['完了タスク', tasks.length + ' 件', 'サンプル週の実績'],
    ['プロジェクト', lanes.length + ' 件', 'マイルストーン登録済み'],
    ['次の節目', isoDay(next.day).slice(5).replace('-', '/'), next.label],
  ];
  return <div className="rp-shell">
    <aside className={menu ? 'rp-side is-open' : 'rp-side'}><div className="rp-brand"><CircleDot size={19}/>研究ロードマップ</div>
      <nav aria-label="ページ内">{navigation.map(({ icon: Icon, label, id }) =>
        <a href={'#' + id} key={id} onClick={() => setMenu(false)}><Icon size={16}/>{label}</a>)}</nav>
    </aside>
    <main className="rp-main" id="overview"><header><button className="rp-menu" aria-label="ナビゲーション" aria-expanded={menu} onClick={() => setMenu(!menu)}><PanelLeft size={18}/></button>
      <h1>週間ダッシュボード</h1><span>サンプル</span></header><div className="rp-body">
      <div className="rp-stats">{stats.map(([title, value, note]) => <section key={title}><p>{title}</p><strong>{value}</strong><small>{note}</small></section>)}</div>
      <WeekChart/>
      <MilestoneNavigator today={today} full={full} lanes={lanes}/>
      <section className="rp-table" id="finished"><h2>完了したタスク</h2><table><thead><tr><th>タスク</th><th>プロジェクト</th><th>状態</th><th>ポイント</th></tr></thead><tbody>{tasks.map(t => <tr key={t.title}><td>{t.title}</td><td>{t.project}</td><td>✓ 完了</td><td>{t.points} pt</td></tr>)}</tbody></table></section>
    </div></main></div>;
}
