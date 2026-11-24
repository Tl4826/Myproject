// Staged implementation: not routed from /api/ until database + OAuth secrets exist.
// Move this into a Vercel Node function only after applying schema.sql and configuring
// DATABASE_URL, GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET.
import { createHash, createHmac, createPublicKey, randomBytes, verify } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const MAX_TOKEN_LENGTH = 8192;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const SESSION_COOKIE = 'nutrivn_session';
const json = (res, code, body) => res.status(code).setHeader('Cache-Control', 'no-store').json(body);
const sha256 = data => createHash('sha256').update(data).digest('hex');
const isReady = () => Boolean(process.env.DATABASE_URL);

function getCookie(req, name) {
    return (req.headers.cookie || '').split(';').map(x => x.trim())
        .find(x => x.startsWith(name + '='))?.slice(name.length + 1) || '';
}

function decodeBase64Json(chunk) {
    return JSON.parse(Buffer.from(chunk, 'base64url').toString('utf8'));
}

async function verifyGoogle(token) {
    const [headerPart, payloadPart, signaturePart] = token.split('.');
    if (!headerPart || !payloadPart || !signaturePart) throw Error('Invalid Google token');
    const header = decodeBase64Json(headerPart);
    const payload = decodeBase64Json(payloadPart);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw Error('Unsupported Google signature');
    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
        !Number.isFinite(payload.exp) || payload.exp <= now ||
        !Number.isFinite(payload.iat) || payload.iat > now + 60 ||
        !payload.sub || typeof payload.sub !== 'string') throw Error('Invalid Google claims');
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw Error('Google key verification unavailable');
    const jwks = await response.json();
    const key = jwks.keys?.find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!key) throw Error('Google key not found');
    const publicKey = createPublicKey({ key, format: 'jwk' });
    if (!verify('RSA-SHA256', Buffer.from(headerPart + '.' + payloadPart), publicKey,
        Buffer.from(signaturePart, 'base64url'))) throw Error('Invalid Google signature');
    return {
        provider: 'google', id: payload.sub,
        email: payload.email_verified === true || payload.email_verified === 'true'
            ? (payload.email || null) : null,
        name: String(payload.name || '').slice(0, 150),
        avatar: typeof payload.picture === 'string' ? payload.picture.slice(0, 1000) : null
    };
}

async function getGraphJson(path, params) {
    const url = new URL('https://graph.facebook.com/v23.0/' + path);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw Error('Facebook verification failed');
    const data = await response.json();
    if (data.error) throw Error('Facebook verification failed');
    return data;
}

async function verifyFacebook(token) {
    const appId = process.env.FACEBOOK_APP_ID, appSecret = process.env.FACEBOOK_APP_SECRET;
    const checked = await getGraphJson('debug_token', {
        input_token: token, access_token: appId + '|' + appSecret
    });
    const data = checked.data;
    const now = Math.floor(Date.now() / 1000);
    if (!data?.is_valid || String(data.app_id) !== appId || !data.user_id ||
        (data.expires_at && Number(data.expires_at) <= now)) throw Error('Invalid Facebook token');
    const proof = createHmac('sha256', appSecret).update(token).digest('hex');
    const person = await getGraphJson('me', {
        fields: 'id,name,email', access_token: token, appsecret_proof: proof
    });
    if (String(person.id) !== String(data.user_id)) throw Error('Facebook account mismatch');
    return {
        provider: 'facebook', id: String(person.id),
        email: typeof person.email === 'string' ? person.email.slice(0, 254) : null,
        name: String(person.name || '').slice(0, 150), avatar: null
    };
}

