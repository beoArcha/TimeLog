const fs = require('fs');

const dictionaries = {
  en: {
    "noPatches": "No patches", "addLogManually": "Add Log Manually (INSERT SQL)", "selectTask": "-- Select task --", "noNote": "No note", "addLeave": "+ Add Leave (SQL INSERT)", "addManualPatch": "Add Manual Patch", "noPatchesOperatingStandard": "No patches (patch_logs). Engine operates in standard mode.", "selectProject": "Select project", "noProjects": "No projects.", "noTasksInProfile": "No tasks in this profile.", "warningResetApp": "WARNING: Are you sure you want to delete ALL logs, tasks, and projects? Holidays are not deleted. This operation cannot be undone! Type 'reset' to confirm:", "noActiveTimersThisMoment": "No active timers at this moment."
  },
  pl: {
    "noPatches": "Brak poprawek", "addLogManually": "Dodaj Log Ręcznie (INSERT SQL)", "selectTask": "-- Wybierz zadanie --", "noNote": "Brak notki", "addLeave": "+ Dodaj Wolne (SQL INSERT)", "addManualPatch": "Dodaj Ręczny Patch", "noPatchesOperatingStandard": "Brak łatek (patch_logs). Silnik operuje w standardowym trybie.", "selectProject": "Wybierz projekt", "noProjects": "Brak projektów.", "noTasksInProfile": "Brak zadań w tym profilu.", "warningResetApp": "UWAGA: Czy na pewno chcesz usunąć WSZYSTKIE logi, zadania i projekty? Świąt nie usunięto. Tej operacji nie można cofnąć! Wpisz 'reset' aby potwierdzić:", "noActiveTimersThisMoment": "Brak aktywnych timerów w tym momencie."
  },
  de: {
    "noPatches": "Keine Patches", "addLogManually": "Protokoll manuell hinzufügen", "selectTask": "-- Aufgabe auswählen --", "noNote": "Keine Notiz", "addLeave": "+ Urlaub hinzufügen", "addManualPatch": "Manuellen Patch hinzufügen", "noPatchesOperatingStandard": "Keine Patches. Standardmodus.", "selectProject": "Projekt auswählen", "noProjects": "Keine Projekte.", "noTasksInProfile": "Keine Aufgaben in diesem Profil.", "warningResetApp": "WARNUNG: Möchten Sie wirklich ALLE Protokolle, Aufgaben und Projekte löschen? Geben Sie 'reset' ein, um zu bestätigen:", "noActiveTimersThisMoment": "Momentan keine aktiven Timer."
  },
  es: {
    "noPatches": "Sin parches", "addLogManually": "Añadir registro manualmente", "selectTask": "-- Seleccionar tarea --", "noNote": "Sin nota", "addLeave": "+ Añadir ausencia", "addManualPatch": "Añadir parche manual", "noPatchesOperatingStandard": "Sin parches. Modo estándar.", "selectProject": "Seleccionar proyecto", "noProjects": "Sin proyectos.", "noTasksInProfile": "No hay tareas en este perfil.", "warningResetApp": "ADVERTENCIA: ¿Desea eliminar TODOS los registros, tareas y proyectos? Escriba 'reset' para confirmar:", "noActiveTimersThisMoment": "No hay temporizadores activos en este momento."
  },
  fr: {
    "noPatches": "Aucun patch", "addLogManually": "Ajouter le journal manuellement", "selectTask": "-- Sélectionner une tâche --", "noNote": "Aucune note", "addLeave": "+ Ajouter un congé", "addManualPatch": "Ajouter un patch manuel", "noPatchesOperatingStandard": "Aucun patch. Mode standard.", "selectProject": "Sélectionner un projet", "noProjects": "Aucun projet.", "noTasksInProfile": "Aucune tâche dans ce profil.", "warningResetApp": "ATTENTION : Voulez-vous supprimer TOUS les journaux, tâches et projets ? Tapez 'reset' pour confirmer :", "noActiveTimersThisMoment": "Aucun minuteur actif pour le moment."
  },
  "pt-br": {
    "noPatches": "Sem patches", "addLogManually": "Adicionar Log Manualmente", "selectTask": "-- Selecionar tarefa --", "noNote": "Sem nota", "addLeave": "+ Adicionar Folga", "addManualPatch": "Adicionar Patch Manual", "noPatchesOperatingStandard": "Sem patches. Modo padrão.", "selectProject": "Selecionar projeto", "noProjects": "Sem projetos.", "noTasksInProfile": "Sem tarefas neste perfil.", "warningResetApp": "AVISO: Deseja excluir TODOS os logs, tarefas e projetos? Digite 'reset' para confirmar:", "noActiveTimersThisMoment": "Não há cronômetros ativos no momento."
  }
};

const langs = ['en', 'pl', 'de', 'es', 'fr', 'pt-br'];

for (const lang of langs) {
  const filePath = `src/utils/i18n/${lang}.ts`;
  let fileContent = fs.readFileSync(filePath, 'utf8');

  // Find the dynamic block
  const dynamicRegex = /("dynamic"|dynamic):\s*\{([^}]*)\}/m;
  const match = fileContent.match(dynamicRegex);
  if (match) {
    let blockContent = match[2];
    for (const [key, val] of Object.entries(dictionaries[lang])) {
      if (!blockContent.includes(`"${key}"`) && !blockContent.includes(`${key}:`)) {
        blockContent = blockContent.trim();
        if (blockContent.length > 0 && !blockContent.endsWith(',')) {
          blockContent += ',\n';
        }
        blockContent += `    "${key}": ${JSON.stringify(val)}`;
      }
    }
    
    fileContent = fileContent.replace(dynamicRegex, `  "dynamic": {\n${blockContent}\n  }`);
    fs.writeFileSync(filePath, fileContent);
  }
}
