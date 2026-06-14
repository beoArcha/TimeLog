const fs = require('fs');

const langs = ['en', 'pl', 'de'];

const toAddEN = {
  settings: {
    hardResetDesc: "Deleting all data...",
    hardResetBtn: "Reset database",
  },
  themes: {
    lightDesc: "Light appearance",
    darkDesc: "Dark appearance",
    highContrastDesc: "High contrast UI",
    systemDesc: "System defaults",
  },
  dynamic: {
    createdAtLabel: "Created At:",
    archiveNoun: "Archive",
    archive: "Archive",
    unarchive: "Restore",
    hideSqlitePreview: "Hide SQLite Database Preview",
    exploreSqliteStructure: "Explore SQLite Table Structure (MicroORM)",
    records: "records",
    recordsPlural: "records",
    andMoreRows: "...and {x} more rows",
    actionsCrud: "actions (SQL CRUD)",
    originalValue: "original",
  }
};

const toAddPL = {
  settings: {
    hardResetDesc: "Usunięcie wszystkich danych...",
    hardResetBtn: "Resetuj bazę danych",
  },
  themes: {
    lightDesc: "Jasny wygląd",
    darkDesc: "Ciemny wygląd",
    highContrastDesc: "Wysoki kontrast",
    systemDesc: "Ustawienia systemu",
  },
  dynamic: {
    createdAtLabel: "Utworzono:",
    archiveNoun: "Archiwum",
    archive: "Archiwizuj",
    unarchive: "Przywróć",
    hideSqlitePreview: "Ukryj podgląd SQLite Database",
    exploreSqliteStructure: "Zbadaj strukturę tabel SQLite (MicroORM)",
    records: "rekordy",
    recordsPlural: "rekordów",
    andMoreRows: "...i {x} kolejnych wierszy",
    actionsCrud: "akcje (SQL CRUD)",
    originalValue: "original (oryginał)",
  }
};

const toAddDE = {
  settings: {
    hardResetDesc: "Alle Daten werden gelöscht...",
    hardResetBtn: "Datenbank zurücksetzen",
  },
  themes: {
    lightDesc: "Helles Design",
    darkDesc: "Dunkles Design",
    highContrastDesc: "Hoher Kontrast",
    systemDesc: "Systemeinstellungen",
  },
  dynamic: {
    createdAtLabel: "Erstellt am:",
    archiveNoun: "Archiv",
    archive: "Archivieren",
    unarchive: "Wiederherstellen",
    hideSqlitePreview: "SQLite-Datenbankvorschau ausblenden",
    exploreSqliteStructure: "SQLite-Tabellenstruktur untersuchen (MicroORM)",
    records: "Datensätze",
    recordsPlural: "Datensätze",
    andMoreRows: "...und {x} weitere Zeilen",
    actionsCrud: "Aktionen (SQL CRUD)",
    originalValue: "Originalwert",
  }
};

for (const lang of langs) {
  const path = `src/utils/i18n/${lang}.ts`;
  let content = fs.readFileSync(path, 'utf8');
  let data = lang === 'pl' ? toAddPL : (lang === 'de' ? toAddDE : toAddEN);
  
  for (const block of ['settings', 'themes', 'dynamic']) {
    let blockData = data[block];
    content = content.replace(new RegExp(`${block}\\s*:\\s*\\{`), function(match) {
        let str = match;
        for (const [k, v] of Object.entries(blockData)) {
            // avoid regex meta-chars, just check simple exists
            if (!content.includes(`"${k}":`) && !content.includes(`'${k}':`) && !content.includes(`${k}:`)) {
               str += `\n    "${k}": ${JSON.stringify(v)},`;
            }
        }
        return str;
    });
  }
  
  fs.writeFileSync(path, content);
}
console.log('patched');
