# Task 4 — Lighthouse, Analytics and error logging

Issue: #32. This is implementation and verification guidance, not a fabricated test report.

## 4(a) Lighthouse
- Open the Task 4 workflow under Actions. Download the nutrivn-lighthouse artifact containing HTML, JSON and summary.json for landing, diary and reports.
- The audit uses a Next.js production build served locally with the development mock API and synthetic credentials. It checks the authenticated route rather than auditing a redirect to login. It does NOT measure production or real Neon.
- Review each report; address actual audit findings and rerun. Then audit deployed landing, diary and reports in Chrome DevTools with a test account, uncheck Clear storage for authenticated routes. Save HTML/screenshot in docs/evidence/ and record commit, URL, date and device. Do not commit personal data.
- No Lighthouse score is claimed before an actual run.

## 4(b) Analytics
- Configure a team-owned GA4 web data stream; set NEXT_PUBLIC_GA_ID on the frontend build environment. Disable Enhanced Measurement (including history changes), advertising signals, User-ID and data sharing features not needed for this assignment.
- Tracking is off by default, explicitly opt-in, landing page only. No account/profile/meal data or route query is sent by the application. GA may still process technical network/device data; provide appropriate privacy notice and only enable after team review.
- Deploy and choose Allow on landing. Verify page_view in Realtime; decline and confirm no further events. Capture dashboard evidence with personal data redacted.

## 4(b) Error logging
- Create a team-owned Sentry project and use its public DSN in NEXT_PUBLIC_SENTRY_DSN and server-side SENTRY_DSN. Never use an auth token in a NEXT_PUBLIC variable.
- A minimal Sentry envelope transport sends only allowlisted technical codes. Frontend error collection is opt-in on the landing page. Server error handlers send sanitized codes for unexpected email/social authentication and diary service failures. Central Vercel runtime logs also record codes. No user data, raw errors, stack traces, request URLs or bodies are sent by this transport.
- Set Sentry project data scrubbing and rate limits; disable replay, tracing and PII. Test with an isolated preview DSN (not by breaking production): from repository root, run SENTRY_DSN=<preview DSN> node --input-type=module -e "import {sendCode} from './web/src/lib/telemetry-envelope.mjs'; if (!await sendCode(process.env.SENTRY_DSN,'diagnostic_test','preview')) process.exit(1)".
- Confirm diagnostic_test in Sentry Issues. Browser event capture and actual server-side failure handling must be verified in preview before claiming full integration.
- The transport is not the full Sentry SDK; Python/FastAPI ML instrumentation is unchanged. Do not claim complete SDK coverage.

## AI and CI
Baseline main commit 04070cc06dc8e4b65e5fa1fc478dbd3705be092b: Food100 workflow run 45629502746 and Web Camera Build Check run 45629502519 both reported success. Vercel checks reported success. These are historical CI results, not a new end-to-end production test.
- Re-run model/API and camera checks after this PR.
- Test /api/health and a real non-sensitive food photo through UI; confirm top-3, correction and diary behavior with a synthetic account. Record actual outcome and limitations.

## References
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/tag-platform/security/guides/privacy
- https://develop.sentry.dev/sdk/foundations/envelopes/
- https://github.com/GoogleChrome/lighthouse-ci
