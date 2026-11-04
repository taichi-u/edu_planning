// Dates are integer calendar days. The viewport is [start, start + span).
export const DAY = 86_400_000;
export const dayNumber = (iso: string) => Math.floor(Date.parse(iso + 'T00:00:00Z') / DAY);
export const isoDay = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
export function monthStart(day: number, offset = 0) {
  const date = new Date(day * DAY);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1) / DAY;
}

export const scales = ['週', '月', '3か月', '年', '全期間'] as const;
export type Scale = typeof scales[number];
export type Window = { start: number; span: number };

export function preset(scale: Scale, focus: number, full: Window): Window {
  if (scale === '全期間') return full;
  if (scale === '週') return { start: focus - (new Date(focus * DAY).getUTCDay() + 6) % 7, span: 7 };
  const start = monthStart(focus);
  const months = scale === '月' ? 1 : scale === '年' ? 12 : 3;
  return { start, span: monthStart(start, months) - start };
}

export function fitWindow(start: number, span: number, full: Window): Window {
  const size = Math.min(full.span, Math.max(7, Math.round(span)));
  return { start: Math.min(full.start + full.span - size, Math.max(full.start, Math.round(start))), span: size };
}

export function pageWindow(view: Window, scale: Scale | null, direction: -1 | 1, full: Window) {
  const months = scale === '月' ? 1 : scale === '3か月' ? 3 : scale === '年' ? 12 : 0;
  if (months && view.start === monthStart(view.start)) {
    const next = monthStart(view.start, direction * months);
    return fitWindow(next, monthStart(next, months) - next, full);
  }
  return fitWindow(view.start + direction * view.span, view.span, full);
}

export function axisTicks(window: Window, width: number) {
  const { start, span } = window;
  const end = start + span;
  const ticks: { day: number; label: string }[] = [];
  const capacity = Math.max(2, Math.floor(width / 62));
  if (span <= 45) {
    const step = Math.max(1, Math.ceil(span / capacity));
    for (let d = start; d < end; d += step) ticks.push({ day: d, label: isoDay(d).slice(5).replace('-', '/') });
  } else {
    const step = Math.max(1, Math.ceil(span / (30.44 * capacity)));
    const months = step > 6 ? 12 * Math.ceil(step / 12) : step;
    const month = new Date(start * DAY).getUTCMonth();
    let d = monthStart(start, -(month % months));
    for (; d < end; d = monthStart(d, months)) {
      if (d >= start) ticks.push({ day: d, label: months >= 12 ? isoDay(d).slice(0, 4) : isoDay(d).slice(0, 7).replace('-', '/') });
    }
  }
  return ticks;
}
