import handler from '../../../lib/server/social-auth-handler.mjs';
import { invokeHandler } from '../../../lib/server/route-adapter.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const GET = request => invokeHandler(request, handler);
export const POST = request => invokeHandler(request, handler);
export const DELETE = request => invokeHandler(request, handler);
