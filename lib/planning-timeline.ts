import { blankMilestone, blankProject, type Plan, type Project } from './domain';
import { shiftDay, eventDay } from './planning';

// Derived marks are never written back to project data or exported to viewers.
export function withTaskMarks(plan: Plan): Plan {
  const projects = plan.projects.map(p => ({ ...p, milestones: [...p.milestones] }));
  let unassigned: Project | undefined;
  for (const task of plan.planning.tasks.filter(t => !t.archived && t.state !== 'cancelled')) {
    let targets = projects.filter(p => task.projectIds.includes(p.id));
    if (!targets.length) { unassigned ??= { ...blankProject(), id: 'derived-unassigned', name: '未分類のタスク', shortName: '未分類', sample: false }; if (!projects.includes(unassigned)) projects.push(unassigned); targets = [unassigned]; }
    for (const p of targets) {
      const base = { ...blankMilestone(p.category), title: task.title, publicTitle: '', shared: false, done: task.state === 'done', important: true, confirmed: false };
      if (task.start && task.target && task.start <= task.target) p.milestones.push({ ...base, id: `task-period-${task.id}`, title: `${task.title}・準備`, kind: 'period', start: task.start, end: task.target, important: false });
      else if (task.start) p.milestones.push({ ...base, id: `task-start-${task.id}`, title: `${task.title}・着手`, kind: 'target', start: task.start, important: false });
      if (task.target) p.milestones.push({ ...base, id: `task-target-${task.id}`, kind: 'target', start: task.target });
      if (task.deadline.value) p.milestones.push({ ...base, id: `task-deadline-${task.id}`, title: `${task.title}・正式締切`, kind: 'deadline', start: task.deadline.value, precision: task.deadline.precision, confirmed: task.deadline.confirmed, sourceUrl: task.deadline.sourceUrl, checkedAt: task.deadline.checkedAt, time: task.deadline.time, timezone: task.deadline.timezone });
    }
  }
  if (plan.planning.events.some(e => !e.cancelled)) {
    const p: Project = { ...blankProject(), id: 'derived-calendar', name: 'カレンダーの予定', shortName: 'カレンダー', category: 'travel' };
    for (const e of plan.planning.events.filter(e => !e.cancelled)) { const start = eventDay(e.start), end = eventDay(e.end); p.milestones.push({ ...blankMilestone('travel'), id: `${e.calendarId}-${e.id}`, title: e.title, publicTitle: '', shared: false, kind: 'event', start, end: e.start.length === 10 && end > start ? shiftDay(end,-1) : end > start ? end : '', confirmed: true }); }
    projects.push(p);
  }
  return { ...plan, projects };
}
