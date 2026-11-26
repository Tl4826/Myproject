# NutriVN — Task 4 verification evidence (26 November 2026)

Issue #32; submission branch main. Implementation PR #33; API routing fix #34; production verification PRs #49, #50, #51.

## Lighthouse

Scores are Performance / Accessibility / Best Practices / SEO.

| Route | CI (local mock API) | Production | Production host |
|---|---|---|---|
| / | 100 / 100 / 96 / 100 | 87 / 100 / 96 / 100 | nutrivn-main.vercel.app |
| /diary | 100 / 96 / 96 / 100 | 100 / 96 / 96 / 100 | nutrivn-myproject.vercel.app |
| /baocao | 100 / 96 / 96 / 100 | 99 / 96 / 96 / 100 | nutrivn-myproject.vercel.app |

- [Local CI HTML/JSON](https://github.com/Tl4826/Myproject/actions/runs/45643857681), artifact nutrivn-lighthouse.
- [Public production HTML/JSON and smoke checks](https://github.com/Tl4826/Myproject/actions/runs/45798437764/artifacts/15106531216).
- [Authenticated production score summaries and consent checks](https://github.com/Tl4826/Myproject/actions/runs/45799243828/artifacts/15106048066). Raw authenticated production reports were deliberately not published to avoid session metadata. Preserve downloaded artifacts separately before expiry.
- Performance 87 on the public landing is a remaining improvement opportunity; no claim that every Lighthouse audit finding is fixed.

## GA4 dashboard (team-provided screenshot)

![GA4 Realtime event count](ga4-realtime-evidence.png)

4 page_view and 9 user_engagement events. Image cropped and reduced in palette to omit account and navigation information. The screenshot proves dashboard reception, not independent attribution of each event to a domain. On nutrivn-myproject production the automated browser check confirmed default-off, opt-in page_view and decline. Third-party requests were intercepted for this consent test.

## Sentry dashboard (team-provided screenshot)

![Sentry browser_runtime issue](sentry-issues-evidence.png)

MYPROJECT-1 / browser_runtime, 2 events, 1 user as displayed by Sentry. Cropped and palette-reduced. Browser consent and allowlisted payload tests passed. The server transport separately sent diagnostic_test tagged preview, ingestion HTTP 200, event ID 7a5b550868944640983d44de92c9aaf6; see [diagnostic evidence](https://github.com/Tl4826/Myproject/actions/runs/45799739417/artifacts/15105923999). This was not a deliberately induced production failure or an independent view of that event in Sentry Issues.

## Functional regression

- Health HTTP 200, 100 classes; synthetic PNG prediction returned Top 3.
- Public pizza image tested via actual UI: HTTP 200, Top 1 pizza, Top 3 pizza/carrot_cake/breakfast_burrito; selected pizza and diary visible. One photo is not a statistical model accuracy measure.
- QA account register 201, wrong password and unregistered email 401, session verification 200, anonymous diary 401, account-scoped diary API CRUD passed and QA meal removed; logout 200. Synthetic QA accounts may remain. Email-account UI diary remains browser-local; no universal cross-device sync claim.
- GA4/Sentry environment variables were verified by name on nutrivn-myproject. nutrivn-main did not have them at the time of checking; no credentials or DSNs are included here.
- No real personal images, passwords, session tokens or health profiles are included in this report. This is a course prototype, not a clinical nutrition tool.
