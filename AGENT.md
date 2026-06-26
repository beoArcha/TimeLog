# AGENT.md

## AI Agent Operational Guidelines

This repository is developed using AI-assisted engineering.

AI agents are implementation assistants.

Humans own architecture, product direction and final technical decisions.

---

## Mission

The objective is not to generate the most code.

The objective is to make the codebase better with every change.

Every contribution should improve at least one of:

* correctness
* maintainability
* readability
* consistency
* documentation

---

## Working Process

For every task:

1. Understand the existing implementation.
2. Follow the current architecture.
3. Make the smallest reasonable change.
4. Validate the result.
5. Update documentation when necessary.

Avoid unnecessary rewrites.

---

## Before Writing Code

Always:

* inspect related files
* understand existing patterns
* reuse existing abstractions
* identify the correct architectural layer

Never introduce parallel implementations of existing functionality.

---

## Engineering Priorities

Always prioritize:

1. Correctness
2. Maintainability
3. Consistency
4. Simplicity
5. Performance

Never sacrifice architecture for short-term speed.

---

## Architectural Rules

Respect existing architectural boundaries.

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
Persistence
```

Dependencies always point downward.

Do not bypass repositories.

Do not access persistence directly from business logic.

Do not move business logic into React.

---

## Frontend Guidelines

React is responsible for:

* rendering
* user interaction
* state orchestration

React should not contain:

* persistence
* business rules
* storage logic

Guidelines:

* keep components small
* prefer composition
* avoid deeply nested props
* avoid duplicated logic
* use custom hooks appropriately

Always use explicit TypeScript types.

Avoid `any`.

If a type becomes difficult to express, improve the type model instead of using `any`.

---

## Backend Guidelines

Rust owns:

* business rules
* repositories
* persistence
* validation
* application services

Guidelines:

* prefer `Result`
* propagate errors
* avoid `unwrap()` in production
* avoid hidden global state
* keep modules focused

Repositories own storage access.

Persistence implementations should remain interchangeable.

---

## Refactoring

Refactor only when it improves the codebase.

Prefer incremental improvements.

Avoid unrelated cleanup during feature work.

Large refactorings should be divided into small reviewable steps.

Preserve behavior unless explicitly instructed otherwise.

---

## Testing

Changes should preserve existing behavior.

Whenever practical:

* add unit tests
* update integration tests
* cover edge cases

Tests validate behavior, not implementation.

Avoid brittle tests.

---

## Quality Checklist

Before considering a task complete:

Frontend:

* npm run lint
* npm run typecheck
* npm run test

Backend:

* cargo fmt
* cargo test

Resolve failures instead of working around them.

Avoid introducing cascading errors.

---

## Dependencies

Before adding a dependency, verify:

* Is it necessary?
* Does the standard library already solve the problem?
* Is an existing dependency sufficient?
* Is it actively maintained?

Prefer fewer dependencies.

---

## Documentation

Update documentation whenever changes affect:

* architecture
* workflows
* public APIs
* engineering decisions

Documentation should explain intent rather than duplicate code.

---

## AI Behavior

AI should:

* follow existing architecture
* challenge questionable designs
* identify potential issues
* explain trade-offs
* ask questions when requirements are unclear

AI should not:

* invent requirements
* redesign architecture without approval
* introduce unnecessary abstractions
* silently change behavior
* ignore project conventions

When uncertain, ask for clarification.

---

## Decision Rule

When multiple valid solutions exist, choose the one that is:

* simpler
* more consistent
* easier to understand
* easier to test
* easier to maintain
* easier to extend

Favor incremental improvement over cleverness.

Leave the codebase in a better state than you found it.
