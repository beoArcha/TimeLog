# AUDIT-B — Reports tab UI/UX findings (browser runtime)

Status: IN PROGRESS (resumed after previous worker died). Findings are appended as they are confirmed.
Reports dir: C:\Users\Krzysiu\AppData\Local\Temp\claude\4fe3aaad023df462\e87bbf6b-161a-4c90-a56f-6e067449689d\scratchpad\ui-audit\reports
Shots: `<reports dir>\shots\`  Downloads: `<reports dir>\dl\`

Source facts read so far (not findings):

- `src/features/reports/ReportView.tsx:39,289-290,301-303` — the report scope is `state.selectedProjectId` / `setSelectedProjectId`, the same state as the Tasks tab (known defect, see below).
- `src/features/reports/components/ReportProjectFilter.tsx:35,58,81` — single-select chip row; "All" = `onSelectProject(null)`; clicking the selected chip also deselects to `null`.
- `src/features/reports/components/ReportPeriodSelector.tsx:52-63` — 10 period presets in one SegmentedControl; sort select is a separate right-hand block.
- Docs drift noticed: USEREXPERIENCE.md / USERINTERFACE.md say 6 locales (`en,pl,de,es,fr,pt-br`), AGENTS.md says 10.

## Findings

(appended below)

> Evidence prefix: `S:` = `C:\Users\Krzysiu\AppData\Local\Temp\claude\4fe3aaad023df462\e87bbf6b-161a-4c90-a56f-6e067449689d\scratchpad\ui-audit\reports\shots\`
> Seed data: 7 projects (one with a 70-char name), ~180 logs over 90 days, 2 midnight-crossing logs, 1 patch, 1 running timer, rates on 3 projects, tags. "simAll" = the previous worker's browser-only route patch that gives ReportView its own project scope so a working "All" can be observed (repo untouched). Findings seen only under simAll say so.

### B-01 (P1, data-correctness) "Daily average" equals "Period total" for the "All" period

- where: Reports, Full 1440 and Medium 390, EN/DE, any theme; period "All" (the period the tab opens on).
- repro: open Reports with seeded data. Period total 283:48:37 (simAll) / 56:03:08 (real app, project Website Redesign) and Daily average show the same value.
- evidence: S:05-simall-1440-light-s0.png (283:48:37 twice), S:01-reports-1440-light.png (56:03:08 twice), S:10-medium-390-s0.png.
- code: `src/features/reports/utils/periodRanges.ts` `case 'all'` returns `days: 1`; `reportCalculator.ts:81-82` divides by it. `last30Days` also reports `days: 30` for a 31-day range.
- why: a card that repeats its neighbour reads as a bug; the reader cannot trust either number; "All" is the opening period.
- fix: for `all` derive days from the first log date to now (or hide the card when the divisor is not meaningful).
- size S. Guard: unit test on `getRangeFilterForPeriod('all')` + `calculateReportStatistics`.

### B-02 (P1, sense-of-solution / interaction-cost) Controls that change the numbers sit BELOW the numbers they change

- where: Reports, Full 1440x900 (also Medium / 390). Order in `ReportView.tsx:249-306`: stats cards -> billing card -> period/project/tag filter -> charts -> list.
- repro: open Reports at 1440x900. First viewport shows only the first 6 stat cards (S:01-reports-1440-light.png). The period selector first appears after ~1.5 screens of scrolling (S:02-1440-light-s2.png). Pressing "Month" there changes cards that are now off-screen above.
- why: cause and effect are separated by scrolling; costs 2 scrolls per question ("how much did I work this week").
- fix: one compact scope bar (period + project(s) + tags popover) directly under the header, sticky while the report scrolls; collapse the billing card to an inline summary.
- size M. Guard: geometry spec asserting `report-period-selector` is inside the first viewport and above the stats.

### B-03 (P1, interaction-cost) Filter block is a 4-row wall that grows with data

- where: Reports Full 1440. Period segmented control wraps to two rows (10 presets), project chips wrap to 3 rows with 7 projects (one 70-char chip), tag chips row, sort select on its own row (S:02-1440-light-s2.png).
- why: ~330px before any chart; grows with project count (50 projects = a screen of chips); no search; no multi-select.
- fix: keep Today / Week / Month / Last month / Custom visible and put the rest under "More periods"; projects as one multi-select popover with colour dots + search; sort moves next to the list it sorts (see B-26).
- size M.

### B-04 (P1, interaction-cost / consistency) Project scope is single-select and "All" does nothing (known defect), observable behaviour

- where: Reports Full 1440, light, seeded data, current project = Website Redesign.
- observed: on entering Reports chip "Website Redesign" is pressed, "All" is not (S:02-1440-light-s2.png). Clicking `project-filter-all` leaves Website Redesign pressed and the numbers unchanged (S:03-after-all-click.png). Clicking a sidebar project (Mobile App) switches the report scope to it, expands that sidebar row (pencil, ARCHIVE) and changes all numbers (S:04-after-sidebar-click.png). Clicking the donut slice sets the same scope. All three write the Tasks tab's selected project (`ReportView.tsx:39,289-290,301-303`).
- consequences: (a) nothing near the header says which project the numbers belong to; only one pressed chip far below; (b) the sidebar highlight doubles as the report filter without any label; (c) two projects cannot be compared.
- recommended control: see section "Multi-project scope" at the end of this file.
- size L (state model); fix assigned elsewhere.

### B-05 (P1, responsiveness) Billing table is cut off at 390px: Duration and Amount columns are not visible

- where: Reports, Medium layout, 390x844, light, billing card expanded.
- repro: open Reports at 390 wide, scroll to the Billing table. Only Task and Rate are visible; Duration/Amount are clipped at the card edge with no scroll affordance (S:10-medium-390-s5.png, S:10-medium-390-s6.png: digits "10", "14" cut).
- why: the money column is the point of the table.
- fix: stack each row as a card on narrow widths or give the table a visible horizontal scroller; `min-w-0` on the card.
- code: `ReportBillingCard.tsx` table. size S-M. Guard: geometry spec: every cell `right <= card.right` at 390.

### B-06 (P1, responsiveness / interaction-cost) Full layout on a phone: the report is buried under the whole Projects sidebar

- where: Full layout, 390x844 (Medium does not have this).
- repro: open Reports at 390 in Full layout. First ~2 screens are the "Projects (7)" panel (add-project form, list), then the timer, then the report (S:10-light-390-s0.png, S:10-light-390-s1.png).
- why: tab says Reports, screen shows project list; ~1500px of scrolling to the first report number.
- fix: in Reports below the two-column breakpoint swap the sidebar for the compact selector Medium already has (`MediumProjectSelector`), or put the sidebar after the report.
- size M.

### B-07 (P1, visual) "Project Share" title is truncated by its own filter badge

- where: Reports Full 1440, light, EN, a project filter active.
- repro: donut header shows "Project Sha|Website Redesign|x Clear filter" (S:02-1440-light-s2.png, S:03-after-all-click.png); with tag filter and no data an empty grey pill remains (S:14a-tag-vs-project-dead-end.png).
- code: `ProjectDonutChart.tsx` header.
- fix: move chip + clear below the title or drop them (a scope bar, B-02, already shows the scope).
- size S. Guard: geometry spec title `scrollWidth <= clientWidth`.

### B-08 (P1, visual) Chart legends are clipped at the card edges with many projects / long names

- where: Reports Full 1440, light, EN, simAll (7 projects incl. the 70-char name).
- repro: Daily Activity and Project Share legends are one clipped row: "Internal Tooling / Mobile App / Payments API / Res & Lea.." plus fragments "harily ect" at the left edge (S:05-simall-1440-light-s5.png). The donut has no slice labels, so colours cannot be decoded for the clipped projects.
- fix: wrapped legend with truncation + title tooltip; slice name + share on hover.
- code: `StackedBarActivityChart.tsx`, `ProjectDonutChart.tsx`. size S-M. Guard: geometry spec (legend items inside card).

### B-09 (P2, data-correctness) "Registered today" in the timer banner is not today's time

- where: banner above the Reports tab, Full 1440: "REGISTERED TODAY 29:11:15" while report Today Total is 01:10:12 (S:01-reports-1440-light.png); the Implementation task total in the log list is 29:11:06 (S:02-1440-light-s4.png). With no activity today: "REGISTERED TODAY 07:19:21" beside Today Total 00:00:00 (S:14f-no-logs-today-s0.png).
- why: two "today" numbers on one screen that differ by 28 h; the banner shows the task's all-time total.
- fix: compute today only, or rename to "Task total". Outside the Reports area (Tasks banner); listed because it is on screen next to the report and contradicts it.
- size S. Guard: unit test of the banner total.

### B-10 (P1, i18n / visual) Stat-card titles break mid-word and truncate (DE, multi-currency)

- where: Reports Full 1440. DE: "ZEITRAU/M…", "TAGESDU/RCHSC…", "HAUPTPR/OJEKT", "EUR PERIOD…" (S:10-de-1440-s0.png). EN: "TOTAL PERIOD…", "UNKNOW/N TOTAL…" (S:05-simall-1440-light-s0.png). Helper lines truncate: "Total time in selected p…", "Gesamtzeit im gewählt…".
- why: the title is the only label of the number; the UX doc names text overflow from language length a UX bug.
- fix: wrap on word boundaries, one-line label + tooltip, drop helper lines; 4-up at 1440 is too narrow for a 28px mono value + icon.
- code: `ReportStatsCards.tsx`. size S-M. Guard: geometry spec per locale (no title `scrollWidth > clientWidth`).

### B-11 (P2, sense-of-solution) Billing appears three times and an "UNKNOWN" currency card

- where: Reports Full 1440 / Medium 390, simAll (multi-currency). Stat grid has "EUR TOTAL…", "PLN TOTAL…", "UNKNOWN TOTAL… -" (S:05-simall-1440-light-s0.png; S:10-medium-390-s3.png "UNKNOWN TOTAL AMOUNT 0.00 UNKNOWN"), then Billing Summary repeats per-currency totals (S:02-1440-light-s1.png), then the table.
- why: duplicated numbers and a card that shows "no data" as a currency; 8-9 stat cards = three phone screens.
- fix: one billing representation: per-currency totals in one compact row, table behind the existing collapsible; show the unconfigured bucket only when > 0, labelled "No rate set".
- size M.

### B-12 (P1, sense-of-solution) Billing table has no project column; rows ambiguous in multi-project scope

- where: Reports Full 1440, simAll (what the multi-project fix will produce): "Planning / Implementation / Code review / Meetings" repeat 7 times with different rates and no project name (S:05-simall-1440-light-s2.png, S:05-simall-1440-light-s4.png).
- fix: group by project (dot + name + subtotal) or add a project column.
- code: `ReportBillingCard.tsx`. size M. Guard: e2e on multi-project data.

### B-13 (P0, data-correctness) Period boundaries are computed in UTC: a log made just after local midnight is reported under "Yesterday"

- where: Reports, Full 1440, browser timezone Europe/Warsaw (UTC+1 in November), EN, any theme. Same code for every period preset.
- repro (script `u1.cjs`): one log 00:10-00:50 local today (= 23:10 UTC the day before). Today: Period total 00:00:00 and Today card 00:00:00. Yesterday: 00:40:00. Week: 00:40:00. Log row time and the edit dialog show local time (Europe/Warsaw) so the row says "today 12:10 AM" while the report counts it as yesterday.
- evidence: console output of `u1.cjs` (run 2026-11-13): `period today total 00:00:00 | period yesterday total 00:40:00`.
- code: `src/features/reports/utils/periodRanges.ts` all presets use `Date.UTC(now.getUTCFullYear()...)` / `getUTCDay()` (today:46, yesterday:52, week:61, month:79...) and `custom` appends `T00:00:00Z`.
- why: users west or east of UTC lose or gain up to a day at the edges of every period; the first hour(s) of the day vanish from "Today" and the "Today total" card. The same user sees different "today" in the row labels and in the totals.
- fix: build range edges from the user's timezone (`settings.resolvedTimezone`, already used by the row formatter) instead of UTC.
- size M (engine contract: Rust engine and browser plugin must change together). Guard: unit test with `TZ=Europe/Warsaw` / fixed timezone and a log at 23:10Z; parity fixture.

### B-14 (P1, motion/transition) Selecting a donut slice (or clearing the filter) throws the user to another place in the page

- where: Reports Full 1440x900, light, simAll only (the real app cannot hold several projects in scope, B-04, so the jump shows once the scope fix lands, or today with period/tag changes that shrink the page by thousands of px).
- repro: scroll until the donut is on screen (donut header at y=307, scrollTop 3217 of 5098). Click a slice. Result: content shrinks 5098 -> 2714 px, scrollTop clamps to 2036 and the donut header is now at y=-97 (off screen). Click "Clear filter" (which is in that header): scrollTop 1449, donut header at y=2075, i.e. 2000 px BELOW the viewport (measured in `u3.cjs`).
- evidence: `u3.cjs` output lines `before slice click / after slice click / after clear filter`; S:u2-after-slice-click.png shows the chart half scrolled off screen right after the click.
- why: the filter control (donut) disappears from under the pointer as an effect of using it; undo ("Clear filter") then leaves the user lost. Breaks "no abrupt jumps" and the UX doc's visual stability rule.
- fix: reserve stable heights (log list fixed-height window, distribution collapsed by default) so filtering never changes page height by thousands of px; keep scope controls sticky at the top so they are always under the pointer.
- code: `ReportView.tsx:293-318` layout; `ReportLogList.tsx:157` / `ReportLogDistribution.tsx` variable height.
- size M. Guard: geometry/e2e spec: after a filter click the clicked control's `getBoundingClientRect().top` changes by less than N px.

### B-15 (P1, performance / motion) Every period or project click blocks the main thread for 0.3-2.2 s (dev build)

- where: Reports Full 1440 and Medium 1440, Chromium headless, vite DEV server (unminified React dev build: absolute numbers are inflated; I did not measure a production build because building writes into the repo).
- repro (`u4.cjs`): click period/chip and poll for the new total. Real app (single-project data): month 319 ms, week 555 ms, all 420 ms, chip 849 ms; one long task per click of the same length (e.g. `longtasks:[845,212]`). With 7 projects in scope (simAll): month 2209 ms (6 frames in 3 s), all 1127 ms, week 627 ms. Medium layout: 450-475 ms.
- evidence: `u4.cjs` output; earlier recorder `t7.cjs` captured 14 frames in 4.3 s for a period switch (3 fps).
- why: UX doc: "UI must never stutter ... Waiting for the interface to catch up is a critical UX bug". The pressed state of the clicked chip only changes after the block ends, so a click feels dropped.
- cause (not profiled, from code): the log list renders every row (150 rendered rows inside a 250 px window, see B-18) and recharts redraws two charts on each change.
- fix: window/virtualise the log list, paginate groups, memoise chart data; give the clicked control instant pressed feedback.
- size M. Guard: perf budget test is flaky in CI; guard the cause with a unit test (list renders <= N rows).

### B-16 (P1, a11y / interaction-cost) Keyboard: ~40 Tab stops from the tab bar before the report's first button; donut slices are not keyboard reachable

- where: Reports Full 1440, light.
- repro (`u2.cjs`): focus the Reports tab, press Tab 40 times. Stops: add-project form (10), then 3-4 stops per project row (select, ARCHIVE, move up, move down; several buttons report an empty accessible name "BUTTON:"), then Take Break, Stop, and only at stop #39-40 `report-print-button`, `report-export-button`. The period selector comes after the stats cards.
- Donut slices have `tabindex=-1` (7 of 7) so click-to-filter is mouse-only (`ProjectDonutChart.tsx` Pie onClick).
- why: UX doc: every interactive element must be keyboard operable; 40 stops to reach the report is a keyboard dead end. The sidebar rows with unnamed buttons break "every interactive element has an accessible name".
- fix: skip link "Skip to report" / move the sidebar after the report in DOM order; give the sidebar row buttons accessible names; slices are redundant with chips if chips become the multi-select (see end), otherwise add `role="button"` + key handlers.
- size S-M. Guard: Playwright: Tab count from `tab-reports` to `report-export-button` <= 5.

### B-17 (P2, a11y) Export modal: focus escapes the dialog and the format list is 7 separate Tab stops

- where: Reports Full 1440, light, EN.
- repro (`u3.cjs`): open Export with Enter; focus lands on `export-format-csv-exporter` (good). Press Tab 14 times: formats (6 more stops), Cancel, Download, Close (X), then focus leaves the dialog to the page header (`layout-variant-medium`, `theme-btn-light`, `text-scale-small`). The dialog element has no `aria-modal` (`aria-modal=null`). Escape returns focus to `report-export-button` (good).
- why: frontend rule: modal focus is trapped while open; radio-like card lists must be a `radiogroup` (arrow keys, one Tab stop) - the format list is not.
- fix: use the project's accessible radio-group primitive for formats; add `aria-modal` and a real focus trap (the Base UI dialog is configured non-modal).
- code: `ReportExportModal.tsx:145-251`. size S. Guard: Playwright keyboard test (Tab cycle stays in dialog).

### B-18 (P1, interaction-cost / visual) Log list: 250 px nested scroller holds 9000 px of rows, rows have no date, text is 10-12 px

- where: Reports Full 1440, light, EN, period All.
- repro: scroll to "Plain SQLite logs dump". The list is a 250 px high inner scroll box (`scrollHeight` 9168 px, 150 rows rendered) inside the page scroller (`ReportLogList.tsx:157` `max-h-[250px]`): wheel scrolling hands over between two scrollers. Row text reads `[10:00:00 PM] "Meetings" (Payments API)` - time only, no date, no end time, no note; with period Week or longer the reader cannot tell which day a row is from (the print variant includes the date, `ReportLogRow.tsx:94-99`; the screen variant does not). Time stamp font 10 px, row 12 px. Project name is repeated in every row inside its own project group.
- evidence: S:02-1440-light-s4.png, S:u3-week-list.png, `u3.cjs` output `log list {"h":250,"scrollH":9168,"rowsRendered":150,"timeFont":"10px"}`.
- why: this is the list the user needs to find and fix a wrong entry; it is the smallest, least readable element on the page. Notes (`note` on 30% of seeded logs) are not displayed at all although search matches them.
- fix: give the list the remaining viewport height (or page it) instead of 250 px, group by day (date header per group) when period > 1 day, show start-end and note, drop the repeated project name.
- size M. Guard: e2e: row contains a date when period != today; geometry: list height >= 40% of the viewport.

### B-19 (P1, interaction-cost) "Fix a wrong log found in the report" costs ~9-12 interactions and a mandatory free-text reason

- where: Reports Full 1440, light, EN. See the interaction-cost table. Edit dialog ("Edit Time Log (Audit)") opens with focus on Start time (good), has plain text inputs `2026-11-10 22:00:00` (no picker), a required "Reason for edit (required for audit)" textarea and Delete in the same dialog (S:u3-edit-modal.png). The subtitle repeats the label of the required field.
- why: every correction needs typed prose; a one-click correction (nudge end time) is impossible.
- fix: make the reason optional with a default ("Corrected in report") or pre-fill from a short select; offer date-time pickers; keep Delete in the row/confirm.
- code: `src/components/ReportLogEditModal.tsx:408-510`. size M.

### B-20 (P1, interaction-cost / consistency) Custom range: starts empty and equal to "All", needs two typed dates, a reversed range silently empties the report

- where: Reports Full 1440, light.
- repro (`u5.cjs`): click "Custom": both date inputs are empty and the report is unchanged (283:48:35 = All) with no hint (S:u5-custom-empty.png). Entering only "from" 2026-10-01 gives 151:30:05 (open ended). From 2026-11-10 to 2026-11-01: totals 00:00:00, the whole log list disappears and no message says the range is invalid (S:u5-custom-reversed.png).
- why: a mode switch that changes nothing, then silent failure; the export dialog then labels it just "CUSTOM 0 entries" (B-21).
- fix: prefill custom with the previous preset's range; show an inline error for from > to; allow arrow-key stepping of presets.
- code: `ReportPeriodSelector.tsx:107-132`, `periodRanges.ts` custom. size S.

### B-21 (P2, consistency / i18n) Export dialog shows the raw period id and no scope

- where: Reports, Export dialog, EN (and all locales).
- repro: with "Last month" selected the dialog summary reads `LASTMONTH 46 entries / PERIOD TOTAL 93:33:09` (S:12-export-modal.png); with Custom it reads `CUSTOM 0 entries`. No date range and no project name appear anywhere in the dialog or its file name (downloaded: `Time_Summaries___Reports_2026-11-13.csv`, in `dl\`).
- why: the user cannot confirm what they are about to export; the file name does not say which period or project; the label is an untranslated identifier.
- code: `ReportExportModal.tsx:164` renders `payload.period`. fix: show the localised period label + resolved dates + project/tag scope, and put them in the file name. size S.

### B-22 (P2, visual / consistency) 3 px wide daily bars with a hover target of 3 px

- where: Reports Full 1440, period All (133 bars in a 304 px chart).
- repro (`u5.cjs`): bar width 3 px; hovering at a bar's edge shows no tooltip; the x axis shows 4 date labels of irregular spacing ("Aug 28, Sep 24, Oct 23, Nov 13") (S:02-1440-light-s3.png).
- why: tooltips are the only way to read a day's value; a long period degrades to a texture. fix: aggregate to weeks above ~45 days and show a column-wide hover band. size M.

### B-23 (P1, motion/transition) The period button you just clicked moves under the pointer (up to 1250 px) because the filter sits below variable-height content

- where: Reports Full 1440x900, light, EN. Real app and simAll.
- repro (`u6.cjs`): scroll so that the period buttons are in view, click presets in turn and measure the clicked button's viewport top before/after (2.5 s settle). Real app: Month -105 px, Yesterday -105 px, Today +35 px, All +175 px. With 7 projects in scope (simAll): Month -974 px (button ends up at y=-481, off screen), Week -315, Yesterday -344, Last week +506, All +1254 (page height 3155 -> 4917). Recorder `t7.cjs`: the filter box (top relative to the panel) moved 2799 -> 1825 px on All -> Month.
- cause: stats cards + billing table (one row per task, 8 rows for one project, ~32 for seven) are rendered ABOVE the filter, so every filter change resizes the content above the control (`ReportView.tsx:249-291`).
- why: the user cannot click Month, then Week, in two quick moves: the second target has moved. This is the "sharp spot" the product intent forbids and it is the concrete cost of B-02.
- fix: same as B-02: scope bar above the content, sticky; billing table collapsed by default.
- size M (same change as B-02). Guard: geometry/e2e spec: clicked preset's `top` changes by < 2 px.

### B-24 (P1, consistency / sense-of-solution) Print output: app chrome prints, card titles vanish, period has no dates or project, irrelevant cards stay

- where: Reports, print media emulated at 794 px (A4), Medium layout, simAll, period Last month (`u8.cjs`; the same ReportView renders in Full).
- observed (S:u8-print-p0.png, p2, p3): the "PWA READY / ONLINE" banner and an empty bordered strip print above the title; the cards "Periodical report" and "Billing Summary" lose their headings (icon only); the header says only "Period: Last Month" (no dates, no project/tag scope, no generated date); "Today total 01:10:11 / Week total / Month total" are printed in a last-month report and contradict it; the document is ~7 A4 pages (7315 px). Positive: the print variant has a wrapped legend, dates in log rows and no clipped text.
- why: "Print / PDF" is a primary action (header button); the output is not a document someone can hand to a client.
- fix: hide app chrome (banner, timer strip) under `print:`; keep card titles; print the resolved range + scope; omit Today/Week/Month cards in print unless the selected period is that one.
- code: `ReportView.tsx:243-260` (`ReportPeriodPrintHeader`, `ReportStatsCards forceMountOnPrint`), layout builders for the banner. size M. Guard: Playwright `page.emulateMedia({media:'print'})` spec on visible text.
