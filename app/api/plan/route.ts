import { readPlan, mutate, errorResponse, AppError } from '@/lib/store';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { return Response.json(await readPlan(new URL(request.url).searchParams.get('view') === 'meeting'), { headers: { 'Cache-Control': 'private, no-store' } }); } catch (e) { return errorResponse(e); } }
export async function POST(request: Request) { try {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new AppError('この送信元からは更新できません', 403);
  const body = await request.text(); if (body.length > 1500000) throw new AppError('データが大きすぎます', 413);
  return Response.json(await mutate(JSON.parse(body)), { headers: { 'Cache-Control': 'no-store' } });
} catch (e) { return errorResponse(e); } }
