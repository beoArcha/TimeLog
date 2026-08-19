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

## CSS Strategy

UI must be driven by state, not hardcoded values.

Required approach:

- CSS variables
- data-attributes (e.g. `data-layout`, `data-size`)
- proportional units (%, vw)

Forbidden:

- inline styles
- page-specific hacks
- pixel-based layout logic

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
