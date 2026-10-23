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
1. Discovery (analytical artifact as source of truth)
   → 2. Implementation plan (plan artifact with phases and subphases)
   → 3. Phases (subphases run automatically → reviewer subphase → phase gate → review fixes → explicit approval)
   → 4. Penultimate phase: Full automated verification (tests, lint, formatting, typecheck across runtimes)
   → 5. Final phase: Agent-executed manual verification (runtime checks, exit codes, state persistence)
   → 6. Sign-off and documentation update
```

## 2. Stages

### 2.1. Discovery

- Read the relevant modules in `src/` and `src-tauri/` and the applicable rules before writing code.
- Create an analytical artifact (e.g. `backend_error_handling_analysis.md`) adhering to `documentation_standards.md` as the concrete **source of truth** mapping existing flows, root causes, exact file locations, and target behaviors.
- Resolve ambiguities by asking the user, preferably as multiple-choice questions. Never guess unstated requirements.

### 2.2. Implementation Plan

- Write the plan as a Markdown document (e.g. `phase_X_implementation_plan.md`) adhering to the 10-section structure in `documentation_standards.md` and get it approved before implementation.
- **Phase Structure:**
  - **Phases (`Phase X`):** Complete, vertical slices producing working, compilable, and tested code, ending with a mandatory Phase Gate.
  - **Subphases (`Subphase X.Y`):** Atomic, logical code tasks inside an approved phase. Execution moves between subphases automatically without prompting the user.
  - **Mandatory Final Reviewer Subphase (`Subphase X.Review`):** The last subphase in every production phase is a formal quality & architecture review auditing touched code.
- The penultimate phase is always **Full Automated Verification** (tests, linter, typecheck, fmt across all environments).
- The final phase is always **Agent-Executed Manual Verification** (testing runtime behavior, exit codes, state persistence).
- Split responsibilities explicitly: the AI writes code, tests, lint and typecheck fixes; the user verifies visuals, window behavior and business sign-off.
- End the plan with a **Verification Plan**: the exact automated commands and manual checks.
- The approved plan is a frozen reference. Do not tick or untick its checkboxes during execution.

### 2.3. Phase Execution

1. **Subphases**: move between subphases of an approved phase automatically without stopping. Each subphase leaves the code compiling and its targeted tests passing.
2. **Reviewer Subphase**: before the Phase Gate, conduct an architectural and code audit covering:
   - **Changes & Rationale (WHY):** What was changed and why.
   - **Pre-existing Violations (WHAT WAS BROKEN):** What was defected, missing, or violating standards in the original code.
   - **SOLID:** SRP, OCP, LSP, ISP, DIP.
   - **KISS & DRY:** Simplest working solution, zero duplication.
   - **Clean Code:** Clean naming, max nested ifs <= 2 (Rule of 3 Ifs), zero unwrap() in production.
   - **Comments:** Follow `code_commenting_standards.md` — English only, explaining WHY, no narration of obvious match/variants, no ASCII banners/dividers, zero declarative buzzwords.
   - **Clean Architecture:** Layer boundaries strictly preserved, SQL isolated in repositories, no Tauri GUI types in domain/persistence.
   - **Boy Scout Rule:** Report cleanup of technical debt or inconsistencies in touched files.
3. **Phase gate**: after the reviewer subphase, STOP completely. Report the summary of changes, reviewer audit, test results and verification commands, and ask for a code review.
4. **Review fixes**: fixes requested in review belong to the current phase. After applying them, re-run tests and report what changed.
5. **Advance**: start the next phase ONLY after the user explicitly says so (e.g. "następna faza", "proceed", "approved"). **A completed review fix NEVER constitutes permission to advance automatically.**

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

- Update `docs/manifesto/MASTERMAP.md` and other affected documentation.
- Present the final summary, including anything skipped or failing.

## 3. Refactoring Scope

- Clean up the code you touch: unclear names, dead code, magic strings and rule violations on the lines you change.
- Larger refactors (splitting a monolithic file, moving modules, changing contracts) are proposed to the user and done as a separate subphase or commit after approval.
- Never mix a feature, an unrelated refactor and an architecture change in one commit.

## 4. Tool-Specific Notes

- Antigravity: commands run sandboxed by default (`BypassSandbox: false`). Use `BypassSandbox: true` only for commands that need low-level Windows pipe or path access.