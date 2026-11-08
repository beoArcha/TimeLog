---
trigger: always_on
---

# Multi-Agent Development Workflow Standards

How AI orchestrators and specialist subagents collaborate, delegate tasks, manage semantic git branches, preserve focused development commits, enforce squash-merge results, and ensure quality gates in oXyFlow.

## 0. Rules Are Requirements

Passing tests and a clean compiler are a prerequisite, not proof of compliance. Every delegated subagent and orchestrator must strictly enforce `AGENTS.md` and all rules in `.agents/rules/`. Code that compiles but violates these rules is a defect and must be rejected during cross-agent review.

## 1. When This Workflow Applies

This workflow applies whenever task execution involves delegation across multiple subagents or when the user explicitly requests multi-agent collaboration:

- **Multi-Agent Mode Triggers**:
  - User prompts specifying delegation: *"delegate to agents"*, *"split among agents"*, *"multi-agent execution"*, *"separate PR per agent"*, *"run subagents"*.
  - Implementation plans that define distinct, modular slices intended for autonomous execution across isolated branches.
- **Single-Agent Mode Fallback**:
  - When the user gives direct commands without delegation intent (*"implement this"*, *"fix issue X"*, *"proceed with phase 1"*), the process strictly follows [`.agents/rules/development_workflow_standards.md`](development_workflow_standards.md).

### 1.1. Required Topology: One Main + One or More Workers

A multi-agent run consists of exactly one **Main Agent** (the orchestrator) and a dynamically selected pool of **N−1 Worker Agents**, where total agent count **N >= 2**.

- **Main Agent count is always one.** It is the single owner of the user conversation, overall objective, implementation plan, task registry, integration decisions, and final report.
- **Worker count is dynamic.** Main assigns one or more workers according to task parallelism, dependency structure, risk, available agent sessions, and resource limits. There is no fixed worker count.
- **At least one worker is required** for Multi-Agent Mode. If no worker can be started or reached, Main must explicitly fall back to the Single-Agent Mode and disclose that delegation did not occur.
- Main must not create duplicate orchestrators. Workers do not independently delegate, redefine the overall plan, communicate competing decisions to the user, or merge changes.
- Main may perform implementation work only when it does not compromise orchestration, or when the user explicitly approves that trade-off. Main must not silently become another worker on overlapping files.

The workflow is capability-aware: use only agent sessions, threads, workspaces, and control mechanisms actually available in the host environment. Do not claim that a worker was launched, monitored, or isolated unless that operation was confirmed. If the host cannot provide a required capability, Main reports the limitation and chooses a safe fallback.

### 1.2. Orchestration Flow: Task Queue & Worker Pull Architecture

```text
User Goal
   ↓
Main Agent (single orchestrator)
   ├─ Graph-First Discovery via Graphify (god nodes, module communities, blast radius)
   ├─ Proactive PR Decomposition into bite-sized tasks (target: 100–300 LOC diff)
   ├─ Active Task Queue / Backlog (prioritized, dependency-mapped, file-bounded)
   └─ Continuous Orchestrator Review & Integration Loop
          ↓
   ┌──────────────────────────────────────────────────────────────┐
   │ Active Task Queue (Unblocked Ready-to-Run Tasks)            │
   └──────────────────────────────────────────────────────────────┘
          │ (Worker Pull / Immediate Dispatch upon worker availability)
          ▼
   ┌──────────────┬──────────────┬──────────────┐
   │ Worker A     │ Worker B     │ Worker ... N │
   │ isolated task│ isolated task│ isolated task│
   └──────────────┴──────────────┴──────────────┘
          ↓             ↓             ↓
       Task completion reports, commits, verification evidence
          └─────────────┬─────────────┘
                        ↓
          Orchestrator Continuous Review
          (Audits diff, quality gates & AST rules;
           Idle worker immediately pulls next unblocked task from queue)
                        ↓
         PR Creation / PR Chain Linking
         (Evidence-based, strictly NO fake self-ratings like "10/10")
                        ↓
              User review / approval gate
                        ↓
              Sequential merge into main
```

## 2. Agent Roles and Responsibilities

### 2.1. Main Agent (Orchestrator)

