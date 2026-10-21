# 🚀 Getting Started

> 🌐 **Language / Język**: **English** | [Polski](/pl/pierwsze-kroki.md) | [Deutsch](/de/Erste-Schritte.md) | [Español](/es/Primeros-Pasos.md) | [Français](/fr/Premiers-Pas.md) | [Português](/pt-br/Primeiros-Passos.md)

---

This guide covers installing oXyFlow and recording your first timer entry.

---

## 1. Installation

Download the distribution package matching your operating system from [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Run `OxyFlow-Setup-x64.exe` to install to `%LOCALAPPDATA%\Programs\OxyFlow` or use `OxyFlow-Standalone-x64.exe` for portable execution.
- **macOS**: Mount `OxyFlow-Universal.dmg` and drag `OxyFlow.app` into `/Applications`.
- **Linux**: Make `OxyFlow-x86_64.AppImage` executable (`chmod +x OxyFlow-x86_64.AppImage`) and launch, or install `oxyflow_amd64.deb` / `oxyflow.x86_64.rpm` via your system package manager.

---

## 2. Creating a Project & Task

1. Open **oXyFlow**.
2. Click **"+ New Project"** in the sidebar.
3. Enter a project name (e.g. `Client Alpha`) and select a color tag. Click **Save**.
4. In the project section, click **"+ Add Task"**. Enter a task title (e.g. `Backend API Development`) and press **Enter**.

---

## 3. Recording Time

- Click the green **Play (▶)** button adjacent to your task to start tracking.
- The global status bar highlights the running task with live elapsed time updates.
- Click **Pause (⏸)** or **Stop (■)** to complete the entry.
- Starting another task automatically stops the currently active log in an atomic database transaction.

---

## Next Steps

- **[Timer & Tracking](timer.md)**: Manual time entry adjustments and switching protocols.
- **[CLI Companion (`oxy`)](cli.md)**: Operating the timer from PowerShell or terminal.
- **[Interface & Themes](interface.md)**: Customizing visual layout density and color schemes.
