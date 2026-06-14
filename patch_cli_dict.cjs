const fs = require('fs');

const cliDict = {
  cliStatusDesc: { en: "Displays details of the active running timer", pl: "Pokazuje status aktywnego mierzenia czasu", de: "Zeigt Details des aktiven Timers", es: "Muestra detalles del temporizador activo", fr: "Affiche les détails du chronomètre actif", "pt-br": "Exibe detalhes do cronômetro ativo" },
  cliCompleteDesc: { en: "Toggles completion state of a task", pl: "Oznacza zadanie/podzadanie jako ukończone", de: "Schaltet den Abschlussstatus einer Aufgabe um", es: "Alterna el estado completado de una tarea", fr: "Basculer l'état terminé d'une tâche", "pt-br": "Alterna o status de conclusão de uma tarefa" },
  cliLogsDesc: { en: "Shows log history from sqlite time_logs", pl: "Pokazuje historię wpisów z tabeli sqlite time_logs", de: "Zeigt Zeitprotokolle aus SQLite", es: "Muestra historial de logs de SQLite", fr: "Affiche l'historique des journaux SQLite", "pt-br": "Mostra o histórico de logs do SQLite" },
  cliHolidaysDesc: { en: "Lists holidays/leaves (add holiday/leave 2026-06-15 \"leave\" - saves)", pl: "Wyświetla święta/urlopy (add holiday/leave 2026-06-15 \"urlop\" - zapisuje)", de: "Zeigt Feiertage/Urlaub", es: "Muestra festivos/vacaciones", fr: "Affiche les jours fériés/congés", "pt-br": "Lista feriados/férias" },
  cliReportDesc: { en: "Generates standard and graphical reports for period", pl: "Generuje zwykłe i graficzne podsumowanie czasu w okresie", de: "Visualisiert Berichte", es: "Genera informes visuales", fr: "Génère des rapports visuels", "pt-br": "Gera relatórios visuais" },
  cliClearDesc: { en: "Clears console screen", pl: "Czyści ekran konsoli", de: "Leert die Konsole", es: "Limpia la consola", fr: "Effacer la console", "pt-br": "Limpa o console" },
  cliErrNoProjects: { en: "No projects found in SQLite. Use: addproject \"Name\"", pl: "Brak projektów w SQLite dbi. Użyj: addproject \"Nazwa\"", de: "Keine Projekte gefunden.", es: "No se encontraron proyectos.", fr: "Aucun projet trouvé.", "pt-br": "Nenhum projeto encontrado." },
  cliProjHeader: { en: "│  ID  │ PROJECT NAME                   │ TIME ELAPSED (H:M:S)   │", pl: "│  ID  │ NAZWA PROJEKTU                 │ CZAS SPĘDZONY (H:M:S)  │", de: "│  ID  │ PROJEKTNAME                    │ ZEIT (H:M:S)           │", es: "│  ID  │ NOMBRE DEL PROYECTO            │ TIEMPO INVERTIDO       │", fr: "│  ID  │ NOM DU PROJET                  │ TEMPS ÉCOULÉ            │", "pt-br": "│  ID  │ NOME DO PROJETO                │ TEMPO (H:M:S)          │" },
  cliRequiresProjId: { en: "Error: You must provide a project ID. Example: tasks 1", pl: "Błąd: Musisz podać ID projektu. Przykład: tasks 1", de: "Fehler: Projekt-ID fehlt.", es: "Error: Faltó ID de proyecto.", fr: "Erreur: ID de projet manquant.", "pt-br": "Erro: Forneça o ID do projeto." },
  cliProjNotExist: { en: "Error: Project with ID doesn't exist.", pl: "Błąd: Projekt nie istnieje.", de: "Fehler: Projekt existiert nicht.", es: "Error: El proyecto no existe.", fr: "Erreur: Le projet n'existe pas.", "pt-br": "Erro: O projeto não existe." },
  cliProjNoTasksYet: { en: "Project does not have any tasks yet.", pl: "Projekt nie posiada jeszcze żadnych zadań.", de: "Projekt hat noch keine Aufgaben.", es: "El proyecto no tiene tareas aún.", fr: "Le projet n'a pas encore de tâches.", "pt-br": "O projeto ainda não possui tarefas." },
  cliProjTasksHeader: { en: "Tasks for project", pl: "Zadania dla projektu", de: "Aufgaben für Projekt", es: "Tareas para proyecto", fr: "Tâches pour le projet", "pt-br": "Tarefas do projeto" },
  cliErrSpecifyProjQuotes: { en: "Error: Specify project name in quotes. Example: addproject \"Zouk Project\"", pl: "Błąd: Podaj nazwę projektu w cudzysłowie. Przykład: addproject \"Projekt Zouk\"", de: "Fehler: Projektname in Anführungszeichen.", es: "Error: Nombre del proyecto entre comillas.", fr: "Erreur: Nom de projet entre guillemets.", "pt-br": "Erro: Nome do projeto entre aspas." },
  cliSuccessCreatedProj: { en: "Success: Created project in SQLite.", pl: "Sukces: Utworzono projekt w SQLite.", de: "Erfolg: Projekt erstellt.", es: "Éxito: Proyecto creado.", fr: "Succès : Projet créé.", "pt-br": "Acerto: Projeto criado." },
  cliErrUsageAddTask: { en: "Error: Usage: addtask <proj_id> \"<name>\".", pl: "Błąd: Użycie: addtask <proj_id> \"<nazwa>\".", de: "Fehler: Nutzung addtask", es: "Error: Uso addtask", fr: "Erreur : Utilisation addtask", "pt-br": "Erro: Uso addtask" },
  cliSuccessAddedTask: { en: "Success: Added task", pl: "Sukces: Dodano zadanie", de: "Erfolg: Aufgabe hinzugefügt", es: "Éxito: Tarea añadida", fr: "Succès : Tâche ajoutée", "pt-br": "Acerto: Tarefa adicionada" },
  cliErrUsageAddSubtask: { en: "Error: Usage: addsubtask <parent_task_id> \"<name>\".", pl: "Błąd: Użycie: addsubtask <parent_task_id> \"<nazwa>\".", de: "Fehler: Nutzung addsubtask", es: "Error: Uso addsubtask", fr: "Erreur : Utilisation addsubtask", "pt-br": "Erro: Uso addsubtask" },
  cliSuccessAddedSubtask: { en: "Success: Added subtask", pl: "Sukces: Dodano podzadanie", de: "Erfolg: Unteraufgabe", es: "Éxito: Subtarea", fr: "Succès : Sous-tâche", "pt-br": "Acerto: Subtarefa" },
  cliErrTaskNotExist: { en: "Error: Task does not exist.", pl: "Błąd: Zadanie nie istnieje.", de: "Fehler: Aufgabe existiert nicht.", es: "Error: Tarea no existe.", fr: "Erreur: Tâche inexistante.", "pt-br": "Erro: Tarefa não existe." },
  cliErrTaskCompleted: { en: "Error: Task is completed.", pl: "Błąd: Zadanie jest ukończone.", de: "Fehler: Aufgabe ist erledigt.", es: "Error: Tarea completada.", fr: "Erreur: Tâche terminée.", "pt-br": "Erro: A tarefa está concluída." },
  cliTimerStarted: { en: "Timer started for task", pl: "Timer rozpoczęty dla zadania", de: "Timer gestartet für", es: "Temporizador iniciado para", fr: "Le chronomètre a commencé pour", "pt-br": "Cronômetro iniciado para" },
  cliNoActiveTimer: { en: "Info: No active timer is currently running.", pl: "Informacja: Brak aktywnego mierzenia czasu.", de: "Info: Kein Timer aktiv.", es: "Info: Ningún temporizador activo.", fr: "Info : Aucun minuteur actif.", "pt-br": "Info: Nenhum cronômetro ativo." },
  cliTimerStopped: { en: "Timer stopped for task", pl: "Timer zatrzymany dla zadania", de: "Timer gestoppt für", es: "Temporizador detenido para", fr: "Minuteur arrêté pour", "pt-br": "Cronômetro parado para" },
  cliStatusHeader: { en: "================ ACTIVE TIMER STATUS ================", pl: "================ STATUS AKTYWNEGO TIMERA ================", de: "== TIMER STATUS ==", es: "== ESTADO TEMPORIZADOR ==", fr: "== ÉTAT MINUTEUR ==", "pt-br": "== STATUS CRONÔMETRO ==" },
  cliStateIdle: { en: "State: Idle. No active tracker running.", pl: "Stan: Bezczynny. Brak aktywnego monitorowania.", de: "Status: Leerlauf", es: "Estado: Inactivo", fr: "État: Inactif", "pt-br": "Estado: Ausente" },
  cliUsageCompleteTask: { en: "Error: Usage: complete <task_id>", pl: "Błąd: Użycie: complete <task_id>", de: "Fehler", es: "Error", fr: "Erreur", "pt-br": "Erro" },
  cliTaskToggled: { en: "Task toggled successfully.", pl: "Zadanie zostało przełączone (ukończone/nieukończone).", de: "Aufgabe umgeschaltet", es: "Tarea alternada", fr: "Tâche basculée", "pt-br": "Tarefa alternada" },
  cliNoLogsFound: { en: "SQLite database: No logged time sessions found.", pl: "Baza SQLite: Brak zarejestrowanych sesji pomiarowych.", de: "Keine Protokolle in SQLite", es: "No se encontraron logs", fr: "Aucun log", "pt-br": "Sem logs" },
  cliLogsHeader: { en: "│ ID   │ PRJ ID │ STARTED AT │ STATE    │ DURATION               │", pl: "│ ID   │ PRJ ID │ ROZPOCZĘTO │ STATUS   │ CZAS TRWANIA           │", de: "│ ID   │ PRJ ID │ GESTARTET  │ STATUS   │ DAUER                  │", es: "│  ID  │ PRJ ID │ INICIADO   │ ESTADO   │ DURACIÓN               │", fr: "│  ID  │ PRJ ID │ DÉMARRÉ    │ ÉTAT     │ DURÉE                  │", "pt-br": "│ ID   │ PRJ ID │ INICIADO   │ STATUS   │ DURAÇÃO                │" },
  cliInvalidDateFormat: { en: "Error: Invalid date format. Must be YYYY-MM-DD.", pl: "Błąd: Niepoprawny format daty. Wymagany to YYYY-MM-DD.", de: "Falsches Format", es: "Formato incorrecto", fr: "Format invalide", "pt-br": "Formato inválido" },
  cliNoHolidays: { en: "SQLite database: holidays and leaves table is empty.", pl: "Baza sqlite: Tabela świąt i urlopów jest pusta.", de: "Keine Feiertage", es: "Sin vacaciones", fr: "Aucun congé", "pt-br": "Sem feriados" },
  cliHolidaysHeader: { en: "│  ID  │ DATE       │ TYPE        │ NAME (HOLIDAY / VACATION)      │", pl: "│  ID  │ DATA       │ TYP         │ NAZWA (ŚWIĘTO / URLOP)         │", de: "│  ID  │ DATUM      │ TYP         │ NAME                           │", es: "│  ID  │ FECHA      │ TIPO        │ NOMBRE                         │", fr: "│  ID  │ DATE       │ TYPE        │ NOM                            │", "pt-br": "│  ID  │ DATA       │ TIPO        │ NOME                           │" },
  cliNoLogsPeriod: { en: "Info: No logging entries found for period", pl: "Informacja: Brak logów czasowych dla okresu:", de: "Keine Protokolle", es: "Sin registros para período", fr: "Aucun élément pour l'époque", "pt-br": "Sem logs para período" },
  cliReportTimeHeader: { en: "TIME DURATION REPORT", pl: "RAPORT CZASOWY", de: "ZEITBERICHT", es: "INFORME", fr: "RAPPORT", "pt-br": "RELATÓRIO DE TEMPO" },
  cliReportSysList: { en: "--- PLAIN LIST OF SQLITE LOGS ---", pl: "--- ZWYKŁY WYPIS LOGÓW SYSTEMOWYCH ---", de: "--- PROTOKOLLE ---", es: "--- REGISTROS ---", fr: "--- LISTE DES JOURNAUX ---", "pt-br": "--- LOGS ---" },
  cliReportGraph: { en: "--- GRAPHICAL ACTIVE PROJECTS REPRESENTATION (ASCII) ---", pl: "--- GRAFICZNY RAPORT PROJEKTÓW (ASCII CHART) ---", de: "--- GRAFIK ---", es: "--- GRÁFICO ---", fr: "--- GRAPHIQUE ---", "pt-br": "--- GRÁFICOS ---" }
};

const langs = Object.keys(cliDict.cliStatusDesc);

for (const lang of langs) {
  const filePath = `src/utils/i18n/${lang}.ts`;
  let fileContent = fs.readFileSync(filePath, 'utf8');

  const dynamicRegex = /("dynamic"|dynamic):\s*\{([^}]*)\}/m;
  const match = fileContent.match(dynamicRegex);
  if (match) {
    let blockContent = match[2];
    for (const key of Object.keys(cliDict)) {
      if (!blockContent.includes(`"${key}"`) && !blockContent.includes(`${key}:`)) {
        blockContent = blockContent.trim();
        if (blockContent.length > 0 && !blockContent.endsWith(',')) {
          blockContent += ',\n';
        }
        blockContent += `    "${key}": ${JSON.stringify(cliDict[key][lang])}`;
      }
    }
    
    fileContent = fileContent.replace(dynamicRegex, `  "dynamic": {\n${blockContent}\n  }`);
    fs.writeFileSync(filePath, fileContent);
  }
}
