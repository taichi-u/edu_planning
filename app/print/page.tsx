import { readPlan } from '@/lib/store';
import { categories, validDay, addYears } from '@/lib/domain';
import PrintView from '@/components/print-view';
export const dynamic='force-dynamic';
export default async function PrintPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const data=await readPlan(true);const q=await searchParams;
  if(q.project) data.plan.projects=data.plan.projects.filter(p=>p.id===q.project);
  const start=q.start&&validDay(q.start)?q.start:data.plan.settings.b4Start;
  const end=q.end&&validDay(q.end)&&q.end>=start?q.end:addYears(data.plan.settings.phdStart,6);
  const filters=categories.map(c=>c.id).filter(c=>!q.categories||q.categories.split(',').includes(c));
  return <PrintView data={data} start={start} end={end} filters={filters}/>;
}
