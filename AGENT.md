# AGENT.md

## AI Development Guide

This document defines the mandatory architectural and engineering rules that every AI assistant must follow when contributing to oXyFlow.

These rules override generic coding practices whenever they conflict with the project's architecture.

The objective is not to generate more code.

The objective is to preserve a clean, maintainable architecture.

---

## Primary Objective

Always produce code that is:

- Correct
- Predictable
- Maintainable
- Readable
- Consistent
- Easy to extend

Architecture is always more important than implementation speed.

---

## Think Before Coding

Before writing any code always answer these questions.

### 1

Which architectural layer owns this responsibility?

### 2

Does an implementation already exist?

### 3

Can existing code be reused?

### 4

Does this change preserve the current architecture?

Only after answering these questions should implementation begin.

---

## Architecture Overview

The project is built around independently replaceable implementations.

```text
React UI
        │
        ▼
Application Routers
        │
        ▼
Runtime Implementations
        │
        ▼
Business Engine / Persistence
```

Every layer owns exactly one responsibility.

---

## Backend Architecture

### EngineRouter

Selects the active Engine implementation.

Never contains business logic.

---

### PersistenceRouter

Selects the active Persistence implementation.

Never contains business logic.

---

### Engine

Contains every business rule.

Rust is the reference implementation.

---

### Persistence

Stores and retrieves data.

Nothing more.

---

## Frontend Architecture

The frontend follows exactly the same architectural philosophy.

It consists of four independent concepts.

---

### Runtime

Defines where the application executes.

Examples:

- Browser
- Tauri

Future runtimes must be easy to add.

Runtime owns:

- environment integration
- native APIs
- runtime wrappers
- runtime styling

Runtime never owns:

- business logic
- layout
- component hierarchy

---

### Runtime Applications

Each runtime exposes its own application entry point.

Examples:

```text
app-browser/

app-tauri/
```

Both must expose the same frontend architecture.

Only runtime-specific behavior may differ.

---

### LayoutManager

LayoutManager composes the application inside the current runtime.

Responsibilities:

- host application shell
- compose LayoutVariant
- host shared providers
- host shared layout

LayoutManager never decides:

- runtime
- layout variant
- text scale

Those values always come from configuration.

---

### LayoutVariant

LayoutVariant defines application composition.

Examples:

- Full
- Half
- Compact

Each LayoutVariant has its own Builder.

Builders define structure only.

Builders never:

- calculate spacing
- detect runtime
- contain business logic

---

### TextAndIconSize

TextAndIconSize defines visual scale.

Responsible only for:

- typography
- icons
- spacing
- paddings
- border radius
- CSS Design Tokens

It never changes layout.

---

## CSS Rules

Presentation belongs to CSS.

React components should not calculate:

- spacing
- margins
- typography
- paddings
- icon sizes

Components consume Design Tokens only.

Example:

```css
padding: var(--spacing-card);
```

Never generate React code that calculates visual scale.

---

## React Responsibilities

React owns:

- rendering
- interaction
- local UI state
- composition

React never owns:

- business rules
- persistence
- runtime selection
- visual scaling

---

## Hooks

Hooks coordinate UI.

Hooks may:

- call routers
- prepare view models
- coordinate interaction

Hooks must never:

- duplicate Engine logic
- implement workflows
- perform calculations already available inside Engine

---

## Runtime Rules

Shared components must never know whether they run inside:

- Browser
- Tauri

Runtime differences belong only to runtime implementations.

Never leak runtime into shared components.

---

## Builder Rules

Builders compose layouts.

Builders never:

- calculate scale
- detect runtime
- contain business logic

---

## Business Rules

Business logic belongs exclusively inside Engine.

Examples:

- timer lifecycle
- elapsed calculations
- validation
- statistics
- aggregates

Business logic must exist exactly once per runtime implementation.

---

## Persistence Rules

Persistence stores data.

Allowed:

- CRUD
- serialization
- deserialization
- transactions

Forbidden:

- validation
- statistics
- workflows
- business decisions

---

## When Adding New Features

Always determine first whether the feature belongs to:

- Engine
- Persistence
- Runtime
- Layout
- React
- CSS

Choose the correct layer before writing code.

---

## When Adding New Runtime

Never modify shared components.

Instead:

- create a new runtime implementation
- reuse LayoutManager
- reuse Layout Builders
- reuse shared components

---

## When Adding New Layout

Never modify Runtime.

Instead:

- add a new Layout Builder
- register it inside LayoutManager

Everything else remains unchanged.

---

## When Adding New Scale

Never modify components.

Only:

- add CSS Design Tokens
- update CSS variables

Components should automatically adapt.

---

## Refactoring Rules

Prefer architectural refactoring over local optimization.

Refactor only one concern at a time.

Never combine:

- feature work
- refactoring
- architecture changes

unless explicitly requested.

---

## AI Workflow

Every task follows the same sequence.

```text
Understand

↓

Architecture

↓

Correct Layer

↓

Contracts

↓

Implementation

↓

Tests

↓

Documentation
```

Never skip steps.

---

## Documentation

Whenever architecture changes update:

- README.md
- MASTERMAP.md
- ENGINEERING.md
- AGENT.md

Documentation is part of the implementation.

---

## TypeScript Rules

Always:

- strict typing
- explicit types where helpful
- reuse existing models
- keep modules cohesive

Never:

- use any
- suppress compiler errors
- duplicate types

---

## Rust Rules

Always:

- write idiomatic Rust
- propagate errors correctly
- keep modules cohesive
- preserve Rust as Source of Truth

---

## AI Decision Rules

When uncertain:

1. Follow MASTERMAP.
2. Follow ENGINEERING.
3. Preserve architecture.
4. Prefer simpler solutions.
5. Ask for clarification instead of guessing.

Never invent architecture.

Never introduce abstraction without justification.

---

## Definition of Done

A task is complete only if:

- Architecture remains consistent.
- Responsibilities remain clear.
- Tests pass.
- TypeScript passes.
- Rust builds.
- Formatting passes.
- Documentation is updated.
- Runtime independence is preserved.
- Layout independence is preserved.
- Visual scaling remains CSS-driven.

---

## Guiding Principle

The project is designed around independently replaceable implementations.

Always preserve the separation between:

- Runtime
- LayoutVariant
- TextAndIconSize
- Engine
- Persistence

Every contribution should make those boundaries clearer, never weaker.
