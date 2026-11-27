import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reply = (status, body) => NextResponse.json(body, {status, headers:{'Cache-Control':'private, no-store', Vary:'Cookie'}});
function backendOrigin() {
    // Never derive an upstream from a client header, URL parameter or cookie.
    const value = process.env.NUTRIVN_BACKEND_ORIGIN || process.env.LOCAL_API_PROXY || '';
    let url;
    try { url = new URL(value); } catch { return null; }
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    const local = url.origin === 'http://127.0.0.1:3001';
    const teamOwned = url.origin === 'https://nutrivn-myproject.vercel.app' || url.origin === 'https://nutrivn-main.vercel.app';
    if ((!local && !teamOwned) || (local && process.env.VERCEL)) return null;
    return url.origin;
}

export async function GET(req) {
    const token = req.cookies.get('nutrivn_session')?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return reply(401,{error:'Cần đăng nhập'});
    const origin = backendOrigin();
    if (!origin) return reply(503,{error:'Dịch vụ chưa được cấu hình'});
    try {
        const response = await fetch(origin+'/api/diary',{
            method:'GET', headers:{cookie:'nutrivn_session='+token},
            cache:'no-store', redirect:'error', signal:AbortSignal.timeout(8000)
        });
        if (response.status === 401 || response.status === 403) return reply(401,{error:'Cần đăng nhập'});
        if (!response.ok) return reply(503,{error:'Nhật ký tạm thời không khả dụng'});
        const data = await response.json();
        if (!Array.isArray(data.meals)) return reply(503,{error:'Dữ liệu không hợp lệ'});
        // Only the existing account-scoped diary response is returned. The report page
        // derives its aggregates from the same authenticated collection.
        return reply(200,{meals:data.meals});
    } catch { return reply(503,{error:'Nhật ký tạm thời không khả dụng'}); }
}
