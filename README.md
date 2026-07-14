# oXyFlow

> **A lightweight, native-first productivity suite built with Rust, Tauri and React. Designed for flow, engineered for the long term.**

oXyFlow is an experimental desktop productivity application that explores modern product engineering with AI-assisted development. 

Rather than chasing features, the project focuses on building software that remains fast, maintainable, and intuitive to evolve. AI helps implement ideas, but humans remain strictly responsible for architecture, engineering, and product decisions.

---

## ✨ Features

* ⏱️ **Zero-Friction Time Tracking**
* 📁 **Project & Task Management**
* 🖥️ **Multi-Runtime Support** (Native Desktop via Tauri & Browser execution)
* 💾 **Reliable Persistence** (SQLite / CSV)
* 🎨 **Decoupled UI Scaling** (CSS-driven Layout Variants & Design Tokens)
* 🌍 **Internationalization (i18n)**
* 💻 **Command Line Interface (CLI)**
* 🧪 **Comprehensive Testing** (Unit & Integration)

---

## 🏛 Architecture (v3)

oXyFlow is built around a single business model with multiple runtime implementations. Every architectural layer remains independently replaceable while exposing a single, consistent API.

```text
                     React Frontend
                            │
             ┌──────────────┴──────────────┐
             │                             │
      EngineRouter                PersistenceRouter
             │                             │
             └──────────────┬──────────────┘
                            │
                     Runtime Boundary
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
 Desktop Runtime                         Browser Runtime
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                     LayoutManager
                            │
                    Layout Builders 
               (Full / Half / Compact)
```

**Key Architectural Pillars:**
1. **Engine & Persistence:** Rust remains the reference implementation for the business engine. Storage is just an implementation detail.
2. **Runtime Independence:** The UI never knows if it's running in Tauri or a Browser.
3. **Decoupled Styling:** React components handle view state and composition. Visual scaling (typography, spacing) is handled entirely by CSS Design Tokens.

---

## 🚀 Engineering & UX Philosophy

We build for the tired user. 
* **Intuitive Discovery:** Features map to the user's mental model. No hunting, no nested mazes.
* **Zero Friction:** Core actions (like starting a timer) require a single click.
* **Correctness over cleverness:** Architecture is more important than implementation speed.
* **Performance is UX:** The UI must never stutter. Background sync never blocks the UI thread.

---

## 📖 Project Documentation

To understand how oXyFlow is built and maintained, please review our core manifests:

| Document                | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `MASTERMAP.md`          | Project roadmap, long-term vision, and core architecture diagram       |
| `ENGINEERING.md`        | Strict engineering principles, layer responsibilities, and coding standards |
| `USEREXPERIENCE.md`     | The UX philosophy: protecting user focus, zero friction, and predictability |
| `AGENT.md`              | Operational guidelines and mandatory rules for AI assistants           |

---

## 🛠 Technology Stack

**Backend:** Rust, Tauri, SQLite
**Frontend:** React, TypeScript, Vite, Motion
**Quality:** Playwright (e2e), Cargo Test, ESLint, strict TypeScript

---

## 🚀 Getting Started

Install dependencies:
```bash
npm install
```

Run the application (Desktop Runtime):
```bash
npm run tauri dev
```

Verify code quality:
```bash
npm run lint
npm run typecheck
npm run test

cargo fmt
cargo test
```

---

## 📄 License

This project is licensed under the Mozilla Public License Version 2.0 (MPL-2.0).
See `LICENSE.md` and `NOTICE.md` for details.

---

> **Less clicking. More flow.**
