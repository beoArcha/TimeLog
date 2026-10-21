# ⏱️ Welcome to oXyFlow

🌐 **Language / Język**: **English** | [Polski](pl/Home.md) | [Deutsch](de/Home.md) | [Español](es/Home.md) | [Français](fr/Home.md) | [Português (Brasil)](pt-br/Home.md)

---

**oXyFlow** is a modern, ultra-lightweight desktop timer and task tracker designed for freelancers, developers, and focused professionals. It keeps track of your daily work with zero distractions, zero cloud tracking, and instant startup speed.

```
   ┌─────────────────────────────────────────────────────────────┐
   │  ● Active: [Website Redesign] Client Homepage (01h 35m)     │
   │  [ Pause ]   [ Switch Task ]   [ Reports ]   [ Settings ]   │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Why oXyFlow?

- 🔒 **100% Private & Local**: Your data lives exclusively on your computer in a local database. No cloud subscriptions, no mandatory accounts, no tracking.
- ⚡ **Instant & Lightweight**: Built with Tauri v2 and native Rust. Uses less than 40 MB of RAM and opens in milliseconds.
- 🎨 **12 Gorgeous Themes**: Modern dark, clean light, high-contrast, and vibrant accent colors (Slate, Indigo, Emerald, Amber, Rose).
- 📊 **Clear Reports**: Visual calendar blocks, task hierarchies, and one-click exports to HTML, CSV, and JSON for client billing.
- 💻 **Terminal Companion (`oxy`)**: Control your timers directly from PowerShell, Terminal, or Bash without switching windows.
- 🌐 **6 Languages**: Available in English, Polish, German, Spanish, French, and Brazilian Portuguese.

---

## 📥 Download & Install

Download the latest package for your computer from the **[GitHub Releases Page](https://github.com/beoArcha/TimeLog/releases/latest)**:

| Platform | Recommended File | Quick Description |
| :--- | :--- | :--- |
| **Windows** | `OxyFlow-Setup-x64.exe` | Standard Windows installer with Start Menu integration |
| **Windows (Portable)** | `OxyFlow-Standalone-x64.exe` | Single `.exe` you can run anywhere or from a USB drive |
| **macOS** | `OxyFlow-Universal.dmg` | Drag-and-drop disk image for both Apple Silicon (M1–M4) and Intel |
| **Linux (AppImage)** | `OxyFlow-x86_64.AppImage` | Portable executable for all major Linux distributions |
| **Linux (Debian/Ubuntu)** | `oxyflow_amd64.deb` | Native package for Ubuntu, Debian, Linux Mint, and Pop!_OS |
| **Linux (Fedora/RHEL)** | `oxyflow.x86_64.rpm` | Native package for Fedora, Red Hat, and openSUSE |

Need help installing or bypassing Windows SmartScreen? Check our step-by-step **[Getting Started Guide](Getting-Started.md)** or the **[Installation Guide](https://github.com/beoArcha/TimeLog/blob/main/docs/INSTALLATION.md)**.

---

## 🧭 Explore the Wiki

### 👤 For Everyday Users (Jargon-Free)
- **[Getting Started](Getting-Started.md)**: First 5 minutes walkthrough.
- **[Basic Timer](Basic-Timer.md)**: Starting, stopping, and switching tasks.
- **[Basic CLI](Basic-Cli.md)**: Control your timer with 5 simple terminal commands.
- **[Interface & Themes](Interface.md)**: Personalizing colors, text size, and layout.
- **[Frequently Asked Questions (FAQ)](FAQ.md)**: Reassuring answers about data privacy, offline usage, and tips.

### ⚙️ For Developers & Power Users
- **[Advanced CLI Scripting](Advanced-Cli.md)**: JSON outputs, action macros, and automation pipelines.
- **[System Architecture](Architecture.md)**: Tauri v2 micro-engine, triple decoupling, and SQLite internals.
- **[Sinks & Automation](Sinks-and-Automation.md)**: Real-time CSV logging, Webhook dispatches, and idle rules.
- **[Building from Source](Developer-Build.md)**: Compiling oXyFlow locally with Bun and Cargo.
