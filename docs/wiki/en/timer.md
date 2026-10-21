# ⏱️ Timer & Tracking

> 🌐 **Language / Język**: **English** | [Polski](/pl/podstawy-timera.md) | [Deutsch](/de/Timer-Grundlagen.md) | [Español](/es/Uso-del-Temporizador.md) | [Français](/fr/Minuteur-de-Base.md) | [Português](/pt-br/Uso-do-Temporizador.md)

---

## Operating the Timer

- **Single Active Invariant**: Exactly one task can be recorded at any point in time. When a new task is started, the previous log's `endTime` is populated and committed before the new log is initialized.
- **Microsecond Precision**: Start and stop timestamps use ISO 8601 UTC strings formatted with second precision.
- **Live Elapsed Calculation**: Elapsed timers in the UI are calculated directly against system clock ticks without relying on imprecise UI interval accumulation (`useLiveTaskElapsed`).

---

## Log Management & Overlaps

- **Viewing Records**: The **Time Logs** table provides full historical inspection, filtering by date range, project, and task.
- **Editing Entries**: Modifying start or end times must preserve strict non-overlapping intervals within the same project. Attempting to create an overlapping interval triggers a domain validation exception (`ERR_ENGINE_OVERLAP`).
- **Reports & Exporting**: Daily and weekly summaries calculate total task duration, billable hour multipliers, and support exports to HTML, CSV, and JSON.
