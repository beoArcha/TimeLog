# MASTERMAP.md

## oXyFlow Master Map

### 🎯 Vision

Build a lightweight, flow-oriented productivity suite that combines native performance, sustainable engineering and modern AI-assisted development.

---

## Phase 1 - Foundation

**Goal:** Stabilize the codebase before expanding the product.

### Architecture

- [ ] Split oversized files
- [ ] Reduce component responsibilities
- [ ] Improve module boundaries
- [ ] Remove code duplication
- [ ] Improve maintainability

### Quality

- [ ] Fill testing gaps
- [ ] Improve test coverage
- [ ] Refactor problematic areas

---

## Phase 2 - Product MVP

**Goal:** Build a usable product.

### Product

- [ ] Fix bugs
- [ ] Stabilize existing features
- [ ] Improve usability
- [ ] Remove friction points

---

## Phase 3 - Multi-Runtime Architecture

**Goal:** Support multiple execution environments.

### Node/Web Runtime

```text
React
↓
localStorage
```

### Tauri/Desktop Runtime

```text
React
↓
Tauri
↓
Rust
↓
SQLite
```

**Tasks:**

- [ ] Separate runtime implementations
- [ ] Share a common frontend
- [ ] Define storage boundaries

---

## Phase 4 - Data Reliability

**Goal:** Protect user data.

### Backup

- [ ] Automatic backups
- [ ] Manual backups
- [ ] Import
- [ ] Export
- [ ] Restore
- [ ] Data validation

---

## Phase 5 - Tauri Stabilization

**Goal:** Mature the desktop experience.

**Tasks:**

- [ ] Improve Rust integration
- [ ] Improve communication layers
- [ ] Improve startup performance
- [ ] Improve native behaviors

---

## Phase 6 - Node UI Polish

**Goal:** Improve the web experience.

**Tasks:**

- [ ] Improve layouts
- [ ] Improve spacing
- [ ] Improve responsiveness
- [ ] Improve component states

---

## Phase 7 - Desktop UX Polish

**Goal:** Leverage native desktop capabilities.

**Tasks:**

- [ ] Keyboard shortcuts
- [ ] Window behavior
- [ ] Tray integration
- [ ] Native menus

---

## Phase 8 - Flow Expansion

**Goal:** Expand product capabilities.

**Tasks:**

- [ ] New workflows
- [ ] New views
- [ ] Automation
- [ ] Reporting
- [ ] Analytics

---

## ♾️ Continuous Iteration

Development cycle:

Feature
→ Fixes
→ UX improvements
→ Optimization
→ Refactoring
→ Feature

---

## Engineering Priorities

1. Correctness
2. Maintainability
3. User Experience
4. Performance
5. New Features

---

## Long-Term Evolution

Foundation
↓
Usable Product
↓
Multi-Runtime Support
↓
Reliable Data
↓
Polished UX
↓
Expanded Workflows
↓
Continuous Evolution
