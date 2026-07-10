# MASTERMAP.md

## oXyFlow Master Map

### 🎯 Vision

Build a lightweight, native-first productivity suite that prioritizes flow, correctness, maintainability, and long-term sustainability.

The project should provide a single business model that can run across multiple environments while keeping platform-specific implementations isolated behind well-defined runtime abstractions.

---

## Core Principles

### Engineering

* Correctness over cleverness
* Simplicity over unnecessary abstractions
* SOLID where it improves maintainability
* KISS whenever possible
* DRY without over-generalization
* YAGNI until a requirement exists

### Architecture

* Business logic must be platform independent.
* Runtime-specific code must be isolated.
* Storage is an implementation detail.
* UI never communicates directly with persistence.
* Every layer has a single responsibility.
* Rust remains the reference implementation of the business engine.

---

## Current Architecture (v2)

```text
React UI
    │
    ├──────────────┐
    │              │
EngineRouter   PersistenceRouter
    │              │
    ├──────────────┤
    │
──────── Runtime Boundary ────────

Desktop Runtime
    │
Tauri Commands
    │
Rust Engine
    │
SQLite

Browser Runtime
    │
Engine Plugin
    │
Persistence Plugin
    │
LocalStorage
```

### Responsibilities

#### React

* UI
* User interactions
* Rendering
* View state

#### EngineRouter

* Select active engine implementation.
* Expose a single API to the frontend.
* Contain no business logic.

#### PersistenceRouter

* Select active persistence implementation.
* Abstract storage backends.
* Contain no business logic.

#### Runtime Plugins

Provide platform-specific implementations while preserving a shared frontend.

#### Rust Engine

Source of truth for business rules.

Responsibilities include:

* timer calculations
* domain validation
* aggregates
* business workflows

#### Persistence Goals

Responsible only for storing and retrieving data.

Possible implementations include:

* SQLite
* LocalStorage
* CSV
* Future cloud synchronization

---

## Phase 1 — Foundation ✅

### Core Architecture

* [x] Layered architecture
* [x] Repository abstraction
* [x] Runtime abstraction
* [x] EngineRouter
* [x] PersistenceRouter
* [x] Browser plugins
* [x] Tauri command routing
* [x] Shared domain models
* [x] Rust as business engine

### Core Engineering

* [x] TypeScript strict mode
* [x] Rust formatting
* [x] ESLint
* [x] Unit tests
* [x] Integration tests
* [x] CI pipeline

---

## Phase 2 — Runtime Completion

**Goal:** Reach feature parity between Desktop and Browser runtimes.

### Engine

* [ ] Complete Browser EnginePlugin
* [ ] Match Rust algorithms
* [ ] Eliminate remaining runtime differences

### Persistence

* [ ] Complete PersistencePlugin
* [ ] Full LocalStorage implementation
* [ ] Unified repository interfaces

---

## Phase 3 — Backend Completion

**Goal:** Finish all business domains.

### Timer

* [ ] Active timer
* [ ] Pause / Resume
* [ ] Manual log editing
* [ ] Validation

### Projects

* [ ] CRUD completion
* [ ] Statistics
* [ ] Metadata

### Tasks

* [ ] CRUD completion
* [ ] Task hierarchy
* [ ] Status management

### Configuration

* [ ] Application settings
* [ ] User preferences
* [ ] Runtime configuration

---

## Phase 4 — Frontend Refinement

**Goal:** Simplify React while keeping business logic outside the UI.

### Frontend architecture

* [ ] Smaller components
* [ ] Better feature boundaries
* [ ] Improved hooks
* [ ] Reduced duplicated state

### UX

* [ ] Responsive layouts
* [ ] Accessibility
* [ ] Error handling
* [ ] Loading states
* [ ] Keyboard navigation

---

## Phase 5 — MVP

**Goal:** Deliver a complete application suitable for everyday use.

### Features

* [ ] Stable timer workflow
* [ ] Stable project workflow
* [ ] Stable task workflow
* [ ] Configuration UI
* [ ] Settings management
* [ ] Polish user experience
* [ ] Remove remaining blockers

---

## Phase 6 — Data Reliability

**Goal:** Ensure user data is safe and recoverable.

### Storage

* [ ] Automatic backups
* [ ] Manual backups
* [ ] Import
* [ ] Export
* [ ] Restore
* [ ] Validation
* [ ] Database migrations

---

## Phase 7 — Native Experience

**Goal:** Make the desktop application feel fully native.

### Desktop

* [ ] Startup optimization
* [ ] Window management
* [ ] Tray integration
* [ ] Native notifications
* [ ] Keyboard shortcuts
* [ ] IPC optimization

---

## Phase 8 — Productivity Platform

**Goal:** Expand beyond time tracking.

### Extended features

* [ ] Dashboard
* [ ] Reporting
* [ ] Analytics
* [ ] Search
* [ ] Filtering
* [ ] Automation
* [ ] Workflow support
* [ ] Plugin ecosystem

---

## Continuous Engineering

Every contribution should improve at least one of the following:

* correctness
* maintainability
* readability
* testability
* performance
* developer experience

Development workflow:

```text
Architecture
      ↓
Contracts
      ↓
Implementation
      ↓
Tests
      ↓
Refactoring
      ↓
Optimization
      ↓
Release
```

---

### Long-Term Roadmap

```text
Foundation
      ↓
Runtime Parity
      ↓
Complete Backend
      ↓
Clean Frontend
      ↓
Stable MVP
      ↓
Reliable Data
      ↓
Native Desktop
      ↓
Productivity Platform
```
