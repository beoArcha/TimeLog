# Basis-CLI (oxy)

> Sprache / Language: [English](/en/cli.md) | [Polski](/pl/cli.md) | **Deutsch** | [Español](/es/cli.md) | [Français](/fr/cli.md) | [Português](/pt-br/cli.md)

---

oXyFlow enthält das native Terminal-Tool `oxy`, das direkt mit der lokalen SQLite-Datenbank (`oxytime.db`) interagiert. Das CLI funktioniert vollständig unabhängig von der grafischen Oberfläche und eignet sich für Terminal-Workflows, Shell-Skripte und CI/CD-Pipelines.

---

## Globale Flags

Das Binary `oxy` akzeptiert globale Flags zur Steuerung von Ausgabeformatierung und Ausführlichkeit:

| Flag | Kurzform | Beschreibung |
| :--- | :--- | :--- |
| `--json` | `-j` | Gibt unformatiertes JSON auf `stdout` aus. |
| `--machine` | `-m` | Gibt deterministisches, einzeiliges JSON ohne interaktive Prompts aus. |
| `--quiet` | `-q` | Unterdrückt informative Hinweise und Tabellenkopfzeilen. |

---

## Kernfunktionen des Timer-Lebenszyklus

```bash
# Aktuellen Timer-Status abfragen
oxy status

# Zeiterfassung für eine Aufgabe starten (nach ID, Präfix oder Name)
oxy start "API-Implementierung"

# Laufenden Timer stoppen
oxy stop

# Atomar in einem Schritt zu einer anderen Aufgabe wechseln
oxy switch "Frontend-Bugfix"

# Zusammenfassung der heute erfassten Arbeitszeit ausgeben
oxy today
```

---

## Projekte und Aufgaben verwalten

```bash
# Alle aktiven Projekte auflisten
oxy project ls

# Neues Projekt mit optionaler Farbangabe anlegen
oxy project add "Kunden-Portal" -c "#3b82f6"

# Aufgaben aller Projekte auflisten
oxy task ls

# Aufgaben gefiltert nach Projekt auflisten
oxy task ls -p "Kunden-Portal"

# Neue Aufgabe in einem Projekt anlegen
oxy task add "OAuth-Flow entwerfen" -p "Kunden-Portal"

# Aufgabe als erledigt markieren
oxy task done "OAuth-Flow entwerfen"

# Aufgabe archivieren
oxy task rm "OAuth-Flow entwerfen"
```

---

## Berichte generieren und Daten exportieren

```bash
# Hierarchischen Unicode-Baum der heutigen Aufgaben ausgeben
oxy report --tree --today

# Bericht für die aktuelle Woche ausgeben
oxy report --tree --week

# Erfasste Arbeitszeiten nach HTML, CSV oder JSON exportieren
oxy report export -f html -o ./zeiterfassung.html
oxy report export -f csv -o ./zeiterfassung.csv
oxy report export -f json -o ./zeiterfassung.json
```

---

## Exit-Codes

Alle CLI-Befehle liefern deterministische POSIX-Exit-Codes:

| Exit-Code | Bedeutung | Beschreibung |
| :--- | :--- | :--- |
| `0` | Erfolg | Befehl erfolgreich ausgeführt. |
| `1` | Allgemeiner Fehler | Geschäftsregel verletzt oder Invariante nicht erfüllt. |
| `2` | Syntaxfehler | Ungültiger Befehl, fehlendes Argument oder unbekanntes Flag. |
| `3` | Speicherfehler | SQLite-Datenbankfehler oder Datei-E/A-Problem. |
| `4` | Entitätsfehler | Entität nicht gefunden oder mehrdeutige Übereinstimmung. |
| `5` | Engine-Fehler | Timer-Lebenszykluskonflikt (z. B. Stoppen bei inaktivem Timer). |

Für Shell-Pipelines, Cron-Jobs und Starship-Integration siehe **[Erweiterte CLI-Skripte](advanced-cli.md)**.