- **User Interface**: Holds exclusive direct communication with the user in the main thread.
- **Architectural Custodian**: Owns the high-level implementation plan, guarantees layer boundaries, and verifies adherence to `AGENTS.md`.
- **Delegation Manager**: Decomposes work into bounded tasks, selects worker count, assigns work, and maintains task ownership.
- **Scheduler**: Orders tasks based on dependencies and starts independent tasks concurrently when safe.
- **State Owner**: Maintains the authoritative task registry and knows each worker's assignment, branch/workspace, status, changed-file scope, blockers, commit, and verification result.
- **Conflict Coordinator**: Prevents uncoordinated concurrent edits and resolves integration conflicts. Workers never resolve cross-worker ownership conflicts by editing another worker's scope.
- **Escalation Gateway**: When a worker encounters ambiguity, missing requirements, or a blocking defect, Main evaluates it and asks the user when a decision depends on unstated requirements. Never guess unstated user requirements.
- **Review & Merge Coordinator**: Performs cross-agent code audits, coordinates integration, and controls sequential merging after user sign-off.
- **Final Reporter**: Presents completed work, verification evidence, outstanding risks, and any work that was not completed.

### 2.2. Worker Agents (Specialists / Workers)

- **Isolated Execution**: Works exclusively in its designated branch and workspace/session, as supported by the host environment.
- **Strict Boundary Adherence**: Modifies only files explicitly allowed in its Task Brief. Never touches unrelated files or architecture layers.
- **No Uncoordinated Delegation**: Does not create additional workers or reassign its task unless Main explicitly authorizes it.
- **Zero Speculation (Stop & Ask Protocol)**: If a requirement is unclear, ambiguous, or contradicts existing code, the worker stops the affected work and reports the question to Main. Speculative implementation is forbidden.
- **Self-Verification**: Runs the exact verification commands in its Task Brief before declaring completion.
- **Task Commits**: May create multiple focused, atomic commits while implementing and correcting its assigned task. It reports all relevant commit SHAs and does not merge them into `main`.
- **Completion Report**: Returns changed files, implementation summary, tests and command results, commit SHA, known limitations, and any follow-up dependencies.

### 2.3. Dynamic Worker-Pool Sizing

Main decides the number of workers for each run; do not default to either one worker per task or the maximum available workers.

Before assigning work, Main evaluates:

1. **Parallelism**: Which tasks are independent and can safely proceed concurrently?
2. **Dependencies**: Which tasks require outputs or decisions from another task?
3. **File overlap**: Which tasks need to modify the same files, shared contracts, generated files, or central configuration?
4. **Complexity and risk**: Does splitting a task create more coordination overhead than value?
5. **Capacity**: How many usable worker sessions and isolated workspaces are actually available?

Use the smallest worker pool that provides useful parallelism without increasing integration risk. Tasks with a strict dependency must be scheduled after their prerequisite; independent tasks may run concurrently. Main may add, pause, or stop workers as the plan changes, but must update the task registry and communicate reassignment explicitly.

### 2.4. Worker Lifecycle and Status

Main tracks every assigned worker using the following lifecycle:

```text
Planned → Assigned → Running → Completed → Reviewed → Integrated
                         ↘ Blocked
                         ↘ Failed
                         ↘ Cancelled
```

- **Planned**: Task exists in the plan but has not been assigned.
- **Assigned**: Worker, scope, branch/workspace, and acceptance criteria are defined.
- **Running**: Worker has acknowledged the brief and is executing.
- **Blocked**: Worker cannot safely proceed and has reported the blocker to Main.
- **Completed**: Worker has delivered its report and commit; this does not mean the work is accepted.
- **Reviewed**: Main has reviewed the diff and evidence and accepted the task for integration, or returned it for correction.
- **Integrated**: Changes have been incorporated into the designated integration target and integration verification has passed.
- **Failed / Cancelled**: Main has recorded the reason and decided whether to retry, reassign, or remove the task from scope.

A worker must not be marked Completed based only on a progress message. Main requires a completion report and verifiable output. Main polls or checks worker status at meaningful coordination points using available host capabilities; it must not invent background monitoring or assume a worker is still active without evidence.

### 2.5. Task Registry, Active Backlog and Worker Pull Model

