<div align="center">

<img src="src-tauri/icons/icon.png" alt="oXyFlow TimeLog Logo" width="100" height="100" />

# oXyFlow TimeLog

**Ultra-lightweight, local-first work timer and task tracker built with Rust, Tauri v2, SQLite, and React 19.**  
*Engineered for deep flow, offline privacy, and zero cognitive friction.*

[![Latest Release](https://img.shields.io/github/v/release/beoArcha/TimeLog?color=blue&label=Release)](https://github.com/beoArcha/TimeLog/releases/latest)
[![CI Tests](https://github.com/beoArcha/TimeLog/actions/workflows/test.yml/badge.svg)](https://github.com/beoArcha/TimeLog/actions/workflows/test.yml)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL_2.0-blue.svg)](LICENSE.md)
[![Platforms](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-brightgreen.svg)](docs/manifesto/INSTALLATION.md)
[![Rust](https://img.shields.io/badge/Rust-2021-DEA584.svg?logo=rust)](src-tauri/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB.svg?logo=tauri)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](src/)
[![Bun](https://img.shields.io/badge/Bun-v1.2-fbf0df.svg?logo=bun)](https://bun.sh/)

[Download Packages](#quick-downloads) • [Features](#key-features) • [CLI Quick Tour](#cli-in-30-seconds) • [Architecture](#architecture) • [Documentation](#documentation) • [Developer Guide](#building-from-source)

</div>

---

## Quick Downloads

Production packages and portable binaries are published with cryptographic SHA-256 checksums on the [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) page.

| Operating System | Package Type | Target Architecture | Link |
| :--- | :--- | :--- | :--- |
| **Windows** | Setup Wizard (`.exe`) | x86_64 | [Download Setup](https://github.com/beoArcha/TimeLog/releases/latest/download/OxyFlow-Setup-x64.exe) |
| **Windows** | Portable Executable (`.exe`) | x86_64 | [Download Standalone](https://github.com/beoArcha/TimeLog/releases/latest/download/OxyFlow-Standalone-x64.exe) |
| **macOS** | Universal DMG (`.dmg`) | Apple Silicon (M1–M4) & Intel | [Download DMG](https://github.com/beoArcha/TimeLog/releases/latest/download/OxyFlow-Universal.dmg) |
| **Linux (Universal)** | AppImage (`.AppImage`) | x86_64 | [Download AppImage](https://github.com/beoArcha/TimeLog/releases/latest/download/OxyFlow-x86_64.AppImage) |
| **Linux (Debian/Ubuntu)** | DEB Package (`.deb`) | amd64 | [Download DEB](https://github.com/beoArcha/TimeLog/releases/latest/download/oxyflow_amd64.deb) |
| **Linux (Fedora/RHEL)** | RPM Package (`.rpm`) | x86_64 | [Download RPM](https://github.com/beoArcha/TimeLog/releases/latest/download/oxyflow.x86_64.rpm) |

> For installation troubleshooting, SmartScreen guidance, or macOS Gatekeeper bypass, see the [Installation & Platform Trust Guide](docs/manifesto/INSTALLATION.md).

---

## Why oXyFlow TimeLog?

Most modern productivity tools suffer from bloated runtimes, slow cold starts, and mandatory cloud tracking. oXyFlow TimeLog is built with a different philosophy:

* **100% Local-First & Private:** Everything persists in a local SQLite database (`oxytime.db`). No user accounts, no telemetry, no tracking daemons, and zero network dependency.
* **Instant Native Performance:** Powered by a native Rust reference engine and Tauri v2. Cold start executes in milliseconds with a memory footprint under 40 MB RAM (compared to 400 MB+ in Electron applications).
* **Dual GUI & Terminal Interfaces:** Work in the graphical desktop application, pop out the in-app terminal drawer (`Ctrl+\``), or run the standalone native CLI companion (`oxy`) directly in PowerShell or Bash.
* **Deterministic Flow & Invariants:** 1-click timer actions, atomic task switching (zero overlapping logs), cascade stops on project archival, and temporal integrity across daylight saving shifts and leap years.
* **Zero Vendor Lock-In:** Export timesheets anytime in HTML, JSON, or CSV. Configure real-time CSV audit append sinks or push webhook payloads directly into your self-hosted infrastructure.

---

## Key Features

### ⏱️ Zero-Friction Time Tracking
* **One-Click Execution:** Start, pause, or switch tracking sessions with zero cognitive friction.
* **Atomic Task Switching:** Switching tasks immediately stops the current active session and starts the new one in a single atomic database transaction—preventing overlapping time log errors.
* **System Tray Daemon:** Minimize to system tray with live elapsed indicators, tray context actions, and global keyboard shortcuts.
* **Cascade Safeguards:** Archiving or deleting a project automatically commits active timers before updating records.

### 💻 Standalone Native CLI (`oxy`) & In-App Terminal Drawer
* **High-Velocity Automation:** Full command suite (`oxy start`, `oxy stop`, `oxy switch`, `oxy status`, `oxy report`).
* **Machine Automation Mode:** Clean JSON streams to `stdout` with structured machine-parseable error envelopes to `stderr` (`--machine`, `--json`) and POSIX exit codes (`0`..`5`).
* **Beginner Guidance:** Levenshtein-based "Did you mean?" suggestions for command typos and interactive parameter prompts in TTY mode.
* **Action Masks & Macros:** Register custom shorthand commands (`oxy mask set wrap-up "oxy stop --all && oxy report --today"`) with dynamic argument substitution (`$1`..`$9`).

### 🎛️ Spatial Layout Density & CSS Design Tokens
* **Three Responsive Layouts:**
  * **Compact Layout:** Minimalist floating mini-timer widget with always-on-top mode for distraction-free tracking.
  * **Medium Layout:** Balanced two-pane split with task hierarchy and active timer controls.
  * **Full Layout:** Comprehensive workspace featuring projects, task breakdowns, analytics, database explorer, and settings.
* **Decoupled Sizing & Themes:** Independent scaling via CSS tokens (`small`, `medium`, `large`) and three built-in accessibility themes (`light`, `dark`, `high-contrast`).

### 📊 Advanced Analytics & Reporting
* **Visual Breakdown:** Interactive time distribution charts, project share pie graphs, and activity timelines built with Recharts.
* **Terminal Unicode Trees:** Generate hierarchical ASCII/Unicode summary trees directly in the console (`oxy report --today --tree`).
* **Multi-Format Exports:** Export filtered intervals to HTML, CSV, or structured JSON.

### 🛡️ SQLite Data Integrity & Database Explorer
* **Database Explorer:** Inspect raw SQLite tables, verify entity relations, and review full revision audit trails in-app.
* **Automated System Diagnostics (`oxy doctor`):** Verify filesystem permissions, schema health, table integrity, and sink connectivity in one command.
* **Online Backup & Restore:** Create lock-free SQLite backups and restore data through the SQLite Online Backup API (`oxy db backup <path>`).

### 🔌 Real-Time Sinks & Automations
* **CSV Audit Sink:** Append every completed time log to an external CSV file immediately upon timer stop.
* **HTTP Webhook Integration:** Dispatch real-time lifecycle events to external REST endpoints with an SQLite outbox queue and exponential retry backoff.
* **Workflow Rules:** Configurable auto-stop hours limits and midnight boundary auto-split daemons.

### 🌍 Multilingual by Design
* 100% translated across 6 supported languages: **English**, **Polski**, **Deutsch**, **Español**, **Français**, and **Português (Brasil)**.

---

## CLI in 30 Seconds

The `oxy` CLI binary communicates directly with the local SQLite database without opening a GUI window:

```bash
# Start tracking a task in a project (creates them on the fly if missing)
oxy start "Implement IPC Bridge" -p "oXyFlow TimeLog"

# Check active timer status
oxy status

# Atomically switch to another task without timer overlap
oxy switch "Refactor Design Tokens"

# View today's summary as a hierarchical Unicode tree
oxy report --today --tree

# Verify database integrity and system health
oxy doctor

# Create a consistent, lock-free SQLite database backup
oxy db backup ./backups/oxytime-backup.db
```

---

## Architecture

oXyFlow TimeLog adheres to strict layer decoupling: the UI never contains business rules, and storage is an interchangeable persistence detail.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Frontend UI                            │
│     (LayoutManager: Compact / Medium / Full | CSS Design Tokens)       │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │                                        │
                ▼                                        ▼
          EngineRouter                           PersistenceRouter
                │                                        │
 ═══════════════╪════════════════════════════════════════╪════════════════  Runtime Boundary
                │                                        │
       ┌────────┴────────┐                      ┌────────┴────────┐
       ▼                 ▼                      ▼                 ▼
  EngineCommands    EnginePlugin           PersistenceCmds   PersistencePlugin
  (Tauri IPC)     (Browser In-Memory)     (Tauri IPC)       (Browser Storage)
       │                 │                      │                 │
       └────────┬────────┘                      └────────┬────────┘
                ▼                                        ▼
       Rust Reference Engine                      SQLite Database
    (Timers, Metrics, Invariants)                  (oxytime.db)
                ▲
                │ Direct Invocation
       Native CLI Binary (`oxy`)
```

---

## Building from Source

### Prerequisites

* **Bun** ($\ge 1.2$): JavaScript runtime and package manager
* **Rust & Cargo** ($\ge 1.80$, edition 2021): Backend engine and CLI
* Platform prerequisites for Tauri v2 (WebView2 on Windows, WebKitGTK on Linux, Xcode CLI tools on macOS)

### Quick Start Commands

```bash
# 1. Clone repository
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# 2. Install dependencies
bun install

# 3. Run in Web Browser (Browser In-Memory Runtime)
bun run dev

# 4. Run Desktop Application in Development mode (Hot-reload)
bun run tauri:dev

# 5. Build Desktop Production Bundle (NSIS, DMG, AppImage, or DEB)
bun run tauri:build
```

### Verification & Quality Gate

```bash
# Run all quality checks (TypeScript, ESLint, Rust Clippy & fmt)
bun run check

# Run all test suites (Vitest unit/integration/arch + Cargo tests)
bun run test:quality

# Validate documentation integrity, links, and locale parity
bun run docs:validate
```

---

## Documentation

Comprehensive engineering manifests, user manuals, and technical specifications:

| Document | Purpose |
| :--- | :--- |
| [**User Guide**](docs/manifesto/USER_GUIDE.md) | Complete end-user manual: GUI workflows, active timer controls, and shortcuts |
| [**Installation Guide**](docs/manifesto/INSTALLATION.md) | OS package installation, SmartScreen trust, and SHA-256 verification |
| [**CLI Specification**](docs/manifesto/CLI.md) | CLI architecture, personas, commands, exit codes, and error envelopes |
| [**System Architecture**](docs/manifesto/ENGINEERING.md) | Architecture boundaries, layer decoupling, and reference engine invariants |
| [**Product Roadmap**](docs/manifesto/MASTERMAP.md) | Phase roadmap, completed milestones, and long-term vision |
| [**User Interface System**](docs/manifesto/USERINTERFACE.md) | Spatial layout logic, design system primitives, and CSS tokens |
| [**User Experience Philosophy**](docs/manifesto/USEREXPERIENCE.md) | Protecting user focus, zero friction, and cognitive ergonomics |
| [**Contributor Rules**](AGENTS.md) | Mandatory coding standards, AST test rules, and review protocols |
| [**Multilingual Wiki**](docs/wiki/README.md) | Docsify technical documentation in 6 languages |

---

## License

This project is open-source software licensed under the **Mozilla Public License Version 2.0 (MPL-2.0)**.  
See [LICENSE.md](LICENSE.md) and [NOTICE.md](NOTICE.md) for details.

---

<div align="center">
<sub>Engineered with care for builders who value focus, flow, and privacy.</sub>
</div>
