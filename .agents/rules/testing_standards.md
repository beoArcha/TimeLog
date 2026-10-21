---
trigger: always_on
---

# Testing Standards (Frontend & Backend)

This file is the single source of truth for test structure, naming and isolation in oXyFlow. Other documents link here instead of repeating these rules.

## 1. Test Tiers

| Tier | Location | Target | Structure | Allowed side-effects |
| :--- | :--- | :--- | :--- | :--- |
| **Unit** | `tests/unit/`, `src-tauri/tests/unit/` | Utilities, rules, algorithms, isolated hooks, UI primitives | **AAA** | None. Mocks and fakes only; no I/O, disk or real IPC |
| **Integration** | `tests/integration/`, `src-tauri/tests/integration/` | Routers, persistence, IPC bridge, composite views, daemons, CLI flows | **BDT** | In-memory DB, temp-dir SQLite, mock IPC handlers |
| **Architecture** | `tests/architecture/`, `src-tauri/tests/architecture/` | AST scanning, boundaries, cycles, design-system rules | Rule assertions | File-system parsing only |
| **E2E** | `tests/e2e/` | Complete user journeys in the browser runtime | Page Object Model | Seeded browser storage |
| **Smoke** | `tests/smoke/`, `src-tauri/tests/smoke_test.rs` | App boots, core wiring works | Minimal | As integration |

Rust tests live in the tier directories above, not in ad-hoc `#[cfg(test)]` modules inside production handler files.

## 2. Unit Tests (AAA)

### 2.1. Naming

- `describe`: the exact name of the unit under test (`describe('TaskItem', ...)`).
- `it`: `it('should <expected outcome> when <action or condition>')`.
- Forbidden: vague names (`it('works')`, `it('renders properly')`, `it('test 1')`) and snake_case titles. *(enforced: `test-governance.arch.test.ts`)*

### 2.2. Structure

```ts
it('should stop the timer when the hours limit is exceeded', () => {
  // Arrange
  const config = aWorkflowConfig({ autoStopHoursLimit: 4 });
  const activeLog = aTimeLog({ startTime: '2026-10-19T08:00:00Z', endTime: null });

  // Act
  const result = rule.evaluate(config, [activeLog], nowMs);

  // Assert
  expect(result?.stopped).toBe(true);
});
```

- Markers are exactly `// Arrange`, `// Act`, `// Assert`.
- One Arrange-Act-Assert cycle per test. If a scenario needs a second Act, split it into another test.
- Dependencies are injected and mocked. Never touch real persistence, real timers or global router singletons.

## 3. Integration Tests (BDT)

### 3.1. Naming and structure

```ts
describe('Given a running timer on task A', () => {
  describe('When the user switches to task B', () => {
    it('Then it should stop task A and start task B atomically', async () => {
      // Given
      ...
      // When
      ...
      // Then
      ...
    });
  });
});
```

- Markers are exactly `// Given`, `// When`, `// Then`.
- Never mix paradigms: no `// Given (Arrange)` or AAA markers in integration tests, no BDT markers in unit tests.

### 3.2. Rust test names

Rust has no nested `describe`, so the scenario goes into the function name: `test_given_<state>_when_<action>_then_<outcome>` (the prevailing convention in `src-tauri/tests/`). Section markers follow the tier: AAA in unit tests, Given/When/Then in integration and architecture tests.

## 4. E2E Tests

- Ensure all E2E tests adhere to the User Journey pattern.

### 4.1 Playwright

- Specs in `tests/e2e/specs/` interact only through Page Objects in `tests/e2e/pages/`. Specs never define ad-hoc selectors.
- Locators target `data-testid` or stable element IDs, never visible text or localized labels.
- Every spec seeds or resets state in `test.beforeEach` (`mainPage.seedStorage(...)`, `mainPage.resetStorage()`) and never depends on another spec.

### 4.2 Tauri rust tests

- Located in `tests/e2e'
- Focused on CLI tests

## 5. Triple Decoupling

1. **From localization**: never assert localized copy (e.g. `/Zatwierdź/i`). Query by role, `data-testid` or element ID.
2. **From theming and CSS**: never assert color classes, hex values or theme names.
3. **From native side-effects**: no real Tauri invocations, disk or network in unit tests. Wrap components in `MockProviders` (`MockDataProvider`, `MockSettingsProvider`, `MockLocaleProvider`) and use `tests/shared/mocks/tauri-ipc-mock.ts`.

## 6. Test Data Builders

- TypeScript: use `tests/shared/builders/entity-builders.ts` (`aProject()`, `aTask()`, `aTimeLog()`, `aPatchLog()`, `aWorkflowConfig()`), overriding only the fields relevant to the scenario.
- Rust: use `src-tauri/tests/shared/builders/` (`ProjectBuilder`, `TaskBuilder`, `TimeLogBuilder`) and shared setup helpers.
- Never handcraft raw domain literals with arbitrary missing fields.

## 7. What a Good Test Verifies

- Meaningful behavior: form submission, keyboard shortcuts (`Enter`, `Escape`), confirmation dialogs, error states, toggles, state transitions.
- Mount-only tests and snapshots without interaction are not acceptable as the only coverage of a component.
- Rules and strategies are tested individually; evaluators are tested with stub rules injected through the constructor.

## 8. Cross-Runtime Parity

- Engine parity: `CrossRuntimeParity.test.ts` compares the Rust engine with the browser `EnginePlugin`.
- CLI parity: the shared fixture matrix `tests/shared/fixtures/cli-parity-cases.json` is executed by `cli-cross-runtime-parity.test.ts` (Vitest) and `cli_parity_test.rs` (Cargo).
- A change to engine or CLI behavior updates both runtimes and the parity fixtures in the same change.

## 9. Timeouts and Hangs

- Vitest runs with its default per-test timeout (5 s; no override in `vite.config.ts`). Playwright timeouts are set in `tests/e2e/config/playwright.config.ts`.
- Subprocess tests (`std::process::Command`) must enforce an explicit timeout and pass flags that prevent opening a Tauri/WebView2 window.
- A test that needs more than 60 s is a defect to fix, not a timeout to raise.

## 10. Temporary Tool Directories

Directories created by test or mutation tools (`.stryker-tmp/`, `.stryker-sandbox/`, `reports/`) must be excluded in `vite.config.ts` (`test.exclude`), `eslint.config.js` (`ignores`) and `.gitignore`.