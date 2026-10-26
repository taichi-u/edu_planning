// Pure view data for the comparison. Never reads the production database.
export function sampleForScenario(base, scenario) {
  const data = structuredClone(base);
  if (scenario === 'empty') {
    data.tasks = []; data.events = []; data.periods = []; data.milestones = [];
  }
  if (scenario === 'crowded') {
    for (const task of data.tasks.filter(t => t.start)) {
      task.date = '2027-06-11'; task.kind = 'deadline';
      task.ja += '：国際学会・研究成果報告・提出資料の最終確認';
      task.en += ': final check for conference and research submissions';
    }
  }
  return data;
}

export function summary(data) {
  const tasks = data.tasks.filter(t => t.start);
  return {
    tasks: tasks.length,
    unestimated: tasks.filter(t => t.estimate === null).length,
    due: tasks.filter(t => t.date >= data.anchor && t.date <= data.weekEnd).length,
    preparation: tasks.filter(t => t.date > data.weekEnd).length,
    undated: data.tasks.filter(t => !t.date),
  };
}

export function timePosition(date, start, end, width) {
  const utc = s => Date.parse(s + 'T00:00:00Z');
  return (utc(date) - utc(start)) / (utc(end) - utc(start)) * width;
}

export function workRecord(form, taskId) {
  const value = form.get('minutes');
  return {taskId, summary: form.get('summary'), feedback: form.get('feedback'),
    actualMinutes: value === '' ? null : Number(value)};
}
