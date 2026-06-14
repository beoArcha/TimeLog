const fs = require('fs');

const data = {
  es: {
    settings: {
      hardResetDesc: "Eliminando todos los datos...",
      hardResetBtn: "Restablecer base de datos"
    },
    themes: {
      lightDesc: "Aspecto claro",
      darkDesc: "Aspecto oscuro",
      highContrastDesc: "UI de alto contraste",
      systemDesc: "Ajustes del sistema"
    },
    dynamic: {
      createdAtLabel: "Creado en:",
      archiveNoun: "Archivo",
      archive: "Archivar",
      unarchive: "Restaurar",
      hideSqlitePreview: "Ocultar Vista Previa de SQLite",
      exploreSqliteStructure: "Explorar Estructura SQLite (MicroORM)",
      records: "registros",
      recordsPlural: "registros",
      andMoreRows: "...y {x} filas más",
      actionsCrud: "acciones (SQL CRUD)",
      originalValue: "original"
    }
  },
  fr: {
    settings: {
      hardResetDesc: "Suppression de toutes les données...",
      hardResetBtn: "Réinitialiser la base de données"
    },
    themes: {
      lightDesc: "Apparence claire",
      darkDesc: "Apparence sombre",
      highContrastDesc: "Contraste élevé",
      systemDesc: "Paramètres du système"
    },
    dynamic: {
      createdAtLabel: "Créé le :",
      archiveNoun: "Archive",
      archive: "Archiver",
      unarchive: "Restaurer",
      hideSqlitePreview: "Masquer l'aperçu SQLite",
      exploreSqliteStructure: "Explorer la structure SQLite (MicroORM)",
      records: "enregistrements",
      recordsPlural: "enregistrements",
      andMoreRows: "...et {x} lignes en plus",
      actionsCrud: "actions (SQL CRUD)",
      originalValue: "original"
    }
  },
  'pt-br': {
    settings: {
      hardResetDesc: "Excluindo todos os dados...",
      hardResetBtn: "Redefinir banco de dados"
    },
    themes: {
      lightDesc: "Aparência clara",
      darkDesc: "Aparência escura",
      highContrastDesc: "Alto contraste",
      systemDesc: "Padrões do sistema"
    },
    dynamic: {
      createdAtLabel: "Criado em:",
      archiveNoun: "Arquivo",
      archive: "Arquivar",
      unarchive: "Restaurar",
      hideSqlitePreview: "Ocultar Visualização do BD SQLite",
      exploreSqliteStructure: "Explorar Estrutura SQLite (MicroORM)",
      records: "registros",
      recordsPlural: "registros",
      andMoreRows: "...e mais {x} linhas",
      actionsCrud: "ações (SQL CRUD)",
      originalValue: "original"
    }
  }
};

for (const lang of Object.keys(data)) {
  const path = `src/utils/i18n/${lang}.ts`;
  let content = fs.readFileSync(path, 'utf8');

  for (const block of Object.keys(data[lang])) {
    const blockData = data[lang][block];
    for (const [k, v] of Object.entries(blockData)) {
      const regex = new RegExp(`"${k}"\\s*:\\s*"[^"]*"`);
      if (regex.test(content)) {
          content = content.replace(regex, `"${k}": "${v}"`);
      } else {
        // if not found, we insert it at the start of the block
        content = content.replace(new RegExp('"' + block + '"\\\\s*:\\\\s*\\\\{'), '"' + block + '": {\\n    "' + k + '": "' + v + '",');
      }
    }
  }
  fs.writeFileSync(path, content);
}
