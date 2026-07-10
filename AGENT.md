# AGENT.md

## AI Development Guide

This document defines the mandatory rules that every AI assistant must follow when contributing to oXyFlow.

These instructions override default coding habits whenever they conflict with generic AI behavior.

---

## Primary Objective

Produce code that is:

* correct
* maintainable
* readable
* consistent with the existing architecture

Generating more code is **not** the objective.

Generating the **right** code is.

---

## Architecture First

Before writing any code, understand the architecture.

If an implementation would violate the architecture, choose another solution.

Never optimize for the shortest implementation at the expense of consistency.

---

## Current Architecture

```text
React UI
        │
        ▼
Feature Hooks
        │
        ▼
EngineRouter
PersistenceRouter
        │
        ▼
Runtime Implementations
        │
        ├──────── Desktop Runtime
        │             │
        │             ▼
        │      Tauri Commands
        │             │
        │             ▼
        │        Rust Engine
        │             │
        │             ▼
        │          SQLite
        │
        └──────── Browser Runtime
                      │
                      ▼
               Engine Plugin
               Persistence Plugin
                      │
                      ▼
                 LocalStorage
```

Everything should fit naturally into this architecture.

---

## Layer Responsibilities

### React

Responsible for:

* rendering
* user interaction
* UI state

React must never contain business logic.

---

### Hooks

Responsible for:

* coordinating UI
* calling routers

Hooks are not business services.

---

### EngineRouter

Responsible for:

* exposing business operations
* selecting runtime implementation

Never place business logic inside the router.

---

### PersistenceRouter

Responsible for:

* exposing persistence operations
* selecting storage implementation

Never implement business rules inside the persistence layer.

---

### Runtime Plugins

Runtime plugins adapt platform-specific implementations.

They should expose identical behavior whenever possible.

---

### Rust Engine

Rust is the reference implementation.

Whenever there is uncertainty, follow the Rust implementation.

---

## Mandatory Rules

Always:

* follow the existing architecture
* reuse existing domain models
* prefer composition
* keep functions focused
* keep modules cohesive
* write explicit code
* preserve runtime abstraction

Never:

* bypass EngineRouter
* bypass PersistenceRouter
* access SQLite directly from React
* duplicate business logic
* move business rules into repositories
* introduce unnecessary abstractions

---

## Business Logic

Business logic belongs only inside the Engine.

Examples include:

* timer lifecycle
* elapsed time
* validation
* statistics
* aggregates

Business rules must exist only once per runtime implementation.

---

## Persistence

Persistence exists only to store data.

Allowed:

* CRUD
* serialization
* deserialization
* transactions

Not allowed:

* validation
* calculations
* workflow decisions
* statistics

---

## Runtime Consistency

Desktop Runtime and Browser Runtime should behave identically whenever possible.

If a feature is implemented in one runtime, consider whether the other runtime also requires the same behavior.

---

## Code Generation Guidelines

When implementing a feature:

1. Understand the requirement.
2. Identify the correct architectural layer.
3. Reuse existing models.
4. Minimize changes.
5. Add tests where appropriate.
6. Verify architectural consistency.

Do not start coding before understanding where the code belongs.

---

## Refactoring Rules

Prefer small refactorings.

Avoid large rewrites unless explicitly requested.

When refactoring:

* preserve behavior
* improve readability
* reduce duplication
* improve separation of concerns

Never mix refactoring with unrelated feature work.

---

## Testing Expectations

Whenever practical:

* update existing tests
* add new unit tests
* keep integration tests passing

Avoid introducing changes that reduce testability.

---

## TypeScript Rules

Always:

* use strict typing
* prefer explicit types when they improve readability
* use existing interfaces
* keep functions small

Never:

* use `any`
* suppress type errors
* ignore compiler warnings
* use non-null assertions unless unavoidable

---

## Rust Rules

Always:

* follow idiomatic Rust
* prefer ownership over unnecessary cloning
* propagate errors correctly
* keep modules cohesive

Avoid unnecessary allocations and hidden side effects.

---

## Documentation

Whenever architecture changes:

Update:

* README.md
* MASTERMAP.md
* ENGINEERING.md
* AGENT.md

Documentation is part of the implementation.

---

## Pull Request Checklist

Before considering a task complete, verify:

* Architecture respected
* Routers used correctly
* No duplicated business logic
* No business logic in React
* No business logic in Persistence
* Runtime consistency preserved
* Tests updated
* Lint passes
* Formatting passes
* Documentation updated (if required)

---

## Guiding Principle

When in doubt:

Prefer the solution that makes the architecture clearer, even if it requires writing a little more code.

The long-term maintainability of the project is more important than the size of an individual change.
