import { readHistory, errorResponse } from '@/lib/store';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { return Response.json(await readHistory(new URL(request.url).searchParams.get('project') || undefined), { headers: { 'Cache-Control': 'no-store' } }); } catch (e) { return errorResponse(e); } }
