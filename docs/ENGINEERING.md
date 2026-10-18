# ENGINEERING.md

## Engineering Guide

This document defines the engineering principles, architectural rules, development standards, and frontend/backend responsibilities for oXyFlow.

It is the authoritative engineering reference for contributors, reviewers, and AI assistants.

---

## Engineering Goals

Every engineering decision should improve at least one of the following without unnecessarily harming the others.

- Simplicity
- Maintainability
- Correctness
- Predictability
- Testability
- Runtime Independence
- Native User Experience
- Long-Term Sustainability

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

- Routers
- Managers
- Builders
- Runtime implementations

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

### EngineRouter & PersistenceRouter (`IRouter<T>`)

Responsible exclusively for selecting and routing to the active runtime implementation (Tauri IPC vs Browser In-Memory / LocalStorage):

- Implement generic lifecycle interface `IRouter<T>` providing `setImplementationForTesting(implementation: T): void`.
- Expose domain sub-interfaces via polymorphic getters (`timer`, `metrics`, `timeLogs`, `validation`).
- Never contain business logic, transformation, or fallback heuristics.

---

### Engine (`IEngine`)

Business logic and calculations belong exclusively to Engine (`IEngine`), decomposed according to ISP into segregated domain sub-engines:

- `timer: ITimerEngine`: timer lifecycle (`startTimer`, `stopTimer`, `resumeTimer`, `getActiveLogs`)
- `metrics: IMetricsEngine`: snapshot metrics and elapsed calculations (`getComputedMetrics`, `getTaskElapsed`, `getProjectElapsed`, `getElapsedRange`, `getProjectStatistics`)
- `timeLogs: ITimeLogsEngine`: interval edits, corrections, and audit history (`editTimeLog`)
- `validation: IValidationEngine`: domain entity validations (`validateProjectName`, `validateTaskName`, `validateTaskHierarchy`)

Rust remains the reference implementation; Browser `EnginePlugin` guarantees behavioral parity.

---

### Persistence (`IPersistence`)

Persistence (`IPersistence` / `PersistenceRouter`) is responsible only for storing, retrieving, and mutating entity state.

Responsibilities:

- read state (`load`, `overrideState`, `reset`)
- entity CRUD (`projects`, `tasks`, `timeLogs`, `holidays`, `patches`)
- configurations and settings (`settings`, `runtimeConfigs`, `uiState`, `externalApi`, `locale`)
- backup and export operations
- parity between SQLite backend (Tauri) and LocalStorage `PersistencePlugin` (Browser)
- domain persistence services (`projects`, `tasks`, etc.) are decoupled from `core.load()` and execute targeted, granular queries or IPC calls directly

Persistence never:

- validates business time overlap rules (Engine responsibility)
- calculates metric statistics
- orchestrates active timer ticks
- invokes full-state `core.load()` downloads for granular single-entity mutations (e.g. `rename`, `getProjectId`, `getSubtasks`)

---

## Frontend Architecture

The frontend follows the same architectural philosophy as the backend.

Business logic remains outside React.

Frontend is divided into independent responsibilities.

---

### Runtime

A Runtime represents the execution environment.

Current runtimes:

- Browser
- Tauri

Future runtimes may include:

- Electron
- Mobile
- Embedded
- WebView

Runtime is responsible only for:

- environment integration
- native APIs
- window management
- runtime wrappers
- runtime styling

Runtime never changes:

- business logic
- layout composition
- component hierarchy

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

- runtime integration
- window behavior
- runtime CSS
- native APIs

---

### LayoutManager

LayoutManager composes the application inside the current runtime.

Responsibilities:

- host application shell
- compose LayoutVariant
- provide shared application structure
- host common providers

LayoutManager never decides:

- runtime
- layout variant
- visual scale

Those values come from application configuration.

---

### LayoutVariant

LayoutVariant defines application composition.

Examples:

- Full
- Half
- Compact

LayoutVariant determines:

- page composition
- column layout
- navigation placement
- major screen regions

Each LayoutVariant has its own Builder.

---

### Layout Builders

Builders compose layouts.

Examples:

- FullBuilder
- HalfBuilder
- CompactBuilder

Builders never:

- calculate sizes
- detect runtime
- modify business logic

Builders only compose views.

---

### TextAndIconSize

TextAndIconSize defines visual scale.

It controls only:

- typography
- icon sizes
- spacing
- paddings
- border radius
- CSS Design Tokens

It never changes layout composition.

---

## CSS Architecture

CSS is responsible for presentation.

React components should not calculate:

- spacing
- paddings
- margins
- typography
- sizing
- theme visual variants via inline branching

Visual scaling belongs entirely to CSS Design Tokens.

Application state is exposed through root classes.

Example:

```text
runtime-tauri

layout-full

text-medium
```

Components consume only CSS variables and semantic design tokens (`bg-card`, `border-border`, `text-card-foreground`, `text-foreground`).

Example:

```css
padding: var(--spacing-card);
```

React should not contain conditional styling logic based on scale.

### Theme DIP Architecture

The application adopts the Dependency Inversion Principle (DIP) for theme styling:

