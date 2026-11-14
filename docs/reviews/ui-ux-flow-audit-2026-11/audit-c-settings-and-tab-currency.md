# AUDIT-C findings: Settings / Backup / Manual / Credits + tab currency (browser runtime)

Scratch root: `C:\Users\Krzysiu\AppData\Local\Temp\claude\4fe3aaad023df462\e87bbf6b-161a-4c90-a56f-6e067449689d\scratchpad\ui-audit\settings`
Shots dir: `...\settings\shots\` (abbrev `S/` below = `C:\Users\Krzysiu\AppData\Local\Temp\claude\4fe3aaad023df462\e87bbf6b-161a-4c90-a56f-6e067449689d\scratchpad\ui-audit\settings\shots\`)
Dev server: <http://127.0.0.1:5183/> (reused, alive at start of worker 3)

## Progress log / next steps (update continuously)

- [worker 3] dev server had died; restarted on 5183 (bun run dev, DEV_PORT=5183).
- [worker 3, step 1] Read all prior scripts/.out and 7 key screenshots; wrote findings C-01..C-17 from prior-run evidence (no new experiments yet).
- Prior-run gaps (matrix never finished): `m4.out` EMPTY (Medium layout run died), `m5` (pl/de/ja) and `m6` (text small/large) never ran. expB/expD ended with "Target crashed" (see C-17) so: 2nd import merge-vs-replace, de/ja geometry, tab-switch frames are UNKNOWN.
- NEXT: (a) tab-currency: read ManualTab/CompilationGuideCard/KeyboardShortcutsCard/CreditCard vs README/CHANGELOG/manifesto; (b) Medium layout + Alt+N shortcuts + hidden shortcuts of Manual card; (c) themes; (d) pl/de/ja; (e) text sizes; (f) interaction-cost table; (g) a11y of header icon toggles; (h) stop dev server on 5183 at end.

---

## Findings

Legend: sev P0 broken / P1 flow friction / P2 polish. Size S/M/L. "prior" = from prior run evidence.

### C-01  P1  interaction / dead-end  Alt+3 lands on a hidden tab: blank content, no tab selected  (prior: expA2.out, A-alt3-hidden-db.png)

- Where: Full layout, 1440x900, light, en, browser runtime.
- Repro: focus body, press Alt+3. Active tab list is empty (`Alt+3 tabs []`), the content area below the status banner is completely empty (screenshot).
- Evidence: `S/A-alt3-hidden-db.png`; `src/layouts/hooks/useLayoutManagerOrchestrator.ts:100-104` indexes `APP_TAB_IDS` (`src/common/types/navigation.ts`: tasks, reports, **db**, settings, backup, **cli**, manual, credits) instead of the tabs actually rendered. In the browser runtime db and cli are hidden, so Alt+3 = db (blank), Alt+4 = settings, Alt+5 = backup, Alt+6 = cli, Alt+7 = manual, Alt+8 = credits; the visible tab order is therefore not Alt+1..6. (Alt+6/cli not yet verified live.)
- Why it breaks flow: the user is thrown into an empty view with nothing highlighted; the only way out is the mouse.
- Fix: map the Alt+digit to the visible tab list (the same list TabBar renders); unit-test the mapper. Size S. Test: Playwright e2e (press Alt+3 -> `tab-settings` aria-selected) + unit test for the mapper.

### C-02  P1  stale-content / sense-of-solution  Manual tab: shortcut card describes desktop tray behaviour in the browser  (prior: 1440-light-manual-expanded.png)

- Where: Manual, Full, all viewports (default state).
- Observed text: "TimeLog by oXyFlow relies on an embedded tauri daemon, meaning the underlying C++ and SQLite engine does not die when you close the interface (via the "X" button)"; tiles "Toggle interface (Minimize to Tray) ESC / X", "Fast global restore (Global Shortcut) CTRL+SHIFT+O", "Emergency stop all timers CTRL+SHIFT+X". None of tray / daemon / global shortcut exists in the browser/PWA runtime. Prior expA.mjs fired Escape, Control+Shift+O, Control+Shift+X (output lost): to be re-verified live (see next steps).
- Evidence: `S/1440-light-manual-expanded.png`, component `src/features/settings/components/KeyboardShortcutsCard.tsx`.
- Fix: gate tiles by PlatformCapabilities (tray/global shortcut only when present); add the browser-valid shortcuts (Alt+1..N tab switch, Space / Ctrl+Space timer). Size S-M. Test: unit test of the card with browser vs tauri capability providers.

### C-03  P2  stale-content  Manual tab title and subtitle promise content that is not there; section numbering starts at "II."  (prior: 1440-light-manual-expanded.png)

- Observed: header "Compilation Manual, Shortcuts & Arch (Tauri OS Guides)" with subtitle "Step-by-step guide to building production binaries and an overview of shortcuts and daemons." The tab bar calls the tab "Manual". Only one card is visible, titled "II. Keyboard Shortcuts & System Tray Daemon" (no "I."), the rest of the page is empty (large empty area under the card at 1440x900).
- Fix: either show the compilation guide (CompilationGuideCard, check why it is absent in browser) or retitle to what the page contains; renumber sections. Size S.

### C-04  P1  consistency / stale-content  Three different version numbers  (prior: all shots header, 1440-light-settings-expanded.png)

- Observed: header badge "v18"; Settings > oXyFlow Versions card "App Release v1.14.5", Engine v1.14.26, Front v1.14.18, Components v1.14.5, Translations v1.14.2. The badge is only the "front" sub-version (`src/layouts/components/header-parts/AppLogo.tsx:30` prints `v{metadata.versions.subversions.front}`), so "v18" means nothing to a user. Also the version card lives at the very bottom of Settings while Credits & Thanks (where users look for "about") has no versions.
- Fix: badge shows `metadata.version` (1.14.5); move AppVersionsCard to Credits (or add link). Size S. Test: unit test comparing badge text with metadata.json.

### C-05  P1  stale-content / sense-of-solution  Browser runtime still advertises native stack  (prior: all shots)

- Observed (every tab): header tagline "Rust & SQLite microORM engine • Multi-project background support"; footer "oXyFlowOS Environment — LocalStorage Engine" + link "Database Management" (db tab is hidden in this runtime); Backup card "JSON / SQLite Backup", "dump of the entire SQLite database"; Settings cards "Engine Options & Daemons", "Destructive Zone ... stored in this browser's LocalStorage"; status banner "Engine synchronized ● parallel tracking threads (projects run concurrently)" with a tiny stray glyph between "synchronized" and "parallel" (looks like a half-rendered `e`/bullet, needs zoom check).
- Why: the user is told they run SQLite and daemons while the same screen says LocalStorage; "Database Management" link leads to a tab not shown in the tab bar (need to verify where it goes).
- Fix: runtime-aware strings (PlatformCapabilities), remove "Database Management" link when db tab hidden. Size M.

### C-06  P2  consistency / visual  Duplicate and developer-jargon headings in Settings  (prior: 1440-light-settings-expanded.png)

- Observed: page h2 "Interface & Application Settings" is repeated as the title of the first card; "Holidays & Regional Settings" h2 then card "Holidays & Vacations" then inner accordion "REGISTER NEW DAY OFF (SQL INSERT)" and "holidays_leaves table (6 records)" with badge "RESOURCE DATABASE TABLE". Holiday names are Polish ("Nowy Rok (New Year)") although locale is en.
- Also the table shows 5 rows (h1..h5) but footer says "Total: 6" and "6 records": the 6th row is not visible without a scroll affordance (to verify).
- Fix: drop the duplicate card title, use plain wording ("Add day off", "Holidays and leave"), no SQL jargon. Size S.

### C-07  P2  sense-of-solution  Order of Settings cards; reset separated from backup  (prior: 1440-light-settings-expanded.png)

- Observed order: Interface/Language, Display Timezone, Engine Options & Daemons, Automated Workflows, Holidays, Destructive Zone, Versions. The destructive reset lives in Settings, export lives in the Backup tab, so "back up, then reset" needs a tab hop; the confirmation dialog (B-reset-dialog.png, to be reviewed) is the only place to learn about it.
- Fix: put reset next to backup, or offer "Export backup first" inside the reset dialog. Size S-M.

### C-08  P1  interaction / validation  Auto-stop hours field: max not enforced, clearing snaps to 1  (prior: expA2.out)

- Repro: Settings > Automated Workflows > tick Continuous Working Limit; type 99 -> field keeps 99 (input has `max={24}`); clear the field -> it immediately shows 1, so the user cannot empty the field to type a new value without the "1" prefix.
- Evidence: `expA2.out` ("typing 99: 99", "after clear: 1"), `src/features/settings/components/automation/AutomationHoursLimitSection.tsx:49-50` (`Math.max(1, Number(e.target.value) || 1)`, no upper clamp). Value persists immediately to `oxytime_workflow_config` (good, no save step).
- Fix: keep a local draft string, clamp 1..24 on blur, show invalid state. Size S. Test: unit test of the section + e2e.

### C-09  P1  interaction / validation feedback  Invalid backup file: generic message, stays on screen  (prior: expC.out)

- Repro: Backup > Restore / Import with `{"projects":"nope"}` or a non-JSON file.
- Observed: banner "SYSTEM NOTIFICATION TRAY — Invalid backup file." (same text for both causes) still present after 3.4 s. Real cause (`'projects' must be an array`, `Unexpected token`) goes only to the console (`DatabaseBackupCard.tsx:34-40`). Data stayed intact (3/7/12), good.
- Why: user cannot tell what is wrong with the file; banner label "SYSTEM NOTIFICATION TRAY" is desktop wording.
- Fix: show the validation reason (missing array X / not JSON) and use a dismissible toast. Size S. Test: e2e on Backup page object.

### C-10  P2  consistency  Custom translation editor accepts unknown keys silently  (prior: expC.out)

- Repro: Settings > Custom Language: key `NoSuchKeyAtAll`, value `Hello`, Save -> entry `common.NoSuchKeyAtAll` added to the list with no warning. Empty key shows "Translation key cannot be empty" (good). Domain select lists 12 domains (good).
- Fix: validate key against the domain key list (same rule as domain). Size S.

### C-11  P2  a11y  Reset dialog: focus is not returned to the trigger after Escape  (prior: expB.out)

- Observed: dialog opens with focus on "Cancel" (good), Escape closes, `document.activeElement` = BODY, not `hard-reset-btn`. By contrast the language modal returns focus to `open-language-modal-btn` (expC.out).
- Fix: restore focus in ConfirmDialog. Size S. Test: Playwright focus assertion.

### C-12  P2  a11y / motion  prefers-reduced-motion is not honoured by the active tab icon  (prior: expD.out)

- Observed with `reducedMotion: 'reduce'`: active tab icon still runs animation `pulse / 2s`; gear and credits heart icons are static.
- Fix: wrap in `motion-safe:` or media query. Size S.

### C-13  P1  motion / layout shift  Switching language moves header and tab bar  (prior: expD.out)

- Observed geometry (1440x900): en header height 89, tab bar y=110; after pl header height 79, tab bar y=100 (all content moves 10 px up), language selector moves from x=713,y=69 to x=824,y=31 (tab x positions also change 113/229/359/495/682/808 -> 113/243/373/491/666/810). de/ja not measured (run crashed).
- Why: choosing a language visibly jerks the whole page.
- Fix: fixed header height / fixed-width tab slots, or wrap rules so header height is locale independent. Size M. Test: geometry spec comparing header/tab bar rects across locales.

### C-14  P2  sense-of-solution  Language can be set in three places  (prior: 1440-light-settings-expanded.png)

- Observed: header language bar (EN PL DE ... SYSTEM), Settings "Quick language selection" tiles, and an "Add Language" modal. Theme / layout / text size exist only in the header (no Settings card for them). Settings card claims "Language explicitly locked to user preference." for the one that is selected.
- Fix: decide a single home (header for fast switch; Settings for the rare override editor), remove the duplicate tiles or keep as the only place. Size M.

### C-15  P2  responsiveness  390x844: language tile label truncated  (prior: m3.json)

- Observed by DOM probe: "Português (Brasil)" `scrollWidth 100 > clientWidth 79` in light and dark, Settings. No horizontal page overflow in any of the 390/1024/1440 x light/dark x 4-tab cells probed (m1/m2/m3.json: hOverflowDoc=false, hOverflowMain=false).
- Fix: shorter label (PT-BR) or allow wrap. Size S.

### C-16  P1  interaction  Backup tab hierarchy: both cards collapsed by default hide the primary actions  (prior: 1440-light-backup-default.png vs -expanded)

- Observed: Backup tab content ("Export Backup JSON", "Restore / Import Backup JSON") is inside collapsible cards; "Send logs to external API" card sits below with a checkbox titled identically to its header ("Send logs to external API" twice). (Prior shots show these expanded; default-collapse state to be confirmed.)
- Needs verification before counting. (kept as candidate)

### C-17  note (not an app finding yet)  Chromium "Target crashed" during prior runs

- expB (screenshot after invalid import) and expD (clicking `lang-btn-de`) died with "Target crashed". Not reproduced in isolation yet; do not report as an app defect unless reproduced. To retest with a single browser.

---

## Works well, keep it (observed)

- Restore round trip: export 3 projects/7 tasks/12 logs -> hard reset (state emptied) -> import -> 3/7/12 back, plus 6 holidays, tasks visible again (expB.out). File name `TimeLog_Backup_2026-11-13.json`.
- Settings apply instantly with no save step: workflow config written to storage immediately, timezone change shows "Active timezone: Asia/Tokyo" at once (expA2.out); API URL persisted across reload.
- Reset dialog defaults focus to the safe "Cancel" and closes on Escape (expB.out).
- Language modal returns focus to its trigger (expC.out).
- Space / Ctrl+Space toggle the timer (expA2.out).
- No horizontal overflow at 390/1024/1440 for the four tabs (m1-m3.json).

## Tab-currency table (to be completed)

| tab | item | what the UI says | what is true now | action |
| --- | --- | --- | --- | --- |
| all | header badge | "v18" | metadata.json version 1.14.5, front sub-version 18 (AppLogo.tsx:30) | show 1.14.5 |
| all | tagline/footer | "Rust & SQLite microORM engine", "LocalStorage Engine" | browser uses LocalStorage only | runtime-aware strings |
| manual | title | "Compilation Manual, Shortcuts & Arch (Tauri OS Guides)" | page shows one shortcuts/tray card only | retitle / restore guide |
| manual | shortcuts | ESC/X tray, CTRL+SHIFT+O global restore, CTRL+SHIFT+X emergency stop | tray/global shortcut are desktop only; Alt+digit tab switch undocumented, hits hidden db (C-01) | gate by capabilities |
| settings | versions card | App Release 1.14.5 | consistent with metadata.json, wrong place | move to Credits |
| (pending) | README, CHANGELOG and manifesto comparison; Credits dependencies and authors; Medium tab set; pl/en tab labels | not completed: the worker stopped on an API error | — | — |

## Interaction-cost table (to be completed)

| task | clicks + keys | note |
| --- | --- | --- |
| change language | 1 click (header bar) | (verify) |
| backup and restore | export 1 click; restore: reset 3 clicks (tab, card, button, confirm) + import 1 click + file pick | (measure) |
| (pending) | not measured: the worker stopped on an API error | — |

## Coverage table

| cell | status |
| --- | --- |
| 1440x900 light, 4 tabs default+expanded | tested (prior) |
| 1440 dark / high-contrast (hc) | screenshots + overflow probe only, not looked at in this worker yet |
| 1024x768 light/dark | screenshots + overflow probe, not yet looked at |
| 390x844 light/dark | screenshots + overflow probe, not yet looked at |
| other themes in themeRegistry | NOT tested |
| Medium layout | NOT tested (m4 run died) |
| pl / de / ja | pl geometry only (expD); de/ja NOT tested |
| text size small / large | NOT tested |
| reduced motion | tested (expD) |
| keyboard-only, focus return | partly (dialogs) |

---

## Additional findings (worker 3, code + doc comparison, appended in order of discovery)

### C-18  P1  stale-content  Manual tab hides the compilation guide in the browser, so the title/description describe a page that does not exist here  (code: ManualTab.tsx)

- `src/features/settings/ManualTab.tsx:28-33` renders `CompilationGuideCard` only when `hasNativeDaemon`; `AppBrowser.tsx` sets `hasNativeDaemon: false`. The heading keys `help.Title` / `help.Description` are not runtime-aware (see C-03). Confirms C-03 root cause. Merge C-03 + C-18 when reporting. Fix S: runtime-specific title/description keys.

### C-19  P1  stale-content  Shortcut card is not capability-gated except CLI row  (code: KeyboardShortcutsCard.tsx:29-52)

- Tiles "Toggle interface (ESC / X)", "Global restore (CTRL+SHIFT+O)", "Emergency stop (CTRL+SHIFT+X)" are always rendered; only the CLI tile uses `canUseCli`. `useGlobalShortcuts.ts` registers only: Ctrl+`, Space / Ctrl+Space (timer), Alt+1..8 (tab by index), Escape (blur / close drawer). There is no handler for Ctrl+Shift+O or Ctrl+Shift+X in the browser code path (grep: only`useGlobalShortcuts.ts` references Alt/Digit). "ESC / X" is documented as "minimize to tray" but Escape only blurs the focused element. Live confirmation scheduled.
- Fix S-M: capability-gate + list real shortcuts (Alt+1..N, Space, Ctrl+Space, Ctrl+`).

### C-20  P1  stale-content  PWA: nothing tells the user how to install it  (code: AppBrowser.tsx:16, PlatformCapabilitiesContext.ts:12)

- `isPwaInstallable: true` is declared but read nowhere (grep `isPwaInstallable`: only declarations). No `beforeinstallprompt` handler in `src/`. Manual tab has no install instructions; banner says "PWA READY / ONLINE" only. vite-plugin-pwa manifest exists in `vite.config.ts:22`. So the install path is the browser's own menu, undiscoverable from the app. Interaction cost for "find out how to install the PWA": not answerable inside the app (infinite).
- Fix M: `beforeinstallprompt` -> an "Install app" button in the Credits/Manual or the banner (only when installable), plus text for iOS Safari ("Share > Add to Home Screen"). Test: unit test with mocked event.

### C-21  P2  stale-content  User guide and README disagree with the real UI  (docs vs UI)

- `docs/manifesto/USER_GUIDE.md:132-139` says "12 built-in themes" (Slate, Indigo, Emerald, Amber, Rose ...); `src/styles/themeRegistry.ts` registers 3 themes (light, dark, high-contrast) plus "system" in the header; README says three themes (correct).
- USER_GUIDE:141 "In Settings, adjust the UI scale": text size and theme live in the header, not Settings.
- USER_GUIDE:172 "Settings -> Language, click Configure Language (SlidersHorizontal)": UI button is "Add Language".
- USER_GUIDE:317-323 "Settings -> Backup ... Database & State Backup card ... `import-backup-btn`; Safe scoped reset in Settings -> Database Operations": UI has a top-level Backup & Export tab with card "JSON / SQLite Backup", test id is `import-backup-input`, reset card is "Destructive Zone (Dangerous)" in Settings.
- CHANGELOG.md newest released heading is `[1.12.7]` while metadata.json/package.json are 1.14.5; everything since sits under `[Unreleased]`.
- Fix S (docs only).

### C-22  P2  sense-of-solution  Credits tab content is personal copy, partly inaccurate for the browser  (code: CreditsTab.tsx:10, screenshot 1440-light-credits-expanded.png)

- Tech badges are a hard-coded list `['React','Tauri','Rust','SQLite','TailwindCSS','Bun']` (CreditsTab.tsx:10), not derived from package.json (Vite, Recharts, Base UI, lucide, sonner are used; SQLite is not used in the browser). Copy "Core Team (Me, AI & Caffeine)", "Copyright (c) 2026 TimeLog by oXyFlow Team". No link to repo (metadata.json has `repository`, `homepage`), no versions, no license link.
- Fix S: derive badges from a list in metadata; add repo link + version.

### C-23  P2  consistency  Medium layout exposes only tasks / reports / settings  (code: navigation.ts)

- `MEDIUM_TAB_IDS = ['tasks','reports','settings']`: Backup, Manual and Credits (and the PWA info) are unreachable in Medium layout, and the Backup is the only place for export/import; to be checked live whether Settings in Medium offers a link. (verify, prior m4 died)

### Live confirmations (expE.out, worker 3)

- **C-01 confirmed live**: Alt+1 tasks, Alt+2 reports, **Alt+3 -> no tab selected, main content 105 chars (empty)**, Alt+4 settings, Alt+5 backup, **Alt+6 -> no tab selected (cli, hidden)**, Alt+7 manual, Alt+8 credits (`expE.out`). So the shortcut numbers do not match the visible tab positions (settings is the 3rd tab but is Alt+4).
- **C-19 confirmed live**: in the browser Ctrl+Shift+X ("Emergency stop all timers") leaves the running timer running (`active after: t1`), Ctrl+Shift+O does nothing observable, Escape does not stop/minimize (timer still running) - three of the four documented tiles are false in the browser. Ctrl+Space and Space start/stop work. Evidence `expE.out`.

### C-24  P2  a11y / i18n / consistency  Header controls: naming and accessible names  (expE.out header buttons)

- The layout switch has "Medium" and "Large" buttons (`layout-variant-full` is labelled "Large"), while the neighbouring text-size control also has a "large" step and the docs call the layout "Full". Two different things are called Large in the same header.
- Text-size buttons have `aria-label` "small" / "medium" / "large" (raw lowercase codes, not translated; no `title`), visible label just "A". Theme buttons have good labels (Light, Dark, "High contrast (Terminal)", System) but are icon only (sun, moon, eye, laptop): "eye" for high contrast is not guessable.
- DOM contains each layout-variant button twice (`layout-variant-medium` and `layout-variant-full` listed twice in the header) - duplicate nodes (possibly a hidden responsive twin), affects test ids (`getByTestId` strict mode).
- Fix S. Test: unit test of the header (aria-label translated) + Playwright strictness.

### C-25  P1  sense-of-solution / dead end  Footer "Database Management" link does nothing in the browser  (expE.out, shots E-db-link.png)

- On the Settings tab clicking the orange footer link "Database Management" changes nothing (selected tab stays settings, content length same 1544); the db tab is not available in this runtime (canInspectDatabase false) so the link is a dead control shown on every tab (see screenshot). The adjacent "MPL-2.0 License & Credits" link opens a modal dialog (it blocked the next click in the script).
- Fix S: hide link when `!canInspectDatabase`. Test: unit test with capabilities.
- Evidence: `S/E-db-link.png`.

### C-26  P1  stale-content  PWA install not discoverable (supports C-20)

- Live: body text contains no "install" anywhere in any visited tab (`PWA install text anywhere? false`). In the dev server there is no `<link rel=manifest>` nor active service worker (dev build; vite-plugin-pwa may only emit these in production builds - not verified in a production build, so not counted as a defect).

### C-25 CORRECTION (expF.out)

- From Tasks the footer "Database Management" link lands on the **Settings** tab (selected tab-settings, main 1544 chars; `F-db-link-from-tasks.png`); on Settings it does nothing visible. So the link is labelled for a feature (DB explorer) that is hidden in this runtime and silently goes to an unrelated tab. Same fix: hide when `!canInspectDatabase`.
- License link opens a modal "About Flow, Credits & MPL-2.0" (`S/F-license-modal.png`); Escape closes it and focus returns to the link (good). The modal repeats creator bio / OSS list / license that also live in the Credits tab (two "credits" surfaces, different copy: modal says "Engineered and crafted by Marcin 'beoArcha' Stefan", Tauri v2 "native desktop shell"; tab says "Core Team (Me, AI & Caffeine)") -> C-22 extension: duplicate, diverging credit content; modal also advertises Tauri/desktop in the browser.

### C-13 EXTENDED  P1  motion / layout shift  Header control layout depends on locale (expF.out, F-settings-ja.png)

- Header height: en 89, de 89, pl 79, ja 79; tab bar y: 110 (en/de) vs 100 (pl/ja). In **ja** the whole control group reorders: layout switch (中 | 大), theme, text-size and the language bar sit on ONE row with the switch at the far left, whereas in en the language bar and the PWA badge sit on a second row and the layout switch is at the right (compare `S/A-alt3-hidden-db.png` vs `S/F-settings-ja.png`). A user who switches language from the header sees the layout/theme/text-size controls jump to new positions under the cursor.
- Fix M: fixed two-row header grid independent of label width (or shorter locale labels), reserve badge row. Test: geometry spec across the 10 locales (header height, control x positions equal).

### C-27  P2  i18n  Leftovers and naming drift across locales (expF.out)

- de: Credits heading "Credits, OSS & Creators" is English (tab "Credits & Dank"); Manual heading uses "Verknüpfungen" (= links) for Shortcuts. pl: tab "Opcje" vs page heading "Ustawienia Interfejsu i Aplikacji" (tab and view name differ), Manual tab "Instrukcja" vs heading "Instrukcja Kompilacji, Skróty & Architektura (Tauri OS Guides)". en: tab "Credits & Thanks" vs heading "Credits, OSS & Creators"; tab "Manual" vs heading "Compilation Manual, ...". Backup tab/heading consistent in all four. ja: pass without truncation in settings top part (`F-settings-ja.png`); ja tab "バックアップ & エクスポート" is the longest label.
- Fix S: align tab label and heading, translate de credits heading.

### C-05 CORRECTION (expG2.out)

- The tiny glyph in the status banner is the **number "0"** rendered at a micro size: DOM text is "Engine synchronized 0 parallel tracking threads (projects run concurrently)". The banner therefore shows a near-invisible "0" mid sentence (visible at 1440, 390 and in Medium, see `S/G-med-1440-settings.png`, `S/F-settings-ja.png`). With no timer running "0 parallel tracking threads" is noise on every tab.

### C-28  P1  sense-of-solution / dead end  Medium layout cannot reach Backup, Manual, Credits, Versions or Reset  (expG3.out, shots G-med-*)

- Repro: header Medium button (visible one: header contains each layout button twice, one hidden) -> Settings. Page text check at 1440, 1024 and 390: Export Backup false, Shortcuts false, Philosophy of Flow false, App Release false, "Clear browser data" false; Holidays true. The Medium tab set is `tasks, reports, settings` (`src/common/types/navigation.ts` MEDIUM_TAB_IDS; testids `medium-tab-tasks/reports/settings`).
- Why: a PWA user on a phone / narrow window (Medium is the browser's phone layout; at 390 only Medium-dock makes sense) cannot export or restore data, read shortcuts or the credits without switching to Full, which is horizontally cramped. The doc line in README/USER_GUIDE about backup never mentions this.
- Fix M: add Backup (and Manual/Credits via an overflow "More" item or as Settings cards) to Medium; or move Backup/Reset cards into Settings so both layouts share them. Test: Playwright e2e on Medium (export button reachable).

### C-29  P1  visual / responsiveness  Medium Settings: quick language tiles truncated to one letter; status banner overlaps timer card  (shots G-med-1440-settings.png, G-med-390-settings.png)

- Medium at 1440x900: the layout is a narrow ~540 px dock on the right of an otherwise empty 1440 px window; "Quick language selection" tiles show "S...", "E...", "P...", "D...", "Es...", "Fr...", "Ital..." (names cut after 1-4 chars, one tile shows only a clipped "P" before PT-BR) - a language cannot be recognised. At 390 wide the tiles show 2 per row (names readable, "Português (Br..." truncated).
- In both Medium shots the sticky banner "PWA READY / ONLINE ... Synced" sits over the top of the active timer card ("11:00:00 - 3 Total Tasks" is cut; the timer card's buttons are half hidden under the banner), and the bottom dock overlays the last card edge. The banner + two-row header consume ~220 px of 844 px at 390.
- Fix M: tiles use code-only/2-col grid in narrow container (container query), banner not sticky over content (or collapse after first show); Test: geometry spec (no tile with truncated text in Medium; banner rect does not intersect the timer card rect).

### C-30  P2  interaction-cost / consistency  Needless confirmation toast for an instant visible change  (expG2.out)

- Clicking the Medium/Large switch shows a "SYSTEM NOTIFICATION TRAY / Interface size changed to: Medium" banner although the layout visibly changes at once; wording "Interface size" for what the buttons call layout, "SYSTEM NOTIFICATION TRAY" desktop label. Same banner is used for errors (C-09). In Zouk terms: a toast for something the user just saw happen is an extra visual event.
- Fix S: no toast for instant visible UI preferences; keep for failures.

### C-31  P1  consistency / sense-of-solution  Text-and-icon size control only scales the tab bar, not the Settings content  (expJ.out, shots H-text-large-settings.png)

- Repro: Full 1440x900 light en, header "A A A" -> small/medium/large, open Settings. Computed font sizes (px) small / medium / large: tab label 12 / 14 / 16, tab height 44 / 55 / 78 - but Settings h2 24 / 24 / 24, caption 12 / 12 / 12, field label 14 / 14 / 14, Save button 12 px and 32 px high in all three; header height 89 in all three; root font-size 16 in all three (`expJ.out`, `expH.out`). In the large screenshot the tab row grows and everything below stays identical (`S/H-text-large-settings.png`).
- Why: the owner-facing promise (USER_GUIDE 2.6, AGENTS.md "TextAndIconSize changes CSS design tokens") is that the whole UI scales; here the user who needs larger text gets a fatter tab bar and the same 12 px captions, i.e. the control seems broken, and the tab bar eats vertical space.
- Fix M (token audit: components using fixed text-xs / h-8 instead of scale tokens). Test: geometry spec asserting a body-text element's computed font-size grows small -> large.

### C-32  P1  responsiveness  390x844: Holidays table hides Edit/Delete off-screen, headings and footer clipped  (expI.out, shot 390-dark-settings-default.png)

- Holidays table is 482 px wide in a 290 px scroller (`overflow-x:auto`, no visible scroll cue); the Edit/Delete buttons sit at x=484/516 > viewport 390, so on a phone the only row actions are hidden until the user discovers a horizontal swipe. Accordion headers are cut: "REGISTER NEW DAY OFF (SQL INSE", "holidays_leaves table (6 recor". Footer line is 473 px in a 376 px box (clipped "Databas..." at the right edge). Quick tiles: "Português (Br..." truncated (see C-15).
- Fix M: card layout for rows < 480 px (name + date, kebab actions), allow header wrap, footer wraps into two lines. Test: Playwright 390 check: action buttons inside viewport, `scrollWidth <= clientWidth` for footer and accordion headers.

### C-33  P2  consistency  Default expansion state of Settings cards is arbitrary  (expI.out)

- Default aria-expanded: Interface true, Timezone true, Engine Options false, Automated Workflows false, Register day off true, holidays table true, Destructive Zone false, Versions false. The two cards for the main flow (language, timezone) are open, the automation card that users must configure (hours limit) needs one click, and Holidays always expands two nested accordions (3 stacked headers deep: page h2 > card > accordion). Cost to set the auto-stop limit: click tab, click card header, tick checkbox, type value = see interaction table.
- Fix S: persist per-card expand state (localStorage) so the user's last arrangement survives; flatten Holidays to a single card.
