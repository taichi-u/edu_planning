import { readPlanning, mutatePlanning, errorResponse } from '@/lib/store';
export const dynamic = 'force-dynamic';
export async function GET() { try { return Response.json(await readPlanning(), { headers: { 'Cache-Control': 'no-store' } }); } catch (e) { return errorResponse(e); } }
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') && new URL(request.headers.get('origin')!).host !== new URL(request.url).host) return Response.json({ error: '同一サイトから操作してください' }, { status: 403 });
    const raw = await request.text(); if (raw.length > 3000000) return Response.json({ error: '入力が大きすぎます' }, { status: 413 });
    return Response.json(await mutatePlanning(JSON.parse(raw)), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
