# Next.js server migration — deployment checklist

## Before merging
- This branch changes the root deployment to Python AI only. Do not merge while the production project still builds from the repository root.
- In an isolated Preview, configure the web project with root `web`, Next.js preset and automatic build/output settings. Configure `AI_SERVICE_URL=https://nutrivn-main.vercel.app` only after confirming this is the intended AI project. Configure a separate Neon test database in Preview; never copy production credentials into logs or messages.
- AI project: root repository, Other preset (no framework). Deploy this branch, confirm /api/health returns 200 with class_count 100 and test /api/predict with a known example.
- Confirm AI origin is not protected from the web proxy. No login/session cookie is passed to the AI service.
- Run GitHub Actions: email/diary sync, Task 4 Lighthouse, and all relevant tests. Verify production-like Preview with two independent accounts: auth, read/edit/delete diary, report, logout, cross-account denial and unauthenticated redirect. Confirm no private session/diary data is cached.
- Local/CI without DATABASE_URL: use `LOCAL_API_PROXY=http://127.0.0.1:3001` at build time with mock API running. Never enable this proxy on Vercel.
- Server Actions handle category and delete operations, and use the same account-scoped SQL as the diary API.
- Old root Node handlers stay in Git for rollback and tests but are excluded from the AI deployment.

## Cutover
- Keep the last working production deployment available for rollback. Record current root/framework/build settings before changing them.
- Verify the AI deployment on its stable domain first.
- Coordinate with the project owner: switch the web project's root to web and framework to Next.js; remove old static export build/output overrides; retain its existing environment variables and set AI_SERVICE_URL. Ensure Preview is green before merging/publishing.
- Merge only after approval and coordinated Vercel configuration. Check production health and auth/diary/report functionality again.

## Rollback
Restore the previous production deployment and the previous project settings if health, auth, or diary regression occurs. Do not expose database credentials. Revert the migration commit if needed.

## Evidence status
This document specifies required verification, not completed test results. Actual CI runs, Vercel deployments and health responses must be recorded separately.
