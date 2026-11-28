import handler from '../../../lib/server/email-auth.mjs';
import { invokeHandler } from '../../../lib/server/route-adapter.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const POST = request => invokeHandler(request, handler);
