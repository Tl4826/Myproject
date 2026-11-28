import handler from '../../../lib/server/diary.mjs';
import { invokeHandler } from '../../../lib/server/route-adapter.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const GET = request => invokeHandler(request,handler);
