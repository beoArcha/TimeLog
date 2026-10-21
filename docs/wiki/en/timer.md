# Timer & Tracking

> **Language**: **English** | [Polski](/pl/timer.md) | [Deutsch](/de/timer.md) | [Español](/es/timer.md) | [Français](/fr/timer.md) | [Português](/pt-br/timer.md)

---

This guide covers daily timer operations, switching tasks, adjusting historical logs, and understanding engine validation rules.

---

## Operating the Timer

- **Single Active Task**: Exactly one task can be recorded at any time. When you start tracking a new task, the active log's `endTime` is populated and committed before the new entry is initialized.
- **Accurate Elapsed Time**: Live elapsed times in the interface are computed against system clock ticks rather than simple interval counters, preventing drift when the window is minimized or the machine sleeps.
- **ISO 8601 Timestamps**: Start and end timestamps are stored as UTC strings formatted to second precision (e.g. `2026-10-21T14:30:00Z`).

---

## Switching and Stopping

- **Atomic Switching**: Clicking **Play** on another task automatically finalizes the currently running session and starts the new task in a single atomic database transaction.
- **Pausing / Stopping**: Click **Pause (⏸)** or **Stop (■)** in the status bar or next to the active task to complete the session.
- **Tray & Background Operation**: When minimized to system tray (on supported platforms), tracking continues uninterrupted in the background.

---

## Managing Time Logs and Overlaps

### Viewing and Filtering Records

The **Time Logs** view provides a chronological history of all tracked sessions. You can filter logs by:
- Date ranges (Today, This Week, This Month, Custom range).
- Project name or assigned color tag.
- Specific tasks and subtasks.

### Editing Entries

To modify an existing record:
1. Open the **Time Logs** table.
2. Click on the row you wish to edit.
3. Adjust the start time, end time, or associated task notes, then click **Save**.

### Overlap Invariant (`ERR_ENGINE_OVERLAP`)

Time logs cannot overlap within the same project. If an edit produces an overlapping interval with another log, the engine rejects the change and returns validation code `ERR_ENGINE_OVERLAP`. To resolve this, adjust the adjacent log's start or end time so the intervals remain mutually exclusive.

### Forgotten Timers

If a timer is left running overnight, open the log entry in **Time Logs** and trim the `endTime` to your actual departure time. The daily and weekly summary statistics will immediately recalculate.

---

## Reports and Exporting

The **Reports** view aggregates tracked hours across projects and tasks:
- **Daily and Weekly Totals**: Summarizes billable and non-billable hours.
- **Export Formats**: Export structured reports to **HTML**, **CSV**, or **JSON** for invoicing or integration with external reporting tools.
