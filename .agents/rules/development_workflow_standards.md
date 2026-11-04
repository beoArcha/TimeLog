---
trigger: always_on
---

# Single-Agent Development Workflow Standards

How a single AI assistant plans, executes, and hands over work in oXyFlow when working autonomously without subagent delegation. The default flow for every task is defined in `AGENTS.md`; this file adds the process for multi-phase work and reviews for single-agent tasks. For tasks delegated across multiple subagents, refer to [`multi_agent_workflow_standards.md`](multi_agent_workflow_standards.md).

## 0. Rules Are Requirements

Passing tests and a clean compiler are a prerequisite, not proof of compliance. Before reporting a phase or a review fix as done, audit the change against `AGENTS.md` and every file in `.agents/rules/`. Code that compiles but violates these rules is a defect.

## 1. When This Process Applies

Use this single-agent phase-gate process when:
- The user requests direct execution without delegation (*"implement phase 1"*, *"fix issue X"*, *"refactor module Y"*).
- A single assistant executes all phases and subphases within the primary workspace.
- Small fixes and single-concern changes follow the default flow in `AGENTS.md`.

*Note*: If the task requires decomposition and delegation across multiple subagents or dedicated pull requests per work stream, use [`.agents/rules/multi_agent_workflow_standards.md`](multi_agent_workflow_standards.md) instead.

```text
1. Discovery (analytical artifact as source of truth)
   → 2. Implementation plan (plan artifact with phases and subphases)
   → 3. Phases (subphases run automatically → reviewer subphase → phase gate → review fixes → explicit approval)
   → 4. Unified Verification Gate: Automated & Manual Verification executed concurrently
   → 5. Sign-off, documentation update, and commit message preparation
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
- Verification can be consolidated into a **Unified Verification Gate**: automated and manual tests run concurrently. While long-running automated suites execute in the background, the agent uses the waiting time to perform manual runtime checks. If an issue is found, fix it cleanly and resume testing; re-running tests is scoped pragmatically based on the fix impact.
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
   - **Boy Scout Rule & File Length:** Proactively clean up technical debt and decompose touched files. If any modified or newly expanded file exceeds ~300 lines of code or mixes multiple domain responsibilities, proactively decompose it into cohesive submodules (e.g. `handlers/`, `ops/`, `store/`) within the current phase before the review gate.
3. **Phase gate**: after the reviewer subphase, STOP completely. Report the summary of changes, reviewer audit, test results and verification commands, and ask for a code review.
   - **Commit Message Preparation**: At phase completion, stage changes (`git add .`), prepare a concise, high-level commit message adhering to Conventional Commits, and display it for review. The message should informatively summarize the operational scope and key changes in 3–6 focused bullet points without exhaustive file-by-file manifests (the git diff provides the granular detail). Never commit to git history prematurely without user confirmation.
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

### 2.5. Unified Verification Gate (Automated & Manual Concurrency)

Automated and manual verifications form a single collaborative quality gate:
- **Concurrent Execution**: Launch background automated test suites (`bun run test`, `cargo test`, linters), and during the execution waiting time, immediately proceed with agent-executed manual runtime checks (CLI exit codes, real database state, error envelopes).
- **Pragmatic Defect Remediation**: If manual or automated checks reveal a defect, fix it cleanly in place and continue verification. Re-running the full suite is required only if the fix touches cross-cutting boundaries or contracts; otherwise, run targeted regression checks.

Full verification suite:
- `bun run test:smoke`, `bun run test`, `bun run typecheck`, `bun run lint`
- `bun run test:rust`, `bun run lint:rust`, `bun run fmt:rust:check`, `bun run test:arch:rust`
- `bun run test:e2e` when UI flows changed
- `bun run test:mutation` (Stryker) when core logic or its tests changed; surviving mutants on boundary logic need new assertions

### 2.6. Sign-off

- Update `docs/manifesto/MASTERMAP.md` and other affected documentation.
- Present the final summary, including anything skipped or failing.

### 2.7. Git Commits and Pull Request History

- **Separate development commits**: Keep each meaningful implementation unit, completed phase, and review-fix batch in its own focused commit. A single-agent task or PR may therefore contain multiple commits. Do not combine unrelated features, refactors, or architecture changes in one commit.
- **Phase-gate approval**: At the phase gate, prepare and present the proposed Conventional Commit message and its scope. Create the commit only after the user confirms the phase/sign-off, consistent with the approval gate in section 2.3. Do not create commits merely because a subphase ended.
- **Review fixes**: After the user reviews the PR or phase and requests changes, implement the fixes and record them as additional focused commits. Re-run the relevant verification and report the actual results; do not rewrite or squash the earlier development history just to keep the PR commit count at one.
- **PR history**: Keep meaningful commits visible in the open PR so implementation steps and review corrections remain traceable. The one-commit requirement applies to the resulting `main` history, not to the open PR's commit count.
- **Final merge**: After explicit user approval, use **Squash and merge** (or an equivalent squash operation). The target branch must receive exactly one Conventional Commit representing the complete PR. Present the proposed squash commit message with the PR review summary.
- **Small changes**: The same rule applies to a small single-agent fix opened as a PR: one or more focused development commits are acceptable; squash-merge the approved PR into one commit on `main`.


## 3. Refactoring Scope

- Clean up the code you touch: unclear names, dead code, magic strings and rule violations on the lines you change.
- Proactive Modularization: If a file you are touching or expanding exceeds ~300 lines of code or accumulates multiple responsibilities, decompose it into focused domain submodules as part of your current work. Do not leave oversized god-objects for the user to catch in review.
- Unrelated structural refactors (moving unrelated modules, renaming public contracts across distant layers) remain a separate task or subphase requiring approval.
- Never mix a feature, an unrelated refactor and an architecture change in one commit.

## 4. Tool-Specific Notes

- Antigravity: commands run sandboxed by default (`BypassSandbox: false`). Use `BypassSandbox: true` only for commands that need low-level Windows pipe or path access.