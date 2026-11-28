# Final assessment evidence — 28 November 2026

Baseline assessed commit: `5aa63d4`, trial score 6.5/10. This index records actual changes and verification; it is not a self-awarded final grade.

| Rubric | Evidence | Status / limitations |
|---|---|---|
| 1(b), 2(a) | [PR #63](https://github.com/Tl4826/Myproject/pull/63), [wireframes](WIREFRAMES.md), [responsive report](RESPONSIVE_REPORT.md) | Six retrospective wireframes, linked from README. Team must supply authentic original design artifacts if available. |
| 1(c), 1(d), 1(e) | [PR #65](https://github.com/Tl4826/Myproject/pull/65), [Project Plan](PROJECT_PLAN.md), linked issues #62, #64, #66, #68, #70 and PRs #63, #65, #67, #69, #71 | Actual recent issue/branch/PR practice and documented historical milestones. [PR #78](https://github.com/Tl4826/Myproject/pull/78) merged; #77 closed. Five milestone due dates are documented per the contributor's report; independent milestone and official deadline verification remains with the team. Historical contributions cannot be rewritten. |
| 3(a) | [PR #69](https://github.com/Tl4826/Myproject/pull/69), [schema extension and ERD](ACCOUNT_SCHEMA_PROPOSAL.md), [SQL CI](https://github.com/Tl4826/Myproject/actions/runs/46053044750) | Migration applied; Neon catalog confirms seven tables, RLS on all three new tables and 14 constraints. No user record reads/migration. New tables are minimal metadata; UI/API integration and legacy cleanup outstanding. |
| 3(c) | [PR #71](https://github.com/Tl4826/Myproject/pull/71), [Next runtime](NEXT_RUNTIME_READS.md), [runtime CI](https://github.com/Tl4826/Myproject/actions/runs/46050312039) | Opt-in Next.js server Route Handler and isolation test passed with mock API; direct SQL inside Next and production runtime deployment not verified. |
| 4(a) | [PR #63](https://github.com/Tl4826/Myproject/pull/63), [merged PR #73](https://github.com/Tl4826/Myproject/pull/73), [verified HTML/JSON artifact](https://github.com/Tl4826/Myproject/actions/runs/46100299544/artifacts/15245097768) | /home Mobile 100/100/96/100; Desktop 100/100/100/100 (performance/accessibility/best practices/SEO). Actual CI log and artifact verified on 28 Nov; these are local mock-API scores. [PR #76](https://github.com/Tl4826/Myproject/pull/76) merged after [production verification](https://github.com/Tl4826/Myproject/actions/runs/46116160281/artifacts/15251229313): /home mobile 90/100/96/100, desktop 100/100/100/100; diary mobile 87/100/100/100; reports mobile 100/100/96/100. All 19 production checks passed. |
| 4(b) | [PR #67](https://github.com/Tl4826/Myproject/pull/67), [observability](TASK4_OBSERVABILITY.md), [CI](https://github.com/Tl4826/Myproject/actions/runs/46050030578) | Consent-based public-route analytics and allowlisted error context; CI passed. Earlier GA4 Realtime and Sentry browser evidence are recorded in [Task 4 results](evidence/TASK4_RESULTS.md); user screenshot confirms [MYPROJECT-2 diagnostic_test](https://nutrivn.sentry.io/issues/7868692522/?environment=preview&project=4512497296474112), preview, event prefix 7a5b5508. New public-route coverage, private-route exclusion, enhanced-measurement settings and new diagnostic context dashboard verification remain open in #66. |
| 5(a), 5(b) | [Remi review](feedback/REMI_OUTGOING_REVIEW.md), [received peer feedback](PEER_FEEDBACK.md) | Review of second team prepared from actual source code. Posting to their repo failed with HTTP 403; requires authorized account to post and genuine response. |

## Final demo checklist

- Confirm the latest production deployment and test actual login, scan, diary edit/delete and report with synthetic data.
- Show the six wireframes alongside responsive screenshots, Project Plan, GitHub issues/PRs, ERD and real schema catalog.
- Demonstrate Next runtime route only on a verified runtime build; distinguish it from static production. Full migration PR #75 was closed unmerged after failed deployment; track #70 without changing stable production.
- Use the recorded Lighthouse production numeric summaries and dashboard evidence; complete the outstanding #66 telemetry verification without personal data.
- Post Remi peer review with an authorized account and record their response.
- Confirm official submission deadline and actual team contribution evidence.

PR #74 was closed unmerged because #76 superseded it. PR #72 and #78 are merged. Do not reopen superseded PRs. No grade is guaranteed. Instructors should assess the implementation, verified evidence, and final demo against the published rubric.
