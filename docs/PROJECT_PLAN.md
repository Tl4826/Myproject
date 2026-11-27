# NutriVN — Project plan and milestone evidence

Prepared 28 November 2026 after trial grading. This document reconstructs milestones from actual repository history; it does not claim the following were agreed at the beginning of the semester. Original deadlines and meeting records must be supplied by team members if available.

## Scope and deliverables

A Next.js/Tailwind course prototype recognizing food photos with the ONNX model, confirming predictions, estimating nutrition, recording meals in PostgreSQL and showing diary/report data. Deliverables: deployed web app, source code and documented architecture, wireframes, ERD, tests, peer review evidence and final demo. Nutrition values are estimates; portion size is not measured from images.

| Milestone | Actual evidence (dates UTC+7) | Deliverable |
|---|---|---|
| AI and backend prototype | Existing model and training artifacts in `ml/`; earlier history to be confirmed by team | Inference service, model evaluation |
| Authentication/QA | 21–24 Nov: [774b3e2](https://github.com/Tl4826/Myproject/commit/774b3e2), [fd9a722](https://github.com/Tl4826/Myproject/commit/fd9a722), [06340d5](https://github.com/Tl4826/Myproject/commit/06340d5) | Auth, regression/security reports |
| Next.js conversion and optimization | 25 Nov: [e0fe039](https://github.com/Tl4826/Myproject/commit/e0fe039), [PR 33](https://github.com/Tl4826/Myproject/pull/33), [PR 34](https://github.com/Tl4826/Myproject/pull/34) | Next.js, telemetry, AI routes |
| Responsive UI, DB, review | 26 Nov: [765a346](https://github.com/Tl4826/Myproject/commit/765a346), [1292bc8](https://github.com/Tl4826/Myproject/commit/1292bc8), [PR 44](https://github.com/Tl4826/Myproject/pull/44), [PR 54](https://github.com/Tl4826/Myproject/pull/54) | Responsive evidence, ERD, peer feedback fixes, diary sync |
| Final integration | 27 Nov: [PR 60](https://github.com/Tl4826/Myproject/pull/60), [5aa63d4](https://github.com/Tl4826/Myproject/commit/5aa63d4) | Assessed snapshot |
| Final grading improvements | 28 Nov onward: [issue 62](https://github.com/Tl4826/Myproject/issues/62), [issue 64](https://github.com/Tl4826/Myproject/issues/64) | Missing rubric evidence and fixes |

## Proposed remaining deadlines (team must confirm official submission date)

| Target (Vietnam time) | Proposed owner | Acceptance criteria |
|---|---|---|
| 28 Nov 12:00 | Huy + Hồng | Review wireframes against responsive screenshots and add genuine original artifacts if available |
| 28 Nov 15:00 | Thanh | Validate Lighthouse /home and link actual reports; review GA4/Sentry scope |
| 28 Nov 17:00 | Hồng + team | Send Remi peer feedback, link actual issue; set GitHub milestone due dates; record actual meeting decisions |
| 29 Nov 12:00 | Tuấn Anh | Review profile/plan/report schema and migration, validate account isolation with synthetic tests |
| 29 Nov 18:00 | Thanh + Huy | Review Next.js server route approach and deployment compatibility; build and verify two dynamic pages |
| Before official deadline | All | Review PRs, confirm CI and deployment, complete real demo and evidence index |

These are suggested targets, not historical deadlines or a claim of the instructor's submission date. If official deadline is earlier, prioritize low-risk evidence and communicate scope honestly.

## Working agreement for remaining work

Use existing issues rather than duplicates; assign actual owners, use branches and Conventional Commits with issue references, open PRs with acceptance criteria, request genuine peer review, attach tests, merge only after checks. No rewriting history or attributing work to people who did not do it. Keep the current production version stable. Record genuine meetings with actual date, attendance, decisions and follow-up tasks.
