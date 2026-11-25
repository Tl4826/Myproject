import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Local development mock API for testing auth & diary without Neon DB.
// Never used in production or Vercel builds.
const PORT = Number(process.env.MOCK_API_PORT || 3001);
const HOST = '127.0.0.1';
const COOKIE = 'nutrivn_session';

const accounts = new Map(); // email -> { id, email, name, salt, hash }
const sessions = new Map(); // token -> { user, expiresAt }
const diaries = new Map();  // userId -> Meal[]

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getCookie(req, name) {
  return (req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(name + '='))
    ?.slice(name.length + 1) || '';
}

function getSessionUser(req) {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  const entry = sessions.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, user: entry.user };
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(scryptSync(password, salt, 32).toString('hex'), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function issueSessionCookie(req, user, remember) {
  const oldToken = getCookie(req, COOKIE);
  if (oldToken) sessions.delete(oldToken);
  const token = randomBytes(32).toString('hex');
  const lifetime = remember ? 7 * 86400 : 86400;
  sessions.set(token, { user, expiresAt: Date.now() + lifetime * 1000 });
  const duration = remember ? `; Max-Age=${lifetime}` : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${duration}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, mode: 'local-dev-mock' });
    }

    if (pathname === '/api/email-auth') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      }
      const body = await readJsonBody(req);
      const action = body.action;
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = body.password;
      const name = typeof body.name === 'string' ? body.name.trim() : '';

      if (
        !['register', 'login'].includes(action) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        typeof password !== 'string' ||
        password.length < 6 ||
        password.length > 128 ||
        (action === 'register' && (!name || name.length > 150))
      ) {
        return sendJson(res, 400, { error: 'Thông tin đăng nhập không hợp lệ' });
      }

      if (action === 'register') {
        if (accounts.has(email)) {
          return sendJson(res, 409, { error: 'Email này đã được đăng ký' });
        }
        const { salt, hash } = hashPassword(password);
        const account = {
          id: `local-${randomBytes(8).toString('hex')}`,
          email,
          name,
          salt,
          hash,
        };
        accounts.set(email, account);
        const user = { id: account.id, provider: 'email', email: account.email, name: account.name, avatar: null };
        const cookie = issueSessionCookie(req, user, body.remember !== false);
        return sendJson(res, 201, { user }, { 'Set-Cookie': cookie });
      }

      const account = accounts.get(email);
      if (!account || !verifyPassword(password, account.salt, account.hash)) {
        return sendJson(res, 401, { error: 'Sai email hoặc mật khẩu' });
      }
      const user = { id: account.id, provider: 'email', email: account.email, name: account.name, avatar: null };
      const cookie = issueSessionCookie(req, user, body.remember !== false);
      return sendJson(res, 200, { user }, { 'Set-Cookie': cookie });
    }

    if (pathname === '/api/social-auth') {
      if (req.method === 'GET') {
        const active = getSessionUser(req);
        if (!active) return sendJson(res, 401, { error: 'Not signed in' });
        return sendJson(res, 200, { user: active.user });
      }
      if (req.method === 'DELETE') {
        const token = getCookie(req, COOKIE);
        if (token) sessions.delete(token);
        return sendJson(
          res,
          200,
          { ok: true },
          { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }
        );
      }
      if (req.method === 'POST') {
        return sendJson(res, 503, { error: 'Google/Facebook login cần cấu hình OAuth trên Vercel' });
      }
      return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'POST, GET, DELETE' });
    }

    if (pathname === '/api/diary') {
      const active = getSessionUser(req);
      if (!active) return sendJson(res, 401, { error: 'Chưa đăng nhập' });
      const userId = active.user.id;
      const list = diaries.get(userId) || [];

      if (req.method === 'GET') {
        return sendJson(res, 200, { meals: list });
      }
      if (req.method === 'POST') {
        const meal = await readJsonBody(req);
        const saved = { ...meal, id: String(meal.id || Date.now()) };
        diaries.set(userId, [...list, saved]);
        return sendJson(res, 201, { meal: saved });
      }
      if (req.method === 'PATCH') {
        const { id, category } = await readJsonBody(req);
        const updated = list.map(m => (String(m.id) === String(id) ? { ...m, category } : m));
        diaries.set(userId, updated);
        return sendJson(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        diaries.set(userId, list.filter(m => String(m.id) !== String(id)));
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    return sendJson(res, 400, { error: err.message || 'Bad request' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[NutriVN Mock API] Đang chạy tại http://${HOST}:${PORT} (chỉ dùng cho dev local)`);
});
