---
trigger: always_on
---

# Development Workflow Standards

How AI assistants plan, execute and hand over work in oXyFlow. The default flow for every task is defined in `AGENTS.md`; this file adds the process for multi-phase work and reviews.

## 0. Rules Are Requirements

Passing tests and a clean compiler are a prerequisite, not proof of compliance. Before reporting a phase or a review fix as done, audit the change against `AGENTS.md` and every file in `.agents/rules/`. Code that compiles but violates these rules is a defect.

## 1. When This Process Applies

Use the phase-gate process for roadmap phases, large features and refactors spanning several modules. Small fixes and single-concern changes follow only the default flow in `AGENTS.md`.

```text
1. Discovery  →  2. Implementation plan  →  3. Phases (subphases → phase gate → review fixes → approval)
                                         →  4. Full verification  →  5. Sign-off and docs
```

## 2. Stages

### 2.1. Discovery

- Read the relevant modules in `src/` and `src-tauri/` and the applicable rules before writing code.
- Resolve ambiguities by asking the user, preferably as multiple-choice questions. Never guess unstated requirements.

### 2.2. Implementation Plan

- Write the plan as a Markdown document (e.g. `phase_X_implementation_plan.md`) and get it approved before implementation.
- Structure: **Phases** (`Phase X.Y`) are vertical slices ending with a phase gate; **Subphases** (`Subphase X.Y.Z`) are atomic tasks inside a phase.
- Split responsibilities explicitly: the AI writes code, tests, lint and typecheck fixes; the user verifies visuals, window behavior and business sign-off.
- End the plan with a **Verification Plan**: the exact automated commands and manual checks.
- The approved plan is a frozen reference. Do not tick or untick its checkboxes during execution.

### 2.3. Phase Execution

1. **Subphases**: move between subphases of an approved phase without stopping. Each subphase leaves the code compiling and its targeted tests passing.
2. **Phase gate**: after the last subphase, stop. Report the summary of changes, test results and verification commands, and ask for a code review.
3. **Review fixes**: fixes requested in review belong to the current phase. After applying them, re-run the tests, report what changed and wait again.
4. **Advance**: start the next phase only after the user explicitly says so. A completed review fix is not permission to advance.

### 2.4. Pre-Review Self-Audit

Before requesting a review, confirm:

- [ ] The change lives in the correct layer (`AGENTS.md`, Architecture).
- [ ] Rust: no loose primitive parameter lists, no `#[allow(clippy::too_many_arguments)]`, typed error enums, user-facing strings in `constants.rs`, no silent `Ok` on missing entities (`backend_rust_engineering_standards.md`).
- [ ] Frontend: design-system, theming, i18n and a11y rules (`frontend_engineering_standards.md`).
- [ ] Tests in the correct tier with correct structure (`testing_standards.md`).
- [ ] Comments follow `code_commenting_standards.md`.
- [ ] Documentation updated per the table in `AGENTS.md`.

### 2.5. Full Verification

After the last phase, run the complete suite and report results honestly:

- `bun run test:smoke`, `bun run test`, `bun run typecheck`, `bun run lint`
- `bun run test:rust`, `bun run lint:rust`, `bun run fmt:rust:check`, `bun run test:arch:rust`
- `bun run test:e2e` when UI flows changed
- `bun run test:mutation` (Stryker) when core logic or its tests changed; surviving mutants on boundary logic need new assertions

### 2.6. Sign-off

- Update `docs/MASTERMAP.md` and other affected documentation.
- Present the final summary, including anything skipped or failing.

## 3. Refactoring Scope

- Clean up the code you touch: unclear names, dead code, magic strings and rule violations on the lines you change.
- Larger refactors (splitting a monolithic file, moving modules, changing contracts) are proposed to the user and done as a separate subphase or commit after approval.
- Never mix a feature, an unrelated refactor and an architecture change in one commit.

## 4. Tool-Specific Notes

- Antigravity: commands run sandboxed by default (`BypassSandbox: false`). Use `BypassSandbox: true` only for commands that need low-level Windows pipe or path access.
