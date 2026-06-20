# AGENT.md

## AI Agent Instructions

This document defines the engineering rules for all AI agents contributing to this repository.

The AI agent is an implementation assistant, not an autonomous engineer.

Humans remain responsible for architecture, product decisions and code quality.

---

## General Rules

### Responsibilities

AI may:

- implement features
- refactor code
- write tests
- improve documentation
- identify issues
- propose improvements

AI must not:

- redesign architecture without explicit request
- introduce new dependencies without justification
- perform large rewrites without approval
- remove existing functionality
- overengineer solutions

---

### Coding Principles

Always prioritize:

1. Simplicity
2. Readability
3. Maintainability
4. Explicitness
5. Predictability

Avoid:

- unnecessary abstractions
- premature optimization
- magic values
- hidden side effects
- duplicated code

---

### File Size Guidelines

Evaluate splitting files when they exceed:

- Components: ~300 lines
- Hooks: ~300 lines
- Services/Engines: ~400 lines

Avoid creating "god objects".

---

## Frontend (React)

### Responsibilities

Frontend is responsible for:

- UI rendering
- user interactions
- state orchestration

Frontend is NOT responsible for:

- persistence
- heavy computations
- business logic

---

### Component Rules

Components should:

- have a single responsibility
- remain small and composable
- avoid excessive prop drilling

Prefer composition over inheritance.

---

### State Management

Avoid central "super stores".

Separate state by domain.

Examples:

- TimeLog
- Projects
- Tasks
- Settings
- UI state

Keep state predictable.

---

### TypeScript Rules

Avoid:

```ts
any
```

Prefer:

```ts
unknown
```

Use explicit interfaces and types.

Enable strict typing whenever possible.

---

## Tauri / Rust

### Responsibilities

Rust owns:

- business logic
- persistence
- performance-critical operations

React communicates through:

```text
invoke()
```

Long-term architecture:

```text
React
 ↓
Tauri
 ↓
Rust
 ↓
SQLite
```

Do not bypass this architecture.

---

### Rust Guidelines

Prefer:

- explicit error handling
- Result types
- small modules
- strong typing

Avoid:

- unwrap() in production code
- panic! for business scenarios
- hidden global state

---

## Testing

Tests validate behavior, not implementation.

Priorities:

1. Unit tests
2. Integration tests

Avoid brittle tests.

---

### Unit Tests

Test:

- pure functions
- business rules
- edge cases

Do not test implementation details.

---

### Integration Tests

Test:

- interactions between modules
- application flows
- persistence behavior

Avoid excessive mocking.

---

## DevOps

Keep CI simple and deterministic.

CI should:

- install dependencies
- run linting
- run frontend tests
- run Rust tests
- build the application

Fail fast.

---

### Dependencies

Before adding a dependency, verify:

- Is it necessary?
- Can existing code solve this?
- Is it actively maintained?
- Does it increase complexity?

Prefer fewer dependencies.

---

## Documentation

Update documentation whenever changes affect:

- architecture
- workflows
- public interfaces
- engineering decisions

Avoid duplicating code in documentation.

---

## Refactoring Rules

Refactor incrementally.

Do not rewrite entire modules unless explicitly requested.

Preserve existing behavior.

Large refactors should be split into small, reviewable changes.

---

## AI Decision Rule

When multiple solutions exist, choose the one that is:

- simpler
- easier to understand
- easier to test
- easier to maintain
- easier to extend

Never optimize for cleverness.

When uncertain, ask for clarification instead of making assumptions.
