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

Stores and retrieves data records (CRUD: projects, tasks, timelogs).

Never validates business intervals or computes timer metrics.

---

### Context Layering (ISP)

Contexts are strictly split by domain:

- `WindowShellContext`: Tray, window minimization, notifications, toasts.
- `DataContext`: Reactive state for projects, tasks, timelogs, and CRUD handlers.
- `EngineContext`: Metrics calculations, background sync, and daemon status.
- `SettingsContext`: LayoutVariant, theme, and TextAndIconSize.

Never import EngineContext solely for window/shell actions.

---

### Live Calculation Hooks

Always use `useLiveTaskElapsed` or `useLiveProjectElapsed` for displaying elapsed time.

Never write custom `setInterval` tickers in components.

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

## CSS & Theming Rules

Presentation belongs to CSS.

React components should not calculate:

- spacing
- margins
- typography
- paddings
- icon sizes
- theme visual variants via inline branching

Components consume Design Tokens only.

Example:

```css
padding: var(--spacing-card);
```

Never generate React code that calculates visual scale.
Never use hardcoded hex values (e.g. `#FCFAF8`, `#DFD7CB`, `#2C2421`) in components or Tailwind classes.
Use semantic tokens (`bg-card`, `border-border`, `text-card-foreground`, `bg-background`, `text-foreground`).

### Theme Dependency Inversion Principle (DIP)

UI components must NEVER branch on active themes using inline ternaries:

- Forbidden: `resolvedTheme === 'light' ? ... : ...`
- Forbidden: `theme === 'high-contrast' ? ... : ...`
- Forbidden: `theme === 'dark' ? ... : ...`

Instead, follow DIP and Kiss:

1. Components consume semantic CSS utility classes or CSS custom properties directly.
2. The global visual theme identity is managed by `ThemeRegistry` (`src/styles/themeRegistry.ts`) which sets `data-theme="..."` on `document.documentElement`.
3. New themes (e.g., custom high-contrast or branded themes) are registered via `ThemeRegistry.getInstance().register(...)` with their respective CSS variables without modifying any UI component code.
4. Enforced automatically across the entire codebase by the AST architecture test `tests/architecture/specs/no-inline-theme-ternaries.arch.test.ts`.

---

## Design System & Primitive UI Components

All user interface controls are partitioned into:

1. Primitives: `src/components/ui/` (`Button`, `Input`, `Label`, `Select`, `Checkbox`, `Card`, `Table`, `Tabs`, `SearchInput`)
2. Composites: `src/components/` (`StatCard`, `CollapsibleCard`, `ConfirmDialog`, `PromptDialog`, `SegmentedControl`, `EmptyState`, `DataTable`)

### Absolute Rule: Zero Raw HTML Primitives

AI assistants must NEVER use raw HTML interactive elements:
`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<label>`
outside `src/components/ui/`.

Always use primitives from `@components/ui/...` or composites from `@components/...`.
This rule is strictly enforced by the AST architecture test (`tests/architecture/specs/no-raw-html-primitives.arch.test.ts`) and ESLint `no-restricted-syntax`.

---

## Internationalization (i18n) Rules

All user-facing text, titles, placeholders, and accessible names MUST use `translate(...)` or `useTranslation`.

### Anti-Pattern Prohibition: No Manual Fallback Operators

Never write:
`{translate(...) || 'Fallback'}`

The `translator.ts` engine automatically defaults to the `en` dictionary if a key is missing. Adding `|| '...'` creates clutter, obscures missing dictionary entries, and violates i18n standards.

### Complete Dictionary Coverage

Whenever adding a new translation key:

1. Add it to all 6 locales: `en`, `pl`, `de`, `es`, `fr`, `pt-br`.
2. Register the key in `src/common/i18n/keys.ts`.

---

## Accessibility (a11y) Rules

Every UI component must follow WCAG standards:

- Every interactive element (especially icon buttons) must have an accessible name via `aria-label` or `title`.
- Modals must have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Terminal and daemon logs must have `role="log"` and `aria-live="polite"`.
- Form inputs must be linked with `<Label htmlFor="...">` or have an `aria-label`.
- All controls must be navigable and operable using the keyboard (Tab, Enter, Space, Escape).

---

## Clean Code & Comments Rules

