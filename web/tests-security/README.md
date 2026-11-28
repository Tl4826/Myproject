# Authentication security tests

Run frontend-only E2E tests from `web/`:

```bash
npx playwright test --config=playwright.security.config.cjs
```

These tests intentionally **mock the backend** to avoid writing to the real Neon
database. They verify that the UI handles rejection, duplicate registration and
storage tampering correctly; they **do not** demonstrate that production server
authentication, cookies or database constraints work. Do not report them as an
end-to-end proof of security.

The original 6-passed/6-failed Playwright report in SECURITY_TEST_REPORT.md
is historical (from before the backend-auth change). Do not overwrite that
report or claim a new pass rate until rerunning tests and collecting actual
evidence.

Server verification requires:
1. Apply the additive database/schema.sql migration to the configured Neon DB.
2. Deploy /api/email-auth on Vercel.
3. Using a **dedicated test database**, verify email registration, login,
   duplicate-email rejection, invalid credentials and logout over HTTP.
4. Confirm forged `nv_user` cannot unlock private routes, and verify that
   /api/diary rejects requests without a verified HttpOnly cookie.

Locally test the password KDF independent of Neon:

```bash
node --test database/password-kdf.test.mjs
```
