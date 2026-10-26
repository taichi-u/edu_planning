import { canWriteTask, inHorizon, taskDate, type Horizon, type Planning, type Task } from './planning';

export type WorkFilter = 'active' | 'done' | 'all';
export function organizeTasks(planning: Planning, options: { scope: string; search: string; anchor: string; horizon: Horizon; filter: WorkFilter }) {
  const needle = options.search.toLowerCase();
  const scoped = planning.tasks.filter(t => !t.archived && (!options.scope || t.projectIds.includes(options.scope)) && (!needle || `${t.title} ${t.purpose} ${t.repository}`.toLowerCase().includes(needle)));
  const personal = scoped.filter(t => canWriteTask(t, planning.config));
  const references = scoped.filter(t => !canWriteTask(t, planning.config));
  const candidates = personal.filter(t => options.filter === 'done' ? ['done', 'cancelled'].includes(t.state) : options.filter === 'all' || inHorizon(t, options.anchor, options.horizon));
  const unplanned = (t: Task) => !taskDate(t) && t.horizon === 'later' && t.state === 'todo';
  const byDate = (a: Task, b: Task) => (taskDate(a) || '9999').localeCompare(taskDate(b) || '9999') || a.title.localeCompare(b.title, 'ja');
  return { personal, references, tasks: candidates.filter(t => !unplanned(t)).sort(byDate), undated: candidates.filter(unplanned).sort(byDate) };
}

export function referenceKind(task: Task) { return /\/pull\//.test(task.url) || task.title.startsWith('PR: ') ? 'PR' : 'Issue'; }
export function referenceTitle(task: Task) { return task.title.replace(/^PR: /, ''); }

const colors = ['#0072B2', '#D55E00', '#009E73', '#6153B8', '#AB3C7A', '#9B7400'];
export function projectColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length];
}
