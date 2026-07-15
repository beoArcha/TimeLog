# ENGINEERING.md

## Engineering Guide

This document defines the engineering principles, architectural rules, development standards, and frontend/backend responsibilities for oXyFlow.

It is the authoritative engineering reference for contributors, reviewers, and AI assistants.

---

## Engineering Goals

Every engineering decision should improve at least one of the following without unnecessarily harming the others.

* Simplicity
* Maintainability
* Correctness
* Predictability
* Testability
* Runtime Independence
* Native User Experience
* Long-Term Sustainability

---

## Core Engineering Principles

### KISS

Prefer the simplest solution that satisfies the current requirements.

Avoid unnecessary abstraction.

Avoid architecture created only for possible future scenarios.

---

### SOLID

Apply SOLID only when it genuinely improves maintainability.

Avoid interfaces, inheritance or indirection that provide no practical value.

---

### DRY

Business logic must never be duplicated.

Platform-specific implementations may differ when doing so improves readability or runtime isolation.

---

### YAGNI

Never implement features for hypothetical future needs.

Extension points should exist only when they already solve a real problem.

---

### Composition over Inheritance

The entire application is based on composition.

Systems are assembled from:

* Routers
* Managers
* Builders
* Runtime implementations

Avoid deep inheritance hierarchies.

---

## Architectural Layers

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

Every layer has exactly one responsibility.

---

## Backend Architecture

### EngineRouter

Responsible only for selecting the active Engine implementation.

Never contains business logic.

---

### PersistenceRouter

Responsible only for selecting the active Persistence implementation.

Never contains business logic.

---

### Engine

Business logic belongs exclusively to Engine.

Responsibilities include:

* timer lifecycle
* elapsed calculations
* statistics
* validation
* workflows
* aggregates

Rust remains the reference implementation.

---

### Persistence

Persistence is responsible only for storing and retrieving data.

Responsibilities:

* load
* save
* update
* delete

Persistence never:

* validates business rules
* calculates statistics
* changes workflows

---

## Frontend Architecture

The frontend follows the same architectural philosophy as the backend.

Business logic remains outside React.

Frontend is divided into independent responsibilities.

---

### Runtime

A Runtime represents the execution environment.

Current runtimes:

* Browser
* Tauri

Future runtimes may include:

* Electron
* Mobile
* Embedded
* WebView

Runtime is responsible only for:

* environment integration
* native APIs
* window management
* runtime wrappers
* runtime styling

Runtime never changes:

* business logic
* layout composition
* component hierarchy

---

### Runtime Applications

Each runtime owns its application entry point.

Examples:

```text
app-browser/

app-tauri/
```

Both expose exactly the same frontend architecture.

Differences should remain limited to:

* runtime integration
* window behavior
* runtime CSS
* native APIs

---

### LayoutManager

LayoutManager composes the application inside the current runtime.

Responsibilities:

* host application shell
* compose LayoutVariant
* provide shared application structure
* host common providers

LayoutManager never decides:

* runtime
* layout variant
* visual scale

Those values come from application configuration.

---

### LayoutVariant

LayoutVariant defines application composition.

Examples:

* Full
* Half
* Compact

LayoutVariant determines:

* page composition
* column layout
* navigation placement
* major screen regions

Each LayoutVariant has its own Builder.

---

### Layout Builders

Builders compose layouts.

Examples:

* FullBuilder
* HalfBuilder
* CompactBuilder

Builders never:

* calculate sizes
* detect runtime
* modify business logic

Builders only compose views.

---

### TextAndIconSize

TextAndIconSize defines visual scale.

It controls only:

* typography
* icon sizes
* spacing
* paddings
* border radius
* CSS Design Tokens

It never changes layout composition.

---

## CSS Architecture

CSS is responsible for presentation.

React components should not calculate:

* spacing
* paddings
* margins
* typography
* sizing

Visual scaling belongs entirely to CSS Design Tokens.

Application state is exposed through root classes.

Example:

```text
runtime-tauri

layout-full

text-medium
```

Components consume only CSS variables.

Example:

```css
padding: var(--spacing-card);
```

React should not contain conditional styling logic based on scale.

---

## React Responsibilities

React is responsible only for:

* rendering
* user interaction
* local UI state
* view composition

React must never contain:

* business calculations
* persistence logic
* runtime selection
* platform-specific workflows

---

## Component Rules

Components should:

* be small
* have a single responsibility
* remain reusable
* avoid unnecessary state

Prefer composition.

Avoid monolithic components.

---

## Hooks

Hooks orchestrate UI behavior.

Hooks must not:

* implement business logic
* access persistence directly
* duplicate Engine behavior

---

## Repository Rules

Repositories only access storage.

Never:

* validate
* calculate
* orchestrate workflows

---

## Runtime Rules

Runtime-specific code must remain isolated.

No shared component should know whether it runs inside:

* Browser
* Tauri

Runtime differences belong only to runtime implementations.

---

## Builder Rules

Builders define structure.

Builders never define scale.

Builders never define runtime behavior.

---

## Testing Strategy

### Unit Tests

* utilities
* plugins
* repositories
* builders

---

### Integration Tests

* routers
* runtime communication
* tauri commands
* persistence

---

### End-to-End

* timer workflow
* project workflow
* task workflow
* configuration

---

## Performance

Always prioritize:

1. Correctness
2. Maintainability
3. Readability
4. Performance

Never sacrifice architecture for hypothetical optimizations.

---

## AI Development Workflow

Every architectural change follows the same sequence.

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

AI must never skip steps.

---

## Definition of Done

A task is complete only when:

* architecture remains consistent
* documentation is updated
* tests pass
* typecheck passes
* lint passes
* formatting passes
* both runtimes behave consistently
* new code follows engineering rules

---

## Non-Negotiable Rules

### Never

* Put business logic into React.
* Bypass EngineRouter.
* Bypass PersistenceRouter.
* Couple UI to storage.
* Detect runtime inside shared components.
* Calculate UI scale inside React components.
* Mix layout composition with visual scaling.

### Always

* Keep responsibilities focused.
* Prefer composition.
* Isolate runtimes.
* Keep LayoutVariant independent from TextAndIconSize.
* Keep CSS responsible for presentation.
* Keep components simple.
* Leave the project cleaner than you found it.
