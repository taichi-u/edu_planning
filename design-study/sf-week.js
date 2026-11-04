// Display-only fixture for a complete week. No project data is requested.
const entries = [
  { day: 0, title: '基準ケースを再現', project: 'analysis', points: 3, note: '入力条件・使用した版・実行ログを保存。' },
  { day: 1, title: '観測データの単位を照合', project: 'analysis', points: 2, note: '元資料と出力表の単位を照合。' },
  { day: 3, title: '評価手順を自動化', project: 'software', points: 5, note: '同じ入力で評価を再実行できることを確認。' },
  { day: 4, title: '比較結果を図表にまとめる', project: 'paper', points: 8, note: '比較条件と差が読める図表を原稿に追加。' },
];
const total = entries.reduce((sum, entry) => sum + entry.points, 0);
document.querySelector('#score').textContent = total;
document.querySelector('#tally').textContent = '完了 ' + entries.length + ' 件　/　個人尺度';
document.querySelector('#entries').innerHTML = entries.slice().reverse().map(e =>
  `<details class="entry" data-project="${e.project}"><summary><time>11.${String(9 + e.day).padStart(2,'0')}</time><span class="task-title">${e.title}</span><span class="points">${e.points} pt</span><span class="arrow" aria-hidden="true">›</span></summary><p>${e.note}</p></details>`
).join('');

const svg = document.querySelector('#plot');
function render() {
  const theme = location.hash === '#folio' ? 'folio' : 'orbit';
  document.documentElement.dataset.theme = theme;
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === '#' + theme) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  let sum = 0;
  const curve = Array.from({length: 7}, (_, day) => {
    sum += entries.filter(e => e.day === day).reduce((n, e) => n + e.points, 0);
    return { x: 12 + day * 92, y: 127 - sum * 6, value: sum };
  });
  const steps = curve.map((p, i) => i ? `H${p.x} V${p.y}` : `M${p.x},127 V${p.y}`).join(' ');
  const grid = [0, 5, 10, 15, 20].map(n => `<path class="axis" d="M12 ${127 - n * 6}H564" stroke-dasharray="2 5"/>`).join('');
  const marks = curve.map(p => `<path class="axis" d="M${p.x} 7V127" stroke-dasharray="2 5"/><circle class="point" cx="${p.x}" cy="${p.y}" r="3.5"/>`).join('');
  svg.innerHTML = `<desc id="trend-description">月曜からの日別累計 ${curve.map(p => p.value).join('、')} ポイント</desc>${grid}<path d="${steps} V127 H12 Z" fill="var(--area)" opacity=".12"/><path class="track" d="${steps}"/>${marks}`;
}
addEventListener('hashchange', render);
render();
