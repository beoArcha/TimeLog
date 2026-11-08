---
trigger: always_on
---

# Frontend Engineering Standards

Rules for TypeScript and React code in `src/`. Testing rules live in `testing_standards.md`, comment rules in `code_commenting_standards.md`.

## 1. Responsibilities

- **React** owns rendering, interaction, local UI state and composition. It never owns business rules, persistence, runtime selection or visual scaling.
- **Hooks** coordinate UI: they may call routers, prepare view models and coordinate interaction. They never duplicate Engine logic or access storage directly.
- **Components** stay small and single-purpose. Event listeners, keyboard shortcuts and state synchronization live in dedicated hooks (`use<Feature>Orchestrator`), so `.tsx` files remain declarative orchestrators.
- **Proactive Decomposition (SRP)**: Components must have a clear and cohesive responsibility. A container must not absorb independently meaningful sub-features, such as dictionary override editors, complex CRUD workflows or nested list management.
  - Extract a sub-feature when it has its own business or presentation responsibility, independent state or interaction lifecycle, reusable behavior, or meaningful independent test coverage.
  - Keep tightly coupled presentation fragments inside their parent component when extraction would only move JSX without creating a clearer responsibility boundary.
  - Do not introduce wrapper components, pass-through components or additional abstraction layers solely to reduce file length.
  - Component decomposition must improve cohesion, readability or testability, not merely satisfy a LOC threshold.
  - Apply the shared LOC policy from `.agents/rules/code_quality_standards.md`.

## 2. Routers and Runtime Isolation

- All engine and storage access goes through `EngineRouter` and `PersistenceRouter`. Never import `EngineCommands`, `PersistenceCommands`, `EnginePlugin` or `PersistencePlugin` from features or components.
- Shared components never check the runtime (`window.__TAURI__`, runtime flags). Runtime-specific behavior belongs in `src/app-tauri/`, `src/app-browser/` or `PlatformCapabilities`.

## 3. Contexts

Contexts are split by domain so that a change in one area does not re-render unrelated consumers:

| Context | Location | Owns |
| --- | --- | --- |
| `WindowShellContext` | `src/common/contexts/` | Tray, window minimization, notifications, toasts |
| `PlatformCapabilitiesContext` | `src/common/contexts/` | Capabilities of the current runtime |
| `DataContext` | `src/common/hooks/` | Projects, tasks, time logs, selections, CRUD handlers, metrics snapshot |
| `SettingsContext` | `src/common/hooks/` | LayoutVariant, theme, TextAndIconSize and other preferences |
| `LocaleProvider` | `src/common/hooks/` | Current locale and dictionaries |
| `CliSessionContext` | `src/features/cli/context/` | Terminal history, drawer state, live vs sandbox mode |

Consume the narrowest context that provides what you need.

## 4. Live Elapsed Time

- Display elapsed time only through `useLiveTaskElapsed` / `useLiveProjectElapsed` (`src/common/hooks/useLiveTaskElapsed.ts`).
- Never write `setInterval` tickers in components. *(enforced: `timer-live-calculation.arch.test.ts`)*

## 5. Design System

