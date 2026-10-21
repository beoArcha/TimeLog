# Installation & Platform Trust Guide

Welcome to the installation and deployment guide for **oXyFlow**, an ultra-lightweight, local-first work timer and task tracker powered by Tauri v2 and SQLite.

---

## Table of Contents

- [1. Quick Download Matrix](#1-quick-download-matrix)
- [2. Windows Installation](#2-windows-installation)
  - [2.1 NSIS Setup Wizard vs Portable Executable](#21-nsis-setup-wizard-vs-portable-executable)
  - [2.2 Windows SmartScreen Warning](#22-windows-smartscreen-warning)
  - [2.3 Antivirus & Heuristic False Positives](#23-antivirus--heuristic-false-positives)
- [3. macOS Installation](#3-macos-installation)
  - [3.1 Universal DMG Package](#31-universal-dmg-package)
  - [3.2 Apple Gatekeeper Quarantine Bypass](#32-apple-gatekeeper-quarantine-bypass)
- [4. Linux Installation](#4-linux-installation)
  - [4.1 AppImage](#41-appimage)
  - [4.2 Debian / Ubuntu (.deb)](#42-debian--ubuntu-deb)
  - [4.3 Fedora / RHEL (.rpm)](#43-fedora--rhel-rpm)
  - [4.4 Required System Libraries](#44-required-system-libraries)
- [5. Cryptographic Verification (SHA-256)](#5-cryptographic-verification-sha-256)
- [6. Building from Source](#6-building-from-source)

---

## 1. Quick Download Matrix

All official production builds are published on the GitHub Releases page:
👉 **[Latest Official Release](https://github.com/beoArcha/TimeLog/releases/latest)**

| Operating System | Recommended Package | Target Architecture | Description |
| :--- | :--- | :--- | :--- |
| **Windows** | `OxyFlow-Setup-x64.exe` | x86_64 (Intel/AMD) | NSIS setup wizard with start menu & tray integration |
| **Windows (Portable)** | `OxyFlow-Standalone-x64.exe` | x86_64 (Intel/AMD) | Single standalone `.exe` without installer |
| **macOS** | `OxyFlow-Universal.dmg` | Universal (M1–M4 & Intel) | Drag-and-drop macOS disk image |
| **Linux (Universal)** | `OxyFlow-x86_64.AppImage` | x86_64 | Self-contained, portable Linux executable |
| **Linux (Debian/Ubuntu)** | `oxyflow_amd64.deb` | x86_64 | Native Debian package for `apt` / `dpkg` |
| **Linux (Fedora/RHEL)** | `oxyflow.x86_64.rpm` | x86_64 | Native RPM package for `dnf` / `rpm` |

---

## 2. Windows Installation

### 2.1 NSIS Setup Wizard vs Portable Executable

- **NSIS Setup Wizard (`OxyFlow-Setup-x64.exe`)**:
  - Installs into your user profile directory (`%LOCALAPPDATA%\Programs\OxyFlow`).
  - Creates a desktop shortcut and a Start Menu shortcut.
  - Automatically configures auto-start with Windows (if enabled in app settings).
  - Clean uninstallation via Windows Settings $\to$ Apps $\to$ Installed Apps.
- **Portable Standalone (`OxyFlow-Standalone-x64.exe`)**:
  - No installer needed. Place it anywhere (e.g. `C:\Tools\OxyFlow.exe` or on a USB drive).
  - Your SQLite database and settings are saved automatically in `%APPDATA%\com.oxytime.oxyflow`.

### 2.2 Windows SmartScreen Warning

Because oXyFlow is a free community open-source project and is not signed with an expensive corporate Extended Validation (EV) certificate, Windows SmartScreen may display an initial warning:

> *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."*

#### How to proceed

1. Click the text link **"More info"** on the blue dialog.
2. Click the button **"Run anyway"** at the bottom.
3. The app will launch normally. Windows remembers your approval for future launches.

### 2.3 Antivirus & Heuristic False Positives

Occasionally, third-party antivirus engines flag freshly compiled Rust / Tauri binaries because the executable is compact and contains bundled webview integration. If your antivirus raises a warning:

- Verify the file's SHA-256 hash against the official `SHA256SUMS.txt` (see [Section 5](#5-cryptographic-verification-sha-256)).
- Add an exception in your antivirus software for `OxyFlow.exe`.

---

## 3. macOS Installation

### 3.1 Universal DMG Package

oXyFlow for macOS is distributed as a **Universal Binary**, natively supporting both Apple Silicon (M1, M2, M3, M4) and Intel (x86_64) Macs.

1. Download `OxyFlow-Universal.dmg` from the latest release.
2. Double-click the `.dmg` file to mount the disk image.
3. Drag the **OxyFlow** app icon into your **Applications** folder.
4. Eject the mounted disk image.

### 3.2 Apple Gatekeeper Quarantine Bypass

Because community open-source binaries are not notarized through Apple's paid developer program, macOS Gatekeeper may display a message:

> *"“OxyFlow” can’t be opened because Apple cannot check it for malicious software."*

#### Method A: Graphical Approval (Recommended)

1. Open **System Settings** $\to$ **Privacy & Security**.
2. Scroll down to the **Security** section.
3. You will see a notice: *"OxyFlow was blocked from use because it is not from an identified developer."*
4. Click **Open Anyway** and enter your macOS administrator password.

#### Method B: Terminal Command (Instant)

Alternatively, open your Terminal and remove the quarantine attribute:

```bash
xattr -d com.apple.quarantine /Applications/OxyFlow.app
```

---

## 4. Linux Installation

### 4.1 AppImage

The AppImage package runs on virtually all modern 64-bit Linux distributions without requiring root permissions.

1. Download `OxyFlow-x86_64.AppImage`.
2. Open a terminal in your download folder and grant executable permission:

   ```bash
   chmod +x OxyFlow-x86_64.AppImage
   ```

3. Run the application:

   ```bash
   ./OxyFlow-x86_64.AppImage
   ```

> **Note for Ubuntu 22.04+ & Fedora**:
> Modern Linux distributions require `libfuse2` to run AppImages. If the app fails to start with a FUSE error, install the compatibility library:
>
> - Ubuntu / Debian: `sudo apt install libfuse2`
> - Fedora: `sudo dnf install fuse-libs`

### 4.2 Debian / Ubuntu (.deb)

Install via `dpkg` or `apt`:

```bash
sudo dpkg -i oxyflow_amd64.deb
sudo apt-get install -f   # Fixes any missing dependencies automatically
```

Or with `apt` directly:

```bash
sudo apt install ./oxyflow_amd64.deb
```

### 4.3 Fedora / RHEL (.rpm)

Install via `dnf`:

```bash
sudo dnf install ./oxyflow.x86_64.rpm
```

### 4.4 Required System Libraries

OxyFlow relies on WebKitGTK for rendering the desktop UI on Linux. These libraries are installed automatically by `.deb` and `.rpm` packages, but are listed below for minimal Linux environments:

- `libwebkit2gtk-4.1-0` (or `webkit2gtk4.1`)
- `libgtk-3-0`
- `libayatana-appindicator3-1` (for system tray support)

---

## 5. Cryptographic Verification (SHA-256)

Every release includes an official `SHA256SUMS.txt` file generated during the automated build pipeline. You can verify the integrity and authenticity of your downloaded package before running it.

### On Windows (PowerShell)

```powershell
Get-FileHash .\OxyFlow-Setup-x64.exe -Algorithm SHA256
```

Compare the output `Hash` with the corresponding line in `SHA256SUMS.txt`.

### On Linux

Download both the package and `SHA256SUMS.txt` to the same folder, then run:

```bash
sha256sum --ignore-missing -c SHA256SUMS.txt
```

You should see:

```text
OxyFlow-x86_64.AppImage: OK
```

### On macOS

```bash
shasum -a 256 OxyFlow-Universal.dmg
```

---

## 6. Building from Source

If you prefer compiling oXyFlow directly from source:

### Prerequisites

1. **Bun**: JavaScript toolchain (`curl -fsSL https://bun.sh/install | bash` or `powershell -c "irm bun.sh/install.ps1 | iex"`).
2. **Rust**: Rust stable toolchain (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`).
3. **Linux Only**: Development headers:

   ```bash
   sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
   ```

### Build Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/beoArcha/TimeLog.git
   cd TimeLog
   ```

2. Install dependencies:

   ```bash
   bun install --frozen-lockfile
   ```

3. Run automated quality checks:

   ```bash
   bun run check
   bun run test
   ```

4. Build release packages using the automated script:
   - On Windows:

     ```powershell
     powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -Bundle nsis
     ```

   - On Linux / macOS:

     ```bash
     chmod +x ./scripts/build-release.sh
     ./scripts/build-release.sh
     ```

5. Your compiled packages will be located in `src-tauri/target/release/bundle/`.