Main maintains one authoritative task registry and active task backlog for the duration of the run. It may be a concise table in the main working context or a project artifact when persistence is needed. At minimum, record:

| Field | Required information |
|---|---|
| Task ID | Stable identifier within the run |
| Worker | Assigned worker/session |
| Goal | Bounded deliverable and acceptance criteria |
| Dependencies | Prerequisite task IDs, or none |
| File ownership | Explicit allowed paths and protected/shared paths |
| Branch/workspace | Exact location of work |
| Status | Lifecycle status from section 2.4 |
| Result | Commit SHA, verification evidence, blockers, review outcome |

#### 2.5.1. Active Task Backlog & Idle Worker Pull Protocol

To maximize automation and eliminate orchestrator bottlenecks, execution follows a **Worker Pull / Immediate Dispatch** model:

1. **Active Task Queue**: Main decomposes the overall goal into a prioritized queue of bounded, independent or dependency-mapped tasks.
2. **Immediate Pull/Dispatch**: As soon as a worker finishes its assigned task and delivers its completion report, Main marks the task `Completed`, registers the commit, and **immediately assigns the next eligible, unblocked task from the queue** to that free worker.
3. **No Unnecessary Idle Waiting**: An idle worker does not wait for Main to finish a multi-step code review of its previous task if another independent task is ready in the backlog.
4. **Continuous Orchestrator Review**: Main concurrently reviews delivered work (diff inspection, quality gates, AST rules) in the background while workers continue executing queued tasks.
5. **Targeted Review Fixes**: If Main's review uncovers defects or rule violations, Main injects a high-priority, bounded correction task into the author's queue or assigns it upon the next pull.

#### 2.5.2. Coordination Rules:

- Each file has one active writer by default. Main assigns non-overlapping file ownership before parallel execution.
- Shared contracts, central exports, lockfiles, generated files, and configuration files are treated as conflict-sensitive resources.
- If two tasks need the same file, Main must either serialize those tasks, split ownership by clearly non-overlapping regions with an explicit coordination protocol, or assign the shared-file change to one worker.
- A worker must request a scope change before modifying a file outside its brief. Main updates the registry and informs affected workers before approving the change.
- Workers communicate task findings and blockers to Main, not directly to other workers as a substitute for Main's coordination.
- Main broadcasts only the decisions and interface changes that affected workers need; it avoids unnecessary cross-worker chatter.

## 3. Semantic Git Branching & PR Architecture

### 3.1. Prohibition of Throwaway Sequential Identifiers

Branches and pull requests must carry durable technical and business meaning. Arbitrary sequential markers (e.g. `phase-1`, `phase-2`, `step-3`, `subphase-1.1`) are **strictly prohibited** in branch names.

- ❌ **Forbidden**: `feat/ds-phase-1-cleanup`, `fix/phase-2-fixes`, `refactor/phase-3`
- ✅ **Required**:
  - `feat/ui-primitives-standardization`
  - `fix/theme-contrast-db-explorer-and-cli`
  - `refactor/shared-patterns-and-accessible-drawer`
  - `refactor/project-form-fields-and-layout-primitives`

### 3.2. PR Sizing Standard & Proactive Decomposition

Pull Requests must be small, cohesive, and easily auditable by both humans and automated reviewers:

1. **Size Target & Ceiling (Single Responsibility PR)**:
   - **Target PR Size**: **100–300 lines of code (LOC) net diff**.
   - **Hard PR Ceiling**: **400 LOC net diff** per PR (excluding package lockfiles, generated bindings from `ts-rs`, and large mock test fixtures with explicit approval).
2. **Mandatory Proactive Decomposition**:
   - When a requested feature, implementation plan, or remediation phase is estimated to exceed 400 LOC diff or spans multiple architectural layers (e.g., Domain/Engine vs UI vs Exporters), Main **MUST proactively suggest decomposing it into smaller, focused PRs** before implementation begins.
   - Do not produce monolithic mega-PRs. A clean sequence of smaller PRs guarantees fast CI runs, simplified conflict resolution, and zero cognitive overload during review.

### 3.3. PR Commit Discipline & Single-Commit Squash Result

A pull request must contribute **exactly one commit to the target branch** after merge. This enforces clean, bisectable history on `main` while maintaining clear auditability during code review:

