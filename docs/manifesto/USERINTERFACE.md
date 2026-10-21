# User Interface System

This document defines the User Interface (UI) system for oXyFlow.

It is NOT about aesthetics.
It is about structure, determinism, and spatial logic.

UI is a passive rendering layer.

---

## Core Principle

> UI = f(runtime, layout, size, theme)

The interface is a deterministic function of system state.

It does not decide.
It does not infer.
It does not orchestrate.

It renders.

---

## Separation of Concerns

UI must strictly respect system boundaries:

- ENGINE → orchestration, logic, flow
- PERSISTENCE → storage (dumb layer)
- UI → rendering + user interaction

UI MUST NOT:

- introduce data flow
- orchestrate logic
- couple engine with persistence
- create communication loops

---

## The Four UI Dimensions

The interface is controlled by four independent axes:

---

### 1. Runtime

Defines who controls the viewport and environment.

- TAURI → controlled by Rust (fixed window constraints)
- BROWSER → controlled by browser (responsive environment)

UI must adapt to runtime.
UI must NOT detect or override runtime behavior.

---

### 2. Layout (Spatial Usage)

Defines how much space the interface occupies.

Layout is NOT based on pixels.
Layout is based on proportion and ergonomics.

#### Layout Variants

- FULL  
  Desktop-first  
  Uses ~2/3 of available space  
  Prioritizes readability and breathing room  

- MEDIUM  
  Laptop-first  
  Uses ~1/2 of FULL (~1/3 of space)  
  Balanced density  

- COMPACT  
  Minimal panel  
  Uses ~1/16 of space  
  Displays only essential information  

Layout defines:

- spatial footprint
- component arrangement
- information density at macro level

Layout does NOT define:

- spacing scale
- font size

---

### 3. Size (Density Scaling)

Defines visual density and scale.

#### Size Variants

- LARGE (2160p)
- MEDIUM (1440p)
- SMALL (1080p)

Size affects:

- padding
- spacing
- font scale
- component density

Size does NOT affect:

- layout structure
- spatial proportions

---

### 4. Theme

Defines visual identity only.

Theme affects:

- colors
- icons
- contrast

Theme MUST NOT:

- change layout
- change spacing
- affect structure

#### Theme Dependency Inversion Principle (DIP)

Themes are implemented via Dependency Inversion and CSS Custom Properties:

1. **Passive Components**: React components never branch on theme identity (`resolvedTheme === 'light'`, `theme === 'high-contrast'`). They consume semantic tokens (`bg-card`, `border-border`, `text-card-foreground`, `text-foreground`).
2. **Central Theme Registry**: `ThemeRegistry` (`src/styles/themeRegistry.ts`) manages active themes and registers built-in (`light`, `dark`, `high-contrast`) and custom themes.
3. **DOM Injection**: When a theme is selected, `ThemeRegistry.applyTheme` sets the `data-theme` attribute and toggles the `dark` class on `document.documentElement`.
4. **AST Enforcement**: Architectural rule `no-inline-theme-ternaries` prohibits any inline theme comparison outside `src/styles/` with zero exceptions allowed.

---

## Layout System

UI must implement a proportional layout system.

Pixel-based layouts are forbidden.

---

### Container

The main container must be derived from layout proportion.

Example logic:

FULL → ~66% of viewport width  
MEDIUM → ~33% of viewport width  
COMPACT → ~6–10% of viewport  

The container must always be centered.

---

### Page Contract

Every page MUST follow:

Page  
 ├── PageHeader  
 ├── Sections[]  

No exceptions.

---

### Section Types (Strict)

Only three layout types are allowed:

1. Stack (vertical)
2. Grid (2 columns)
3. Full-width block

No custom layout inventions.

---

### Design System Architecture

The UI is strictly organized into two distinct layers of reusable components:

#### 1. Primitive UI Controls (`src/components/ui/`)

Atomic, domain-agnostic headless primitives built on top of Radix / Base-UI and styled with Tailwind CSS design tokens:

- `Button`: Interactive button with size (`default`, `sm`, `lg`, `icon`, `icon-xs`) and variant (`default`, `accent`, `destructive`, `outline`, `ghost`, `link`) tokens.
- `Input`: Accessible input control with focus rings and tokenized padding.
- `Label`: Accessible label component built on Radix Label primitives.
- `Select`: Accessible dropdown selector (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`).
- `Checkbox`: Accessible toggle control with checked indicator.
- `Card`: Container primitive (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- `Table`: Tabular primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
- `Tabs`: Segmented tab switching primitives (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`).
- `SearchInput`: Standardized search box with integrated search icon, clear button, and accessible input.
- `ProjectBadge`: Standardized project color dot/icon + truncated title badge.
- `TimerDisplay`: Monospace timer display with design tokens and active live states.

