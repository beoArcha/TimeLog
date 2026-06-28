# MASTERMAP.md

## oXyFlow Master Map

### 🎯 Vision

Build a lightweight, flow-oriented productivity suite focused on native performance, maintainability and long-term sustainability.

Core principles:

* Correctness over cleverness
* Sustainable architecture
* Native-first experience
* AI-friendly codebase
* Flow-oriented productivity

---

## Phase 1 — Foundation ✅ (Mostly Complete)

**Goal:** Build a maintainable architecture.

### Architecture

* [x] Introduce layered backend architecture
* [x] Separate persistence layer
* [x] Introduce Repository pattern
* [x] Add ConfigRepository
* [x] Add CSV Sink
* [x] Improve module boundaries
* [x] Reduce code duplication
* [ ] Continue splitting oversized modules

### Quality

* [x] Unit tests
* [x] Integration tests
* [x] Linting
* [x] Type checking
* [x] Rust formatting
* [ ] Increase test coverage
* [ ] Continue refactoring complex code

---

## Phase 2 — Backend Completion

**Goal:** Finish the application core.

### Domain

* [ ] Complete timer domain
* [ ] Complete project management
* [ ] Complete task management
* [ ] Complete configuration management

### CLI

* [ ] Database management commands
* [ ] Settings commands
* [ ] Timer commands
* [ ] Project commands
* [ ] Task commands

---

## Phase 3 — Frontend Cleanup

**Goal:** Make React easy to maintain.

### Architecture Frontend

* [ ] Reduce component responsibilities
* [ ] Improve feature boundaries
* [ ] Simplify state management
* [ ] Remove duplicated logic
* [ ] Improve hooks organization

### UI

* [ ] Improve layouts
* [ ] Improve responsiveness
* [ ] Improve accessibility
* [ ] Improve loading states
* [ ] Improve error handling

---

## Phase 4 — Product MVP

**Goal:** Deliver a complete daily-use application.

### Features

* [ ] Stabilize timer workflow
* [ ] Polish project workflow
* [ ] Polish task workflow
* [ ] Improve usability
* [ ] Remove UX friction
* [ ] Fix remaining bugs

---

## Phase 5 — Multi Runtime

**Goal:** Support multiple execution environments.

### Web Runtime

React

↓

Browser Storage

### Desktop Runtime

React

↓

Tauri

↓

Rust

↓

SQLite

### Tasks

* [ ] Abstract runtime implementations
* [ ] Share frontend logic
* [ ] Runtime-specific storage adapters
* [ ] Runtime-specific services

---

## Phase 6 — Data Reliability

**Goal:** Protect user data.

### Storage

* [ ] Automatic backups
* [ ] Manual backups
* [ ] Import
* [ ] Export
* [ ] Restore
* [ ] Data validation
* [ ] Database migrations

---

## Phase 7 — Desktop Experience

**Goal:** Deliver a polished native application.

### Native

* [ ] Startup optimization
* [ ] IPC improvements
* [ ] Keyboard shortcuts
* [ ] Window management
* [ ] Tray integration
* [ ] Native menus
* [ ] Native notifications

---

## Phase 8 — Flow Expansion

**Goal:** Expand productivity capabilities.

### Advanced features

* [ ] Multiple workflows
* [ ] Reporting
* [ ] Analytics
* [ ] Automation
* [ ] Dashboard
* [ ] Search
* [ ] Filtering

---

## ♾ Continuous Engineering

Always maintain:

* Correctness
* Maintainability
* Testability
* Performance
* Simplicity

Engineering workflow:

Architecture -> Implementation -> Tests -> Refactoring -> Optimization -> Release

---

## Long-Term Evolution

Foundation ✅ -> Complete Backend -> Clean Frontend -> Usable MVP -> Reliable Data -> Native Experience -> Flow Platform
