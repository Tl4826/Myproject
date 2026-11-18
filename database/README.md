# Social login database — NutriVN (STAGED)

**Current state:** Database schema and server handler prepared; not activated. The existing production website, GitHub branch main, Huy's frontend, and Python AI API are not modified by this staging directory.

## Steps to activate
1. In Vercel → Storage → Marketplace, connect **Neon Postgres** to project `nutrivn-myproject`, with `DATABASE_URL` in Production and Preview. Use a separate Preview database branch if possible.
2. Execute `database/schema.sql` in Neon's SQL Editor. Confirm tables `social_users`, `social_sessions`, `user_diary_entries` exist.
3. Set server-only Vercel environment variables `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, and `FACEBOOK_APP_SECRET`. Configure Google OAuth allowed origin and Facebook Login app domain to match the Production URL. Never prefix secrets with `VITE_`, commit keys, or paste them in chat.
4. Install `@neondatabase/serverless@1.2.1` in the Vercel backend Node package and move `database/social-auth-handler.mjs` to a deployed Node function. **Important:** `vercel.json` currently rewrites `/api/*` to Python `/api/index.py`; add an explicit social-auth rewrite before that catch-all (or separate the auth hostname).
5. Change Google/Facebook UI callbacks to send the real Google ID token / Facebook access token to the auth endpoint; call the app login handler **only after** a successful server response. Remove the current unverified JWT decode and the client-only Facebook profile-based login. Check the existing cookie session on reload and clear it on logout.
6. Add authenticated endpoints to sync diary entries by server-side session user ID, rather than trusting client-supplied email or ID. Existing browser-wide `nv_meals` storage is **not** account isolated; do not claim that the database already solves this until the diary sync migration is complete.
7. Run integration tests for wrong audience, invalid signatures, wrong Facebook app, duplicate login, two different providers with same email, session expiry, cross-account diary isolation, and logout. Then activate and test Production.

## Security choices
- Identity key: provider + immutable provider subject; **never use email alone**.
- No Facebook/Google password or OAuth access token stored in the database.
- Short-lived opaque session cookie (HttpOnly, Secure, SameSite=Lax); only SHA-256 token hash is kept server-side.
- No automatic account linking between Google and Facebook sharing an email.
- Personal diary records must only be read/written using identity derived from the authenticated server session.
- The staged handler does not automatically create tables and fails closed if database/OAuth configuration is missing.
