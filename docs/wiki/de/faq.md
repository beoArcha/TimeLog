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

Im Browser-Modus werden die Daten im HTML5-`localStorage` unter entsprechenden Namespaces abgelegt.

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

- **Automatische Backups**: oXyFlow bietet Sicherungsfunktionen unter **Einstellungen → Datenbank & Backup**.
- **Manuelles Backup**: Kopieren Sie die Datei `oxytime.db` bei geschlossener Anwendung oder führen Sie einen SQLite-Befehl aus:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. Wie synchronisieren sich GUI und CLI (`oxy`)?

Das CLI-Binary (`oxy`) greift auf dieselbe lokale SQLite-Datei (`oxytime.db`) zu. Wird ein Vorgang über das Terminal ausgeführt (z. B. `oxy start <aufgabe>`), aktualisiert die grafische Oberfläche die Anzeige beim nächsten Timer-Tick oder beim Fensterfokus.
