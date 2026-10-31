# Häufig gestellte Fragen (FAQ)

> Sprache / Language: [English](/en/faq.md) | [Polski](/pl/faq.md) | **Deutsch** | [Español](/es/faq.md) | [Français](/fr/faq.md) | [Português](/pt-br/faq.md)

---

## 1. Wo werden meine Daten und Arbeitszeiten gespeichert?

Alle Zeiteinträge, Projekte, Aufgaben und Konfigurationen werden in einer lokalen SQLite-Datei namens `oxytime.db` gespeichert.

| Betriebssystem | Speicherpfad |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

Im Browser-Modus (PWA) werden die Daten im HTML5-`localStorage` anstelle einer physischen SQLite-Datei abgelegt (weitere Details siehe Frage 7).

---

## 2. Benötigt oXyFlow eine Internetverbindung?

**Nein.** oXyFlow arbeitet strikt lokal (Offline-First). Es gibt weder Cloud-Zwangsanbindungen noch Telemetrie-Dienste oder externe Authentifizierungsaufrufe. Alle Zeitberechnungen, Datenbankabfragen und Berichte führt die native Rust-Engine lokal aus.

---

## 3. Warum zeigt Windows Defender SmartScreen beim Start eine Warnung?

Windows Defender SmartScreen warnt vor neu heruntergeladenen Binärdateien, die nicht mit einem kostenintensiven kommerziellen EV-Code-Signing-Zertifikat versehen sind. oXyFlow ist Open-Source-Software unter der Mozilla Public License 2.0 (MPL-2.0).

Vorgehensweise:

1. Klicken Sie im SmartScreen-Dialog auf **Weitere Informationen**.
2. Klicken Sie auf **Trotzdem ausführen**.
3. Die Integrität der Binärdatei kann unabhängig anhand der Datei `SHA256SUMS.txt` im GitHub-Release überprüft werden.

---

## 4. Was passiert, wenn der Timer am Ende des Arbeitstages nicht gestoppt wird?

Der aktive Zeiteintrag läuft weiter, bis er manuell gestoppt, pausiert oder umgeschaltet wird:

- Sie können Start- und Endzeitpunkt jedes Eintrags in der Tabelle **Zeiteinträge** oder der Ansicht **Berichte** nachträglich anpassen.
- Zeitliche Überlappungen von Einträgen innerhalb desselben Projekts werden durch die Validierungslogik der Engine (`TemporalOverlapDetected`) unterbunden.

---

## 5. Wie erstelle und sichere ich ein Backup der Datenbank?

- **Universelles JSON-Backup**: Unter **Einstellungen → Backup** (Karte **Datenbank- & Status-Backup**):
  - **Exportieren**: Klicken Sie auf **Backup als JSON exportieren** (`data-testid="export-backup-btn"`), um einen portablen JSON-Snapshot (`OxyFlow_Backup_YYYY-MM-DD.json`) mit allen Projekten, Aufgaben, Zeiteinträgen und Einstellungen zu erzeugen.
  - **Wiederherstellen / Importieren**: Klicken Sie auf **Backup aus JSON wiederherstellen** (`data-testid="import-backup-btn"`) und wählen Sie eine zuvor exportierte `.json`-Datei. Das System validiert die Dateistruktur (`validateBackupPayload`), bevor der Status wiederhergestellt wird.
  - **Plattformübergreifende Portabilität**: Das JSON-Format ist über alle Laufzeitumgebungen hinweg identisch. Sie können Backups aus der Browser-PWA exportieren und in die Desktop-App importieren (oder umgekehrt).
- **Physisches SQLite-Backup (Nur Desktop)**: Auf Desktop-Systemen können Sie die Datei `oxytime.db` bei geschlossener Anwendung direkt kopieren oder SQLite-Befehle nutzen:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

In der Browser-PWA verhindert die Browser-Sandbox den direkten Dateisystemzugriff; das universelle JSON-Backup ist das primäre Sicherungsverfahren.

---

## 6. Wie synchronisieren sich GUI und CLI (`oxy`)?

Das CLI-Binary (`oxy`) greift auf dieselbe lokale SQLite-Datei (`oxytime.db`) zu. Wird ein Vorgang über das Terminal ausgeführt (z. B. `oxy start <aufgabe>`), aktualisiert die grafische Oberfläche die Anzeige beim nächsten Timer-Tick oder beim Fensterfokus.

---

## 7. Wie unterscheidet sich die Datenspeicherung zwischen Desktop-App und Browser-PWA?

oXyFlow nutzt an die jeweilige Laufzeitumgebung angepasste Persistenz-Engines:

- **Desktop (Tauri v2)**: Die Daten werden in einer ACID-konformen lokalen SQLite-Datei (`oxytime.db`) im Dateisystem gespeichert. Nutzer haben direkten Zugriff auf die Datei für manuelle Backups und den CLI-Abgleich.
- **Browser (PWA)**: Die Daten liegen im herkunftsisolierten `localStorage` des Browsers (`LocalStorage Engine`). Da Webbrowser in einer Sicherheits-Sandbox ohne Dateisystemzugriff arbeiten, wird kein physisches `.sqlite`-File erstellt oder exportiert.
- **Warnung vor Browser-Bereinigungen**: Bereinigungsaktionen des Browsers („Browserdaten löschen“, Löschen von Cookies/Websitespeichern) oder private Browserfenster löschen alle gespeicherten Zeiteinträge unwiderruflich.
- **Empfohlene Vorgehensweise**: Erstellen Sie bei Nutzung der Web-App regelmäßige Sicherungen über **Einstellungen → Backup → Backup als JSON exportieren**, um Daten auf der Festplatte zu sichern.

