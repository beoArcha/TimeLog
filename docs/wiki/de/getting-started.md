# Erste Schritte

> Sprache / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | **Deutsch** | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Diese Anleitung führt Sie durch die Installation von oXyFlow, die Umgebungseinrichtung und die Erfassung Ihres ersten Arbeitszeiteintrags.

---

## Installation

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

1. Starten Sie **oXyFlow**.
2. Klicken Sie in der Seitenleiste auf **"+ Neues Projekt"**.
3. Geben Sie den Projektnamen ein (z. B. `Kunden-Portal`) und wählen Sie eine Farbmarkierung. Klicken Sie auf **Speichern**.
4. Klicken Sie innerhalb des Projekts auf **"+ Aufgabe hinzufügen"**. Geben Sie den Aufgabentitel ein (z. B. `API-Implementierung`) und bestätigen Sie mit **Enter**.

---

## Zeiterfassung steuern

- Klicken Sie auf das **Start-Symbol (▶)** neben der Aufgabe, um die Zeiterfassung zu starten.
- Die obere Statusleiste hebt die aktive Aufgabe hervor und zeigt die laufende Zeit in Echtzeit an.
- Klicken Sie auf **Stopp (■)**, um die aktuelle Sitzung zu beenden.
- Ein Klick auf Start bei einer anderen Aufgabe stoppt die laufende Aufgabe und startet die neue in einer atomaren Datenbanktransaktion (`switch`).

---

## Nächste Schritte

- **[Timer-Grundlagen](timer.md)**: Manuelle Zeitanpassung, Überlappungsregeln und Tagesübersicht.
- **[Basis-CLI (`oxy`)](cli.md)**: Steuerung über die Kommandozeile.
- **[Benutzeroberfläche & Designs](interface.md)**: Layout-Modi und Themes anpassen.
