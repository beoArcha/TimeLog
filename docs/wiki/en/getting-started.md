# Getting Started

> **Language**: **English** | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

This guide covers accessing TimeLog via Web / PWA or installing the native desktop application, configuring your workspace, and recording your first time entry.

---

## Web Application & PWA (Zero Install)

You can use TimeLog instantly without installing any binaries:

1. Open **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** in any modern web browser (Chrome, Edge, Firefox, Safari).
2. All timer operations and data persistence run entirely locally within your browser's private storage.
3. **PWA Installation**: In supported browsers (Chrome, Edge, Safari iOS/macOS), click the **Install App** button in the URL bar or browser menu to install TimeLog as an offline-capable standalone Progressive Web Application on your desktop or mobile home screen.

---

## Desktop Installation

Download the distribution package matching your operating system from the [GitHub Releases page](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Run `oXyFlow_TimeLog-Setup-x64.exe` to install to `%LOCALAPPDATA%\Programs\TimeLog`, or download `oXyFlow_TimeLog-Standalone-x64.exe` for portable execution without installation.
- **macOS**: Mount `oXyFlow_TimeLog-Universal.dmg` and drag `TimeLog.app` into `/Applications`.
- **Linux**: Make `oXyFlow_TimeLog-x86_64.AppImage` executable (`chmod +x oXyFlow_TimeLog-x86_64.AppImage`) and launch directly, or install `timelog_amd64.deb` / `timelog.x86_64.rpm` through your package manager.

### Using the CLI Companion (`oxy`)

The native CLI executable (`oxy` or `oxy.exe`) is bundled with the desktop application. To run `oxy` from any terminal session, ensure its enclosing folder is included in your system `PATH`.

---

## Creating a Project and Task

1. Open **TimeLog** (desktop application or web version).
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
