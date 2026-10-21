# ⏱️ oXyFlow Technical Documentation

> 🌐 **Language / Język**: **English** | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | [Português (Brasil)](/pt-br/README.md)

---

**oXyFlow** is a desktop work timer and task tracker built on Tauri v2, Rust, and an embedded SQLite database. It provides an offline-first, local-only architecture with an accompanying headless CLI binary (`oxy`) for terminal automation and developer workflows.

---

## 🏛️ System Architecture Highlights

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Semantic Tokens)        │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Commands)
┌───────────────────────────▼────────────────────────────┐
│                    Rust Micro-Engine                   │
│  - Timer Lifecycle & Overlap Invariants (engine/)      │
│  - SQLite MicroORM Persistence (repositories/)         │
│  - Real-time Sinks (CSV append, HTTP webhooks)         │
└───────────────────────────┬────────────────────────────┘
                            │ CLI Bridge
┌───────────────────────────▼────────────────────────────┐
│                  Native CLI Binary (`oxy`)              │
└────────────────────────────────────────────────────────┘
```

- **Local-First Storage**: All records persist in an embedded SQLite database (`timelog.db`). No telemetry, analytics, or mandatory cloud connectivity.
- **Triple Decoupling**: Complete architectural isolation between UI presentation, domain engine rules, and native storage drivers.
- **Micro-Engine**: Sub-40 MB memory baseline, instant cold startup, zero webview background drain when idle.
- **Dual Runtime Interfaces**: Desktop GUI with customizable visual density (Compact, Medium, Full) and a synchronized terminal CLI (`oxy`).

---

## 📚 Documentation Structure

### User Guide

- **[Getting Started](getting-started.md)**: Installation, initial configuration, and creating your first project and task.
- **[Timer & Tracking](timer.md)**: Operating the timer, switching active tasks, editing logs, and viewing daily totals.
- **[CLI Companion (`oxy`)](cli.md)**: Terminal syntax for starting, pausing, listing, and switching tasks directly from PowerShell or Bash.
- **[Interface & Themes](interface.md)**: Customizing layout density, 12 semantic color palettes, and accessibility configurations.
- **[Frequently Asked Questions](faq.md)**: Technical details on database paths, data backup, and offline integrity.

### Technical & Developer Reference

- **[Advanced CLI Scripting](advanced-cli.md)**: JSON output pipelines, scripting automation, and CI integration.
- **[System Architecture](architecture.md)**: Rust engine lifecycle, SQLite schema migrations, and event dispatchers.
- **[Sinks & Automations](automation.md)**: Configuring real-time CSV audit trails and webhook payloads.
- **[Building from Source](developer-build.md)**: Prerequisites, Bun toolchain setup, and Cargo build commands.

---

## 📥 Official Packages

| Operating System | Package Type | Target Architecture |
| :--- | :--- | :--- |
| **Windows** | Setup Installer (`.exe`) | x86_64 |
| **Windows** | Portable Executable (`.exe`) | x86_64 |
| **macOS** | Universal DMG (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | DEB Package (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | RPM Package (`.rpm`) | x86_64 |

Pre-compiled binary releases and cryptographic checksums (`SHA256SUMS.txt`) are available on the [GitHub Releases page](https://github.com/beoArcha/TimeLog/releases/latest).
