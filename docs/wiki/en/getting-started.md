# Getting Started

> **Language**: **English** | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

This guide covers installing oXyFlow, configuring your workspace, and recording your first time entry.

---

## Installation

Download the distribution package matching your operating system from the [GitHub Releases page](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Run `OxyFlow-Setup-x64.exe` to install to `%LOCALAPPDATA%\Programs\OxyFlow`, or download `OxyFlow-Standalone-x64.exe` for portable execution without installation.
- **macOS**: Mount `OxyFlow-Universal.dmg` and drag `OxyFlow.app` into `/Applications`.
- **Linux**: Make `OxyFlow-x86_64.AppImage` executable (`chmod +x OxyFlow-x86_64.AppImage`) and launch directly, or install `oxyflow_amd64.deb` / `oxyflow.x86_64.rpm` through your package manager.

### Using the CLI Companion (`oxy`)

The native CLI executable (`oxy` or `oxy.exe`) is bundled with the application. To run `oxy` from any terminal session, ensure its enclosing folder is included in your system `PATH`.

---

## Creating a Project and Task

1. Open **oXyFlow**.
2. Click **"+ New Project"** in the sidebar.
3. Enter a project name (e.g. `Client Alpha`) and select a color badge. Click **Save**.
4. In the project section, click **"+ Add Task"**. Enter a task title (e.g. `Backend API Development`) and press **Enter**.

---

## Recording Time

- Click the **Play (▶)** button adjacent to your task to start tracking.
- The global status bar highlights the running task with live elapsed time updates.
- Click **Pause (⏸)** or **Stop (■)** to complete the session.
- Starting another task automatically stops the currently active log in an atomic database transaction.

---

## Next Steps

- **[Timer & Tracking](timer.md)**: Manual adjustments, overlap validation rules, and log management.
- **[CLI Companion (`oxy`)](cli.md)**: Operating the timer from PowerShell or Bash.
- **[Interface & Themes](interface.md)**: Customizing visual layout density and theme palettes.