1. **Initial PR Creation (Exactly 1 Initial Commit)**: When opening a PR on GitHub, the branch must contain **exactly 1 initial commit** representing the baseline implementation. Do not open PRs with messy work-in-progress commit histories.
2. **Review Fixes (Separate Atomic Commits)**: When code review requests changes (e.g. FIX-01, FIX-02), all fixes must be pushed as **separate, descriptive commits** (e.g. `fix(cli): prevent swallowing SQLite errors (FIX-01)`). **Never amend, rebase, or squash commits during active PR review** — keeping review fixes separate is required so human and automated reviewers can easily verify incremental corrections.
3. **PR Title**: PR title follows Conventional Commits with a clear scope and imperative mood (e.g., `feat(reports): add tag filtering support`).
4. **Final Integration (Squash and Merge)**: Once all checks pass and explicit human approval is received, the PR is merged into `main` exclusively via **Squash and merge**. The resulting single commit on `main` summarizes the entire PR scope.

### 3.4. PR Chaining Architecture & Concurrency Discipline

When decomposing large features into bite-sized PRs, tasks often have sequential dependencies. Main manages this using a structured **PR Chain**:

1. **Chained PR Topology**:
   - When PR B depends on code or type contracts introduced in PR A:
     - `PR A` (`branch-A`) targets `main`.
     - `PR B` (`branch-B`) branches from `branch-A` and targets `branch-A`.
     - `PR C` (`branch-C`) branches from `branch-B` and targets `branch-B`.
2. **Documented Chain Header**:
   - Every chained PR must state its exact chain topology in the PR description header:
     ```markdown
     > **PR Chain**: [PR #55 (Base: main)] ➔ **PR #56 (Current, Base: feat/pr-55)** ➔ [PR #57 (Base: feat/pr-56)]
     ```
3. **Smooth Downstream Retargeting upon Merge**:
   - As soon as `PR A` is squash-merged into `main`:
     - Main rebases `branch-B` onto `origin/main`.
     - Main retargets `PR B` base branch to `main` via GitHub API or web interface.
     - Worker capacity is recycled immediately for the next queued item.
4. **Independent Work Branches from Main**:
   - Independent tasks must always branch directly from `main`. Never chain PRs unless an unavoidable code or contract dependency exists.

### 3.5. Evidence-Based PR Descriptions & Prohibition of Self-Assessment Ratings

1. **Strict Prohibition of Self-Assessment Ratings ("10/10" Ban)**:
   - Writing *"10/10 własnej recenzji"*, *"ocena 10/10"*, *"100% doskonałość"*, *"perfekcyjne wykonanie"*, or any arbitrary subjective score in PR descriptions, commit messages, or review summaries is **strictly forbidden**.
   - Self-assigned scores are inherently biased, untruthful, and violate reporting integrity.
2. **Evidence-Based Reporting Contract**:
   Every PR description and review report must be strictly factual and evidence-based, containing:
   - **Business Context & Problem (WHY)**: Direct reference to the issue or plan phase.
   - **Exact Scope of Changes (WHAT)**: Clear breakdown of modified layers and components.
   - **Quality Gates Evidence (VERIFICATION)**: Factual table of executed commands, exit codes, and passed counts:
     | Quality Gate | Command | Status | Exact Result |
     | :--- | :--- | :---: | :--- |
     | TypeScript Typecheck | `bun run typecheck` | PASS | 0 errors |
     | ESLint | `bun run lint` | PASS | 0 errors / 0 warnings |
     | Rust Formatting & Clippy | `cargo clippy -- -D warnings` | PASS | 0 warnings |
     | Rust Tests | `cargo test` | PASS | 349 passed; 0 failed |
     | Frontend Vitest | `bun run test` | PASS | 474 passed; 0 failed |
   - **Architectural Guardrails & LOC Audit**: Exact line count per touched file (`< 400 LOC`) and AST rule compliance.
   - **Known Limitations & Trade-offs**: Plainly disclosed unverified edge cases or deferred items.

### 3.6. Branch and Integration Ownership

