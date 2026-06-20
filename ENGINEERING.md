# ENGINEERING.md

## Engineering Principles

This project follows a Product Engineering approach.

The objective is not to build software as fast as possible.

The objective is to build software that remains understandable, maintainable and extensible over time.

AI is an engineering accelerator, not an engineering replacement.

---

## Core Principles

### 1. Human-first architecture

AI may generate code.

Humans own:

- architecture
- product decisions
- technical decisions
- code quality validation
- long-term maintainability

---

### 2. Sustainable engineering

Prefer solutions that optimize for long-term maintenance over short-term speed.

Avoid unnecessary complexity.

Every abstraction must have a clear purpose.

---

### 3. Flow over features

Features should reduce friction.

Do not add functionality simply because it is possible.

Each feature must improve user experience or solve a real problem.

---

### 4. Native-first desktop application

oXyFlow is a desktop application.

Web technologies are used for UI.

The application should behave like a native application.

Priorities:

1. Responsiveness
2. Low resource consumption
3. Predictable behavior
4. Cross-platform compatibility

---

## Architectural Guidelines

### Single Responsibility

Modules should have a single responsibility.

If a file exceeds ~300-400 lines, evaluate splitting it.

Avoid "god objects", "god hooks" and "god components".

---

### Explicit boundaries

Separate responsibilities clearly.

Frontend:

- UI
- user interactions
- state orchestration

Rust:

- business logic
- persistence
- performance-critical operations

Shared:

- contracts
- data structures
- type definitions

---

### Data ownership

The frontend should not become the source of truth.

Long-term architecture:

```text
React
 ↓
Tauri invoke()
 ↓
Rust
 ↓
SQLite
```

---

## State Management

Avoid centralized "super stores".

Prefer domain separation.

Examples:

- TimeLog
- Projects
- Tasks
- Settings
- Window state

State should remain predictable and testable.

---

## Performance Guidelines

Optimize only when necessary.

Priorities:

1. Avoid unnecessary re-renders
2. Minimize I/O operations
3. Keep startup time low
4. Keep memory consumption predictable

Never optimize prematurely.

---

## Testing Philosophy

Tests validate behavior, not implementation.

Preferred order:

- unit tests
- integration tests

Avoid brittle tests.

---

## AI-Assisted Engineering

AI is used as:

- implementation accelerator
- reviewer
- challenger
- documentation assistant

AI is not an authority.

Always validate:

- architecture
- correctness
- security
- maintainability

Never blindly accept generated code.

---

## Documentation

Documentation is part of engineering.

Every major decision should be documented.

Keep documentation concise and useful.

Avoid documentation that duplicates code.

---

## Decision Rule

When multiple solutions exist, prefer the one that is:

- simpler
- more maintainable
- easier to understand
- easier to test
- easier to extend

over the one that is merely clever.
