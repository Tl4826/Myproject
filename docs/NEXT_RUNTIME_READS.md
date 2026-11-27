# Next.js server-side read experiment (Task 3c)

The assessed version is static-export Next.js plus separate Vercel Node/FastAPI functions. This branch adds an opt-in Next.js Route Handler at /api/next-diary. When NUTRIVN_RUNTIME_READS=1 at build time, the shared AppContext loads account diary data through this handler, used by /diary and /baocao. The handler retrieves data server-to-server from the existing authenticated PostgreSQL API, forwards only the session cookie to an allowlisted team host, denies missing/malformed cookies, rejects redirects and disables caching. It does not implement a direct SQL query in Next.js.

Default Vercel static output and existing production paths are preserved. Do not enable runtime mode in the existing root static-export Vercel configuration. A separate Next.js runtime deployment of web/ with trusted backend and same-origin authentication/write/AI routing would need independent configuration and verification. No deployment or actual Neon test is claimed by this draft.

## Local verification
Run npm ci in web. Set NUTRIVN_RUNTIME_READS=1 and LOCAL_API_PROXY=http://127.0.0.1:3001 for build/start; run the existing mock API on port 3001. CI checks both static and runtime builds, anonymous/invalid session rejection, no-store and two synthetic accounts at the handler. UI and production auth/write/AI regression are separate acceptance criteria. If the instructor requires direct PostgreSQL reads from a Next.js server module, this is only a partial step and requires a further implementation.