- **No Inline Theme Branching**: React components must not evaluate `resolvedTheme === 'light'` or `theme === 'high-contrast'`.
- **ThemeRegistry**: The singleton `ThemeRegistry` (`src/styles/themeRegistry.ts`) holds built-in (`light`, `dark`, `high-contrast`) and extensible custom themes.
- **Dynamic Application**: Applying a theme injects or toggles `data-theme` on `document.documentElement` and applies CSS variables dynamically.
- **AST Architecture Verification**: Strict AST inspection in `tests/architecture/specs/no-inline-theme-ternaries.arch.test.ts` enforces zero inline theme conditionals across the entire codebase with an empty allowlist.

---

## React Responsibilities

React is responsible only for:

- rendering
- user interaction
- local UI state
- view composition

React must never contain:

- business calculations
- persistence logic
- runtime selection
- platform-specific workflows

---

## Component Rules

Components should:

- be small
- have a single responsibility
- remain reusable
- avoid unnecessary state

Prefer composition.

Avoid monolithic components.

---

## Hooks

Hooks orchestrate UI behavior.

Hooks must not:

- implement business logic
- access persistence directly
- duplicate Engine behavior

### Live Calculation Hooks

Time elapsed calculations must never be duplicated across components or layouts.

- `useLiveTaskElapsed(taskId, options)`: Single source of truth for task elapsed time. Reconciles cached snapshot metrics (`EngineComputedMetrics`) with the live delta from the active timer tick.
- `useLiveProjectElapsed(projectId, options)`: Computes aggregate live elapsed time for entire projects.

Ad-hoc ticker intervals (`setInterval` / `useTimeTicker`) in individual components are strictly forbidden.

---

## Context Architecture (ISP & SRP)

Contexts are decomposed by domain responsibility to prevent unnecessary component re-renders:

1. **`WindowShellContext`**: Controls window lifecycle, tray minimization, toasts, and shell alerts.
2. **`DataContext`**: Manages entity records (projects, tasks, timelogs), selections, and CRUD operations.
3. **`EngineContext`**: Manages metrics calculations, background sync, and daemon status.
4. **`SettingsContext`**: Manages user preferences (layout variant, theme, visual scale).
5. **`LocaleProvider`**: Manages current locale and dictionary translations.

No component should import an Engine context simply to minimize a window or trigger a toast notification.

---

## Repository Rules

Repositories only access storage.

Never:

- validate
- calculate
- orchestrate workflows

---

## Runtime Rules

Runtime-specific code must remain isolated.

No shared component should know whether it runs inside:

- Browser
- Tauri

Runtime differences belong only to runtime implementations.

---

## Builder Rules

Builders define structure.

Builders never define scale.

Builders never define runtime behavior.

---

### Architectural Tests

- AST scanning for raw HTML primitives (`no-raw-html-primitives.rule.ts` with zero exceptions)
- Runtime isolation and boundary checks
- Circular dependency detection
- Persistence boundary enforcement

---

### Unit Tests

- utilities
- plugins
- repositories
- builders
- design system primitives and composites

use AAA design pattern in tests
use descriptive name of tests  ( Arrange Act Assert)

---

### Integration Tests

- routers
- runtime communication
- tauri commands
- persistence
- composite dialogs and view workflows

use BDT design pattern ( Behavior - Description - Outcome)

---

### End-to-End

- timer workflow
- project workflow
- task workflow
- configuration

---

## Design System, a11y & i18n Standards

### 1. Primitive UI Layer

All atomic interactive elements belong exclusively in `src/components/ui/`. Writing raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<label>` anywhere else is an architectural violation enforced by tests and linter.

### 2. Internationalization (i18n)

All user-facing strings, labels, and placeholders must use `translate(...)` or `useTranslation`. Never use manual fallback operators in JSX (`{translate(...) || 'Fallback'}`); fallback to `en` dictionary is handled by the translation engine.

### 3. Accessibility (a11y)

All buttons, inputs, modals, and tables must meet WCAG standards with proper ARIA attributes (`aria-label`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `role="log"`).

### 4. Code Comments & Clean Code

Comments must explain technical or business rationale only. Never write declarative claims ("adhering to WCAG..."), decorative dividers (`===`, `***`), or Polish comments. Use concise technical English.

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

## Toolchain & Runtime (Bun)

The project standardizes exclusively on **Bun*- for frontend package management, script execution, and tooling:

- **Single Lockfile**: Dependencies are locked solely via `bun.lock`. Never generate or commit `package-lock.json`.
- **Execution**: All scripts are executed via `bun run <script>` (e.g. `bun run dev`, `bun run check`, `bun run test`).
- **Tool Invocation**: External binaries are called via `bun x <binary>`.
- **No Mixed Toolchains**: `npm`, `npx`, `yarn`, and `pnpm` are strictly prohibited.

---

## Definition of Done

A task is complete only when:

- architecture remains consistent
- documentation is updated (`docs/`, `AGENT.md`, `README.md`)
- tests pass (`bun run test`)
- static verification passes (`bun run check`, covering TypeScript, ESLint, Clippy, rustfmt)
- both runtimes behave consistently
- new code follows engineering rules

---

## Non-Negotiable Rules

### Never

- Put business logic into React.
- Bypass EngineRouter.
- Bypass PersistenceRouter.
- Couple UI to storage.
- Detect runtime inside shared components.
- Calculate UI scale inside React components.
- Mix layout composition with visual scaling.

### Always

- Keep responsibilities focused.
- Prefer composition.
- Isolate runtimes.
- Keep LayoutVariant independent from TextAndIconSize.
- Keep CSS responsible for presentation.
- Keep components simple.
- Leave the project cleaner than you found it.
