# Product Naming & Identity Specification

Canonical specification for product identity, umbrella branding, technical identifiers, allowed variants, abbreviations, and disambiguation across the oXyFlow TimeLog codebase.

---

## 1. Identity Definitions

The project distinguishes strictly between the umbrella organisation/group and the individual software product:

| Dimension | Canonical Name | Role & Scope |
| :--- | :--- | :--- |
| **Group / Umbrella** | `oXyFlow` | Organization, author entity, copyright owner, `NOTICE`, and credits dialog. |
| **Project / Product** | `TimeLog` | Application name in user interfaces, window titles, PWA manifest, documentation headers, and release artifacts. |

> [!IMPORTANT]
> **The Golden Rule**: Group name (`oXyFlow`) in authorship, copyright, and organization context; Project name (`TimeLog`) in UI display, headers, and build artifacts.

---

## 2. Allowed Variants & Formats

Depending on syntactic constraints of target filesystems, package managers, and reverse-DNS namespaces, the following variants are permitted:

| Context | Pattern / Variant | Example Usage |
| :--- | :--- | :--- |
| **Full Combined Brand** | `oXyFlow TimeLog` | Application title bar, documentation titles, README headers. |
| **Dot Notation** | `oXyFlow.TimeLog` | Structured log identifiers, system namespace tags. |
| **Underscore Compound** | `oXyFlow_TimeLog` | Release bundle tags, CI artifact prefixes. |
| **Reverse-DNS Identifier** | `com.oxyflow.timelog` | Tauri bundle identifier, OS app data directory, desktop shortcut IDs. |
| **Kebab-Case / Slugs** | `oxyflow-timelog` | Repository package names, container images, binary descriptors. |
| **Lower Snake-Case** | `oxyflow_timelog` | Rust crate library naming (`oxyflow_timelog::*`). |

---

## 3. Allowed Abbreviations & Shortcuts

To optimize CLI ergonomics and maintain clean storage keys, specific abbreviations are reserved:

| Abbreviation | Scope | Purpose & Examples |
| :--- | :--- | :--- |
| `oxy` | Native CLI binary & command | Primary command-line interface executable (`oxy start`, `oxy status`, `oxy report`). |
| `oxytime` | Technical shortcut & alias | SQLite database file (`oxytime.db`), localStorage key prefix (`oxytime_*`), environment variable prefix (`OXYTIME_*`), CLI terminal alias. |

---

## 4. Forbidden Names

To eliminate ambiguity and prevent regression to legacy or malformed casing, the following names are strictly prohibited across all code, configurations, and documentation:

| Prohibited Form | Reason for Prohibition |
| :--- | :--- |
| `OxyFlow` | Incorrect casing. Must always be `oXyFlow` with lowercase `o`, capital `X`, and capital `F`. |
| `LogTime` | Inverted words; conflicts with external tooling. |
| `oxyflow` (as product name) | The product is `TimeLog`, not `oxyflow`. `oXyFlow` is the group name. |
| `oxy-flow` | Legacy hyphenated crate/package name slated for retirement. |
| `oxy_flow` | Legacy snake_case name slated for retirement. |
| `com.oxytime.oxyflow` | Legacy Tauri identifier and appdata path. Replaced by `com.oxyflow.timelog`. |

---

## 5. Domain Disambiguation Rule

`TimeLog` serves a dual purpose in this repository:
1. **Product Name**: The application itself (`TimeLog`, built as `timelog.exe` or `TimeLog.app`).
2. **Domain Entity**: The internal core business model tracking time spent on a task (`TimeLog` struct in Rust `src-tauri/src/engine/domain/time_log.rs`, TypeScript binding `bindings/TimeLog.ts`, feature view `features/timelogs`, database table `time_logs`, columns, and unit tests).

**Rule**:
Only the product naming and group attribution are affected by rebranding. Domain entities, database schemas, and API bindings retain their existing domain names (`TimeLog`, `ITimeLogsEngine`, `timeLogs`) without modification.

---

## 6. Breaking Changes (Accepted Without Migration)

The transition to unified naming introduces breaking changes that are accepted without automated backward-compatibility migrations:

1. **Identifier Change**:
   - Old directory: `%APPDATA%\com.oxytime.oxyflow` (or `com.oxytime.timelog`)
   - New directory: `%APPDATA%\com.oxyflow.timelog`
   - Linux: `~/.local/share/com.oxyflow.timelog`
   - macOS: `~/Library/Application Support/com.oxyflow.timelog`
   - *Impact*: Fresh installations create a new empty database. Users migrating historical data must use **Settings → Backup → Export Backup JSON** before upgrading, then import the JSON file into the new installation.
2. **CLI Alias `oxyflow` Removed**:
   - The legacy `oxyflow` command alias is deprecated and removed. Users must invoke the native CLI via `oxy` (or technical alias `oxytime`).
3. **Installer Artifact Names Changed**:
   - Bundles are named `oXyFlow_TimeLog-Setup-x64.exe`, `oXyFlow_TimeLog-Universal.dmg`, `oXyFlow_TimeLog-x86_64.AppImage`, etc.
   - *Impact*: Legacy external download URLs pointing to `OxyFlow-*` cease functioning.
4. **Configuration File Rename**:
   - `dev.config.json` is superseded by `app.config.json`.
5. **Rust Crate Renaming**:
   - Package name updated from `oxy-flow` to `oxyflow-timelog`, with internal module imports referencing `oxyflow_timelog::`.
6. **PWA Manifest Name**:
   - Web application manifest name updated to `TimeLog`. Existing installed PWAs will reflect the updated name upon re-installation or cache refresh.

---

## 7. Metadata Synchronization Procedure

When altering any project metadata, versions, or author details, adhere to the following sequence:

1. Edit root [`metadata.json`](../../metadata.json) as the Single Source of Truth (SSOT).
2. Verify constraints against [`docs/manifesto/NAMING.md`](NAMING.md).
3. Run the synchronization script:
   ```bash
   bun run metadata:sync
   ```
4. Verify synchronisation integrity:
   ```bash
   bun run metadata:check
   ```
5. Run documentation and quality validation:
   ```bash
   bun run docs:validate
   bun run check
   ```
