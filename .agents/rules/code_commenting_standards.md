---
trigger: always_on
---

# Code Commenting Standards

## 1. Core Philosophy

1. **Explain the "WHY", never the "WHAT" or "HOW"**: Clean, expressive code (clear naming, small focused functions, strong typing) self-documents what it does and how it executes. Comments exist solely to document non-obvious intent: domain business invariants, real-world regulatory requirements, OS/platform quirks, or non-obvious algorithmic trade-offs.
2. **Refactor Instead of Documenting Architectural Violations**: Comments that signal or justify breaking Single Responsibility Principle (SRP), Interface Segregation Principle (ISP), or Open/Closed Principle (OCP) are strictly forbidden. If you feel compelled to write a comment explaining why a file or class does multiple distinct architectural jobs, **do not write the comment — perform a proper refactoring of the file**, unless explicitly instructed otherwise.
3. **Zero Declarative Compliance**: Never write comments that declare compliance with design principles, architectures, or standards ("adhering to SRP/OCP/ISP...", "compliant with WCAG...", "implements Clean Architecture..."). Such declarative buzzwords are code smells that become stale immediately. Architectural compliance must be demonstrated exclusively by the implementation.
4. **English Only**: All comments, docstrings, test descriptions, and technical notes must be written in technical English only.

---

## 2. Forbidden Anti-Patterns (How NOT to Write Comments)

### 2.1. Declarative Compliance & Buzzwords
Never claim adherence to design principles or standards.

❌ **BAD**:
```ts
/**
 * Composition facade for Tauri IPC persistence commands.
 * Adheres to SRP by delegating to domain-specific command classes,
 * OCP by allowing injection of custom service implementations,
 * and ISP by exposing segregated sub-interfaces.
 */
export class PersistenceCommands implements IPersistence { ... }

// Adheres to SRP by performing calculations without side-effects (no I/O, timers, or storage).
export class WorkflowRuleEvaluator implements IWorkflowRuleEvaluator { ... }
```

✅ **GOOD**:
```ts
/**
 * Composition facade for Tauri IPC persistence commands.
 */
export class PersistenceCommands implements IPersistence { ... }

export class WorkflowRuleEvaluator implements IWorkflowRuleEvaluator { ... }
```

---

### 2.2. Tautological Paraphrasing & Name Echoing
Never repeat or rephrase the name of a function, method, class, or parameter.

❌ **BAD**:
```ts
// Adds a project to the repository
function addProject(input: ProjectInput): Promise<Project> { ... }

// The ID of the task
const taskId = task.id;
```

✅ **GOOD**:
```ts
function addProject(input: ProjectInput): Promise<Project> { ... }

const taskId = task.id;
```

---

### 2.3. Comments Justifying Architectural Smells
Never use comments to paper over SRP, ISP, or OCP violations.

❌ **BAD**:
```ts
// Combines project storage and network sync in one class to avoid creating another file
class ProjectSyncService { ... }
```

✅ **GOOD**:
Refactor into separate `ProjectStorageService` and `ProjectNetworkSyncService`.

---

### 2.4. Step-by-Step Procedural Narration
Do not narrate obvious sequential execution steps line-by-line.

❌ **BAD**:
```ts
// Step 1: Load logs from database
const logs = await this.timeLogs.getAll();
// Step 2: Filter logs that have no end time
const activeLogs = logs.filter((l) => !l.endTime);
// Step 3: Return the active logs
return activeLogs;
```

✅ **GOOD**:
```ts
const logs = await this.timeLogs.getAll();
return logs.filter((l) => !l.endTime);
```

---

### 2.5. Decorative Visual Dividers & ASCII Banners
Never use decorative visual dividers (`===`, `***`, `---`, `//////`) to separate code sections. Structure must be provided by modularization and clean vertical whitespace.

❌ **BAD**:
```ts
// ==========================================
// TASK REPOSITORY IMPLEMENTATION
// ==========================================
```

✅ **GOOD**:
Partition into dedicated domain modules or use a single clean blank line.

---

### 2.6. Dead Code & Author/Timestamp Metadata
Never retain commented-out code blocks or author/commit/phase metadata in files. Version control (git) is the authoritative history.

❌ **BAD**:
```ts
// Modified by Kris for Phase 6 migration on 2026-10-17
// const legacyData = fetchLegacyXmlData();
```

✅ **GOOD**:
Delete dead code completely and rely on git log and blame.

---

### 2.7. Test Section Markers
Test section markers (`// Arrange` / `// Act` / `// Assert` in unit tests, `// Given` / `// When` / `// Then` in integration tests) are defined in `testing_standards.md`. Never combine them (`// Given (Arrange)`).

---

## 3. Legitimate Comment Patterns (How to Write Comments)

### 3.1. Business Invariants & Non-Obvious Domain Rules
Explain business logic, legal requirements, or domain restrictions that cannot be understood from the code alone.

✅ **GOOD**:
```ts
// Timelogs cannot overlap within the same project to satisfy strict audit compliance.
if (hasOverlappingLog(existingLogs, newLog)) {
  throw new EngineValidationException('Overlapping logs forbidden');
}
```

```rust
// SQLite foreign keys are disabled by default per SQLite connection; enable explicitly.
conn.execute_batch("PRAGMA foreign_keys = ON;")?;
```

---

### 3.2. Platform, Hardware & Runtime Workarounds
Document quirks or limitations of external runtimes, operating systems, or IPC boundaries.

✅ **GOOD**:
```ts
// Tauri v2 on Windows requires stringified JSON when transferring nested dictionary payloads over IPC.
await invoke('save_custom_translations', { translations: JSON.stringify(translations) });
```

---

### 3.3. Non-Obvious Algorithmic Decisions & Order of Operations
Explain why an unconventional data structure, specific execution order, or optimization was chosen.

✅ **GOOD**:
```ts
// Root tasks must be inserted before subtasks to satisfy foreign key hierarchy constraints.
for (const task of rootTasks) { insertTask(task); }
for (const task of subtasks) { insertTask(task); }
```

---

### 3.4. Actionable Technical Notes (`TODO:`)
Mark temporary development notes with `TODO:`, always providing technical context and the reason for deferral.

✅ **GOOD**:
```ts
// TODO: Replace with SQLite bulk parameter binding once supported by Tauri IPC bindings.
```
