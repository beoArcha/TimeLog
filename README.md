# oXyFlow

> **A lightweight, native-first productivity suite built with Rust, Tauri and React. Designed for flow, engineered for the long term.**

oXyFlow is an experimental desktop productivity application that explores modern product engineering with AI-assisted development.

Rather than chasing features, the project focuses on building software that remains fast, maintainable and enjoyable to evolve.

AI helps implement ideas.

Humans remain responsible for architecture, engineering and product decisions.

---

## ✨ Current Features

* ⏱️ Time tracking
* 📁 Project management
* ✅ Task management
* 💾 SQLite persistence
* 📄 CSV export
* ⚙️ Configuration management
* 🌍 Internationalization (i18n)
* 💻 Command Line Interface (CLI)
* 🧪 Unit & Integration Tests
* 🖥️ Native desktop application

---

## 🏛 Architecture

oXyFlow follows a layered architecture.

```text
React UI
    ↓
Hooks / State
    ↓
Tauri Commands
    ↓
Application Services
    ↓
Repositories
    ↓
Persistence Layer
    ↓
SQLite / CSV / Config
```

This separation keeps business logic independent from the UI and makes the application easier to maintain and extend.

---

## 🚀 Engineering Philosophy

The project is built around five priorities:

1. ✅ Correctness
2. 🏗️ Maintainability
3. 😊 User Experience
4. ⚡ Performance
5. ✨ New Features

Core principles:

* Native-first desktop application
* Lightweight over raw performance
* Flow-oriented UX
* Sustainable engineering
* Human-led AI-assisted development

---

## 🛠 Technology Stack

### Backend

* Rust
* Tauri
* SQLite

### Frontend

* React
* TypeScript
* Vite

### Quality

* Unit Tests
* Integration Tests
* ESLint
* TypeScript
* Cargo Test
* Cargo Fmt

---

## 🚀 Getting Started

Install dependencies

```bash
npm install
```

Run the application

```bash
npm run tauri dev
```

Verify code quality

```bash
npm run lint
npm run typecheck
npm run test

cargo fmt
cargo test
```

---

## 📖 Project Documentation

| Document         | Purpose                                 |
| ---------------- | --------------------------------------- |
| `MASTERMAP.md`   | Project roadmap and long-term vision    |
| `ENGINEERING.md` | Engineering principles and architecture |
| `AGENT.md`       | Operational guidelines for AI agents    |

---

## 🎯 Project Goals

oXyFlow aims to demonstrate that modern software can be:

* fast without unnecessary complexity
* lightweight without sacrificing usability
* AI-assisted without giving up engineering discipline
* enjoyable to maintain for years

---

## 📄 License

This project is licensed under the Mozilla Public License Version 2.0 (MPL-2.0).

See [LICENSE.md](file:///c:/Users/Krzysiu/Source/TimeLog/LICENSE.md) and [NOTICE.md](file:///c:/Users/Krzysiu/Source/TimeLog/NOTICE.md) for details.

---

> **Less clicking. More flow.**
