# oXyFlow Documentation

> **Language**: **English** | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow is a desktop work timer and task tracker built with Tauri v2, Rust, and an embedded SQLite database. It runs locally and offline-first, accompanied by a headless native CLI executable (`oxy`) for terminal automation and shell integration.

---

## System Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Semantic Tokens)        │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Commands)
┌───────────────────────────▼────────────────────────────┐
│                    Rust Reference Engine               │
│  - Timer Lifecycle & Overlap Invariants (engine/)      │
│  - SQLite Repositories & Migrations (repositories/)    │
│  - Real-Time Sinks (CSV append, HTTP webhooks)         │
└───────────────────────────┬────────────────────────────┘
                            │ CLI Bridge
┌───────────────────────────▼────────────────────────────┐
│                  Native CLI Binary (`oxy`)             │
└────────────────────────────────────────────────────────┘
```

- **Local Storage**: All records persist in a local SQLite database (`oxytime.db`). No telemetry, analytics, or mandatory network connectivity.
- **Layer Decoupling**: Separation between UI presentation, domain engine rules, and native storage drivers.
- **Dual Runtime Interfaces**: Desktop GUI with customizable visual density (Compact, Medium, Full) and a synchronized terminal CLI (`oxy`).

---

## Documentation Structure

### User Guide

- **[Getting Started](getting-started.md)**: Installation, initial configuration, and creating projects and tasks.
- **[Timer & Tracking](timer.md)**: Operating the timer, switching active tasks, adjusting logs, and viewing totals.
- **[CLI Companion (`oxy`)](cli.md)**: Terminal syntax for starting, pausing, listing, and switching tasks directly from PowerShell or Bash.
- **[Interface & Themes](interface.md)**: Customizing layout density, core color themes, and accessibility settings.
- **[Frequently Asked Questions](faq.md)**: Details on database paths, backups, and offline integrity.

### Technical & Developer Reference

- **[Advanced CLI Scripting](advanced-cli.md)**: JSON output pipelines, scripting automation, and shell prompt integration.
- **[System Architecture](architecture.md)**: Rust engine lifecycle, SQLite schema migrations, and event dispatchers.
- **[Sinks & Automations](automation.md)**: Configuring real-time CSV audit trails and webhook payloads.
- **[Building from Source](developer-build.md)**: Prerequisites, Bun toolchain setup, and Cargo build commands.

---

## Official Packages

| Operating System | Package Type | Target Architecture |
| :--- | :--- | :--- |
| **Windows** | Setup Installer (`.exe`) | x86_64 |
| **Windows** | Portable Executable (`.exe`) | x86_64 |
| **macOS** | Universal DMG (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | DEB Package (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | RPM Package (`.rpm`) | x86_64 |

Pre-compiled binary releases and cryptographic checksums (`SHA256SUMS.txt`) are available on the [GitHub Releases page](https://github.com/beoArcha/TimeLog/releases/latest).
