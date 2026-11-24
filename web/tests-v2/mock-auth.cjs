// Playwright UI fixture only. Never call production auth or create Neon accounts.
const ACCOUNTS = new Set([
  'qa-v2@example.com', 'ai-qa@example.com', 'api-ui-qa@example.com',
  'diary-a@example.com', 'diary-b@example.com',
  'nutrition-qa@example.com', 'reports-qa@example.com'
]);
const installed = new WeakSet();
async function mockAuth(page) {
  if (installed.has(page)) return;
  installed.add(page);
  let session = null;
  const reply = (route, status, body) => route.fulfill({
    status, contentType: 'application/json', body: JSON.stringify(body)
  });
  // Catch-all first; the more specific handlers take precedence.
  await page.route('**/api/**', route => reply(route, 401, { error: 'QA isolated' }));
  await page.route('**/api/social-auth', route => {
    const method = route.request().method();
    if (method === 'GET') return session
      ? reply(route, 200, { user: session })
      : reply(route, 401, { error: 'Not signed in' });
    if (method === 'DELETE') {
      session = null;
      return reply(route, 200, { ok: true });
    }
    return reply(route, 405, { error: 'Method not allowed' });
  });
  await page.route('**/api/email-auth', route => {
    if (route.request().method() !== 'POST')
      return reply(route, 405, { error: 'Method not allowed' });
    const data = route.request().postDataJSON() || {};
    const email = String(data.email || '').trim().toLowerCase();
    if (data.action !== 'login' || !ACCOUNTS.has(email) || data.password !== 'Test123456')
      return reply(route, 401, { error: 'Sai email hoặc mật khẩu' });
    session = { id: email, email, provider: 'email', name: email, avatar: null };
    return reply(route, 200, { user: session });
  });
}
module.exports = { mockAuth };
