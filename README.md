# oXyTime Suite / oXyTimeLog

oXyTime is a highly integrated, high-performance parallel time-tracking utility and development dashboard designed specifically for software engineers, freelancers, and power-users. Built around a sleek cybernetic aesthetic, it bridges fluid GUI design, an interactive terminal command-line emulator (CLI), and a mock Rust/Tauri native compilation workflow.

---

## 🚀 Key Technological Stack

This application is engineered with a modern, reactive, stateful architecture designed for performance and reliability:

- **Frontend Core:** **React 18** with **TypeScript** for absolute type-safety, ensuring robust data interfaces.
- **Build System & Dev Server:** **Vite** for blistering fast hot builds and clean client-side asset compilation.
- **Styling Engine:** **Tailwind CSS** utilizing an premium, bespoke dark obsidian palette accented with fluid borders and custom neon gradients (`orange` to `rose`, `teal` to `emerald`).
- **Animations:** **Motion** (from `motion/react`) driving tactile, purposeful micro-interactions, page transitions, and expandable folder panels.
- **Testing Framework:** **Vitest** for running fast, deterministic unit test-suites verifying state mutations, string conversions, and time-tracking math.
- **Icons:** **Lucide React** for unified, elegant, and crisp vector typography icons.

---

## 🎨 Visual Style & Design Philosophy

oXyTime departs from cookie-cutter corporate admin templates by adopting an architectural, **cybernetic dark slate theme** designed to feel like a high-performance native IDE tools:

- **Minimalistic Obsidian Layout:** Structured around physical window boundaries, floating trays, and semi-transparent frosted panels (`backdrop-blur`).
- **Typography Selection:**
  - **Inter** (sans-serif) as the primary font for superior legibility in detailed panels.
  - **Space Grotesk** for display headers to establish a modern cyber-industrial identity.
  - **JetBrains Mono** for numerical values, system timers, process IDs, and CLI outputs to denote precision data.
- **High-Contrast Accents:** Careful utilization of interactive colors—radiant warm orange/rose for active timers, neon teal for diagnostic success, and deep indigo for source code traits.
- **Tactile Transitions:** Micro-interactions (e.g. hover glows, pulse waves on active tracking, accordion expansions) provide continuous visual feedback without causing sensory distraction.

---

## 💼 Core Business & Logical Rules

To ensure reliable, deterministic time logs, the core tracking logic conforms to several strict business constraints:

1. **Multi-Project Concurrency:** Users can track time across multiple independent projects simultaneously. Each project acts as its own execution sandbox.
2. **Single-Project Exclusivity:** To prevent analytical collisions, **only one task** can be actively tracked inside a single project at any given time. Starting tracking on "Subtask B" automatically pauses and records the final elapsed timestamp for "Subtask A" if they belong to the same project.
3. **Hierarchical Cascading Tracking & Calculations:** Tasks support a nested parent-child structure. Tracking a subtask automatically engages the mother task tracker ensuring parent tasks accurately reflect active sub-processes. The total duration of any parent task is calculated recursively:
   $$\text{Parent Duration} = \text{Direct Logs on Parent} + \sum (\text{Logs on Subtask}_i)$$
4. **Resilient Local Persistence:** All project schemas, task dictionaries, time logs, and system preferences are serialized to `localStorage` using a micro-ORM simulator to preserve developer data across sessions.
5. **Universal Internationalization (i18n):** Includes built-in multi-locale translation engines with an always-available custom dictionary mapper so developers can customize UI labels in real-time.

---

## 📂 Core Component Architecture

The application is modularized into specialized interfaces targeting different developer preferences:

```text
src/
├── components/                  # UI elements (Modular GUI, CLI, RustSourceExplorer)
├── utils/                       # Translators, date math, formats, backup systems
├── providers/                   # LocaleProvider and contexts
└── hooks/                       # useOxyFlow engine definitions and state hooks
tests/
├── shared/                      # Global constants and centralized mock helper functions
├── unit/                        # Isolated tests for custom hooks, data manager, and pure functions
├── integration/                 # Combined feature tests (GUI events, Database Explorer, CLI interaction)
└── e2e/                         # End-to-end automation verification (currently ignored)
```

### 🎛️ Modular GUI Engine (Small/Medium/Large)
An elegant visual control panel split into specific variants (`SmallGui`, `MediumGui`, `LargeGui`) and routed via `GuiRouter`. It relies on a shared `BaseGui` and `useGuiLogic` hook for a clean separation of concerns. Provides full CRUD operations for projects, hierarchical task structures, subtask insertions, and responsive tracking controls. Active tasks display pulsating pingers and digital counter readouts.

### 📟 CliInterface
For terminal lovers, a keyboard-driven console emulator that interprets strings. Features auto-scroll, command history, and custom syntax outputs:
- `help` – Displays available terminal utility systems.
- `projects` – Enumerates projects and active timers.
- `start <taskId>` – Commences parallel time measurement daemon processes.
- `stop` – Halts tracking loops.
- `clear` – Cleans terminal shell buffers.

### 🦀 RustSourceExplorer
Demonstrates how oXyTime integrates natively with the desktop tray using **Rust & Tauri v2**. It offers a read-only repository view of traits (`schema.rs`, `main.rs`, `tray.rs`) so teams can audit the Rust system-level integration.

