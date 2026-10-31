# Frequently Asked Questions (FAQ)

> Language / Język: **English** | [Polski](/pl/faq.md) | [Deutsch](/de/faq.md) | [Español](/es/faq.md) | [Français](/fr/faq.md) | [Português](/pt-br/faq.md)

---

## 1. Where is my database file stored?

All time logs, projects, tasks, and configurations are persisted in a local SQLite file named `oxytime.db`.

| Platform | Storage Path |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

In browser runtime mode (PWA), data is persisted in HTML5 `localStorage` instead of a physical SQLite file (see question 7 for architectural details).

---

## 2. Does oXyFlow require an internet connection?

**No.** oXyFlow is strictly offline-first. There are no mandatory cloud accounts, external telemetry beacons, or third-party authentication services. All timer calculations, data querying, and report generation execute locally inside the native Rust engine.

---

## 3. Why does Windows SmartScreen display an alert on initial launch?

Windows SmartScreen issues a warning for freshly downloaded executables that lack an expensive commercial Extended Validation (EV) code signing certificate. oXyFlow is open-source software distributed under the Mozilla Public License 2.0 (MPL-2.0).

To proceed:

1. Click **More info** on the Windows SmartScreen dialogue.
2. Click **Run anyway**.
3. You can independently verify binary authenticity using the `SHA256SUMS.txt` checksum file published with each GitHub release.

---

## 4. What happens if I forget to stop the timer at the end of the day?

The active time log continues recording until manually paused, stopped, or switched:

- You can manually edit the start or end time of any log entry via the **Time Logs** table or the **Reports** view.
- Overlapping time logs within the same project are prohibited by the temporal validation rules (`TemporalOverlapDetected`) to maintain audit compliance.
- Future logs can be adjusted backward to reflect your actual working hours.

---

## 5. How do I backup and restore my database?

- **Universal JSON Backup**: Under **Settings → Backup** (in the **Database & State Backup** card):
  - **Export**: Click **Export Backup JSON** (`data-testid="export-backup-btn"`) to generate an unencrypted, portable JSON snapshot (`OxyFlow_Backup_YYYY-MM-DD.json`) capturing all projects, tasks, time entries, and settings.
  - **Restore / Import**: Click **Restore / Import Backup JSON** (`data-testid="import-backup-btn"`) and select a previously exported `.json` file. The engine validates the payload structure (`validateBackupPayload`) before restoring state.
  - **Cross-Platform Mobility**: The JSON format is universal across runtimes. You can export a backup from the web PWA and import it into the desktop application, or export from desktop and restore in the browser.
- **Physical SQLite Backup (Desktop Only)**: On desktop installations, you can copy the `oxytime.db` file directly while the app is closed, or run SQLite backup commands:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

In the browser PWA, native filesystem access is restricted by the browser sandbox; the universal JSON backup is the primary backup and migration mechanism.

---

## 6. How do I synchronize state between the GUI and CLI (`oxy`)?

The CLI companion binary (`oxy`) connects directly to the same local SQLite database (`oxytime.db`). When an operation (such as `oxy start <task>`) is dispatched from your shell, the desktop GUI updates its display upon the next timer tick or window focus event.

---

## 7. How does data storage work in the browser PWA compared to the desktop app?

oXyFlow uses separate persistence engines tailored to each runtime environment:

- **Desktop (Tauri v2)**: Data is stored in an ACID-compliant local SQLite database file (`oxytime.db`) on the filesystem. Users retain direct file access for manual filesystem backups and CLI companion synchronization.
- **Browser (PWA)**: Data resides in origin-isolated `localStorage` (`LocalStorage Engine`). Because browsers run in a secure sandbox without direct filesystem access, no physical `.sqlite` file is created or exportable in web mode.
- **Browser Cache Warning**: Executing browser cleanup routines ("Clear browsing data", "Clear site storage and cookies") or using Private/Incognito windows will permanently erase your stored timesheets.
- **Recommended Practice**: When using oXyFlow in web browsers, generate regular JSON backups via **Settings → Backup → Export Backup JSON** to keep a persistent record on your local disk.