- Main defines the branch strategy before dispatch and records it in the task registry.
- A worker with a dedicated task branch must not push to another worker's branch or to `main`.
- For independently releasable tasks, each worker branch may become its own PR after Main's review.
- For tasks contributing to one logical change, workers use separate task branches/workspaces. Main owns the integration branch, incorporates only reviewed commits while preserving meaningful commit boundaries, resolves integration conflicts, runs integration verification, and opens the PR. The PR is squash-merged only after review and explicit user approval.
- Main must not cherry-pick or merge an unreviewed worker result into the integration branch.
- If the host environment cannot provide isolated workspaces/branches, Main must serialize conflicting tasks or stop and explain the limitation; it must not claim isolation that does not exist.

## 4. Delegation Brief Specification

When delegating a task to a worker, Main must provide an explicit **Task Brief** containing:

1. **Task ID and Worker**: Stable task identifier and assigned worker/session.
2. **Working Branch / Workspace**: Exact branch and workspace, or the explicitly approved shared integration arrangement.
3. **Goal & Business Context**: What problem is being solved and why.
4. **Deliverables & Acceptance Criteria**: Observable result and conditions for completion.
5. **Dependencies**: Required outputs or decisions from other tasks; state "none" when independent.
6. **Permitted File Scope**: Explicit list of files and directories the worker is authorized to create or modify, plus protected/shared files it must not touch.
7. **Architectural Invariants**:
   - Zero raw HTML form/table tags outside `src/components/ui/` (`no-raw-html-primitives`).
   - Zero theme branching or hardcoded color classes (`no-inline-theme-ternaries`).
   - All user-facing strings use `translate(...)` and cover every locale defined in the current project localization contract.
   - Maximum nested `if` depth is 2 (`max-nested-ifs`).
   - LOC thresholds and exception handling follow `.agents/rules/code_quality_standards.md` (`>200 LOC` warning; `>400 LOC` error unless an explicitly reviewed exception is accepted).
   - Error handling follows the frontend/backend engineering standards and preserves the distinction between expected domain outcomes, missing data and operational failures.
   - Test structure and architecture enforcement follow `.agents/rules/testing_standards.md`.
8. **Exact Verification Commands**: Specific test suites and linters required for green status.
9. **Commit Message Format**: Commit messages follow the project's Conventional Commits convention. The final squash commit message must describe the complete PR.
10. **Reporting Contract**: Required completion report fields and the channel/session for reporting blockers to Main.

### 4.1. Task Decomposition and Assignment

Before launching workers, Main must:

1. Produce the implementation plan and identify deliverables.
2. Build a dependency graph and identify which tasks can run concurrently.
3. Map file ownership and shared-resource conflicts.
4. Choose a worker count using section 2.3.
5. Assign each task to exactly one accountable worker. A task may have supporting reviewers, but it must have one implementation owner.
6. Define integration order and the acceptance gate for each task.
7. Send each worker its complete Task Brief and wait for acknowledgement before treating it as Running.

Do not split work into artificial tasks merely to increase worker count. A task is suitable for delegation when it has a bounded outcome, clear ownership, and independently verifiable acceptance criteria.

### 4.2. Worker Completion Report

Every worker must report:

- Task ID and final status.
- Summary of changes and business/technical outcome.
- Exact files created, modified, or deleted.
- Branch/workspace and commit SHA.
- Verification commands executed and their actual results (including failures or skipped checks).
- Known limitations, risks, and follow-up work.
- Any deviation from the Task Brief, with Main's prior approval if applicable.

A claim such as "tests pass" without command names and observed results is insufficient evidence.

## 5. Question Escalation & User Communication Protocol

```text
Worker encounters ambiguity / blocker
   ↓
Worker stops the affected task and reports to Main
   ↓
Main checks the Task Brief, architecture rules, and other task dependencies
   ↓
[If the requirement is unstated or a product decision is needed]
Main asks the User in the main thread with concise options
   ↓
User answers
   ↓
Main records the decision and updates affected Task Briefs
   ↓
Main informs the relevant worker(s)
   ↓
Worker resumes
```

Workers must never invent requirements, create speculative fallbacks, or bypass missing requirements. A blocker in one task does not automatically stop independent tasks; Main decides whether dependent tasks must pause and records the impact in the task registry.

## 6. Review Gates and Sign-Off

