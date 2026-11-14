# AUDIT-A — Tasks tab + application shell (browser runtime) — findings

Screenshots: [`shots/tasks/`](shots/tasks/) (committed, WebP). Working folder of the run (not committed): `%TEMP%/claude/<session>/scratchpad/ui-audit/tasks` (below `$T`): scripts `$T/s*.cjs`, helper `$T/lib.cjs`, dev server `DEV_PORT=5181`.

## Progress log / next steps (update as you go)

- [run 3] COMPLETE: A-01..A-35 (32 active), interaction-cost table, keep-list, coverage table, final summary written. If more time: view dark/pl/de sweep screenshots r3-sweep-*.png, run Full journeys at 390 touch.
- Findings in "Confirmed" are observed; "Prior" = observed in screenshots/outputs from earlier workers' run, not re-run.

## Findings (ID, severity, category)

### A-01 · P1 · visual / data-correctness — Sidebar project rows show a 1-character description line ("(", "C", "Cr…")

- Where: Tasks, Full, 1440x900, light, en; seeded data (5 projects). Every project row without description shows a second line truncated to 1–3 chars; selected row too ("Created …" on a fresh project, then "C…").
- Repro: seed or create a project → look at the row under the project name in `#projects-sidebar`.
- Evidence (prior run): [core-full-1440-light-en](shots/tasks/core-full-1440-light-en.webp) (rows: `(` under Website Redesi…, `C` under Mobile App, `Cr…` under Internal Tools), [j1-after-project](shots/tasks/j1-after-project.webp) ("Created …"), [j1-after-start](shots/tasks/j1-after-start.webp) ("C…").
- Why it breaks flow: the row reserves a line for text that is clipped to nothing; it looks like a rendering bug, name is truncated ("Website Redesi…") although the row has dead width on the second line; row height ~110px so only ~5 rows fit the viewport.
- Proposed fix: drop the "Created <date>" line when no description (or render the whole date with `min-w-0` + `whitespace-nowrap`), give the name the full row width, move timer pill to the second line.
- Code: src/layouts/parts/sidebar/* (TBD exact line). Size S. Test: geometry spec (no leaf text clipped with scrollWidth>clientWidth in `#projects-sidebar`).

### A-02 · P1 · visual — Starter-template cards on first run: description text overlaps the neighbour card

- Where: empty app, Full 1440x900, en.
- Evidence (prior): [empty-full-1440-en](shots/tasks/empty-full-1440-en.webp) (descriptions "Track features, code reviews, de…" and "Billable client hours, meetings an…" are painted over each other; same for 2nd row). Titles truncated "Software E…", "Client Cons…", "Learning & …", "Content & D…".
- Why: first impression of the product; the one-click templates are unreadable and look broken; titles lose their meaning.
- Fix: 1 column list of templates (full-width cards) or `overflow-hidden` + 2-line clamp on description; allow title to wrap.
- Code: src/layouts/parts/sidebar/ (starter templates; TBD line). Size S. Test: geometry (no overlapping child rects) in empty-state spec.

### A-03 · P1 · sense-of-solution — Timer start produces a second, parallel status chip and raw "Entity #id" debug line on every task

- Where: Tasks list, Full. Starting "First task" (status TODO) shows `TODO ▾` plus a green "In Progress" badge; running seeded task "Homepage hero section" shows `Done ▾` + "In Progress" + "Entity #t-p1-1 (Active timing)".
- Evidence (prior): [j1-after-start](shots/tasks/j1-after-start.webp), [j3-subtask-form-open](shots/tasks/j3-subtask-form-open.webp). Every task row prints `Entity #t-p1-0` (internal id; for new tasks a full UUID `Entity #9c2ff00b-15de-4f00-85ad-f6c4bcfa8b36…`).
- Why: two status vocabularies (workflow status select vs "In Progress" timer badge) contradict each other (Done + In Progress); internal IDs are developer noise in a "flow" UI and add a line per task row.
- Fix: one status concept: running = visual state (pulse / accent bar) and, optionally, auto-set status to InProgress on start; remove the Entity line from the default view (show in a details popover / behind a setting).
- Code: src/features/tasks/** (TBD). Size S–M. Test: unit/e2e (no "Entity #" text in row; single status chip).

### A-04 · P2 · visual — "In Progress" badge glyph collides with its label ("●n Progress")

- Evidence (prior): [j1-after-start](shots/tasks/j1-after-start.webp), [j3-subtask-form-open](shots/tasks/j3-subtask-form-open.webp) (green dot is painted over the "I").
- Fix: gap between dot and label (inline-flex gap). Size S. Test: geometry/visual.

### A-05 · P1 · motion/transition — Starting/stopping the timer shifts the whole project sheet by ~9px

- Evidence (prior): [j1-after-project](shots/tasks/j1-after-project.webp) (project sheet top y≈339) vs [j1-after-start](shots/tasks/j1-after-start.webp) (y≈348): the idle banner (72px) is replaced by the taller active banner (82px). `$T\s11.cjs` samples frames, `$T\s9.cjs` rect before/after. (Re-measure in this run, see A-05 re-check below.)
- Why: the list jumps under the pointer at the moment the user clicks Start/Stop; a "flow" break at the most frequent action.
- Fix: give idle and active banners the same fixed height. Size S. Test: geometry spec: `#project-tasks-sheet` y equal before/after start.

### A-06 · P1 · interaction-cost / a11y — Medium layout: Esc does not close the "New project" form, and the open form covers the task list so Start buttons cannot be clicked

- Where: Medium, 1024x768 (500px docked frame), en. Click `medium-new-project-btn`, press Esc → form still open (`esc closes form? true`). With the form open the Playwright click on `#start-btn-t-p1-0` fails for 15 s because "Cancel" / project item / form header "intercepts pointer events".
- Evidence (prior): `$T\s19.out`, [med-new-project-form](shots/tasks/med-new-project-form.webp) (form + project list overlay the task sheet; the running-timer banner is hidden).
- Fix: Esc closes the form; clicking outside closes it; keep the selected project name visible. Size S. Test: Playwright e2e (Esc closes new-project panel).

### A-07 · P1 · sense-of-solution — Task stats and project header duplicate the same number three times

- Evidence (prior): [core-full-1440-light-en](shots/tasks/core-full-1440-light-en.webp): "Total: 33:57:22" (header chip), "TOTAL DURATION 33:57:22" (stat card), project row pill "33:57:22". Three tall stat cards push "Add task" and the first task down to y≈573 of 900 (task list starts below the fold at 1440x900 with an active timer).
- Fix: collapse stat cards to a single compact line (duration · tasks · done%), keep Add Task at the top. Size M. Test: geometry (Add Task input within top 300px).

### A-08 · P2 · consistency — Eyebrow "SELECT PROJECT" is shown above an already selected project

- Evidence (prior): [core-full-1440-light-en](shots/tasks/core-full-1440-light-en.webp), [j1-after-start](shots/tasks/j1-after-start.webp).
- Fix: remove or replace with "PROJECT". i18n keys needed (all 10 locales). Size S.

### A-09 · P1 · interaction-cost — Task actions (billing $, logs, rename, delete) are icon-only, appear only on hover, ~12px, low contrast

- Evidence (prior): [full-hover-task-row](shots/tasks/full-hover-task-row.webp) (four glyphs "$ ◷ ✎ 🗑" between name and counter; invisible otherwise). No hover → no hint they exist; unusable on touch (phone PWA, A to verify).
- Fix: keep the hover reveal for desktop but show them on :focus-within, always show on touch (`@media (hover:none)`), enlarge hit target to 32px. Size S–M.

### A-10 · P2 · consistency — Task completion has two independent controls (checkbox vs status select)

- Evidence (prior): [j3-subtask-form-open](shots/tasks/j3-subtask-form-open.webp): task with unchecked checkbox and status "Done"; the checked "Implement responsive…" shows struck-through "TODO". (Seeded data; whether the checkbox sets status is to be verified in a new test — see Progress log.)
- Fix: single source: checking sets status Done and vice versa. Size M.

### A-11 · P2 · i18n/visual — Long task name truncated with "…" at ~45 chars although the row has free width

- Evidence (prior): [j3-subtask-form-open](shots/tasks/j3-subtask-form-open.webp) ("Implement responsive navigation menu with acc…" while the right half of the row is empty).
- Fix: allow 2-line wrap; add `title` tooltip. Size S.

### A-12 · P1 · responsiveness — Medium layout at ≥1024px renders a 500px column docked to the right with an empty 500px+ void on the left

- Evidence (prior): [medium-probe-1024](shots/tasks/medium-probe-1024.webp), [med-new-project-form](shots/tasks/med-new-project-form.webp); `$T\s19.out` frame rect `[36,20,500,728]` after dock toggle. The frame has the same size at 1440 ([medium-probe-1440](shots/tasks/medium-probe-1440.webp)).
- Why: the Medium layout is the tray-popup window layout; in a browser it looks like an unfinished mobile column. Decision to confirm with owner (browser has a "dock" toggle with no explanation).
- Fix: in browser runtime, centre it or fill; or explain Medium. Size M.

### A-13 · P2 · visual — Medium tab bar: active tab pill clipped at left edge, labels icon-only

- Evidence (prior): [medium-tabbar-zoom-1024](shots/tasks/medium-tabbar-zoom-1024.webp), [medium-tabbar-zoom-390](shots/tasks/medium-tabbar-zoom-390.webp), [medium-probe-1024](shots/tasks/medium-probe-1024.webp) (the active pill is cut square on the left and sits under the content card; tab bar is overlapped by the last task card).
- Size S. (Re-verify at zoom.)

### A-14 · P1 · interaction-cost — Subtask creation: "+ Subtask" opens an inline form but focus is not moved to its input (and Enter keeps the form open)

- Evidence (prior): `$T\s12.cjs` prints `focus after +Subtask` and `after Enter focus` (output not saved — re-run to confirm, TBD).
- Status: UNCONFIRMED, re-run before keeping.

### A-15 · P1 · visual / responsiveness — Long project name overlaps the "Total:" chip in the sheet header

- Where: Tasks, Full, 1440x900, light, select project p3 ("Internal Tools and Infrastructure Maintenance Programme 2026").
- Evidence (prior): [j2-after-select-p3](shots/tasks/j2-after-select-p3.webp) — the title "...Programme 2026" is painted across "Total: 21:45:00"; same in [m-hc-full-1440](shots/tasks/m-hc-full-1440.webp).
- Why: text collision on a plausible real-world name; no truncation/wrap on the title (the sidebar truncates, the header does not).
- Fix: `min-w-0 truncate` + `title` on the heading, or wrap to 2 lines and keep the chip shrink-0. Size S. Test: geometry spec (heading rect and total chip rect do not intersect, seeded long name).

### A-16 · P1 · responsiveness / interaction-cost — Phone 390px Full: the projects list fills the first screen; tasks are reached only after scrolling past 7 projects (~110px each)

- Evidence (prior): [phone-full-top](shots/tasks/phone-full-top.webp) (header 2 rows + tab bar + banner + "Projects (7)" card = whole viewport; footer clips "Database…"). In Medium ([phone-medium-top](shots/tasks/phone-medium-top.webp)) the tasks are directly visible via the project dropdown (much better flow).
- Fix: on narrow viewports default to the Medium pattern (project selector dropdown) or collapse the sidebar into a header selector. Size M–L. Test: Playwright viewport 390: first task start button within first viewport.

### A-17 · P1 · responsiveness / a11y — Phone Medium: subtask row action glyphs ("$", clock) overlap the TODO chip; sticky banner hides the running-timer card

- Evidence (prior): [phone-medium-top](shots/tasks/phone-medium-top.webp): in both subtask rows the "$" and clock icon sit on top of the `TODO` chip; the top status banner overlaps the active-timer card ("ACTIVE TRACKERS" strip is cut) — latter already reported by other audits (reference only).
- Fix: wrap action icons to their own line or into an overflow menu at <480px. Size S–M. Test: geometry at 390 (no sibling rect intersections inside a subtask row).

### A-18 · P2 · visual — Medium/phone tab bar: active pill is a rectangle cut off at the left with a different shape than the rest of the bar

- Evidence (prior): [phone-medium-top](shots/tasks/phone-medium-top.webp), [medium-tabbar-zoom-390](shots/tasks/medium-tabbar-zoom-390.webp). (merge with A-13 after zoom re-check)

## Interaction-cost table

(TBD, filled during this run)

## Works well, keep it

- Rename via blur commits ("Wireframes v3" appears after clicking elsewhere): [full-hover-task-row](shots/tasks/full-hover-task-row.webp)/[j6-after-archive](shots/tasks/j6-after-archive.webp) show the renamed task. (prior)
- Archive project has no confirmation and shows RESTORE inline ([j6-after-archive](shots/tasks/j6-after-archive.webp)). (prior)
- Edit-project dialog is complete and compact ([full-edit-project-dialog](shots/tasks/full-edit-project-dialog.webp)). (prior)

## Coverage table

(TBD)

---

## CONFIRMED IN RUN 3 (newly observed; append-only)

### A-19 · P0 (a11y, blocks keyboard-only) · a11y / interaction-cost — Projects cannot be selected with the keyboard; sidebar Tab order is 28 invisible stops

- Where: Tasks, Full 1440x900, light, en, 7 seeded projects. Script `$T\s20.cjs` (output below, reproduce: `node s20.cjs`): focus `#new-project-input`, press Tab until `#new-task-input`.
- Observed: 38 Tab presses to reach the task input. After "Add New Project" (stop 9) the next 26 stops (10-35) are the per-row buttons, ALL with computed effective opacity 0 (visible only on mouse hover): per row `edit-project-btn-pN` (accessible name only from `title`, no aria-label), `archive-project-btn-pN` (text "Archive", rendered 71x22 at opacity 0), `move-up-/move-down-project-btn-pN` (16x16 px), `delete-project-btn-p7`. The project row itself (`#project-item-pN`, a `<div onClick>`) is NOT a tab stop and has no role → a keyboard user can never select/switch a project; and they tab through invisible controls with no visible focus indication (opacity 0 stays 0 on `:focus`). Banner controls (`take-break-btn` stop 36, `stop-timer-btn` stop 37) come AFTER the 35 sidebar stops although they are above in the visual order.
- Exact buttons without a proper accessible name: `edit-project-btn-p1..p7` (only `title`, no `aria-label`, no text; 7 buttons) and `archive-project-btn-p1..p6` have a text name but no title (fine) — so the "unnamed" ones are the 7 edit buttons (+ `#project-item-*` rows which are unnamed non-semantic divs). Name of the move buttons and delete are OK.
- Code: src/layouts/parts/sidebar/SidebarProjectItem.tsx:21 (`HOVER_REVEAL_CLASS = 'opacity-0 group-hover:opacity-100'` has no `group-focus-within`), :148-153 (row `div` with `onClick`, no role/tabIndex/onKeyDown), :200-214 (edit button without aria-label), :254 (reorder VStack uses same class).
- Why it breaks the flow: no keyboard path for the most basic action (switch project); focus is "lost" on invisible elements; 38 stops before the tasks.
- Fix: make the row a `role="button"`/`option` (or a real `<button>` for the name) with tabIndex 0 + Enter/Space; `group-focus-within:opacity-100`; remove move up/down from the Tab order (roving tabindex, or drag/ArrowUp+Alt) and put the action cluster into one "⋯" menu button per row; add `aria-label` to edit. Size M. Test: Playwright e2e (Tab ×N lands on project row, Enter selects; no focusable element with opacity 0 — add a generic a11y geometry/computed-style spec).

Script output excerpt (`node s20.cjs`): `9 add-project-btn effOpacity 1` → `10 edit-project-btn-p1 effOpacity 0 box [210,557,24,24]` → … → `35 move-up-project-btn-p7 effOpacity 0` → `36 take-break-btn` → `37 stop-timer-btn` → `38 new-task-input`.

### A-01 root cause (confirmed by source)

- The "Created <date>" caption (the 1-3 char line) is clipped because the same row (SidebarProjectItem.tsx:190-197) places it beside the `shrink-0` action cluster (edit/archive/delete) which is `opacity-0` but still occupies ~100px of layout. So ~100px are reserved for invisible buttons; the caption gets what is left. Fix: overlay the action cluster absolutely or move the caption to full width; size S.

### A-05 CORRECTION (re-measured in run 3, `$T\s9.cjs`, `$T\s11.cjs`)

- First-project journey (empty app → add project → add task → Start): `#tasks-tree-container` rect y 604 → 613 (+9px) when the timer starts (s9 output: `tree rect before/after [553,604,749,73] [553,613,749,73]`). Cause: idle banner variant "All trackers stopped / Select a task below…" (~73px) is replaced by the active banner (82.5px).
- With a previously tracked task (idle banner "LAST TRACKED TASK … Resume", 82.5px) there is NO height change: s11 shows sheet y constant 346.5 for start and stop, banner slides 242→252 over ~300ms (smooth entry); on stop the active banner slides up and is swapped for the idle banner at t≈240ms without cross-fade (frames: banner null / idle y252 at 240ms).
- So severity P2 (only first-ever start + first minutes), still fixable with equal heights. Size S.

### A-20 · P1 · interaction-cost — After "Add project" via Enter, focus stays in the project input; the next natural step (task name) needs a pointer click

- Evidence (run 3, `$T\s9.cjs`): `focus after add project: new-project-input [Enter project name]`, tasks sheet already displayed for the new project. First-run journey therefore: type name, Enter, **click** task input (pointer travel from sidebar x≈300 to x≈800), type, Enter, **click** the small Start (play) icon. Good: after Enter in the task input, focus stays in the task input (batch entry works) and Enter in the project input works without clicking the button.
- Fix: after creating a project move focus to `#new-task-input` (the sheet is already selected); same pattern after "Add Task" (optionally stay for batch). Size S. Test: Playwright e2e (focus id after project creation).

### A-21 · P1 (data-affecting) · interaction-cost / a11y — Rename (and subtask add) drops focus to BODY, and the global Space shortcut then stops the running timer

- Where: Tasks, Full 1440x900, light, en, timer running (seed). `$T\s24.cjs`, output: `timer running at start: true` → rename Wireframes via pencil, Ctrl+A, type, Enter → `focus after rename Enter: BODY running: true` → one Space press → `running: false`.
- Same root in the subtask flow (`$T\s23.cjs`): after Enter in the subtask input `focus BODY form open? false`; typing a second name ("Second one") without re-clicking sent keystrokes to BODY; the space in it stopped the running timer (final screenshot [r3-after-add-task](shots/tasks/r3-after-add-task.webp) shows the idle banner "LAST TRACKED TASK … Resume" although the timer was running before).
- Code: src/common/hooks/useGlobalShortcuts.ts:19-27 (Space toggles timer whenever target is not INPUT/TEXTAREA/BUTTON); the editors unmount their input on Enter without restoring focus (src/features/tasks/components/TaskItem/TaskNameEditor.tsx; subtask form in TaskItem — TBD exact line).
- Why it breaks the flow: a user typing a task/subtask name can silently stop (or start) the timer — time-tracking data loss; plus focus is lost (no focus return) after the most common edits.
- Fix: return focus to the element that opened the editor (pencil/name) on commit/cancel; keep the subtask input mounted and focused for batch entry; make Space timer shortcut require an explicit modifier (Ctrl+Space exists already) or ignore it while any editor was just closed; show a toast/undo on stop. Size S–M. Test: Playwright e2e (after rename Enter, `document.activeElement` is the task row/pencil; Space does not toggle) + unit for useGlobalShortcuts.

### A-14 CONFIRMED (run 3, `$T\s22.cjs`, `$T\s23.cjs`)

- `+ Subtask` click: `focus after +Subtask: show-subtask-form-btn-t-p1-0` (input NOT focused; typing "a b" there toggles the form closed because Space activates the button, `form open? false`). After clicking the input, typing and Enter the form closes (`form open? false`) → one subtask costs: click "+ Subtask", click input, type, Enter = 3 interactions + typing, and a 2nd subtask repeats all of it. Esc closes the form (OK).
- Fix: autofocus the input on open; keep it open after Enter (Esc/blur closes). Size S.

### A-22 · P2 · motion/transition — Take Break swaps the active banner for a taller break banner: the whole task sheet jumps down 18px and back

- Evidence: `$T\s23.cjs`: running banner [y252,h82.5], sheet y 346.5 → break banner [y242,h100.5], sheet y 364.5 → after "Resume work now" sheet y 346.5 again. Screenshot [r3-break-1m](shots/tasks/r3-break-1m.webp). Three banner variants have three heights (idle "All trackers stopped" ≈73, active 82.5, break 100.5) → also see A-05.
- Fix: reserve one fixed banner height for all three states. Size S. Test: geometry spec (sheet y equal across states).
- Good: break banner has "Resume work now", "Auto-resuming in 00:59", a labelled Cancel (X) button and Take Break menu closes on Esc (focus returns to `take-break-btn`) and on outside click — keep.

### A-10 RETRACTED / REDUCED

- Run 3 (`$T\s21.cjs`): checking "Wireframes" sets its status to Done (`Wireframes / Done / … Counter`), so the checkbox and status ARE linked in that direction. The "Done + unchecked" rows seen earlier come from the earlier seed (statuses cycled independently of `completed`), not from app behaviour. Remaining true part: a running task still shows both its status chip and a separate "In Progress" badge (see A-03).

### A-23 · P2 · interaction-cost — Switching the timer to a task in another project: 1 click, no confirmation, banner swaps — works well

- `$T\s21.cjs`: running Homepage hero section (Website Redesign), select Mobile App (1 click), click Start on Push notifications → banner shows `Mobile App | Push notifications`; only `stop-btn-t-p2-1` remains (previous timer stopped). Focus goes to the new stop button. Toast "Synced" only.
- Weak spot: while the first timer is running, nothing in the task list of the other project tells the user that clicking play will stop the other task (single-timer mode); no feedback that task 1 was stopped (no toast). (P2, S: add a one-line "Switched from X" toast with Undo.)

### A-24 · P1 · responsiveness — Full layout at 1024x768: sidebar is squeezed so project names are cut to 1–2 characters and the "Add New Project" button overflows its card

- Where: Tasks, Full, 1024x768, light, en (seed, project p3 selected). `$T\s25.cjs` → `$T\s25.out`: ellipsized `Website Redesign [16/115]` (16px of 115 visible), `Mobile App [16/72]`, `Marketing [16/65]`, `Update CI pipeline [53/140]`, `Internal Tools and Infrastru [29/406]`.
- Evidence: [r3-sweep-full-1024-light-en-medium](shots/tasks/r3-sweep-full-1024-light-en-medium.webp): sidebar names show "W.", "M.", task name "Upda…", "Cache la…"; the orange "Add New Project" button is painted outside the grey form card (x≈369 vs card edge ≈313); the header subtitle "Rust & SQLite microORM engine • Multi-project background support" is cut by the language bar ("…suppor" under the bar; `overlaps: Rust & SQLite microO x en`). At 1440 the same names are readable.
- Why: 1024 is a very common laptop/tablet width; at it the sidebar is unusable (names are the only way to tell projects apart) and the project row keeps ~130px of reserved width for timer pill + invisible action buttons (see A-01/A-19).
- Fix: sidebar min-width 260px with the main column shrinking; move timer pill under the name below ~1100px; let the Add button wrap below the swatches (`flex-wrap`). Size M. Test: geometry spec at 1024 (name visible width ≥ 8ch; form button inside card rect).

### A-25 · P1 · responsiveness / visual — Long project name is hard-clipped (no ellipsis) in the Medium sheet header and collides with "Total" in Full (all themes/locales/sizes)

- Evidence: Medium 1440 [r3-sweep-medium-1440-light-en-medium](shots/tasks/r3-sweep-medium-1440-light-en-medium.webp) — "Internal Tools and Infrastructure Mainten|" cut at the card edge with no ellipsis, while the same name is correctly ellipsized in the selector row above ("…Maintenance Prog…"). Full: `s25.out` shows `Internal Tools and I x Total: (53x10)` and `x 21:45:00 (70x10)` in EVERY full cell (light/dark/high-contrast, en/pl/de, small/medium/large, 1440 and 1024) → A-15 is not theme/locale/size dependent; at size large the overlap grows to 53x20.
- Fix: `min-w-0 truncate` + `title`, chip `shrink-0` (Full: put chip below title at <1100px). Size S. Test: geometry spec (title rect ∩ chip rect = ∅) over the matrix.

### A-26 · P2 · responsiveness — Phone 390 Full: stat card labels clipped ("Total Duration", "Total Tasks", "Completed Tasks") and the footer license link overlaps the last visible tag chip

- Evidence: `s25.out` `== full 390x844 …  clipped: ["Total Duration","Total Tasks","Completed Tasks"]`, `overlaps: long-tag-name-exampl x MPL-2.0 License & Cr (88x18)` (footer covers content because the footer is a fixed bar over the scroll area; see [phone-full-top](shots/tasks/phone-full-top.webp), footer clips "Databas…").
- Fix: wrap labels; add bottom padding equal to footer height to the scroller; hide footer text links on narrow screens. Size S.

### A-27 · P2 · a11y / responsiveness — Interactive targets below 24px (WCAG 2.5.8 minimum) on the Tasks screen, including on touch

- Evidence: `s25.out` (visible, non-transparent targets <24px): Full 1440: 42 (color swatches 20x20, per-row sidebar buttons 16x16 reorder, 24x24 edit/delete), Medium touch 390: `check-task-*` 24x22, `clock-task-btn-*` 22x22, `check-subtask-*` 24x14 (14px tall subtask checkbox), "Large" text-size toggle 22x24. The sidebar's `move-up/down-project-btn-*` are 16x16 (from s20).
- Fix: min 32px hit area via padding/`::after` on icon buttons, ≥44px for touch. Size M. Test: geometry spec asserting target ≥24px (≥44 on `hover:none`).

### A-28 · P1 · motion/transition — Layout switch Full ↔ Medium is asymmetric: Full→Medium snaps, Medium→Full animates the frame while the full layout is already rendered inside it

- Evidence (`$T\s16.cjs` → `$T\s16.out`, frame rect `[x,width]` of `[data-testid="windowed-frame"]` every 50ms): Full→Medium: `[108,1280]` for 100ms with the Medium content already mounted (`medium:true`), then at 150ms jumps to `[848,540]` — a 740px pointer-less jump in one frame, no animation. Medium→Full: sidebar (full layout) is mounted while the frame is still `[450,540]`, then frame animates `385/670 → 193/1054 → 99/1242 → 80/1280` over ~300ms, so the full layout reflows ~6 times at intermediate widths. Screenshots (prior): [switch-full-to-medium-150ms](shots/tasks/switch-full-to-medium-150ms.webp), [switch-full-to-medium-300ms](shots/tasks/switch-full-to-medium-300ms.webp).
- Why: the layout switch is the one global "mode switch"; a snap in one direction and a reflowing animation in the other is exactly a "sharp spot".
- Fix: swap content after the frame width transition ends (or cross-fade with fixed frame), same order both ways. Size M. Test: frame-sampling Playwright spec (no more than one layout structure mounted per width bucket).

### A-29 · P2 · a11y / motion — `prefers-reduced-motion: reduce` is not honoured by the pulse/ping indicators

- Evidence (`s16.out`): `animations running under prefers-reduced-motion: {"pulse":6,"ping":2}` — identical to the normal-motion count `{"pulse":6,"ping":2}` (running-timer dot ping, pulsing status elements). Tab switch and project switch have no motion at all (frames identical) — fine.
- Fix: `@media (prefers-reduced-motion: reduce) { .animate-pulse,.animate-ping,.animate-spin-slow {animation:none} }` in src/styles/index.css. Size S. Test: unit/Playwright with `reducedMotion:'reduce'` asserting computed `animationName:none` on `.animate-ping`.

### Works well (confirmed run 3)

- Project selection survives Tasks → Reports → Tasks (`back to tasks selected project header: Website Redesign`).
- Tab switch Tasks→Reports is instantaneous without layout flash (frames stable).
- Idle banner remembers the last tracked task with a one-click "Resume" ([after-stop-seeded](shots/tasks/after-stop-seeded.webp), s11).

### A-06 RE-VERIFIED (run 3, `$T\s26.cjs`/`$T\s26.out`): Medium 1024: after opening "New project" `MED after Esc form still open? true`. (Enter submits and closes.)

### A-30 · P1 · interaction-cost / consistency — Medium: creating a project does not select it (Full does) and gives no confirmation

- Evidence (`$T\s28.cjs`): localStorage projects before `[..., 'Accounting','Old Archive']`, after typing "Medium Proj" + Enter `[..., 'Old Archive','Medium Proj']` (created) but `header: Website Redesign | 7 Total Tasks` (unchanged); the form just closes, the new project is not visible without opening the dropdown and scrolling to the end. Screenshot [r3-medium-create-after](shots/tasks/r3-medium-create-after.webp). In Full the new project is selected immediately (`$T\s9.out`: "tasks sheet shown").
- Why: the user's next action (add first task) is on the wrong project; invisible success → likely a duplicate create.
- Fix: select the created project and put focus in `#new-task-input`, same as Full. Size S. Test: Playwright e2e in Medium (header shows new name).

### A-31 · P1 · interaction-cost — A newly added task is appended below the fold and the list is not scrolled to it

- Evidence (`$T\s27.cjs`, Full 1440x900, project p1 with 7 tasks): `Zeta row: {"y":1238,"h":24,"coveredBy":"DIV.h-[100dvh]…","footerTop":844,"scroller":"layout-main","scrollTop":0,"maxScroll":474}` — the new row is at y=1238 in a 900px viewport and the scroller stays at scrollTop 0; the only feedback is the "Total tasks" counter. Screenshot [r3-add-task-long-list](shots/tasks/r3-add-task-long-list.webp).
- Why: Enter in the input appears to do nothing for any project with more than ~4 tasks; users re-submit or hunt for the row.
- Fix: scroll the new row into view (`scrollIntoView({block:'nearest'})`) and flash a highlight; or insert new tasks at the top. Size S. Test: Playwright e2e (new row within viewport after add).

### A-32 · P2 · a11y / interaction-cost — Focus return is inconsistent: billing and logs dialogs return focus to the trigger, the delete-task confirm does not

- Evidence (`s26.out`): logs popover Esc → `clock-task-btn-t-p1-0`; billing dialog Esc → `billing-task-btn-t-p1-0`; delete-task confirm (initial focus correctly on Cancel `confirm-dialog-cancel-btn`) Esc → `BODY`. With A-21 (Space = toggle timer on BODY) this makes Esc-after-delete-dialog + Space stop the timer.
- Code: src/components/ConfirmDialog.tsx (unmounts the trigger row on delete / does not restore focus), src/features/tasks/components/TaskItem/* (delete button). Fix: restore focus to the next row (or the task input) after delete/cancel. Size S.
- Good: delete task dialog warns with data loss count ("5 logged time record(s) … will be lost"), default focus is Cancel; delete project is only offered for projects without time, otherwise "Archive" is offered (see s17/s20) — sensible.

### A-33 · P2 · sense-of-solution / responsiveness — Medium layout leaves ~42% of the window for tasks

- Evidence (`$T\s28.cjs`, 1024x768): header 21→120, status banner + project selector + (hidden) active banner up to y≈321, task area `#tasks-main` y 321→644 (323px of 768), tab bar 648→735, footer 712→747 (tab bar overlaps footer region). Screenshot [r3-sweep-medium-1440-light-en-medium](shots/tasks/r3-sweep-medium-1440-light-en-medium.webp) shows the project title row + total chip + Add Task already consuming the visible area before the first task.
- Why: Medium is the "quick" view; 2 stacked chrome bars (header 99px + status banner ~85px) + selector ~75px + tab bar ~87px = 346px of chrome.
- Fix: drop the status banner in Medium (it is already known-redundant, see reported items), merge selector + active timer into one row. Size M.

### A-34 · P2 · sense-of-solution — Project row shows hover-only edit/archive/reorder controls AND double-click-to-rename AND a separate edit dialog: three ways to edit one name, none discoverable without hover

- Evidence: `$T\s7.cjs` (prior): `dblclick project name → input in sidebar row` (inline rename), `#edit-project-btn-p2` opens the edit dialog ([full-edit-project-dialog](shots/tasks/full-edit-project-dialog.webp)), `#archive-project-btn-p5` archives immediately ([j6-after-archive](shots/tasks/j6-after-archive.webp), no confirmation — good, with RESTORE).
- Fix: keep dblclick rename (fast) + one visible "⋯" menu; hide nothing at opacity 0 (see A-19). Size M.

### A-35 · P2 · sense-of-solution — "Quick Starter Templates / Launch your workflow with one click" creates only an empty project; cards give no readable title or description

- Evidence (`$T\s29.cjs`): click `starter-template-software-dev` → projects `["Software Engineering"]`, tasks `0`, project selected, focus `BODY`. Card is 144x74px, text "Software Engineering | Track features, code reviews, …" is truncated ("Software E…") and has no `title` attribute (`title attr: null`). Screenshot [r3-after-template](shots/tasks/r3-after-template.webp); layout collision see A-02.
- Why: the promise "launch workflow" is delivered only as a project with a tag; the user still has to invent tasks.
- Fix: seed 3–5 starter tasks per template, or relabel to "Start with a preset project"; add `title`/wrap. Size M (i18n for 10 locales). Test: unit on `resolveStarterTemplate` + e2e.
- Code: src/layouts/parts/ProjectEmptyState.tsx:51-61 (card, `truncate` title), src/common/templates/starterTemplates.

---

## CODE REFERENCES (grep in run 3)

- A-01/A-19/A-34: src/layouts/parts/sidebar/SidebarProjectItem.tsx:21 (`HOVER_REVEAL_CLASS`), :146-160 (row `div onClick`), :190-197 (Created caption), :197 (invisible `shrink-0` action cluster), :200-250 (edit/delete/archive buttons), :254-285 (reorder buttons).
- A-03: src/features/tasks/components/TaskItem/TaskHeader.tsx:135 (`InProgressLabel` badge), :142 (`Entity #{rootTask.id} (Active timing)`).
- A-08: src/features/tasks/components/ProjectHeaderCard.tsx:56 (`tProject("SelectProject")` badge when not condensed).
- A-15/A-25: src/features/tasks/components/ProjectHeaderCard.tsx:60-71 (Heading inside `HStack`; inner span has `truncate` but the flex item has no `min-w-0`, overlap observed anyway).
- A-07: src/features/tasks/components/ProjectHeaderCard.tsx:109-127 (3-column `StatCard` grid above the Add Task input).
- A-05/A-22: src/layouts/parts/ActiveTimerBanner.tsx:81-95 (active), :179-190 (idle); break banner is a third variant (`active-timer-break-banner`).
- A-14/A-21: src/features/tasks/components/TaskItem/SubtaskForm.tsx:34-37 (form + `Input`, no autoFocus), TaskItem.tsx:86-91,148 (`AnimatedCollapse` on `showSubtaskFormForId`), TaskNameEditor.tsx:38-53 (Escape/blur commit, no focus return), src/common/hooks/useGlobalShortcuts.ts:19-27 (Space toggles timer when target is not input/button).
- A-28: src/layouts/components/WindowedLayoutContainer.tsx:83-85 (`transition-all duration-300` on frame; content variant mounted immediately).
- A-29: no `prefers-reduced-motion` rule in src/styles/*.css (grep "reduce": no match); animations at ActiveTimerBanner.tsx:85,183 (`animate-pulse`), :90,188 (`StatusDot ping`).
- A-02/A-35: src/layouts/parts/ProjectEmptyState.tsx:28-61.
- A-06/A-30: src/layouts/parts/MediumProjectSelector.tsx (no `Escape` handler: grep no match); form `data-testid="medium-new-project-input"`.

---

## INTERACTION-COST TABLE (observed in this run; keystrokes of typed text excluded)

| Journey (Full 1440 unless noted) | Observed steps today | Source | Where a step can go |
| --- | --- | --- | --- |
| First project + first task + start, empty app | click project input (initial focus is BODY) · type · Enter · **click** task input · type · Enter · **click** Start icon = 3 clicks + 2 Enter; pointer travel ≈500px sidebar→task input, ≈600px input→play icon | s9 | Autofocus project input; after Enter focus task input (A-20); Ctrl+Enter = add & start. Min: Enter · Enter · Ctrl+Enter |
| Same via starter template | 1 click → empty project (0 tasks), focus BODY; then click task input, type, Enter, click Start | s29 | Seed starter tasks (A-35), focus task input |
| Switch timer to a task in another project | click project (1) · click play (1) = 2 clicks, no confirmation, previous timer stops silently; pointer travel ≈900px sidebar→play | s21 | Click count OK; add "Switched from X" toast with Undo |
| Add subtask and start it | click "+ Subtask" · click input (focus not moved) · type · Enter (form closes) · click new play = 3 clicks + Enter | s22/s23 | Autofocus input (−1 click), keep form open for batch, Ctrl+Enter = add & start (−1 click) |
| Stop for the day | 1 click on Stop (banner, top right) or Space with non-input focus (undiscovered; unsafe after focus loss, A-21) | s21/s24 | OK; put shortcut in Stop button title |
| Take a break | click Take Break · click duration = 2 clicks; Esc/outside closes menu, focus returns; break banner has Resume + Cancel | s22/s23 | OK; remember last duration |
| Rename a task | hover + click hidden pencil, or double-click name (1) · type · Enter/blur; focus ends on BODY (A-21) | s21/s24 | Return focus to row |
| Rename a project | double-click name (1) · type · Enter; Esc cancels; or hover → pencil → full dialog (2 clicks) | s7 (prior) | Fine; remove duplicate path |
| Archive a project | hover + click ARCHIVE (2 steps), no confirmation, RESTORE inline | s17 (prior) | Good; add Undo toast; no keyboard path (A-19) |
| Delete a project | only offered when it has no time; trash → confirm (focus on Cancel) → Delete = 3 steps | s17/s20 | OK |
| Add a task to a long list | click input · type · Enter; new row appended below the fold, no scroll (A-31) | s27 | scroll into view / insert at top |
| Create project in Medium | click + · type · Enter; not selected afterwards (A-30); Esc does not close (A-06) | s26/s28 | select new project; Esc |

## WORKS WELL — KEEP IT (all observed)

- Enter creates a project and a task without touching the buttons; Enter in the task input keeps focus there for batch entry (s9).
- Switching the running timer to another project's task is one click, no modal; banner updates; only the new task's stop control remains (s21).
- Idle banner remembers the last tracked task with one-click "Resume" (s11, [after-stop-seeded](shots/tasks/after-stop-seeded.webp)).
- Break banner: countdown, "Resume work now", Cancel, auto-resume text; menu closes on Esc/outside click and focus returns to the trigger (s22/s23).
- Task and project rename commit on blur; double-click on the name starts editing (s7, s17, s26).
- Archive is immediate and reversible inline (RESTORE); delete project only offered when no time exists, otherwise archive — protects data (s20, s17).
- Delete-task confirm states how many time logs are lost and focuses Cancel by default (s26).
- Billing and logs dialogs return focus to their trigger (s26).
- Selected project survives tab switches; tab switch has no layout flash (s16).
- Medium 390 keeps project selector + tasks in the first screen — more direct than Full at 390 (A-16, [phone-medium-top](shots/tasks/phone-medium-top.webp)).
- Edit Project dialog is compact and complete ([full-edit-project-dialog](shots/tasks/full-edit-project-dialog.webp)).
- No horizontal page scroll in any of the 13 sweep cells (`s25.out`: `hscroll:false`).

## COVERAGE TABLE (honest)

Legend: **J** journey executed with measurements; **S** automated sweep metrics (clip/overlap/target size/hidden focus) + screenshot saved; **V** screenshot actually viewed; **P** prior-run evidence only; **–** not tested.

| Cell | Full | Medium |
| --- | --- | --- |
| 1440x900 light en, text medium | J, V | J (Esc/new project/create), S, V |
| 1440x900 dark en | S (prior core-dark shot not re-viewed) | – |
| 1440x900 high-contrast en | S, V | – |
| 1440x900 light pl / de | S (screenshots saved, not viewed) | – |
| 1440x900 text small / large | S (not viewed) | – |
| 1024x768 light en | S, V | P + V (medium-probe-1024) |
| 1024x768 dark de large | – | S (not viewed) |
| 390x844 light en | S, V (top only; Full journeys at 390 NOT run) | S, V (top only; no journey at 390) |
| 390x844 light pl large | – | S (not viewed) |
| First-run empty app | J (1440 en), V; de/390 only P | P (390 empty-medium) |
| Compact layout, tray, Tauri | out of scope | out of scope |

Not tested / limits: drag-and-drop reorder (only the up/down buttons were exercised); keyboard operation of the Medium layout beyond Esc/focus checks; `:hover`/`:active`/`disabled` styling only via screenshots (project/task row hover); screen-reader announcements (accessible names checked via DOM attributes only); real touch gestures (Playwright `hasTouch` only); Alt+digit shortcuts (reported elsewhere). A-09 touch note: on Medium 390 the task action icons are visible without hover ([phone-medium-top](shots/tasks/phone-medium-top.webp)); the hover-only reveal was verified only in Full desktop ([full-hover-task-row](shots/tasks/full-hover-task-row.webp)); Full at 390 touch was NOT verified.

## FINAL SUMMARY

- Active findings: 32 (A-10 retracted, A-18 merged into A-13, A-15 merged into A-25). P0 = 1 (A-19), P1 = 17, P2 = 14.
- P0: A-19. P1: A-01, A-02, A-03, A-06, A-07, A-09, A-12, A-14, A-16, A-17, A-20, A-21, A-24, A-25, A-28, A-30, A-31. P2: A-04, A-05, A-08, A-11, A-13, A-22, A-23, A-26, A-27, A-29, A-32, A-33, A-34, A-35.
- Regression-test feasibility: geometry specs (like layout-alignment-geometry.spec.ts) fit A-01, A-02, A-05/A-22, A-07, A-13, A-15/A-25, A-17, A-24, A-26, A-27; Playwright e2e via Page Objects fit A-06, A-14, A-19, A-20, A-21, A-30, A-31, A-32; Vitest unit fits A-21 (useGlobalShortcuts); A-29 via Playwright `reducedMotion:'reduce'` computed style.
