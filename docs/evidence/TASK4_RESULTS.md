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

## Final CI recheck after accessibility and email diary integration

PR #53 corrected text contrast and font sizes. PR #54 integrated email accounts with the existing Neon diary API; both merged. All six PR #54 checks passed. The latest [Lighthouse CI HTML/JSON](https://github.com/Tl4826/Myproject/actions/runs/45816700702/artifacts/15115672824) uses local mock API, not production: landing 99/100/96/100; diary 100/100/100/100; reports 99/100/96/100. Both production deployments at commit 4b46f73 returned HTTP 200 with 100 classes. Cross-browser local regression [passed](https://github.com/Tl4826/Myproject/actions/runs/45816701285); the [separate production regression](https://github.com/Tl4826/Myproject/actions/runs/45823545267) also passed in PR #55. Legacy browser meals are not silently migrated; newly saved meals are account-scoped and no diary image thumbnail is transmitted. Historical production scores above remain the measured results at the time of those audits.

## Production recheck after PR #54

[Actual workflow](https://github.com/Tl4826/Myproject/actions/runs/45823545267), [JSON summary](https://github.com/Tl4826/Myproject/actions/runs/45823545267/artifacts/15119220960): verified two independent authenticated sessions, visibility of a synthetic Neon row in both, report calculated from the server entry, UI edit/delete persisted, and all nine horizontal-overflow checks at 375/768/1440 px across home, diary and reports. Synthetic meal removed; both sessions revoked; a synthetic account may remain. No real data or telemetry opt-in. Authenticated production Lighthouse diary 85/100/100/100, reports 100/100/96/100; numeric summaries only. Performance varies across runs and is not claimed to be perfect. Saved profile and archived reports and legacy meals remain local. OAuth and the individual diagnostic event's dashboard view were not independently rechecked.
