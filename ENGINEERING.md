# ENGINEERING.md

## Engineering Guide

This document defines the engineering principles, architectural rules, and development standards for oXyFlow.

It is the authoritative reference for contributors, reviewers, and AI assistants.

---

## Design Goals

The project is designed to achieve:

* simplicity
* maintainability
* correctness
* predictable architecture
* high testability
* runtime independence
* native performance

Every design decision should improve at least one of these goals without unnecessarily harming the others.

---

## Engineering Principles

### KISS

Prefer the simplest solution that satisfies the requirements.

Avoid premature abstractions.

---

### SOLID

Apply SOLID where it improves maintainability.

Do not introduce interfaces or inheritance solely to satisfy theoretical purity.

---

### DRY

Avoid duplicated business logic.

Duplicated platform code is acceptable if it improves readability or runtime isolation.

---

### YAGNI

Do not implement future features until there is a concrete requirement.

Keep extension points only where they already provide value.

---

### Composition over Inheritance

Prefer composition.

Runtime behavior should be assembled from routers and plugins instead of deep inheritance hierarchies.

---

## Architectural Overview

The application is divided into four major layers.

```text
React UI
        │
        ▼
Routers
        │
        ▼
Runtime Implementations
        │
        ▼
Business Engine / Persistence
```

Each layer has a single responsibility.

---

## React Layer

Responsible for:

* rendering
* user interaction
* local UI state
* view composition

React must never contain business rules.

Examples of forbidden logic:

* timer calculations
* statistics
* persistence decisions
* runtime detection

---

## Routers

Routers expose a stable API to the frontend.

They select the active runtime implementation.

Routers do not implement business logic.

Current routers:

* EngineRouter
* PersistenceRouter

---

## EngineRouter

Responsibilities:

* expose engine operations
* choose runtime implementation
* keep frontend runtime-independent

EngineRouter must not:

* calculate business values
* access storage directly
* manipulate SQLite
* know UI details

---

## PersistenceRouter

Responsibilities:

* abstract persistence
* expose repository operations
* route requests to the correct backend

PersistenceRouter must not:

* calculate elapsed time
* validate business rules
* implement domain workflows

Persistence exists only to store and retrieve data.

---

## Runtime Implementations

The project currently supports two runtime environments.

### Desktop Runtime

```text
React

↓

EngineRouter
PersistenceRouter

↓

Tauri Commands

↓

Rust Engine

↓

SQLite
```

The Rust implementation is the reference implementation.

---

### Browser Runtime

```text
React

↓

EngineRouter
PersistenceRouter

↓

Engine Plugin
Persistence Plugin

↓

LocalStorage
```

Browser plugins should replicate Rust behavior as closely as possible.

---

## Rust Engine

Rust is the source of truth for business logic.

Responsibilities include:

* timer state
* calculations
* validation
* aggregates
* business workflows

Whenever behavior differs between Rust and Browser implementations, Rust is considered correct.

---

## Persistence Layer

Persistence is responsible only for storage.

Possible implementations:

* SQLite
* LocalStorage
* CSV
* future cloud providers

Persistence should never contain business rules.

---

## Repository Rules

Repositories:

* load data
* save data
* update data
* delete data

Repositories must not:

* calculate statistics
* modify business workflows
* decide application behavior

---

## Business Rules

Business rules belong exclusively to the Engine.

Examples:

* starting a timer
* stopping a timer
* elapsed time calculation
* overlapping log validation
* statistics generation

These rules must exist exactly once per runtime implementation.

---

## Frontend Rules

React components should remain as small as practical.

Recommended order of responsibility:

Component

↓

Feature Hook

↓

Router

↓

Runtime

↓

Business Engine

Avoid:

* large components
* duplicated state
* business calculations in hooks
* direct persistence access

---

## Testing Strategy

The testing pyramid consists of:

### Unit Tests

* utilities
* domain logic
* plugins
* repositories

### Integration Tests

* routers
* Tauri commands
* persistence
* runtime communication

### End-to-End Tests

* complete user workflows
* timer lifecycle
* project management
* task management

---

## Error Handling

Errors should be:

* explicit
* typed where practical
* propagated upward
* presented to users with meaningful messages

Avoid swallowing exceptions.

---

## Performance Guidelines

Optimize only after correctness.

Priorities:

1. Correctness
2. Readability
3. Maintainability
4. Performance

Do not introduce complexity for hypothetical performance gains.

---

## Code Style

Preferred:

* small functions
* descriptive names
* immutable data where practical
* explicit control flow

Avoid:

* hidden side effects
* deeply nested conditionals
* unnecessary abstractions
* magic values

---

## AI Development Guidelines

AI-generated code must:

* follow existing architecture
* preserve runtime abstraction
* avoid bypassing routers
* avoid duplicating business logic
* prefer existing domain models
* keep Rust and Browser implementations behaviorally aligned

When extending functionality:

1. Update contracts.
2. Implement runtime behavior.
3. Add tests.
4. Refactor only if necessary.

---

## Definition of Done

A feature is considered complete only when:

* architecture remains consistent
* tests pass
* lint passes
* formatting passes
* documentation is updated
* both runtimes continue to behave consistently (where applicable)

---

## Non-Negotiable Rules

Never:

* put business logic into React
* bypass EngineRouter
* bypass PersistenceRouter
* duplicate business rules
* let persistence decide business behavior
* couple UI to storage implementation

Always:

* keep layers independent
* keep responsibilities focused
* write code that is easy to understand before making it clever
* leave the codebase cleaner than you found it