#### 2. Composite Components (`src/components/`)

Higher-level UX building blocks composed entirely of UI primitives:

- `StatCard`: Metric summary card with title, icon, value, optional delta badge, and trend indicator.
- `CollapsibleCard`: Expandable section card with header, badge count, actions, and animated collapsible body.
- `ConfirmDialog`: Accessible confirmation dialog replacing browser `confirm()` with semantic cancel and action buttons.
- `PromptDialog`: Accessible input dialog replacing browser `prompt()`.
- `SegmentedControl`: Compact option switcher replacing ad-hoc button groups.
- `EmptyState`: Standardized empty view displaying icon, message, and call-to-action button.
- `DataTable`: Unified table wrapper featuring scrollable viewport and tokenized layout.

---

### Architectural Protection: Zero Raw HTML Primitives

Raw HTML form and table tags are strictly forbidden outside `src/components/ui/`:

- **Forbidden elements**: `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<label>`.
- **Enforcement**:
  1. **Vitest Architecture Rule** (`tests/architecture/rules/no-raw-html-primitives.rule.ts`): Parses TypeScript AST to ensure zero instances across all feature views and layouts. Zero allowlist exceptions.
  2. **ESLint AST Rule** (`eslint.config.js`): Uses `no-restricted-syntax` to report forbidden raw JSX elements in real time in IDE and during linting.

---

### Accessibility and Internationalization

The interface is fully keyboard-operable and localized in 6 languages (`en`, `pl`, `de`, `es`, `fr`, `pt-br`). Translations are resolved by `translate(locale, domain, key, customTranslations)` / `useTranslation`; dictionaries are one JSON file per domain in `src/common/i18n/dictionaries/`, each containing all 6 locales, with keys typed in `src/common/i18n/keys.ts`.

The mandatory a11y and i18n rules are in [`frontend_engineering_standards.md`](../.agents/rules/frontend_engineering_standards.md) (sections 7 and 8).

---

### Layout Decomposition & Builders

Layout Builders compose autonomous sub-parts rather than nesting large inline templates:

- `MediumLayoutBuilder`:
  - `MediumProjectSelector`: Dropdown project selector with dock toggle.
  - `ActiveTimerBanner`: Active tracker state display.
  - Tab views: `TaskListView`, `ReportView`, `SettingsTab`.
  - `MediumTabBar`: Docked bottom navigation.

---

## Runtime Behavior

### TAURI

- Window size is controlled by Rust
- UI must respect constraints
- No overflow breaking
- No viewport assumptions

### BROWSER

- Responsive environment
- Fluid resizing allowed
- Safe min/max constraints required

---

## CSS & Theming Strategy

UI must be driven by semantic design tokens, not hardcoded values.

Required approach:

- Semantic CSS variables (`bg-card`, `border-border`, `text-card-foreground`, `bg-background`, `text-foreground`, `text-muted-foreground`, etc.).
- Tokens adapt automatically across `light`, `dark`, and `high-contrast` themes.
- Proportional units and spacing variables.

Forbidden:

- Inline hex values (e.g. `bg-[#FCFAF8]`, `border-[#DFD7CB]`, `text-[#2C2421]`).
- Page-specific CSS overrides or ad-hoc style tags.
- Pixel-based layout logic.

---

## Visual Stability

UI must never:

- shift unexpectedly
- resize during interaction
- break due to content length

All components must:

- handle overflow gracefully
- support long text
- remain stable across all layout/size combinations

---

## CLI Layout Rules

CLI is a special layout block:

- fixed height (scaled by size)
- scrollable output
- stable input row
- no layout jumping

---

## Determinism Rule

Given the same:

(runtime, layout, size, theme)

UI must render identically.

No randomness.
No implicit behavior.

---

## Forbidden Patterns

The following are considered architectural violations:

- pixel-based layout design
- treating layout as responsive breakpoints
- merging layout with size
- theme affecting structure
- UI making runtime decisions
- UI introducing logic flow

---

## Definition of a UI Bug

Any of the following is a bug:

- layout behaves differently across runtimes
- layout ignores selected layout mode
- spacing does not scale with size
- UI breaks in COMPACT mode
- content overflows container incorrectly
- interface shifts during interaction

---

## Final Principle

UI is not a design layer.

UI is a spatial system.

It exists to:

- preserve focus
- maximize clarity
- eliminate friction

If the interface requires interpretation,
it has failed.
