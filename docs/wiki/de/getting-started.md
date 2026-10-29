# Erste Schritte

> Sprache / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | **Deutsch** | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Diese Anleitung führt Sie durch den Zugriff auf oXyFlow über das Web / PWA oder die Desktop-Installation, die Umgebungseinrichtung und die Erfassung Ihres ersten Arbeitszeiteintrags.

---

## Webanwendung & PWA (Ohne Installation)

Sie können oXyFlow sofort und ohne Download im Browser nutzen:

1. Rufen Sie **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** in einem modernen Webbrowser (Chrome, Edge, Firefox, Safari) auf.
2. Alle Daten und Timer-Funktionen laufen und speichern 100% lokal im Speicher Ihres Browsers.
3. **PWA-Installation**: Klicken Sie in kompatiblen Browsern auf **App installieren** in der Adressleiste, um oXyFlow als eigenständige, offlinefähige Desktop- oder Mobil-App zu installieren.

---

## Desktop-Installation

Laden Sie das entsprechende Paket von der [GitHub Releases-Seite](https://github.com/beoArcha/TimeLog/releases/latest) herunter:

- **Windows**: Führen Sie den Installer `OxyFlow-Setup-x64.exe` aus oder nutzen Sie die portable Version `OxyFlow-Standalone-x64.exe`.
- **macOS**: Öffnen Sie das Disk-Image `OxyFlow-Universal.dmg` und ziehen Sie `OxyFlow.app` in den Ordner `/Applications`.
- **Linux**: Vergeben Sie Ausführungsrechte für `OxyFlow-x86_64.AppImage` (`chmod +x OxyFlow-x86_64.AppImage`) oder installieren Sie das Paket `.deb` / `.rpm`:

  ```bash
  sudo dpkg -i oxyflow_amd64.deb
  # oder auf Fedora/RHEL:
  sudo rpm -i oxyflow.x86_64.rpm
  ```

---

## CLI-Konfiguration (Optional)

Desktop-Installationen richten auch das native CLI-Tool `oxy` ein. Um `oxy` direkt im Terminal (PowerShell, Bash, Zsh) auszuführen, stellen Sie sicher, dass das Installationsverzeichnis in Ihrer `PATH`-Umgebungsvariable enthalten ist:

- **Windows**: `%LOCALAPPDATA%\Programs\oXyFlow\`
- **Linux / macOS**: `/usr/local/bin/` oder `~/.local/bin/`

Überprüfen Sie die Verfügbarkeit im Terminal:

```bash
oxy --version
```

---

## Projekt und Aufgabe anlegen

1. Starten Sie **oXyFlow** (Desktop- oder Webversion).
2. Klicken Sie in der Seitenleiste auf **"+ Neues Projekt"**.
3. Geben Sie den Projektnamen ein (z. B. `Kunden-Portal`) und wählen Sie eine Farbmarkierung. Klicken Sie auf **Speichern**.
4. Klicken Sie innerhalb des Projekts auf **"+ Aufgabe hinzufügen"**. Geben Sie den Aufgabentitel ein (z. B. `API-Implementierung`) und bestätigen Sie mit **Enter**.

---

## Zeiterfassung

- Klicken Sie auf die Schaltfläche **Start (▶)** neben einer Aufgabe, um die Erfassung zu starten.
- Die Statusleiste hebt die aktive Aufgabe mit fortlaufender Zeitanzeige hervor.
- Klicken Sie auf **Pause (⏸)** oder **Stopp (■)**, um die Sitzung zu beenden.
- Das Starten einer anderen Aufgabe stoppt die vorherige automatisch in einer atomaren Transaktion.

---

## Nächste Schritte

- **[Timer-Grundlagen](timer.md)**: Manuelle Anpassungen, Überlappungsregeln und Protokollverwaltung.
- **[Basis-CLI (`oxy`)](cli.md)**: Timer-Steuerung über PowerShell oder Bash.
- **[Benutzeroberfläche & Designs](interface.md)**: Layout-Dichten und Farbschemata anpassen.
