import { type Plan, type Project, type Milestone } from './domain';
import { emptyPlanning } from './planning';

// Fictional planning data only. None of these dates are official announcements.
const m = (id: string, title: string, category: Milestone['category'], kind: Milestone['kind'], start: string, end = '', extra: Partial<Milestone> = {}): Milestone => ({ id, title, publicTitle: title, category, kind, start, end, precision: start ? 'day' : 'unknown', time: '', timezone: 'Asia/Tokyo', confirmed: false, done: false, important: true, shared: true, calendarSync: false, sourceUrl: '', checkedAt: '', ...extra });
const p = (id: string, name: string, category: Project['category'], milestones: Milestone[], extra: Partial<Project> = {}): Project => ({ id, name, shortName: name, publicName: name, category, theme: '', notes: '', stage: '準備中', links: [], shareable: true, viewerEmails: [], archived: false, sample: true, milestones, ...extra });
export function samplePlan(): Plan { return { planning: emptyPlanning(), settings: { b4Start: '2026-04-01', phdStart: '2027-04-01' }, projects: [
  p('theme-a', 'テーマA：軌道と制御', 'research', [m('a-base','基礎研究','research','period','2026-04-01','2027-03-31'),m('a-main','テーマA','research','period','2027-04-01','2029-09-30'),m('a-check','実験条件の整理','research','target','2026-11-05', '', {important:false})], { shareable:false, theme:'軌道計画と制御の基礎検討', stage:'実施中' }),
  p('theme-b', 'テーマB', 'research', [m('b-main','テーマB','research','period','2029-10-01','2032-03-31')], {shareable:false}),
  p('paper-1', '論文1', 'paper', [m('p1-writing','論文1・執筆','paper','period','2026-12-01','2027-04-30'),m('p1-target','論文1・投稿目標','paper','target','2027-05-01'),m('p1-review','査読・改稿','paper','period','2027-05-02','2028-02-28')], {stage:'執筆中',theme:'テーマA',notes:'投稿先は未決定。日程は仮案。'}),
  p('paper-2','論文2','paper',[m('p2-writing','論文2・執筆','paper','period','2028-06-01','2029-02-28'),m('p2-target','論文2・投稿目標','paper','target','2029-03-01')]),
  p('conference-a','国際学会 A：宇宙システム・軌道制御に関する国際シンポジウム（仮称）','travel',[
    m('ca-prep','アブストラクト準備','travel','period','2026-10-25','2026-11-12',{important:false}),
    m('ca-target','アブストラクト完成目標','travel','target','2026-11-12','',{important:false}),
    m('ca-deadline','応募締切','travel','deadline','2026-11-20','',{time:'17:00'}),
    m('ca-fundprep','渡航助成・申請準備','funding','period','2026-11-01','2026-11-25',{important:false}),
    m('ca-fund','渡航助成・申請締切','funding','deadline','2026-11-30'),
    m('ca-slides','発表準備','travel','period','2026-12-01','2027-01-10',{important:false}),
    m('ca-event','国際学会 A','travel','event','2027-01-15','2027-01-17'),
  ],{shortName:'国際学会 A',publicName:'国際学会 A',theme:'テーマA',notes:'すべて仮の日程。公式発表を確認して更新する。'}),
  p('abroad','海外研究滞在','travel',[m('abroad-prep','受入先との調整','travel','period','2028-01-01','2028-09-30',{important:false}),m('abroad-stay','海外研究滞在','travel','period','2028-10-01','2029-06-30')]),
  p('fund','研究費申請','funding',[m('fund-prep','申請書作成','funding','period','2027-01-05','2027-03-10',{important:false}),m('fund-apply','研究費申請','funding','deadline','2027-03','',{precision:'month'}),m('fund-renew','次期申請','funding','target','2029-04-01')]),
  p('degree','学位・進路','degree',[m('grad','学部卒業','degree','event','2027-03','',{precision:'month'}),m('enroll','博士課程入学','degree','event','2027-04-01'),m('thesis','博士論文執筆','degree','period','2031-04-01','2032-02-29'),m('defense','学位審査','degree','target','2032-03','',{precision:'month'}),m('career','進路検討','degree','period','2031-04-01','2033-03-31')]),
  p('next-paper','次の論文テーマ','paper',[m('next-idea','テーマ・投稿先の検討','paper','target','')],{stage:'着想'}),
] }; }
