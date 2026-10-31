# oXyFlow User Guide & Handbook

Welcome to the **oXyFlow** user guide! Whether you are tracking hours for freelance client billing, managing personal software projects, or organizing daily tasks, oXyFlow is built to be fast, distraction-free, and 100% private.

Your data never leaves your computer. There are no cloud subscriptions, no forced logins, and no background tracking.

---

## Table of Contents

- [1. Quick Start: Your First 5 Minutes](#1-quick-start-your-first-5-minutes)
- [2. The Desktop & Web App](#2-the-desktop--web-app)
  - [2.1 Projects & Tasks Hierarchy](#21-projects--tasks-hierarchy)
  - [2.2 Two-Tier Project Creation & Form Controls](#22-two-tier-project-creation--form-controls)
  - [2.3 Tracking Time](#23-tracking-time)
  - [2.4 Reports & Progress](#24-reports--progress)
  - [2.5 Customization: Themes & Scale](#25-customization-themes--scale)
  - [2.6 Language Selection](#26-language-selection)
- [3. The Terminal Companion (Basic CLI)](#3-the-terminal-companion-basic-cli)
  - [3.1 Starting a Timer](#31-starting-a-timer)
  - [3.2 Stopping a Timer](#32-stopping-a-timer)
  - [3.3 Checking Current Status](#33-checking-current-status)
  - [3.4 Today's Work Summary](#34-todays-work-summary)
  - [3.5 Adding Projects and Tasks from Terminal](#35-adding-projects-and-tasks-from-terminal)
- [4. Data Safety, Backups & Sinks](#4-data-safety-backups--sinks)
  - [4.1 Storage Architecture: Desktop SQLite vs Browser LocalStorage](#41-storage-architecture-desktop-sqlite-vs-browser-localstorage)
  - [4.2 Universal JSON Backups & State Restoration](#42-universal-json-backups--state-restoration)
  - [4.3 Automatic CSV & Webhook Sinks](#43-automatic-csv--webhook-sinks)
- [5. Frequently Asked Questions (FAQ)](#5-frequently-asked-questions-faq)

---

## 1. Quick Start: Your First 5 Minutes

When you first open oXyFlow:

1. **Create a Project**: Enter a project name in the sidebar form. Choose a color from the 10 preset swatches or click the **Paintbrush** button to pick a custom HEX color. Click **"+ Add New Project"** (or press Enter). Click **"More Options"** to expand advanced attributes: assign an emoji icon, enter tags or select from the tag suggestion cloud, write a description, or toggle task concurrency.
2. **Add a Task**: Click **"+ Add Task"** under your project (e.g. `Homepage Redesign`).
3. **Start the Timer**: Click the green **Play** button next to your task.
   - The status bar at the top displays the active task with a live elapsed time counter.
   - The application dock or system tray icon indicates that tracking is active.
4. **Take a Break or Switch**: Click the **Pause / Stop** button to stop recording. If you click Play on another task, oXyFlow automatically stops the previous task and starts the new one.

---

## 2. The Desktop & Web App

### 2.1 Projects & Tasks Hierarchy

oXyFlow uses a clean, two-level organizational structure:

```text
📁 Project: "E-Commerce Store" (Color: Indigo)
   ├── 📝 Task: "Shopping Cart Checkout"
   │     └── ↳ Subtask: "Stripe Payment Gateway Integration"
   └── 📝 Task: "Product Catalog Search"
```

- **Projects**: High-level initiatives, clients, or categories. Each project can be assigned one of 10 curated color badges or a custom HEX color to help you visually differentiate client work at a glance.
- **Tasks**: Actionable units of work. You can mark tasks as completed (strikethrough) when finished, or archive them when you no longer need them in your active view.
- **Subtasks**: For complex jobs, break tasks down into manageable child steps. Time tracked on subtasks automatically rolls up to the parent project in reports.
- **Project Deletion vs Archival Lifecycle**:
  - **Zero-Time Projects (`00:00:00`)**: Projects with no logged sessions and no active timer show a delete button (`Trash2`). Deleting permanently removes the project from storage.
  - **Archival Enforcement (`> 00:00:00`)**: Once any time has been logged against a project, the core validation engine blocks deletion (`validate_project_deletion`) to protect historical timesheets. In this case, the UI displays the **Archive** button instead. Archiving hides the project from active views while preserving all historical records for reporting and audits. You can unarchive a project at any time.
- **Destructive Action Safety**: Deleting tasks or subtasks triggers an accessible confirmation modal (`ConfirmDialog`) showing the number of linked subtasks and warnings for tracked time records. If any storage failure occurs during deletion, an inline alert (`role="alert"`) is rendered directly inside the dialog without closing it or locking action controls, allowing immediate retry.

### 2.2 Two-Tier Project Creation & Form Controls

oXyFlow provides an adaptive two-tier creation form in the sidebar:

- **Tier 1 (Compact Primary Row)**: Optimized for fast entry.
  - **Project Name Input**: Enter a title and press Enter to create the project immediately.
  - **Curated Color Swatches**: 10 preset palette options (`slate`, `rose`, `orange`, `amber`, `emerald`, `teal`, `blue`, `indigo`, `violet`, `fuchsia`).
  - **Custom Color Picker (Paintbrush HEX)**: Click the **Paintbrush** button at the end of the palette swatches to open an interactive HTML5 color picker. Any valid HEX code (e.g. `#8B5CF6`) is accepted, normalized, and displayed across badges, dot indicators, and analytics views.
  - **More Options Toggle**: Click the chevron button (**"More Options"** / **"Hide Options"**) to expand or collapse the advanced drawer.
  - **Add New Project**: Primary button to confirm creation.

- **Tier 2 (Advanced Collapsible Drawer)**:
  - **Emoji Icon Picker**: Click the icon trigger to open a dedicated Base UI popover emoji selector to assign an icon to your project.
  - **Tags & Smart Suggestion Cloud**: Enter comma-separated tags. Below the input, the form scans your workspace (`useAllProjectTags`) and renders clickable tag chips. Clicking an existing tag appends it directly to the field without typing.
  - **Project Description**: Optional notes and scope summary for the project.
  - **Allow Concurrency Toggle**: Controls whether multiple tasks under this project can run simultaneously with other projects.

### 2.3 Tracking Time

- **The Single-Active-Timer Invariant**: You can only have **one** task actively ticking at any given time. Starting a new task automatically closes and commits the previous session. This prevents accidental double-counting and keeps your timesheets audit-ready.
- **Live Elapsed Time**: The timer updates smoothly every second. Even if you minimize the window to the system tray, time tracking continues accurately in the background.
- **Manual Adjustments**: Forgot to start the timer? You can manually add a logged time entry with a custom start time, end time, and optional notes (e.g., *"Consulting call with client"*).

### 2.4 Reports & Progress

Navigate to the **Reports** tab to inspect and export your logged time:

- **Daily Calendar & Timeline**: See a visual breakdown of your working blocks across the day.
- **Project Distribution**: View clean percentage bars showing where your hours went.
- **Hierarchy Tree View**: Displays a structured Unicode outline of projects, tasks, and accumulated durations.
- **One-Click Exports**:
  - **HTML**: Beautiful, ready-to-print invoice timesheet.
  - **CSV**: Standard tabular spreadsheet file for Excel, Google Sheets, or Numbers.
  - **JSON**: Machine-readable format for custom developer pipelines.

### 2.5 Customization: Themes & Scale

oXyFlow comes with **12 built-in, curated color themes** designed for all lighting conditions and tastes:

- **Modern Dark & Light**: `Dark`, `Light`, `System (Auto)`
- **Sleek Accents**: `Slate`, `Indigo`, `Emerald`, `Amber`, `Rose`
- **Accessibility**: `High Contrast` (WCAG AAA compliant)

#### Text and Icon Sizing

In **Settings**, adjust the UI scale to fit your screen resolution:

- **Small**: High-density view, ideal for multi-taskers on laptops.
- **Medium**: Balanced default setting.
- **Large**: Comfortable reading size for large desktop monitors or high-DPI displays.

#### Layout Modes

- **Compact**: Minimalist, floating widget showing only the active timer and quick switcher.
- **Medium**: Sidebar plus main timer dashboard.
- **Full**: Comprehensive view with project list, task hierarchy, calendar, and analytics visible side-by-side.

### 2.6 Language Selection

oXyFlow is fully localized in 6 languages:

- **English** (en)
- **Polski** (pl)
- **Deutsch** (de)
- **Español** (es)
- **Français** (fr)
- **Português do Brasil** (pt-br)

You can change the language anytime in **Settings $\to$ Language**, or let oXyFlow automatically match your system's operating system locale.

---

## 3. The Terminal Companion (Basic CLI)

For keyboard-oriented users, terminal lovers, and developers, oXyFlow includes a native companion command `oxy`. You can control your timers directly from PowerShell, Terminal, or Bash without touching your mouse.

### 3.1 Starting a Timer

To start tracking a task, run `oxy start` with the task name or ID:

```bash
oxy start "Homepage Redesign"
```

If multiple tasks share a similar name, `oxy` interactively asks you to pick the right one from a numbered list. If you make a typo (e.g. `oxy start Homepag`), it suggests: *"Did you mean 'Homepage Redesign'?"*.

### 3.2 Stopping a Timer

To stop whatever task is currently active:

```bash
oxy stop
```

### 3.3 Checking Current Status

To quickly see if a timer is running:

```bash
oxy status
```

Outputs the active project, task name, and elapsed duration:

```text
● Active: [Client Website] Homepage Redesign (01h 24m)
```

### 3.4 Today's Work Summary

To view a breakdown of all work recorded today:

```bash
oxy today
```

Prints a summary table with total hours and per-task durations.

### 3.5 Adding Projects and Tasks from Terminal

```bash
# Add a new project
oxy project add "Mobile App" --color "indigo"

# Add a task under that project
oxy task add "API Authentication" --project "Mobile App"
```

> **Looking for advanced scripting?**  
> Check out the [Advanced CLI Guide](./CLI.md) for machine `--json` outputs, action macros (`oxy mask`), and automated shell pipelines.

---

## 4. Data Safety, Backups & Sinks

### 4.1 Storage Architecture: Desktop SQLite vs Browser LocalStorage

oXyFlow operates on a local-first architecture, but physical storage differs between runtime environments:

#### Desktop Runtime (Tauri v2)

On Windows, Linux, and macOS, data resides in an ACID-compliant, local SQLite database file (`oxytime.db`):

- **Windows**: `%APPDATA%\com.oxytime.oxyflow\oxytime.db`
- **Linux**: `~/.local/share/com.oxytime.oxyflow/oxytime.db`
- **macOS**: `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db`

Because it is a standard filesystem SQLite database, you have full ownership of your data and can copy or back up the database file directly via your operating system.

#### Web Runtime (Browser PWA)

The Progressive Web App operates within the browser security model:
- Data is stored in origin-isolated **LocalStorage** (`LocalStorage Engine`).
- The browser environment has no direct access to your local filesystem; therefore, **no physical `.sqlite` file is created or exportable from browser mode**.
- **Browser Cache Warning**: Executing browser cleanup routines ("Clear site data", "Clear browsing data", or clearing cookies/cache) or using Private/Incognito windows will permanently delete your stored timer records.
- **Recommended Practice**: If you use oXyFlow in the browser, perform regular JSON exports to ensure your timesheets are safely backed up on disk.

### 4.2 Universal JSON Backups & State Restoration

In **Settings → Backup** (under the **Database & State Backup** card):

- **Export Backup JSON** (`data-testid="export-backup-btn"`): Generates an unencrypted, structured JSON snapshot (`OxyFlow_Backup_YYYY-MM-DD.json`) capturing all projects, tasks, time logs, holidays, and patch records.
- **Restore / Import Backup JSON** (`data-testid="import-backup-btn"`): Reads a `.json` backup file, validates its structure with `validateBackupPayload`, and restores the complete database state.
- **Cross-Runtime Mobility**: The JSON backup format is universal. You can export a JSON backup from the browser PWA and import it into the desktop application, or export from desktop and import into the web app.
- **Physical SQLite Backup (Desktop Only)**: Desktop users can also make direct filesystem copies of `oxytime.db`. In web runtimes, raw SQLite export is not available; the JSON backup is the universal backup format.
- **Safe Scoped Reset**: Centralized in **Settings → Database Operations**, allowing scoped resets (`BUSINESS`, `SETTINGS`, `SYSTEM`) with mandatory confirmation modals.

### 4.3 Automatic CSV & Webhook Sinks

For automated timesheet logging:

- **Real-Time CSV Sink**: Automatically appends an entry to a local CSV file every time a timer session starts or stops.
- **Webhook Sink**: Posts a JSON event payload to your custom HTTP endpoint (e.g. your company's internal portal or a Discord/Slack webhook) when time tracking events occur.

---

## 5. Frequently Asked Questions (FAQ)

### Is my data shared with any third party?

No. oXyFlow has zero analytics, zero trackers, and zero telemetry. All records reside exclusively on your local hard drive or in your browser's private local storage.

### Can I use oXyFlow completely offline?

Yes! Both desktop packages and the installed PWA require no network access to operate. You can track time on airplanes, trains, or anywhere without an internet connection.

### Can I export a raw `.sqlite` file from the browser?

No. Web browsers run inside a sandboxed environment without native filesystem access, using `LocalStorage` instead of a physical SQLite file. To back up your data from the browser, use **Settings → Backup → Export Backup JSON**. This produces a portable JSON snapshot that can be restored on any desktop or browser installation.

### How do I migrate data between the web app and desktop?

In your source environment (e.g. browser PWA), navigate to **Settings → Backup** and click **Export Backup JSON**. In your target environment (e.g. desktop app), open **Settings → Backup**, click **Restore / Import Backup JSON**, and select the exported `.json` file. The application validates and restores all projects, tasks, and historical logs.

### Why is the delete button missing or replaced by Archive for a project?

To protect historical timesheet integrity, oXyFlow permits permanent deletion (`Trash2`) only for projects with exactly `00:00:00` total logged time. Once any time has been recorded against a project, the core validation engine blocks deletion to preserve billing and audit records. Use the **Archive** button to hide the project from active views instead.

### What happens if I forget to stop my timer overnight?

oXyFlow includes built-in protection rules. By default, it detects when a timer crosses midnight or exceeds a configurable daily limit (e.g. 10 hours), and can automatically stop or warn you so your daily statistics stay realistic.

### Can I run oXyFlow at system startup?

Yes. In the desktop application, open **Settings** and toggle **"Launch at Startup"**. On Windows, you can also enable **"Minimize to System Tray"** to keep oXyFlow silently running in the notification area. (This feature is desktop-only and is hidden in the PWA).

---

## Related Documentation

- [Installation & Security Guide](./INSTALLATION.md)
- [Headless CLI Contract & Reference](./CLI.md)
- [System Architecture & Engineering](./ENGINEERING.md)
- [UI Principles & Design Tokens](./USERINTERFACE.md)