1. Language: All code, comments, test descriptions, and test IDs MUST be in English.
2. Purpose: Comments should only explain technical or business rationale.
3. No Declarative Claims: Never write comments stating compliance ("adhering to WCAG...", "fully integrated with i18n...").
4. No Decorative Banners: Never use `===`, `***`, or ASCII dividers.
5. Standard: Use JSDoc for exported functions, interfaces, and components when clarifying non-obvious behavior.

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

## Unit & Integration Testing Standards

### 1. Test Structure & AAA Pattern

Every test must strictly follow the **Arrange - Act - Assert (AAA)** pattern:

- **Arrange**: Set up fixtures, initial state, and test doubles using domain Test Data Builders.
- **Act**: Execute the specific user interaction (`userEvent`, fireEvent, or direct function invocation).
- **Assert**: Verify expected state changes, mock invocations, or DOM elements.

Never mix actions and assertions into interleaved spaghetti sequences.

### 2. Naming Conventions (BDD Style)

- Language: English only for all test suite descriptions, test names, and test IDs.
- `describe`: Name the unit or component under test exactly (e.g. `describe('TaskItem', () => { ... })`).
- `it`: State expected behavior and conditions clearly:
  - Format: `it('should <expected outcome> when <action or condition>')`
  - Example: `it('should trigger onSaveEdit with updated title when Enter key is pressed', async () => { ... })`
- Forbidden: Vague names like `it('works')`, `it('renders properly')`, or `it('test 1')`.

### 3. Triple Decoupling

- **Decoupled from Localization**: Tests verify component contracts and state transitions, not dictionary copywriting. Never assert hardcoded localized strings (e.g. Polish strings like `/Zatwierdź/i` or `/Usuń/i`). Query by accessibility roles (`getByRole`), `getByTestId`, or unique form element IDs.
- **Decoupled from Theming & CSS**: Never assert CSS color classes, hex values, or active theme names (`theme === 'dark'`). Components are polymorphic consumers of design tokens.
- **Decoupled from Native Side-Effects**: Never allow real Tauri invocations, disk operations, or network calls in unit tests. Always wrap components in `MockProviders` (`MockDataProvider`, `MockSettingsProvider`, `MockLocaleProvider`) and use mock IPC handlers (`tests/shared/mocks/tauri-ipc-mock.ts`).

### 4. Test Data Builders

- Never handcraft raw domain entity literals with arbitrary missing fields in test files.
- Always use domain Test Data Builders from `tests/shared/builders/entity-builders.ts` (`aProject()`, `aTask()`, `aTimeLog()`, `aPatchLog()`).
- Override only the specific fields relevant to the current test scenario (e.g. `aTask({ status: 'Done', isRunning: false })`).

### 5. Interaction Testing over Shallow Rendering

- Tests must verify meaningful user workflows: form submissions, keyboard shortcuts (`Enter`, `Escape`), confirmation dialogs, error states, and toggle controls.
- Shallow snapshots or tests that merely mount a component without testing its event handlers or state mutations are strictly discouraged.

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

## Toolchain & Package Management (Bun)

oXyFlow standardizes on **Bun** as its exclusive JavaScript runtime and package manager:

- Always use `bun install`, `bun add <pkg>`, `bun remove <pkg>`.
- Always execute scripts via `bun run <script>` (e.g. `bun run dev`, `bun run tauri:dev`, `bun run tauri:build`, `bun run test`, `bun run check`).
- For direct binary tool execution, use `bun x <binary>` (e.g. `bun x tauri`).
- **Forbidden:** Never use `npm`, `npx`, `yarn`, or `pnpm`.
- **Forbidden:** Never create or commit `package-lock.json`. `bun.lock` is the single source of truth for dependencies.

---

## Definition of Done

A task is complete only if:

- Architecture remains consistent.
- Responsibilities remain clear.
- Zero raw HTML primitives outside `src/components/ui/`.
- No `{translate(...) || 'Fallback'}` anti-patterns.
- All interactive elements meet a11y standards (accessible names, roles, focus).
- Tests pass (`bun run test`, includes unit, integration, and architecture tests).
- TypeScript passes (`bun run typecheck`).
- Lint passes (`bun run lint`).
- Combined static check passes (`bun run check`).
- Rust builds and passes check if backend touched (`bun run test:rust`, `bun run fmt:rust:check`, `bun run lint:rust`).
- Documentation is updated (`docs/`, `AGENT.md`).
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
