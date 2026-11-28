import { proxyAI } from '../../../lib/server/ai-proxy.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = request => proxyAI(request,'predict');
