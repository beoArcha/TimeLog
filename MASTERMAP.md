# MASTERMAP.md

## oXyFlow Master Map

### 🎯 Vision

Build a lightweight, native-first productivity suite focused on flow, correctness, maintainability and long-term sustainability.

The project is built around a single business model with multiple runtime implementations.

Every architectural layer must remain independently replaceable while exposing a single, consistent API to the rest of the application.

---

## Core Principles

### Engineering

* Correctness over cleverness
* Simplicity over unnecessary abstractions
* SOLID where it improves maintainability
* KISS whenever possible
* DRY without over-generalization
* YAGNI until a requirement exists

---

### Architecture

* Business logic is runtime independent.
* Runtime-specific code is always isolated.
* Storage is an implementation detail.
* UI never communicates directly with persistence.
* Every layer has a single responsibility.
* Rust remains the reference implementation of the business engine.
* Every runtime should be replaceable without affecting the remaining architecture.

---

## Architecture (v3)

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
    Tauri App                             Browser App
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                     LayoutManager
                            │
      ┌─────────────┬─────────────┬─────────────┐
      │             │             │
  FullBuilder   HalfBuilder   CompactBuilder
                            │
                    Shared Components
```

---

## Frontend Architecture

The frontend is composed of three completely independent dimensions.

### Runtime

Defines where the application executes.

Examples:

* Browser
* Tauri

Future runtimes may include:

* Electron
* Mobile
* Embedded

Runtime is responsible only for:

* environment integration
* window integration
* runtime-specific wrappers
* runtime-specific styling

Runtime never changes:

* application structure
* layout composition
* business logic

---

### LayoutVariant

Defines the composition of the application.

Examples:

* Full
* Half
* Compact

LayoutVariant determines:

* page composition
* number of columns
* placement of major UI regions
* overall screen organization

Each LayoutVariant has its own Builder.

Builders are responsible only for composing views.

They never modify styling.

---

### TextAndIconSize

Defines the visual scale.

Responsible only for:

* typography
* icon sizes
* spacing
* paddings
* border radius
* design tokens

It never changes application composition.

---

## CSS Architecture

CSS is responsible for visual scaling.

React components should never calculate spacing or sizing.

The root application exposes only state.

Example:

```text
runtime-tauri

layout-full

text-medium
```

CSS resolves those states using Design Tokens.

Components consume only CSS variables.

This keeps components completely independent from visual scaling.

---

## Responsibilities

### React

* Rendering
* User interaction
* View state

Contains no business logic.

---

### EngineRouter

* Responsible only for selecting the active Engine implementation.
* Contains no business logic.

---

### PersistenceRouter

* Responsible only for selecting the active Persistence implementation.
* Contains no business logic.

---

### LayoutManager

Responsible for composing the selected LayoutVariant inside the active Runtime.

Responsibilities:

* host application layout
* compose builders
* provide shared application shell

LayoutManager does NOT decide:

* runtime
* layout variant
* visual scale

Those values come from application configuration.

---

### Layout Builders

Responsible only for composing UI.

Examples:

* FullBuilder
* HalfBuilder
* CompactBuilder

Builders contain no runtime logic.

Builders contain no sizing logic.

---

### Runtime integration

Responsible only for platform integration.

Examples:

Desktop Runtime

* Tauri
* Drag region
* Native window
* Tray
* Native integrations

Browser Runtime

* Browser wrapper
* Responsive container
* Browser integrations

---

### Rust Engine

Reference implementation.

Responsible for:

* timer calculations
* validation
* workflows
* business rules
* aggregates

---

### Persistence

Responsible only for storing and retrieving data.

Possible implementations:

* SQLite
* LocalStorage
* CSV
* Cloud

---

## Current Development Roadmap

### Phase 1 — Foundation ✅

Completed:

* Runtime abstraction
* EngineRouter
* PersistenceRouter
* Browser plugins
* Rust engine
* Shared contracts
* TypeScript strict mode
* CI
* Testing

---

### Phase 2 — Frontend Architecture Modernization

Goal:

Create a modular frontend architecture mirroring Engine and Persistence.

#### Phase 2A ✅

* Rename GuiSize → LayoutVariant

#### Phase 2B ✅

* Introduce Runtime applications
* app-browser
* app-tauri

#### Phase 2C ✅

* Introduce LayoutManager

#### Phase 2D ✅

* Introduce Layout Builders

#### Phase 2E ✅

* Move sizing entirely to CSS Design Tokens

#### Phase 2F

* Desktop polish
* Browser polish

---

### Phase 3 — Runtime Completion

Goal:

Feature parity.

* Browser Engine
* Browser Persistence
* Unified contracts

---

### Phase 4 — Backend Completion

* Timer
* Projects
* Tasks
* Configuration

---

### Phase 5 — MVP

Stable daily application.

---

### Phase 6 — Data Reliability

* Backup
* Restore
* Import
* Export
* Migration

---

### Phase 7 — Native Desktop

* Window polish
* Tray
* Notifications
* IPC optimization

---

### Phase 8 — Productivity Platform

* Dashboard
* Reports
* Analytics
* Automation
* Plugins

---

## Continuous Engineering

Every contribution should improve at least one of:

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
Documentation
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

## Long-Term Architecture

```text
Foundation
        ↓
Frontend Architecture
        ↓
Runtime Parity
        ↓
Complete Backend
        ↓
Stable MVP
        ↓
Reliable Data
        ↓
Native Desktop
        ↓
Productivity Platform
```