export async function getAuthenticatedUser(req, sql) {
    const raw = getCookie(req, SESSION_COOKIE);
    if (!/^[0-9a-f]{64}$/.test(raw)) return null;
    const rows = await sql`
        SELECT u.id, u.provider, u.email, u.display_name, u.avatar_url
        FROM social_sessions s JOIN social_users u ON u.id = s.user_id
        WHERE s.token_hash = ${sha256(raw)} AND s.expires_at > now() LIMIT 1
    `;
    return rows[0] || null;
}
export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!isReady()) return json(res, 503, { error: 'Chưa cấu hình database và OAuth trên Vercel' });
    if (!['POST', 'GET', 'DELETE'].includes(req.method)) {
        res.setHeader('Allow', 'POST, GET, DELETE');
        return json(res, 405, { error: 'Method not allowed' });
    }
    const origin = req.headers.origin;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const isLocal = host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
    if (origin && (!host || new URL(origin).host !== host || (!origin.startsWith('https://') && !isLocal))) {
        return json(res, 403, { error: 'Origin not allowed' });
    }
    const sql = neon(process.env.DATABASE_URL);
    try {
        if (req.method === 'POST') {
            const provider = req.body?.provider, credential = req.body?.credential;
            if ((provider === 'google' && !process.env.GOOGLE_CLIENT_ID) ||
                (provider === 'facebook' && (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET)))
                return json(res, 503, { error: 'Chưa cấu hình nhà cung cấp đăng nhập trên Vercel' });
            if (!['google', 'facebook'].includes(provider) || typeof credential !== 'string' ||
                !credential || credential.length > MAX_TOKEN_LENGTH) {
                return json(res, 400, { error: 'Thông tin đăng nhập không hợp lệ' });
            }
            const account = provider === 'google'
                ? await verifyGoogle(credential)
                : await verifyFacebook(credential);
            const [user] = await sql`
                INSERT INTO social_users (provider, provider_user_id, email, display_name, avatar_url)
                VALUES (${account.provider}, ${account.id}, ${account.email}, ${account.name}, ${account.avatar})
                ON CONFLICT (provider, provider_user_id)
                DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name,
                    avatar_url = EXCLUDED.avatar_url, last_login_at = now()
                RETURNING id, provider, email, display_name, avatar_url
            `;
            const raw = randomBytes(32).toString('hex');
            await sql`
                INSERT INTO social_sessions (token_hash, user_id, expires_at)
                VALUES (${sha256(raw)}, ${user.id}, now() + INTERVAL '7 days')
            `;
            const secure = isLocal ? '' : '; Secure';
            res.setHeader('Set-Cookie',
                `${SESSION_COOKIE}=${raw}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${SESSION_SECONDS}`);
            return json(res, 200, { user: { id: user.id, provider: user.provider,
                email: user.email, name: user.display_name, avatar: user.avatar_url } });
        }
        const raw = getCookie(req, SESSION_COOKIE);
        if (!/^[0-9a-f]{64}$/.test(raw)) return json(res, 401, { error: 'Not signed in' });
        if (req.method === 'DELETE') {
            await sql`DELETE FROM social_sessions WHERE token_hash = ${sha256(raw)}`;
            const secure = isLocal ? '' : '; Secure';
            res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`);
            return json(res, 200, { ok: true });
        }
        const rows = await sql`
            SELECT u.id, u.provider, u.email, u.display_name, u.avatar_url
            FROM social_sessions s JOIN social_users u ON u.id = s.user_id
            WHERE s.token_hash = ${sha256(raw)} AND s.expires_at > now() LIMIT 1
        `;
        if (!rows.length) return json(res, 401, { error: 'Session expired' });
        const u = rows[0];
        return json(res, 200, { user: { id: u.id, provider: u.provider, email: u.email,
            name: u.display_name, avatar: u.avatar_url } });
    } catch (err) {
        // Never log credentials, access tokens, emails, app secret or DATABASE_URL.
        const isAuthFailure = /Google|Facebook|token|claims|signature|mismatch|key/i.test(err.message || '');
        return json(res, isAuthFailure ? 401 : 503,
            { error: isAuthFailure ? 'Không xác minh được tài khoản' : 'Dịch vụ đăng nhập chưa sẵn sàng' });
    }
}
