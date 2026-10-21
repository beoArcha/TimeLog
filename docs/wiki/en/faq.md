# ❓ Frequently Asked Questions (FAQ)

> 🌐 **Language / Język**: **English** | [Polski](/pl/faq.md) | [Deutsch](/de/FAQ.md) | [Español](/es/FAQ.md) | [Français](/fr/FAQ.md) | [Português](/pt-br/FAQ.md)

---

## 1. Where is my database file stored?

All time logs, projects, tasks, and configuration are persisted in a local SQLite file named `timelog.db`.

| Platform | Storage Path |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\timelog.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/timelog.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/timelog.db` |

---

## 2. Does oXyFlow require an internet connection?

**No.** oXyFlow is strictly offline-first. There are no cloud dependencies, third-party authentication services, or background network calls. All timer calculation, data querying, and report generation execute locally inside the native Rust engine.

---

## 3. Why does Windows SmartScreen display an alert on initial launch?

Windows SmartScreen issues a warning for freshly distributed binaries that lack an expensive commercial Extended Validation (EV) certificate. oXyFlow is open-source software distributed under the Mozilla Public License 2.0 (MPL-2.0).

To proceed:

1. Click **"More info"** on the Windows SmartScreen dialogue.
2. Click **"Run anyway"**.
3. You can verify binary authenticity against `SHA256SUMS.txt` published on each GitHub release.

---

## 4. What happens if I forget to stop the timer at the end of the day?

The active time log continues recording until manually paused, stopped, or switched.

- You can manually edit the start or end time of any log entry via the **Time Logs** table or the **Reports** view.
- Overlapping time logs within the same project are prohibited by the engine's validation rules (`ERR_ENGINE_OVERLAP`) to maintain audit compliance.

---

## 5. How do I backup and restore my database?

- **Automatic Backups**: oXyFlow includes automated backup capabilities located under **Settings → Database & Backup**.
- **Manual Backups**: You can directly copy the `timelog.db` file from the application data directory while the app is closed, or use SQLite CLI tools:

  ```bash
  sqlite3 timelog.db ".backup 'timelog-backup.db'"
  ```

---

## 6. How do I synchronize state between the GUI and CLI (`oxy`)?

The CLI executable (`oxy`) queries and writes to the exact same local SQLite database (`timelog.db`). When an operation (such as `oxy start <task>`) is dispatched from your shell, the desktop GUI updates its display reactively upon next tick or window focus.