### 🧙 TesterAndHelperWizard
Acts as the central QA diagnostic and localization control node. It contains:
- **Build Guideline Picker:** Interactive platform build recipes (Windows, macOS, Linux) explaining how to configure system compilers and package native binaries.
- **Dynamic Localization Manager:** Allows live overrides of system strings and on-the-fly dictionary injection.
- **QA Test Suite Runner:** An interactive mock unit test platform displaying parallel tracking audits, exclusivity guarantees, and mathematical precision checks directly in the UI.

---

## 🗺️ Supported Languages & Rationale

oXyTime comes out-of-the-box supporting multiple languages, tailored for distributed agile teams:

- **Polski (PL):** Traditional baseline format, supporting localized European freelancer accounting and regional agency teams.
- **English (EN):** Default global developer dialect, optimized for technical precision.
- **Deutsch (DE):** Tailored for European enterprises and structured logistics workflows.
- **Español (ES) & Português (PT-BR):** Enhancing reach across highly active tech communities in LATAM.
- **Custom Locale (✨ My Custom):** An open dictionary slot enabling developers to map terms directly, aligning the interface with their proprietary project vocabularies.

---

## 🧪 Technical Quality Assurance (Vitest Coverage)

To ensure mathematical precision, business integrity, and robust structure, our automated test suite has been heavily refactored. The tests are fully isolated in the `tests/` directory ensuring clean separation of concerns.

### Running Tests
To run the automated suite easily, execute:
```bash
npm run test
```

Or with vitest directly:

```bash
npx vitest run
```

### Verified Scopes & Assertions

- **Shared Helpers & Constants (`tests/shared/`)**: Centralizes shared mocks (such as `localStorage` mocks, `matchMedia` configuration, and Tauri core/event invocation spies) to ensure zero duplication across different suites.
- **Unit Tests (`tests/unit/`)**:
  - **Hooks & Contexts:** Exercises custom hooks (`useAppSettings`, `useExternalApiSync`, `useTauriWindow`, `useTimeLogData`, `useTimeTicker`, `useGlobalShortcuts`, etc.) in complete isolation.
  - **Math & Utilities:** Validates raw data operations (`data-manager.test.ts`), formatting boundaries (`formatSeconds` from `00:00:00` up to `99:59:59`), recursive parent-child log consolidation (`getTaskDurationSeconds`), backup algorithms, and dynamic localizations.
- **Integration Tests (`tests/integration/`)**:
  - **Tauri GUI Events:** Emulates system-level Tauri lifecycle signals, resizing limits, and minimize/close/restore event triggers.
  - **Database Explorer:** Audits database manipulation commands for projects, tasks, holidays, logs, patches, and file export helpers.
  - **CLI Terminal Shell:** Tests CLI parser logic, terminal prints, autoscrolls, command executions, and terminal history buffers.
  - **Providers:** Ensures correct provider initialization and state synchronization (e.g. `LocaleProvider`).

---

## 🛠️ Continuous Integration, Delivery & Versioning

oXyTime maintains enterprise-grade reliability and automated version management via advanced **GitHub Actions workflows**, using a dual-branch strategy (`main` for development, `release` for stable builds).

### Automated Test Pipelines & Coverage

Every pull request and push to both the `main` and `release` branches triggers parallel test matrices:

- **Unit & E2E Testing**: Runs the complete frontend Vitest suite, exporting JUnit XML and `v8` coverage reports stored dynamically as test artifacts.
- **Rust Backend Coverage**: On-the-fly integration of the Tauri mock native environment with **cargo-tarpaulin** analyzing native engine code coverage metrics.

### Release Branch Strategy & Versioning (`promote-to-release.yml`)

Releases are strictly controlled through an **Even/Odd Minor Versioning Schema**:

- The `main` branch always stays on an **even** minor version (e.g., `1.2.x`), acting as the active development branch.
- The `release` branch always stays on an **odd** minor version (e.g., `1.3.x`), representing stable production builds.

When ready to release, developers trigger the **Promote to Release** manual workflow from `main`. This automatically:

1. Runs final style & lint checks.
2. Merges `main` into the `release` branch.
3. Automatically bumps the `release` branch to the next odd minor version using `bump_versions.js`.
4. Automatically bumps the `main` branch to the next even minor version.

### Auto Release & Tauri Builds (`release.yml`)

Once the promotion is complete, the `release` branch runs its test suite. If successful, the **Auto Release** workflow is triggered:

- **Tauri Action** securely compiles native binaries across a matrix (`windows`, `macos`, `ubuntu`).
- Generates and uploads the final GUI bundles (e.g., `.exe`, `.dmg`, `.deb`).
- Automatically creates a GitHub Release and attaches a Git Tag (e.g., `v1.3.0`).

### Automated Hotfix Backports (`fix-down.yml`)

To ensure `main` receives critical patches applied directly to production:

- Merging a hotfix into the `release` branch automatically triggers the **Backport Fixes (Fix Down)** workflow.
- It cherry-picks the hotfix commit and opens a Backport Pull Request against `main`.
- Critically, it **excludes all version files** (`package.json`, `tauri.conf.json`, `versions.json`) during the cherry-pick, ensuring the `main` branch preserves its even minor version without conflicts.
