# AGENT.md

## AI Agent Operational Guidelines

This repository is developed using AI-assisted engineering.

AI agents act as implementation assistants. Humans remain responsible for architecture, product decisions and final validation.

---

## 1. General Principles

### Scope

AI agents may:

- implement features
- refactor existing code
- write tests
- improve documentation
- identify issues
- propose improvements

AI agents must not:

- redesign architecture without explicit approval
- introduce unnecessary dependencies
- rewrite large portions of the codebase without request
- remove existing functionality
- make assumptions about product requirements

When uncertain, ask for clarification.

---

## 2. Engineering Priorities

Prioritize in this order:

1. Correctness
2. Simplicity
3. Readability
4. Maintainability
5. Performance

Avoid:

- overengineering
- premature optimization
- unnecessary abstractions
- hidden side effects
- duplicated code

---

## 3. Frontend (React)

Frontend responsibilities:

- UI rendering
- user interactions
- state orchestration

Frontend should not contain:

- persistence logic
- heavy computations
- business-critical rules

Guidelines:

- Keep components focused.
- Prefer composition.
- Avoid deep prop drilling.
- Keep state domain-oriented.
- Use explicit TypeScript types.

Avoid `any`.

---

## 4. Tauri / Rust

Rust is the application core.

Rust responsibilities:

- business logic
- persistence
- performance-sensitive operations

Frontend communicates only through Tauri APIs.

Target architecture:

React

↓

Tauri

↓

Rust

↓

SQLite

Do not bypass architectural boundaries.

Rust guidelines:

- Prefer `Result`
- Handle errors explicitly
- Avoid `unwrap()` in production code
- Avoid hidden global state

---

## 5. Testing

Tests validate behavior, not implementation.

Priorities:

- unit tests
- integration tests

Test:

- business rules
- edge cases
- interactions between modules

Avoid:

- brittle tests
- excessive mocking
- implementation-specific assertions

---

## 6. DevOps

CI must remain deterministic.

Pipelines should:

- install dependencies
- run linting
- run frontend tests
- run Rust tests
- build the application

Fail fast.

Before adding dependencies, verify:

- Is it necessary?
- Is it maintained?
- Does it increase complexity?

Prefer fewer dependencies.

---

## 7. Documentation

Documentation is part of engineering.

Update documentation whenever changes affect:

- architecture
- workflows
- public interfaces
- engineering decisions

Avoid duplicating code inside documentation.

---

## 8. Refactoring

Refactor incrementally.

Preserve existing behavior.

Large changes must be split into small, reviewable steps.

Avoid full rewrites unless explicitly requested.

---

## 9. Decision Rule

When multiple solutions exist, choose the one that is:

- simpler
- easier to understand
- easier to test
- easier to maintain
- easier to extend

Do not optimize for cleverness.
