import { createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { hashPassword, verifyPassword } from '../database/password-kdf.mjs';

// Credentials and sessions are authenticated by Neon, never by browser storage.
const COOKIE = 'nutrivn_session';
const response = (res, code, body) =>
  res.status(code).setHeader('Cache-Control', 'no-store').json(body);

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(origin);
    return Boolean(host && url.host === host &&
      (url.protocol === 'https:' || (url.protocol === 'http:' &&
        /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))));
  } catch {
    return false;
  }
}
function cookieValue(req) {
  return (req.headers.cookie || '').split(';')
    .map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))
    ?.slice(COOKIE.length + 1) || '';
}
function safeUser(row) {
  return { id: row.id, provider: 'email', email: row.email,
    name: row.display_name || '', avatar: null };
}
async function setSession(sql, req, res, user, remember) {
  const oldToken = cookieValue(req);
  if (/^[0-9a-f]{64}$/.test(oldToken)) {
    const oldHash = createHash('sha256').update(oldToken).digest('hex');
    await sql`DELETE FROM social_sessions WHERE token_hash = ${oldHash}`;
  }
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  const lifetime = remember ? 7 * 86400 : 86400;
  await sql`INSERT INTO social_sessions (token_hash, user_id, expires_at)
    VALUES (${hash}, ${user.id}, now() + (${lifetime} * INTERVAL '1 second'))`;
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const secure = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? '' : '; Secure';
  const duration = remember ? '; Max-Age=' + lifetime : '';
  res.setHeader('Set-Cookie', COOKIE + '=' + token +
    '; Path=/; HttpOnly; SameSite=Lax' + secure + duration);
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return response(res, 405, { error: 'Method not allowed' });
  }
  if (!allowedOrigin(req)) return response(res, 403, { error: 'Origin not allowed' });
  if (!process.env.DATABASE_URL)
    return response(res, 503, { error: 'Chưa cấu hình database' });

  const body = req.body || {};
  const action = body.action;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = body.password;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!['register', 'login'].includes(action) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof password !== 'string' || password.length < 6 || password.length > 128 ||
      (action === 'register' && (!name || name.length > 150))) {
    return response(res, 400, { error: 'Thông tin đăng nhập không hợp lệ' });
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    let user;
    if (action === 'register') {
      const digest = await hashPassword(password);
      // Unique normalized email in the database also handles concurrent registration.
      const inserted = await sql`
        WITH account AS (
          INSERT INTO social_users (provider, provider_user_id, email, display_name)
          VALUES ('email', ${email}, ${email}, ${name})
          ON CONFLICT (provider, provider_user_id) DO NOTHING
          RETURNING id
        )
        INSERT INTO email_credentials (user_id, normalized_email, password_hash)
        SELECT id, ${email}, ${digest} FROM account
        ON CONFLICT (normalized_email) DO NOTHING RETURNING user_id
      `;
      if (!inserted.length)
        return response(res, 409, { error: 'Email này đã được đăng ký' });
      user = { id: inserted[0].user_id, email, display_name: name };
    } else {
      const rows = await sql`
        SELECT u.id, u.email, u.display_name, c.password_hash
        FROM email_credentials c JOIN social_users u ON u.id = c.user_id
        WHERE c.normalized_email = ${email} AND u.provider = 'email' LIMIT 1
      `;
      if (!rows.length || !(await verifyPassword(password, rows[0].password_hash)))
        return response(res, 401, { error: 'Sai email hoặc mật khẩu' });
      user = rows[0];
    }
    await setSession(sql, req, res, user, body.remember !== false);
    return response(res, action === 'register' ? 201 : 200, { user: safeUser(user) });
  } catch (error) {
    if (error.code === '23505')
      return response(res, 409, { error: 'Email này đã được đăng ký' });
    // No credentials, token, SQL or database connection secrets in error responses.
    return response(res, 503, { error: 'Dịch vụ đăng nhập chưa sẵn sàng' });
  }
}
