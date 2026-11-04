import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { axisTicks, fitWindow, isoDay, pageWindow, preset, scales, type Scale, type Window } from './time-window';

export type Milestone = { label: string; day: number; until?: number };
export type Lane = { name: string; milestones: Milestone[] };

export function MilestoneNavigator({ today, full, lanes }: { today: number; full: Window; lanes: Lane[] }) {
  const [window, setWindow] = useState(() => {
    const initial = preset('3か月', today, full);
    return fitWindow(initial.start, initial.span, full);
  });
  const [scale, setScale] = useState<Scale | null>('3か月');
  const [selected, setSelected] = useState('');
  const [width, setWidth] = useState(720);
  const axis = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; start: number; span: number } | null>(null);
  const { start, span } = window;
  const end = start + span;
  useLayoutEffect(() => {
    const el = axis.current!;
    const resize = new ResizeObserver(() => setWidth(el.clientWidth));
    resize.observe(el);
    return () => resize.disconnect();
  }, []);
  const ticks = axisTicks(window, width);
  const position = (d: number) => (d - start) / span * 100;
  const middle = Math.floor(start + (span - 1) / 2);
  const focus = today >= start && today < end ? today : middle;
  function choose(s: Scale, day: number) {
    const next = preset(s, day, full);
    setWindow(fitWindow(next.start, next.span, full));
    setScale(s);
    setSelected('');
  }
  function zoom(size: number) {
    setWindow(fitWindow(focus - size * (focus - start) / span, size, full));
    setScale(null);
    setSelected('');
  }
  function page(direction: -1 | 1) {
    setSelected('');
    setWindow(pageWindow(window, scale, direction, full));
  }
  function resetToday() {
    if (scale) choose(scale === '全期間' ? '3か月' : scale, today);
    else {
      setWindow(fitWindow(today - Math.floor(span / 2), span, full));
      setSelected('');
    }
  }
  const sizes = [...new Set(Array.from({ length: 101 }, (_, i) => Math.round(7 * (full.span / 7) ** (i / 100))))];
  const sliderIndex = sizes.reduce((best, size, i) => Math.abs(size - span) < Math.abs(sizes[best] - span) ? i : best, 0);
  const canPan = span < full.span;
  const shortDate = (d: number) => isoDay(d).slice(5).replace('-', '/');
  return <section className="ms-card" id="milestones" aria-label="マイルストーン">
    <div className="ms-head"><div><h2>マイルストーン</h2><p aria-live="polite" data-range>{isoDay(start).replaceAll('-', '/')} — {isoDay(end - 1).replaceAll('-', '/')}</p></div>
      <div className="ms-presets" role="group" aria-label="時間スケール">{scales.map(s => <button key={s} aria-pressed={s === scale} onClick={() => choose(s, focus)}>{s}</button>)}</div></div>
    <div className="ms-tools"><div className="ms-nav"><button aria-label="前の期間" disabled={start <= full.start} onClick={() => page(-1)}><ChevronLeft size={16}/></button>
      <button onClick={resetToday} onPointerUp={e => {
        // A fast swipe can suppress the following synthetic click on touch devices.
        // Resetting to today is idempotent when the native click also arrives.
        if (e.pointerType === 'touch' && e.currentTarget.contains(document.elementFromPoint(e.clientX, e.clientY))) resetToday();
      }}>今日</button>
      <button aria-label="次の期間" disabled={end >= full.start + full.span} onClick={() => page(1)}><ChevronRight size={16}/></button></div>
      <div className="ms-zoom"><ZoomIn size={15} aria-hidden="true"/><input type="range" aria-label="表示日数を調整" min="0" max={sizes.length - 1} step="1"
        value={sliderIndex} aria-valuetext={span + '日間'}
        onChange={e => zoom(sizes[Number(e.target.value)])}/><ZoomOut size={15} aria-hidden="true"/><output>{span}日</output></div></div>
    <div className="ms-rows" onPointerDown={e => {
      if (!canPan || !e.isPrimary || e.button !== 0 || !(e.target as HTMLElement).closest('[data-track]') || (e.target as HTMLElement).closest('button')) return;
      drag.current = { id: e.pointerId, x: e.clientX, start, span };
      if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e => {
      const d = drag.current;
      if (d?.id === e.pointerId) {
        setWindow(fitWindow(d.start - (e.clientX - d.x) * d.span / Math.max(1, width), d.span, full));
        setSelected('');
      }
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <div className="ms-row ms-ticks"><strong>プロジェクト</strong><div data-track ref={axis}>{ticks.map(t => <span className="ms-tick" key={t.day} style={{left: position(t.day) + '%'}}>{t.label}</span>)}</div></div>
      {lanes.map(lane => {
        // Put labels on additional rows when their pixel footprints overlap, including on narrow screens.
        const ends: number[] = [];
        const marks = lane.milestones.filter(m => (m.until ?? m.day + 1) > start && m.day < end).map(m => {
          const x = Math.max(0, (m.day - start) * width / span);
          const w = Math.min(width, Math.max(82, m.label.length * 14 + 12));
          const left = Math.max(0, Math.min(x - w / 2, width - w));
          let row = ends.findIndex(right => right + 6 <= left);
          if (row < 0) row = ends.length;
          ends[row] = left + w;
          return { m, x, w, left, row };
        });
        return <div className="ms-row" key={lane.name}><strong>{lane.name}</strong><div className="ms-track" data-track style={{height: Math.max(53, ends.length * 43 + 13)}}>
          {ticks.map(t => <i className="ms-grid" key={t.day} style={{left: position(t.day) + '%'}}/>)}
          {today >= start && today < end && <i className="ms-today" title="今日" style={{left: position(today) + '%'}}/>}
          {marks.map(({ m, x, w, left, row }) => <div key={m.label}>
            {m.until ? <i className="ms-band" style={{left: x, width: Math.max(1, Math.min(width, (m.until - start) * width / span) - x), top: 11 + row * 43}}/>
              : <i className="ms-dot" style={{left: x, top: 11 + row * 43}}/>}
            <button className="ms-mark" aria-pressed={selected === lane.name + ' / ' + m.label} style={{left, width: w, top: 17 + row * 43}} onClick={() => setSelected(lane.name + ' / ' + m.label)}>
              <small>{m.until ? isoDay(m.day).slice(0, 7).replace('-', '/') + ' 月内' : shortDate(m.day)}</small>{m.label}</button>
          </div>)}
          {!marks.length && <span className="ms-none">この期間の節目なし</span>}
        </div></div>;
      })}
    </div>
    <footer>{selected || 'タイムラインを左右にドラッグして移動'}<span>◇ 目標日　┄ 月内の目標</span></footer>
  </section>;
}
