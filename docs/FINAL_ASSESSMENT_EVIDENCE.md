# Final assessment evidence — 28 November 2026

Baseline assessed commit: `5aa63d4`, trial score 6.5/10. This index records actual changes and verification; it is not a self-awarded final grade.

| Rubric | Evidence | Status / limitations |
|---|---|---|
| 1(b), 2(a) | [PR #63](https://github.com/Tl4826/Myproject/pull/63), [wireframes](WIREFRAMES.md), [responsive report](RESPONSIVE_REPORT.md) | Six retrospective wireframes, linked from README. Team must supply authentic original design artifacts if available. |
| 1(c), 1(d), 1(e) | [PR #65](https://github.com/Tl4826/Myproject/pull/65), [Project Plan](PROJECT_PLAN.md), linked issues #62, #64, #66, #68, #70 and PRs #63, #65, #67, #69, #71 | Actual recent issue/branch/PR practice and documented historical milestones. Proposed deadlines need team confirmation and GitHub Milestone due dates. Historical contributions cannot be rewritten. |
| 3(a) | [PR #69](https://github.com/Tl4826/Myproject/pull/69), [schema extension and ERD](ACCOUNT_SCHEMA_PROPOSAL.md), [SQL CI](https://github.com/Tl4826/Myproject/actions/runs/46053044750) | Migration applied; Neon catalog confirms seven tables, RLS on all three new tables and 14 constraints. No user record reads/migration. New tables are minimal metadata; UI/API integration and legacy cleanup outstanding. |
| 3(c) | [PR #71](https://github.com/Tl4826/Myproject/pull/71), [Next runtime](NEXT_RUNTIME_READS.md), [runtime CI](https://github.com/Tl4826/Myproject/actions/runs/46050312039) | Opt-in Next.js server Route Handler and isolation test passed with mock API; direct SQL inside Next and production runtime deployment not verified. |
| 4(a) | [PR #63](https://github.com/Tl4826/Myproject/pull/63), [merged PR #73](https://github.com/Tl4826/Myproject/pull/73), [verified HTML/JSON artifact](https://github.com/Tl4826/Myproject/actions/runs/46100299544/artifacts/15245097768) | /home Mobile 100/100/96/100; Desktop 100/100/100/100 (performance/accessibility/best practices/SEO). Actual CI log and successful artifact upload verified on 28 Nov. Local production build with mock API, not a deployed-site audit. |
| 4(b) | [PR #67](https://github.com/Tl4826/Myproject/pull/67), [observability](TASK4_OBSERVABILITY.md), [CI](https://github.com/Tl4826/Myproject/actions/runs/46050030578) | Consent-based public-route analytics and allowlisted error context; CI passed. Realtime dashboard evidence and enhanced-measurement settings must be rechecked. |
| 5(a), 5(b) | [Remi review](feedback/REMI_OUTGOING_REVIEW.md), [received peer feedback](PEER_FEEDBACK.md) | Review of second team prepared from actual source code. Posting to their repo failed with HTTP 403; requires authorized account to post and genuine response. |

## Final demo checklist

- Confirm the latest production deployment and test actual login, scan, diary edit/delete and report with synthetic data.
- Show the six wireframes alongside responsive screenshots, Project Plan, GitHub issues/PRs, ERD and real schema catalog.
- Demonstrate Next runtime route on a verified runtime build; clearly distinguish it from static production.
- Capture new Lighthouse production report and GA4/Sentry dashboard evidence without personal data.
- Post Remi peer review with an authorized account and record their response.
- Confirm official submission deadline and actual team contribution evidence.

No grade is guaranteed. Instructors should assess the implementation, verified evidence, and final demo against the published rubric.