1. **Worker Pre-Review Audit**: Each worker audits its own branch against `frontend_engineering_standards.md` / `backend_rust_engineering_standards.md` and the applicable project rules.
2. **Main Cross-Review**: Main inspects each worker diff against its base, validates file ownership and architecture boundaries, checks the completion report, and verifies the required test evidence. A worker's self-review does not replace Main's review.
3. **Integration Gate**: Main integrates only reviewed work, resolves conflicts, checks cross-task contracts, and runs the required integration-level tests, type checks, and linting. If integration fails, Main identifies the responsible change and returns a bounded correction task to its owner.
4. **User Review Gate**:
   - Main links the PR and presents the planned squash commit message, technical summary, and verification evidence.
   - Main lists any remaining risks or skipped checks.
   - Main **STOPS completely** and awaits explicit user approval.
5. **Merge & Progression**: Only upon explicit user sign-off does Main squash-merge the PR into `main`, producing exactly one target-branch commit. Dependent work may then branch from the updated `main`. Independent work may continue in parallel only when its branch and file ownership remain valid.
6. **Non-Testable & Documentation Verification Scope**: When a task or PR touches solely non-executable files (`docs/**`, `.agents/**`, `*.md`, `*.mdx`, `.markdownlint*`), running compilation, typecheck, and application test suites (Vitest, Cargo, E2E) is strictly bypassed. Verification is scoped exclusively to documentation integrity (`bun run docs:validate`) and markdown formatting. Do not waste agent sessions or CI runner resources on test suites that cannot be impacted by the changes.

A task is not **Integrated** until the integration target contains the reviewed change and integration verification has passed. A PR is not approved merely because all workers report Completed.

## 7. Operational Guardrails

- **No false parallelism**: Starting several prompts or sessions is not proof of parallel execution. Main records confirmed worker acknowledgements and outcomes.
- **No silent scope drift**: Changes outside a worker's permitted file scope require Main's approval before implementation.
- **No hidden integration**: Main reports which worker commits were included in each integration commit/PR.
- **No bypass of user gate**: Main never merges or proceeds past a required user approval gate without explicit approval.
- **Graceful degradation**: If a worker becomes unavailable, Main records the status, preserves completed evidence, and either retries, reassigns, serializes the task, or asks the user when the choice affects scope or risk.
- **Honest status**: Main distinguishes Planned, Running, Blocked, Completed, Reviewed, and Integrated. It never reports completion based solely on elapsed time or an assumed background process.

## 8. Systematic Graphify Integration (Graph-First Multi-Agent Architecture)

Graphify (`graphify-out/graph.json` and Graphify MCP tools) is an authoritative, persistent knowledge graph of oXyFlow. Orchestrators and workers MUST actively leverage Graphify across all phases of the multi-agent workflow:

### 8.1. Discovery & Decomposition via Graph Communities
- Before designing tasks or drafting an implementation plan, Main queries the graph (`god_nodes`, `graph_stats`, `get_community`) to discover central hubs and natural cohesion boundaries.
- **Natural Boundary Sizing**: Main decomposes large features along Graphify community boundaries rather than arbitrary horizontal splits. This prevents breaking tightly-coupled modules across uncoordinated PRs.

### 8.2. Impact & Blast-Radius Verification
- Before assigning a task, Main runs `get_pr_impact` / `shortest_path` on the proposed file set to identify all downstream callers, tests, and consumers that could be affected.
- The resulting blast-radius is included directly in the worker's **Task Brief** under `Permitted File Scope` and `Dependencies`.

### 8.3. PR Review & Triage
- During the cross-review gate, Main verifies via Graphify (`triage_prs`, `get_neighbors`) that the proposed changes:
  1. Do not introduce new circular dependencies between subsystems.
  2. Do not introduce forbidden bypasses (e.g. UI directly querying Persistence instead of EngineRouter).
  3. Do not unnecessarily overload god nodes (`CliError`, `Persistence`, `EngineRouter`).

### 8.4. Deterministic Local AST Extraction
- When running locally or in environments without third-party LLM API keys, Graphify operates in deterministic code-only mode:
  ```bash
  bun run graphify:build   # runs `graphify . --code-only --directed`
  bun run graphify:update  # runs `graphify . --code-only --update --directed`
  ```
- This guarantees fast, offline AST extraction across 1,200+ source files without external dependencies.