- Primitives live in `src/components/ui/` (`Button`, `Input`, `Label`, `Select`, `Checkbox`, `Card`, `Table`, `Tabs`, `SearchInput`, ...). Composites live in `src/components/` (`StatCard`, `CollapsibleCard`, `ConfirmDialog`, `PromptDialog`, `SegmentedControl`, `EmptyState`, `DataTable`).
- Raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<label>` are allowed only inside `src/components/ui/`. *(enforced: `no-raw-html-primitives.arch.test.ts` + ESLint `no-restricted-syntax`)*
- **Button with Icon Standardization**: Use the `Button` component with `icon` / `iconPlacement` props rather than manually assembling icons, spans, and classes inside buttons.
- **No Raw HTML Clickable Containers**: Never use a raw `<div onClick>` or another non-semantic clickable container for selectable cards (e.g. radio cards, language selectors). Prefer native radio inputs or an existing accessible radio-group primitive.
  - A custom radio-card composite must expose correct `radiogroup` and `radio` semantics, including `aria-checked`, accessible labels and the selected state.
  - The group must behave as one keyboard interaction unit: Tab enters and leaves the group, arrow keys move between options, and Space selects the focused option. Enter may be supported consistently with the underlying interaction pattern.
  - Focus indication must remain visible, and disabled options must not be selectable.
  - Selection state must be available to assistive technology and must not rely on color or visual styling alone.
  - Do not create a custom accessibility implementation when an existing project primitive already provides the required behavior.
- **Semantic Typography**: Never use `<Label>` as section headers or card titles; use `Overline`, `Heading`, or `Text`. `<Label>` is strictly for linking form controls via `htmlFor`.
- **Layout Primitives**: Prefer `HStack`, `VStack`, `ScrollArea`, `InlineCluster`, and `Grid` over raw `flex flex-col` and manual `overflow-y-auto` divs.
- Reuse an existing primitive or composite before creating a new one.

## 6. Styling, Scale and Theme

- Presentation belongs to CSS. Components never calculate spacing, margins, paddings, typography or icon sizes; `TextAndIconSize` changes only CSS design tokens.
- Use semantic tokens (`bg-card`, `bg-background`, `border-border`, `text-foreground`, `text-card-foreground`, `text-muted-foreground`) or CSS variables (`var(--spacing-card)`). No hardcoded hex values or arbitrary color classes (`bg-[#FCFAF8]`).
- Never branch on the theme in components (`resolvedTheme === 'light' ? …`) and never prop-drill `theme` or style maps. *(enforced: `no-inline-theme-ternaries.arch.test.ts`, empty allowlist)*
- When JS needs theme values (charts, canvas), use `useThemeTokens()` from `src/styles/useThemeTokens.ts`.
- Themes are registered and applied through `ThemeRegistry` (`src/styles/themeRegistry.ts`), which sets `data-theme` on `document.documentElement`. Adding a theme never requires changing components.

## 7. Internationalization

- All user-facing text, titles, placeholders and accessible names use `translate(...)` or `useTranslation`.
- Never write `translate(...) || 'Fallback'`; `translator.ts` already falls back to `en`.
- Domains are defined by `I18N_DOMAINS` in `src/common/i18n/keys.ts`. Dictionaries are one JSON file per domain in `src/common/i18n/dictionaries/` (e.g. `timer.json`), each containing all 10 currently supported locales (`en`, `pl`, `de`, `es`, `fr`, `pt-br`, `uk`, `ja`, `nl`, `it`). A new key must be added to every supported locale in the relevant dictionary (`src/common/i18n/dictionaries/<domain>.json`) and registered in its corresponding domain key file `src/common/i18n/keys/<domain>.ts`.
- Do not introduce additional locales or change the supported locale set through an isolated feature change. A locale-set change requires an explicit product decision and synchronized updates to dictionaries, validation, tests and project documentation.
- **Truthful System Resolution**: "System default" UI indicators must always display the genuine system/browser detected locale (`resolveSystemLocale()`), never mirroring the user's explicit preference when locked to another language.
- **Domain Validation & Form Feedback**: Custom translation or key overrides must validate against known domains (`I18N_DOMAINS` / `DomainKeys`) using a typed `<Select>` rather than open text fields, and provide visual form validation feedback instead of silent returns (`return;`).

## 8. Accessibility

- Every interactive element, especially icon buttons, has an accessible name (`aria-label` or `title`).
- Dialogs have `role="dialog"`, `aria-modal="true"` and `aria-labelledby`; focus is trapped while open and restored to the trigger on close.
- Terminal and daemon logs have `role="log"` and `aria-live="polite"`.
- Inputs are linked to a `<Label htmlFor="...">` or have an `aria-label`.
- Everything is operable by keyboard (Tab, Enter, Space, Escape).

## 9. TypeScript

- Strict typing; no `any`; never silence the compiler (`@ts-ignore`, `@ts-expect-error`).
- Reuse existing models, especially generated types in `src/bindings/` (never edit them by hand).
- Do not throw raw `Error` in domain logic or contexts; use typed exceptions from `src/common/exceptions/` (`ContextException`, `EngineException`, `PersistenceException`, `TauriInteropException`).
- Components that can render outside their provider (e.g. in isolated tests) use a safe hook variant that returns `null` instead of throwing (`useCliSessionSafe()`).
- Rules and strategies are injected (`constructor(rules: readonly IRule[] = defaultRules)`); evaluators stay stateless and do not instantiate concrete rules.

## 10. File Naming

- Utilities, services and scripts (`.ts`): camelCase (`terminalOutput.ts`).
- React components, providers and singleton classes: PascalCase (`CliDrawer.tsx`, `ThemeRegistry`).
- Tests mirror the module name with `.test.ts`, `.test.tsx` or `.arch.test.ts`.

## 11. Dependencies

- Never modify files inside `node_modules/`. Workarounds belong in project source or configuration.
- Add packages only with `bun add` / `bun add -d`; build-time tools go to `devDependencies`.
