---
trigger: always_on
---

# Code Quality Standards

These rules define measurable code quality constraints shared across frontend, backend and repository scripts.

## 1. Lines of Code (LOC)

LOC thresholds are architectural quality gates, not automatic instructions to split every file.

| File size | Classification | Required action |
|---|---|---|
| `≤ 200 LOC` | Normal | No action required |
| `> 200 LOC` | Warning | Review file cohesion, responsibilities and decomposition opportunities |
| `> 400 LOC` | Error | Requires explicit Code Review assessment and justification |

### 1.1. Scope

LOC enforcement applies to project-owned source files with the following extensions:

- `.rs`
- `.ts`
- `.tsx`
- `.js`
- Repository-owned executable scripts covered by the project's script conventions.

Do not apply these thresholds indiscriminately to documentation, JSON, generated files, configuration files, dependencies, build output or other non-source artifacts.

The LOC counting convention must be defined once by the architecture-test implementation, documented alongside that test and applied consistently across the supported file types. Do not mix physical-line and logical-code-line measurements.

### 1.2. Review and Exceptions

- A file exceeding 200 LOC must be reviewed for responsibility cohesion and possible decomposition.
- A file exceeding 400 LOC is an architecture-test violation unless an explicit exception is justified and accepted during Code Review.
- An exception must identify the affected file, explain why decomposition would be inappropriate or harmful, and be approved during Code Review.
- Exceptions must be visible in the exception mechanism used by the architecture test; a broad test disablement or directory-wide exclusion is not an acceptable substitute.
- An exception must not hide unrelated responsibilities or avoid necessary architectural decomposition.
- A file must not be split solely to satisfy a LOC threshold when doing so would reduce cohesion, introduce artificial abstractions or make the code harder to understand.

### 1.3. Architecture Test Enforcement

Architecture tests must:

- Measure LOC consistently across supported source-file types.
- Report files exceeding 200 LOC as warnings.
- Fail when a file exceeds 400 LOC without an accepted exception.
- Support explicitly reviewed exceptions without weakening enforcement for the rest of the codebase.
- Produce actionable output containing the file path, measured LOC and applicable threshold.
- Keep warning and error thresholds centralized; do not duplicate numeric limits in frontend, backend or delegation rules.

The LOC test is a guardrail. Passing it does not replace architectural review of cohesion, responsibility boundaries or maintainability.
