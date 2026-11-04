import test from 'node:test';
import assert from 'node:assert/strict';
import { axisTicks, dayNumber, fitWindow, isoDay, pageWindow, preset } from './src/time-window.ts';

const full = { start: dayNumber('2026-04-01'), span: dayNumber('2032-04-01') - dayNumber('2026-04-01') };

test('calendar presets include leap days, use Monday and page across year boundaries', () => {
  const feb = preset('月', dayNumber('2028-02-29'), full);
  assert.deepEqual(feb, { start: dayNumber('2028-02-01'), span: 29 });
  assert.deepEqual(pageWindow(feb, '月', 1, full), { start: dayNumber('2028-03-01'), span: 31 });
  assert.deepEqual(pageWindow(pageWindow(feb, '月', 1, full), '月', -1, full), feb);
  assert.equal(isoDay(preset('週', dayNumber('2027-01-03'), full).start), '2026-12-28');
  assert.equal(preset('3か月', dayNumber('2026-11-04'), full).span, 92);
});

test('bounds constrain dragging and zoom; all tick dates stay within the visible window', () => {
  assert.deepEqual(fitWindow(full.start - 59, 2, full), {start: full.start, span: 7});
  assert.deepEqual(fitWindow(full.start + full.span, full.span * 2, full), full);
  const last = fitWindow(full.start + full.span, 30, full);
  assert.equal(last.start + last.span, full.start + full.span);
  for (const scale of ['週', '月', '3か月', '年', '全期間']) {
    const view = preset(scale, dayNumber('2026-12-18'), full);
    for (const width of [213, 920]) {
      const ticks = axisTicks(view, width);
      assert.ok(ticks.length > 0);
      assert.ok(ticks.every(t => t.day >= view.start && t.day < view.start + view.span));
    }
  }
});
