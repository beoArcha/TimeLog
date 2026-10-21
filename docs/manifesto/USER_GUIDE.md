# oXyFlow User Guide & Handbook

Welcome to the **oXyFlow** user guide! Whether you are tracking hours for freelance client billing, managing personal software projects, or organizing daily tasks, oXyFlow is built to be fast, distraction-free, and 100% private.

Your data never leaves your computer. There are no cloud subscriptions, no forced logins, and no background tracking.

---

## Table of Contents

- [1. Quick Start: Your First 5 Minutes](#1-quick-start-your-first-5-minutes)
- [2. The Desktop App](#2-the-desktop-app)
  - [2.1 Projects & Tasks Hierarchy](#21-projects--tasks-hierarchy)
  - [2.2 Tracking Time](#22-tracking-time)
  - [2.3 Reports & Progress](#23-reports--progress)
  - [2.4 Customization: Themes & Scale](#24-customization-themes--scale)
  - [2.5 Language Selection](#25-language-selection)
- [3. The Terminal Companion (Basic CLI)](#3-the-terminal-companion-basic-cli)
  - [3.1 Starting a Timer](#31-starting-a-timer)
  - [3.2 Stopping a Timer](#32-stopping-a-timer)
  - [3.3 Checking Current Status](#33-checking-current-status)
  - [3.4 Today's Work Summary](#34-todays-work-summary)
  - [3.5 Adding Projects and Tasks from Terminal](#35-adding-projects-and-tasks-from-terminal)
- [4. Data Safety, Backups & Sinks](#4-data-safety-backups--sinks)
  - [4.1 Where Your Data Lives](#41-where-your-data-lives)
  - [4.2 Creating and Restoring Backups](#42-creating-and-restoring-backups)
  - [4.3 Automatic CSV & Webhook Sinks](#43-automatic-csv--webhook-sinks)
- [5. Frequently Asked Questions (FAQ)](#5-frequently-asked-questions-faq)

---

## 1. Quick Start: Your First 5 Minutes

When you first open oXyFlow:

1. **Create a Project**: Click the **"+ New Project"** button in the sidebar. Give it a name (e.g. `Client Website`) and pick a color tag (e.g. `Emerald`).
2. **Add a Task**: Click **"+ Add Task"** under your project (e.g. `Homepage Redesign`).
3. **Start the Timer**: Click the green **Play** button next to your task.
   - The status bar at the top displays the active task with a live elapsed time counter.
   - The application dock or system tray icon indicates that tracking is active.
4. **Take a Break or Switch**: Click the **Pause / Stop** button to stop recording. If you click Play on another task, oXyFlow automatically and cleanly stops the previous task and starts the new one.

---

## 2. The Desktop App

### 2.1 Projects & Tasks Hierarchy

oXyFlow uses a clean, two-level organizational structure:

```text
📁 Project: "E-Commerce Store" (Color: Indigo)
   ├── 📝 Task: "Shopping Cart Checkout"
   │     └── ↳ Subtask: "Stripe Payment Gateway Integration"
   └── 📝 Task: "Product Catalog Search"
```

- **Projects**: High-level initiatives, clients, or categories. Each project can be assigned one of 10 curated color badges to help you visually differentiate client work at a glance.
- **Tasks**: Actionable units of work. You can mark tasks as completed (strikethrough) when finished, or archive them when you no longer need them in your active view.
- **Subtasks**: For complex jobs, break tasks down into manageable child steps. Time tracked on subtasks automatically rolls up to the parent project in reports.

### 2.2 Tracking Time

- **The Single-Active-Timer Invariant**: You can only have **one** task actively ticking at any given time. Starting a new task automatically closes and commits the previous session. This prevents accidental double-counting and keeps your timesheets audit-ready.
- **Live Elapsed Time**: The timer updates smoothly every second. Even if you minimize the window to the system tray, time tracking continues accurately in the background.
- **Manual Adjustments**: Forgot to start the timer? You can manually add a logged time entry with a custom start time, end time, and optional notes (e.g., *"Consulting call with client"*).

### 2.3 Reports & Progress

Navigate to the **Reports** tab to inspect and export your logged time:

- **Daily Calendar & Timeline**: See a visual breakdown of your working blocks across the day.
- **Project Distribution**: View clean percentage bars showing where your hours went.
- **Hierarchy Tree View**: Displays a structured Unicode outline of projects, tasks, and accumulated durations.
- **One-Click Exports**:
  - **HTML**: Beautiful, ready-to-print invoice timesheet.
  - **CSV**: Standard tabular spreadsheet file for Excel, Google Sheets, or Numbers.
  - **JSON**: Machine-readable format for custom developer pipelines.

### 2.4 Customization: Themes & Scale

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

### 2.5 Language Selection

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
> Check out the [Advanced CLI Guide](file:///c:/Users/Krzysiu/Source/TimeLog/docs/manifesto/CLI.md) for machine `--json` outputs, action macros (`oxy mask`), and automated shell pipelines.

---

## 4. Data Safety, Backups & Sinks

### 4.1 Where Your Data Lives

Your timesheets are stored in an ACID-compliant, local SQLite database on your machine:

- **Windows**: `%APPDATA%\com.oxytime.oxyflow\timelog.db`
- **Linux**: `~/.local/share/com.oxytime.oxyflow/timelog.db`
- **macOS**: `~/Library/Application Support/com.oxytime.oxyflow/timelog.db`

Because it is a standard SQLite database, you always have full ownership of your data.

### 4.2 Creating and Restoring Backups

In **Settings $\to$ Database**:

- Click **"Create Backup"** to export a timestamped `.sqlite` snapshot of your entire database.
- Click **"Restore Database"** to import a previously saved backup file.

### 4.3 Automatic CSV & Webhook Sinks

For automated timesheet logging:

- **Real-Time CSV Sink**: Automatically appends an entry to a local CSV file every time a timer session starts or stops.
- **Webhook Sink**: Posts a JSON event payload to your custom HTTP endpoint (e.g. your company's internal portal or a Discord/Slack webhook) when time tracking events occur.

---

## 5. Frequently Asked Questions (FAQ)

### Is my data shared with any third party?

No. oXyFlow has zero analytics, zero trackers, and zero telemetry. All records reside exclusively on your local hard drive.

### Can I use oXyFlow completely offline?

Yes! oXyFlow requires no network access to operate. You can track time on airplanes, trains, or anywhere without an internet connection.

### What happens if I forget to stop my timer overnight?

oXyFlow includes built-in protection rules. By default, it detects when a timer crosses midnight or exceeds a configurable daily limit (e.g. 10 hours), and can automatically stop or warn you so your daily statistics stay realistic.

### Can I run oXyFlow at system startup?

Yes. Open **Settings** and toggle **"Launch at Startup"**. On Windows, you can also enable **"Minimize to System Tray"** to keep oXyFlow silently running in the notification area.

---

## Related Documentation

- [Installation & Security Guide](file:///c:/Users/Krzysiu/Source/TimeLog/docs/manifesto/INSTALLATION.md)
- [Headless CLI Contract & Reference](file:///c:/Users/Krzysiu/Source/TimeLog/docs/manifesto/CLI.md)
- [System Architecture & Engineering](file:///c:/Users/Krzysiu/Source/TimeLog/docs/manifesto/ENGINEERING.md)
- [UI Principles & Design Tokens](file:///c:/Users/Krzysiu/Source/TimeLog/docs/manifesto/USERINTERFACE.md)
