# Grundlagen der Zeiterfassung

> Sprache / Language: [English](/en/timer.md) | [Polski](/pl/timer.md) | **Deutsch** | [Español](/es/timer.md) | [Français](/fr/timer.md) | [Português](/pt-br/timer.md)

---

oXyFlow verwaltet Zeiterfassungssitzungen über eine native Rust-Engine, die Datenintegrität garantiert und Zeitdrifts zuverlässig ausschließt.

---

## Funktionsprinzipien der Zeiterfassung

- **Einzelner aktiver Eintrag**: Es kann immer nur eine Aufgabe gleichzeitig erfasst werden. Das Starten einer neuen Aufgabe beendet die laufende Sitzung (`endTime`) und schreibt die Änderung atomar in die Datenbank, bevor die neue Sitzung geöffnet wird.
- **Atomares Umschalten (`switch`)**: Der Aufgabenwechsel über die Oberfläche oder per `oxy switch <id>` stoppt den bisherigen Timer und startet den neuen in einer einzigen SQLite-Transaktion.
- **UTC-Zeitstempel**: Sämtliche Start- und Endzeitpunkte werden im ISO-8601-UTC-Format persistiert. Die Dauer berechnet sich deterministisch aus der Zeitstempeldifferenz.
- **Echtzeitberechnung ohne Timer-Drift**: Die Benutzeroberfläche berechnet die abgelaufene Zeit live über die Systemuhr (`useLiveTaskElapsed`), anstatt fehleranfällige JavaScript-`setInterval`-Ticker zu akkumulieren.

---

## Bearbeiten und Korrigieren von Zeiteinträgen

Erfasste Sitzungen können in der Tabelle **Zeiteinträge** oder in der Ansicht **Berichte** geprüft und korrigiert werden:

1. Klicken Sie auf einen Eintrag, um den Sitzungseditor zu öffnen.
2. Passen Sie Start- oder Endzeitpunkt an.
3. Speichern Sie die Änderungen. Die Engine berechnet die Sitzungsdauer neu und aktualisiert die Projektmetriken.

---

## Validierung von Zeitüberlappungen

Zur Gewährleistung vollständiger Audit-Konformität erzwingt die Engine ein striktes Überlappungsverbot (`TemporalOverlapDetected`):

- Zwei Zeiteinträge innerhalb desselben Projekts dürfen sich zeitlich nicht überschneiden.
- Bei einem Kürzungs- oder Bearbeitungskonflikt weist die Engine den Eintrag zurück und fordert eine Anpassung der Zeitspanne an.

---

## Berichte und Datenexport

Das Berichtsmodul aggregiert Daten auf Tages-, Wochen- und Monatsebene:

- **Projekthierarchie**: Detaillierte Aufschlüsselung nach Projekten, Aufgaben und Teilaufgaben.
- **Exportformate**: Export nach **HTML** (druckfertige Übersicht), **CSV** (für Tabellenkalkulationen) und **JSON** (für nachgelagerte Skripte).
