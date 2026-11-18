# NutriVN: Neon PostgreSQL and verified social sign-in

## Current deployment status (2026-11-18)

- Neon project `nutrivn-myproject` (Postgres 17), database `nutrivn`, main branch.
- Production Vercel project `nutrivn-myproject` has encrypted server-only `DATABASE_URL`.
- SQL schema in `database/schema.sql` has been applied successfully:
  `social_users`, `social_sessions`, `user_diary_entries`.
- Server endpoints implemented: `/api/social-auth` (POST, GET, DELETE)
  and `/api/diary` (GET, POST, PATCH, DELETE).
- Frontend Google/Facebook callbacks now send provider credentials to the server
  and only accept a returned verified account. Social diary entries are read/written
  in Neon using the authenticated session, never a client-supplied email or user ID.
- **Not yet live-tested:** Google/Facebook OAuth client credentials are not yet
  configured. Authentication remains unavailable until they are configured.
  A successful Vercel build does not prove real OAuth sign-in works.

## Configure Google and Facebook (required)

Set these **Vercel Production environment variables**, then redeploy so Vite
can inject the public IDs during the build:

| Key | Location | Secret? |
| --- | --- | --- |
| `DATABASE_URL` | Server only | Already configured, do not expose |
| `GOOGLE_CLIENT_ID` | Server | Public OAuth client identifier |
| `VITE_GOOGLE_CLIENT_ID` | Vite build | Same public Google Client ID |
| `FACEBOOK_APP_ID` | Server | Public app identifier |
| `VITE_FACEBOOK_APP_ID` | Vite build | Same public Facebook App ID |
| `FACEBOOK_APP_SECRET` | Server only | Private: never prefix `VITE_` |

Configure `https://nutrivn-myproject.vercel.app` as an allowed origin
in the Google OAuth client and configure Facebook Login for that site/domain.
Facebook requires a valid app configuration and applicable permissions.

Google ID tokens are verified against Google public signing keys and the server
client ID. Facebook tokens are verified through the Graph debug_token endpoint
with server-only app credentials; the /me profile ID is checked against the
verified token user ID. The browser never decides the authenticated identity.

## Data isolation

- Each provider identity is keyed by provider + immutable subject (no automatic
  Google/Facebook account linking based on email).
- Sessions are secure HttpOnly cookies; only SHA-256 session token hashes are
  stored in the database. Passwords and social OAuth tokens are not saved.
- Diary operations use the user derived from the server-validated session;
  updates/deletes require matching `user_id`.
- Social users' diary entries are persisted in Neon and isolated per account.
- The onboarded profile and nutrition plan are still local per device; cloud
  profile synchronization is **not** implemented.
- The existing email/password form is **local-only demo behavior**, not a real
  password-authenticated server account. Do not represent it as secure email auth.
- Old browser-wide `nv_meals` data is left intact as a backup, but is not
  blindly migrated because its owner cannot be safely determined.

## Acceptance checks after OAuth setup

1. Login with Google creates one social_users row; login again reuses it.
2. Login with Facebook creates a separate provider identity.
3. Bad signature/wrong app ID/expired provider token never creates a user.
4. Alice cannot read, delete, or update Bob's diary entries.
5. Logout invalidates the session; direct diary endpoint calls return 401.
6. Save/select/edit/remove dishes and refresh the page: diary persists.
7. Existing Python /api/health and /api/predict still work and Food100
   predictions still offer Top-3 choices.

**Never paste Google/Facebook secrets or Neon database passwords into chat or source control.**
