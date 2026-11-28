import { NextResponse } from 'next/server';

const allowedOrigin = 'https://nutrivn-main.vercel.app';
const json = (status,error) => NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});

// Forward only AI input and content type, never the user's session cookie.
export async function proxyAI(request, path) {
    const origin = (process.env.AI_SERVICE_URL || '').replace(/\/+$/, '');
    if (origin !== allowedOrigin) return json(503,'Dịch vụ AI chưa được cấu hình');
    const options = {method:request.method,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(55000)};
    if (request.method === 'POST') {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.startsWith('multipart/form-data;')) return json(415,'Yêu cầu ảnh multipart/form-data');
        const declared = Number(request.headers.get('content-length') || 0);
        if (declared > 4*1024*1024) return json(413,'Ảnh quá lớn');
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength > 4*1024*1024) return json(413,'Ảnh quá lớn');
        options.headers = {'Content-Type':contentType};
        options.body = bytes;
    }
    try {
        const response = await fetch(origin + '/api/' + path,options);
        return new Response(response.body,{status:response.status,headers:{
            'Content-Type':response.headers.get('content-type') || 'application/json',
            'Cache-Control':'no-store'
        }});
    } catch { return json(503,'Dịch vụ AI tạm thời không khả dụng'); }
}
