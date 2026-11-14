# UI/UX Flow Audit — Consolidated Backlog (browser / PWA runtime)

Status: scheduled as the UI/UX Flow Program, Phases 38–41 of the [roadmap](../../manifesto/MASTERMAP.md#uiux-flow-program--browser--pwa-runtime-phases-3841), which sets the order of the packages below. FLOW-05 part 1 was delivered in PR #142. The packages marked "needs decision" wait for the owner decisions D1–D4.

- Date: 2026-11-13/14, audited at `main` 0c0e67e4.
- Scope: Tasks, Reports, Settings, Backup, Manual, Credits and the app shell in the browser runtime. Tabs absent from the browser (`db`, `cli`) are excluded by owner decision.
- Product principle: "Brazilian Zouk Flow" — fluid, no sharp spots, minimum interactions.
- Method: three read-only worker audits drove the browser runtime with Playwright (screenshots, bounding-box measurements, keyboard runs); Main consolidated the results into this backlog.
- Source findings (full repro steps, measurements, code references):
  - [audit-a-tasks-and-shell.md](audit-a-tasks-and-shell.md) — A-01..A-35 (32 active: 1 P0, 17 P1, 14 P2)
  - [audit-b-reports.md](audit-b-reports.md) — B-01..B-24 (partial: interaction-cost and coverage tables missing)
  - [audit-c-settings-and-tab-currency.md](audit-c-settings-and-tab-currency.md) — C-01..C-33 (partial: tab-currency and interaction-cost tables incomplete)
- Screenshots cited in the findings are committed as WebP under [`shots/`](shots/) (one subfolder per audit; 68 of about 360 captured, only the ones a finding cites). The Playwright scripts and their text outputs (`s*.cjs`, `u*.cjs`, `exp*.mjs`, `*.out`) stayed in the temporary working folder `%TEMP%/claude/<session>/scratchpad/ui-audit/` and are not committed. Code references (`file:line`) are against `main` 0c0e67e4.

## Verification level

| Level | Meaning | Items |
| --- | --- | --- |
| Verified by Main in code | Main read the cited code and confirms the defect | B-13, B-01, A-21 (Space handler), B-04 root cause |
| Worker-observed | Reproduced by a worker with a script or screenshot; not re-checked by Main | everything else |

## Coverage gaps (honest)

- Visual design was judged mostly through layout defects (clipping, overlap, jumps). Colour, typography and theme quality were viewed in depth only for the light theme; dark and high-contrast got automated metrics and a few screenshots.
- Locales `pl`, `de`, `ja` were measured for geometry; other locales were not opened.
- Full layout journeys at 390 px were not executed (only first-screen screenshots).
- Production build was not measured (B-15 timings come from the dev build).
- Compact layout, tray and the Tauri runtime are out of scope.

## Work packages

Sizes: S < 50 LOC, M 50–200, L > 200 (split before dispatch). Every package ships with the regression test named in the source finding.

### Wave 1 — wrong data and blocked users

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| FLOW-01 | Report periods use the user's timezone instead of UTC; "All" period gets a real day count for the daily average; `last30Days` day count | B-13, B-01 | Engine (Rust + browser plugin, parity fixtures); the range logic currently sits in `src/features/reports/utils/periodRanges.ts` | M |
| FLOW-02 | Bare Space must not toggle the timer after focus falls to the page body; editors and confirm dialogs return focus to their trigger | A-21, A-32, C-11 | React hooks | S–M |
| FLOW-03 | Sidebar is keyboard-operable: project row focusable and selectable, no focus stops on invisible controls, action cluster stops stealing row width, edit button named | A-19, A-01, A-34, B-16 | React + CSS | M |
| FLOW-04 | Alt+digit maps to the visible tab list | C-01 | React hook | S |
| FLOW-05 | Report has its own multi-project scope; "All" works (part 1, delivered in PR #142); sidebar multi-select while Reports is active (part 2) | B-04 | React | M + M |

### Wave 2 — Reports flow

| ID | Package | Findings | Size |
| --- | --- | --- | --- |
| FLOW-06 | One scope bar (period, projects, tags) above the numbers, sticky; filtering no longer moves the clicked control | B-02, B-03, B-23, B-14 | M–L |
| FLOW-07 | Log list: usable height, date per row or day groups, start–end and note, windowed rendering | B-18, B-15 | M |
| FLOW-08 | Billing: one representation, project grouping, readable at 390 px, no "UNKNOWN" currency card | B-05, B-11, B-12 | M |
| FLOW-09 | Stat card labels, chart legends, donut title no longer clipped; wide-period bars aggregated | B-07, B-08, B-10, B-22 | M |
| FLOW-10 | Custom range prefilled and validated; export dialog and file name state period and scope | B-20, B-21 | S |
| FLOW-11 | Print output is a clean document (no app chrome, titles kept, resolved dates and scope) | B-24 | M |
| FLOW-12 | Cheaper log correction from the report | B-19 | M (needs decision D2) |
| FLOW-13 | Export modal focus trap and radio-group semantics | B-17 | S |

### Wave 3 — Tasks flow

| ID | Package | Findings | Size |
| --- | --- | --- | --- |
| FLOW-14 | Keyboard-first entry chain: focus moves project → task input; subtask input autofocus and batch entry; new task scrolled into view; Medium selects the created project and closes on Esc | A-20, A-14, A-31, A-30, A-06 | M |
| FLOW-15 | Stable geometry: one banner height for idle/active/break; symmetric Full ↔ Medium switch | A-05, A-22, A-28 | M |
| FLOW-16 | Task row and header cleanup: one status concept, no `Entity #id` line, badge gap, "SELECT PROJECT" eyebrow, compact stats, long names wrap | A-03, A-04, A-07, A-08, A-11, A-09 | M |
| FLOW-17 | Responsive pass: 1024 px sidebar, long project name, phone Full layout, subtask row at 390 px, touch target sizes, Settings tables at 390 px, Medium tiles | A-24, A-25, A-16, A-17, A-26, A-27, B-06, C-29, C-32, C-15 | L (split per view) |
| FLOW-18 | First-run starter templates readable and worth the click | A-02, A-35 | M (needs decision D4) |
| FLOW-19 | Medium layout chrome budget and tab bar shape | A-12, A-13, A-33 | M (needs decision D1) |

### Wave 4 — Shell truthfulness and tab currency

| ID | Package | Findings | Size |
| --- | --- | --- | --- |
| FLOW-20 | Runtime-aware copy: no Rust/SQLite/tray/daemon wording, dead footer link, false shortcut tiles or Manual title in the browser; status banner "0 threads"; "Registered today" value | C-02, C-03, C-05, C-18, C-19, C-25, B-09 | M |
| FLOW-21 | One version number in the header; Credits content and versions in one place | C-04, C-22 | S |
| FLOW-22 | Backup, Manual, Credits and reset reachable in Medium | C-28, C-23 | M (needs decision D1) |
| FLOW-23 | Header geometry independent of locale; one home for language; naming of layout vs text size; tab label equals view heading | C-13, C-14, C-24, C-27 | M |
| FLOW-24 | Text-and-icon size scales the whole UI, not only the tab bar | C-31 | L (token audit) |
| FLOW-25 | `prefers-reduced-motion` honoured | A-29, C-12 | S |
| FLOW-26 | PWA install is discoverable in the app | C-20, C-26 | M |
| FLOW-27 | Settings polish: headings and jargon, card order and expansion state, hours-limit field, translation key validation, import error message, no toast for instant visible changes | C-06, C-07, C-08, C-09, C-10, C-30, C-33 | M |
| FLOW-28 | Documentation drift: USER_GUIDE themes/paths, CHANGELOG release headings, locale count in manifesto | C-21 | S (docs only) |

### Follow-ups found during FLOW-05 review

| ID | Item | Size |
| --- | --- | --- |
| FLOW-29 | `tests/e2e/specs/main-layout.spec.ts` expects `tab-db` to be visible, but the browser runtime sets `canInspectDatabase: false` (`src/app-browser/AppBrowser.tsx`); the spec is stale and fails on `main` | S |
| FLOW-30 | Engine parity gap: Rust range metrics filter on `log.project_id`, the browser engine on `task.projectId ?? log.projectId`; needs a parity fixture and one rule | M |
| FLOW-31 | `ReportBillingCard` fetch path treats an empty project id list as "all", while the statistics path returns the engine's empty result | S |

## Owner decisions needed

| ID | Question | Affects |
| --- | --- | --- |
| D1 | Medium layout in the browser: is it the phone layout (then it needs Backup/Manual/Credits and should fill the window), or only a desktop-popup preview? | FLOW-19, FLOW-22 |
| D2 | Is the typed "reason for edit" mandatory for every log correction (audit requirement), or may it default? | FLOW-12 |
| D3 | Bare Space as timer toggle: keep (with focus fixes) or require Ctrl+Space only? | FLOW-02 |
| D4 | Starter templates: seed starter tasks, or relabel as preset projects? | FLOW-18 |

## Works well — keep

- Enter-driven creation of projects and tasks; batch task entry keeps focus.
- One-click timer switch across projects; idle banner "Resume"; break banner with countdown.
- Rename on double-click and commit on blur; archive without confirmation and inline restore; delete guarded by data-loss count with focus on Cancel.
- Settings apply instantly with no save step; backup export → reset → import round trip restores all data.
- No horizontal page scroll in any tested cell; tab switches have no layout flash.
