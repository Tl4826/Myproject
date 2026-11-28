import { NextResponse } from 'next/server';

// Adapt the existing Node handlers without changing their authentication or SQL contracts.
export async function invokeHandler(request, handler) {
  const headers = Object.fromEntries(request.headers.entries());
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  let body;
  if (['POST','PATCH'].includes(request.method)) {
    try { body = await request.json(); }
    catch { return NextResponse.json({error:'Invalid JSON'}, {status:400,headers:{'Cache-Control':'no-store'}}); }
  }
  let status = 200, payload = null;
  const outputHeaders = new Headers({'Cache-Control':'private, no-store',Vary:'Cookie'});
  const res = {
    status(code) { status = code; return this; },
    setHeader(name,value) { outputHeaders.set(name, String(value)); return this; },
    json(value) { payload = value; return this; }
  };
  await handler({method:request.method,headers,query,body},res);
  outputHeaders.set('Cache-Control','private, no-store');
  return NextResponse.json(payload,{status,headers:outputHeaders});
}
