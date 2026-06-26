# ENGINEERING.md

## Engineering Principles

oXyFlow follows a Product Engineering approach.

The goal is not to build software as quickly as possible.

The goal is to build software that remains understandable, maintainable and extensible for years.

AI accelerates engineering. It does not replace engineering.

---

## Core Values

### 1. Correctness First

Correct software is always preferred over fast software.

Priorities:

1. Correctness
2. Maintainability
3. User Experience
4. Performance
5. New Features

Never sacrifice correctness for speed.

---

### 2. Sustainable Engineering

Every change should reduce future maintenance cost.

Prefer simple solutions over clever ones.

Avoid unnecessary abstractions.

Every abstraction must solve a real problem.

---

### 3. Human Ownership

AI assists development.

Humans own:

* architecture
* product vision
* technical decisions
* code quality
* security
* maintainability

Generated code must always be reviewed.

---

### 4. Flow-Oriented Design

Every feature should reduce friction.

Avoid feature creep.

New functionality should improve real user workflows rather than increase feature count.

---

### 5. Native-First Philosophy

oXyFlow is a desktop application.

React provides the UI.

Rust provides the application core.

The application should feel native.

Priorities:

* responsiveness
* low memory usage
* predictable behavior
* cross-platform compatibility

Lightweight operation is more important than maximum performance.

---

## Architecture

### Layered Architecture

The application is organized into clear layers.

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

Dependencies always point downward.

Lower layers must never depend on higher layers.

---

### Domain Separation

Keep business domains independent.

Examples:

* Timer
* Projects
* Tasks
* Settings
* Configuration

Avoid large shared modules.

---

### Single Responsibility

Each module should have one reason to change.

Prefer many focused modules over a few large ones.

If a file grows beyond roughly 300–400 lines, evaluate whether it should be split.

Avoid:

* God Objects
* God Components
* God Hooks
* God Services

---

### Repository Pattern

Repositories own data access.

Business logic must not directly communicate with storage.

Storage implementations should be replaceable without changing business logic.

---

### Persistence Layer

Persistence implementations should remain isolated.

Supported storage backends may include:

* SQLite
* CSV
* Configuration files

Persistence should never leak into UI code.

---

## Frontend Guidelines

React is responsible for:

* presentation
* user interaction
* state orchestration

React should not contain business logic.

Complex business rules belong in Rust.

---

## Backend Guidelines

Rust owns:

* business rules
* persistence
* validation
* application services
* performance-critical operations

Rust is the source of truth.

---

## State Management

Prefer small domain-specific state.

Avoid global application stores whenever possible.

Examples:

* Timer state
* Projects
* Tasks
* Settings
* Window state

State should remain predictable, isolated and testable.

---

## Performance

Optimize only after correctness.

Priorities:

1. Low memory usage
2. Fast startup
3. Predictable resource consumption
4. Efficient I/O
5. Minimal unnecessary rendering

Avoid premature optimization.

Prefer lightweight solutions over micro-optimizations.

---

## Testing

Tests validate behavior rather than implementation.

Preferred order:

1. Unit tests
2. Integration tests

Every architectural change should preserve existing tests.

---

## Development Workflow

Before considering a task complete, verify quality.

Frontend:

* npm run lint
* npm run typecheck
* npm run test

Backend:

* cargo fmt
* cargo test

Address root causes instead of applying temporary fixes.

Avoid introducing cascading errors.

---

## AI-Assisted Development

AI should be used for:

* implementation
* architecture discussions
* code review
* documentation
* brainstorming
* identifying edge cases

Never accept generated code without validation.

AI suggestions should challenge existing solutions, not merely implement them.

---

## Documentation

Architecture is documented.

Important design decisions are documented.

Documentation should explain *why*, not repeat *what* the code already shows.

Keep documentation concise and current.

---

## Decision Rule

When several solutions are technically valid, prefer the one that is:

* simpler
* easier to understand
* easier to maintain
* easier to test
* easier to extend
* consistent with the existing architecture

Avoid unnecessary complexity.

Consistency is usually more valuable than novelty.
