// Minimal Sentry envelope transport: only fixed, non-personal event codes and bounded context.
const codes = new Set(['browser_runtime','browser_promise','email_auth_unavailable','social_auth_unavailable','diary_unavailable','diagnostic_test']);
const messages = Object.freeze({
  browser_runtime:'Unexpected public-page runtime error',
  browser_promise:'Unhandled public-page asynchronous error',
  email_auth_unavailable:'Email authentication service unavailable',
  social_auth_unavailable:'Social authentication service unavailable',
  diary_unavailable:'Diary service unavailable',
  diagnostic_test:'Synthetic diagnostic event'
});
const publicRoutes = new Set(['/','/about','/contact']);
const serviceRoutes = {email_auth_unavailable:'/api/email-auth',social_auth_unavailable:'/api/social-auth',diary_unavailable:'/api/diary'};
export function diagnosticTags(code, context = {}) {
  const route = serviceRoutes[code] || (code.startsWith('browser_') && publicRoutes.has(context?.route) ? context.route : null);
  const ms = context?.durationMs;
  const duration = Number.isFinite(ms) && ms >= 0 ? (ms < 100 ? 'under_100ms' : ms < 500 ? '100_499ms' : ms < 2000 ? '500_1999ms' : '2000ms_or_more') : null;
  return { ...(route ? {route} : {}), ...(serviceRoutes[code] && duration ? {duration_bucket:duration} : {}) };
}
export function makeEnvelope(dsn, code, id, now, environment, context) {
  if (!codes.has(code) || !/^[a-f0-9]{32}$/.test(id)) return null;
  let url;
  try { url = new URL(dsn); } catch { return null; }
  const project = url.pathname.replace(/^\//, '');
  if (url.protocol !== 'https:' || !/^(?:[a-z0-9-]+\.)*ingest(?:\.[a-z0-9-]+)*\.sentry\.io$/i.test(url.hostname) ||
      !/^\d+$/.test(project) || !/^[a-f0-9]{32}$/i.test(url.username) || url.password || url.search || url.hash || url.port) return null;
  const event = { event_id:id, timestamp:now, platform:'javascript', level:'error',
    logger:'nutrivn', message:code, fingerprint:['nutrivn',code],
    tags:diagnosticTags(code,context), extra:{description:messages[code]},
    environment:environment === 'production' ? 'production' : 'preview' };
  const payload = JSON.stringify(event);
  return { endpoint:url.origin+'/api/'+project+'/envelope/',
    body:[JSON.stringify({event_id:id,dsn,sent_at:now}),JSON.stringify({type:'event',length:new TextEncoder().encode(payload).length}),payload].join('\n')+'\n' };
}
export async function sendCode(dsn, code, environment, context) {
  if (!dsn) return false;
  try {
    const id = globalThis.crypto.randomUUID().replaceAll('-','');
    const packet = makeEnvelope(dsn,code,id,new Date().toISOString(),environment,context);
    if (!packet) return false;
    const response = await fetch(packet.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:packet.body,credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(1500)});
    return response.ok;
  } catch { return false; }
}
