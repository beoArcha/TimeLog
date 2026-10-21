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

In browser runtime mode, data is persisted in HTML5 `localStorage` under namespaced keys.

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

- **Automatic Backups**: oXyFlow includes automated backup capabilities configured under **Settings → Database & Backup**.
- **Manual Backups**: You can copy the `oxytime.db` file from the application data directory while the app is closed, or execute SQLite backup commands:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. How do I synchronize state between the GUI and CLI (`oxy`)?

The CLI companion binary (`oxy`) connects directly to the same local SQLite database (`oxytime.db`). When an operation (such as `oxy start <task>`) is dispatched from your shell, the desktop GUI updates its display upon the next timer tick or window focus event.
