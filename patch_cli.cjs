const fs = require('fs');
let content = fs.readFileSync('src/components/CliInterface.tsx', 'utf8');

// Ensure translate is imported
if (!content.includes("import { translate }")) {
  content = content.replace(
    "import { TimeLog, Project, Task } from '../types';", 
    "import { TimeLog, Project, Task } from '../types';\nimport { translate } from '../utils/i18n';"
  );
}

// Add locale from useOxyFlow just in case
if (!content.includes("locale, customTranslations")) {
  content = content.replace(
    "const { activeLog, setActiveLog, projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays } = useOxyFlow();",
    "const { activeLog, setActiveLog, projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays, locale, customTranslations } = useOxyFlow();"
  );
}

// Helper funcs replacement in the file
const replacements = [
  [/isPl \? 'Pokazuje status aktywnego mierzenia czasu' : 'Displays details of the active running timer'/g, "translate(locale, 'dynamic.cliStatusDesc', customTranslations)"],
  [/isPl \? 'Oznacza zadanie\/podzadanie jako ukończone' : 'Toggles completion state of a task'/g, "translate(locale, 'dynamic.cliCompleteDesc', customTranslations)"],
  [/isPl \? 'Pokazuje historię wpisów z tabeli sqlite time_logs' : 'Shows log history from sqlite time_logs'/g, "translate(locale, 'dynamic.cliLogsDesc', customTranslations)"],
  [/isPl \? 'Wyświetla święta\/urlopy \(add holiday\/leave 2026-06-15 "urlop" - zapisuje\)' : 'Lists holidays\/leaves \(add holiday\/leave 2026-06-15 "leave" - saves\)'/g, "translate(locale, 'dynamic.cliHolidaysDesc', customTranslations)"],
  [/isPl \? 'Generuje zwykłe i graficzne podsumowanie czasu w okresie' : 'Generates standard and graphical reports for period'/g, "translate(locale, 'dynamic.cliReportDesc', customTranslations)"],
  [/isPl \? 'Czyści ekran konsoli' : 'Clears console screen'/g, "translate(locale, 'dynamic.cliClearDesc', customTranslations)"],
  [/isPl \? 'Brak projektów w SQLite dbi. Użyj: addproject "Nazwa"' : 'No projects found in SQLite. Use: addproject "Name"'/g, "translate(locale, 'dynamic.cliErrNoProjects', customTranslations)"],
  [/isPl \? '│  ID  │ NAZWA PROJEKTU                 │ CZAS SPĘDZONY \(H:M:S\)  │' : '│  ID  │ PROJECT NAME                   │ TIME ELAPSED \(H:M:S\)   │'/g, "translate(locale, 'dynamic.cliProjHeader', customTranslations)"],
  [/isPl \? 'Błąd: Musisz podać ID projektu. Przykład: tasks 1' : 'Error: You must provide a project ID. Example: tasks 1'/g, "translate(locale, 'dynamic.cliRequiresProjId', customTranslations)"],
  [/isPl \? `Błąd: Projekt o ID "\$\{pId\}" nie istnieje w SQLite.` : `Error: Project with ID "\$\{pId\}" doesn't exist in SQLite.`/g, "`\${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} \${pId}`"],
  [/isPl \? `Projekt "\$\{proj.name\}" nie posiada jeszcze żadnych zadań.` : `Project "\$\{proj.name\}" does not have any tasks yet.`/g, "`\${proj.name}: \${translate(locale, 'dynamic.cliProjNoTasksYet', customTranslations)}`"],
  [/isPl \? `Zadania dla projektu: \$\{proj.name\} \[ID: \$\{proj.id\}\]` : `Tasks for project: \$\{proj.name\} \[ID: \$\{proj.id\}\]`/g, "`\${translate(locale, 'dynamic.cliProjTasksHeader', customTranslations)}: \${proj.name} [ID: \${proj.id}]`"],
  [/isPl \? 'Błąd: Podaj nazwę projektu w cudzysłowie. Przykład: addproject "Projekt Zouk"' : 'Error: Specify project name in quotes. Example: addproject "Zouk Project"'/g, "translate(locale, 'dynamic.cliErrSpecifyProjQuotes', customTranslations)"],
  [/isPl \? `Sukces: Utworzono projekt "\$\{name\}" w SQLite.` : `Success: Created project "\$\{name\}" in SQLite.`/g, "`\${translate(locale, 'dynamic.cliSuccessCreatedProj', customTranslations)}: \${name}`"],
  [/isPl \? 'Błąd: Użycie: addtask <proj_id> "<nazwa>". Przykład: addtask 1 "Zaprojektować logo"' : 'Error: Usage: addtask <proj_id> "<name>". Example: addtask 1 "Design logo"'/g, "translate(locale, 'dynamic.cliErrUsageAddTask', customTranslations)"],
  [/isPl \? `Błąd: Projekt o ID "\$\{pId\}" nie istnieje w bazie.` : `Error: Project with ID "\$\{pId\}" does not exist in SQLite database.`/g, "`\${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} \${pId}`"],
  [/isPl \? `Sukces: Dodano zadanie "\$\{taskName\}" do projektu \[ID: \$\{pId\}\].` : `Success: Added task "\$\{taskName\}" to project \[ID: \$\{pId\}\].`/g, "`\${translate(locale, 'dynamic.cliSuccessAddedTask', customTranslations)}: \${taskName}`"],
  [/isPl \? 'Błąd: Użycie: addsubtask <parent_task_id> "<nazwa>". Przykład: addsubtask 10 "Refaktoryzacja"' : 'Error: Usage: addsubtask <parent_task_id> "<name>". Example: addsubtask 10 "Refactoring"'/g, "translate(locale, 'dynamic.cliErrUsageAddSubtask', customTranslations)"],
  [/isPl \? `Błąd: Zadanie nadrzędne o ID "\$\{parentId\}" nie istnieje.` : `Error: Parent task with ID "\$\{parentId\}" does not exist.`/g, "`\${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} \${parentId}`"],
  [/isPl \? `Sukces: Dodano podzadanie "\$\{subName\}" dla zadania \[ID: \$\{parentId\}\].` : `Success: Added subtask "\$\{subName\}" for task \[ID: \$\{parentId\}\].`/g, "`\${translate(locale, 'dynamic.cliSuccessAddedSubtask', customTranslations)}: \${subName}`"],
  [/isPl \? `Błąd: Zadanie o ID "\$\{currentTaskId\}" nie istnieje.` : `Error: Task with ID "\$\{currentTaskId\}" does not exist.`/g, "`\${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} \${currentTaskId}`"],
  [/isPl \? `Błąd: Zadanie o ID "\$\{tId\}" nie istnieje w sqlite.` : `Error: Task with ID "\$\{tId\}" does not exist in SQLite database.`/g, "`\${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} \${tId}`"],
  [/isPl \? `Błąd: Zadanie "\$\{taskObj.name\}" jest ukończone.` : `Error: Task "\$\{taskObj.name\}" is completed.`/g, "`\${translate(locale, 'dynamic.cliErrTaskCompleted', customTranslations)} \${taskObj.name}`"],
  [/isPl \? `▶️ Timer rozpoczęty dla zadania: "\$\{taskObj.name\}" \[ID: \$\{tId\}\]` : `▶️ Timer started for task: "\$\{taskObj.name\}" \[ID: \$\{tId\}\]`/g, "`▶️ \${translate(locale, 'dynamic.cliTimerStarted', customTranslations)}: \${taskObj.name} [ID: \${tId}]`"],
  [/isPl \? 'Informacja: Brak aktywnego mierzenia czasu.' : 'Info: No active timer is currently running.'/g, "translate(locale, 'dynamic.cliNoActiveTimer', customTranslations)"],
  [/isPl \? `⏹️ Timer zatrzymany dla zadania: "\$\{t\?.name \|\| 'Nieznane'\}. Zapisano w SQLite.` : `⏹️ Timer stopped for task: "\$\{t\?.name \|\| 'Unknown'\}. Saved to SQLite.`/g, "`⏹️ \${translate(locale, 'dynamic.cliTimerStopped', customTranslations)}: \${t?.name || ''}`"],
  [/isPl \? '================ STATUS AKTYWNEGO TIMERA ================' : '================ ACTIVE TIMER STATUS ================'/g, "translate(locale, 'dynamic.cliStatusHeader', customTranslations)"],
  [/isPl \? 'Stan: Bezczynny. Brak aktywnego monitorowania.' : 'State: Idle. No active tracker running.'/g, "translate(locale, 'dynamic.cliStateIdle', customTranslations)"],
  [/isPl \? 'Błąd: Użycie: complete <task_id>. Przykład: complete 102' : 'Error: Usage: complete <task_id>. Example: complete 102'/g, "translate(locale, 'dynamic.cliUsageCompleteTask', customTranslations)"],
  [/isPl \? `Błąd: Zadanie o ID "\$\{tId\}" nie znalezione.` : `Error: Task with ID "\$\{tId\}" not found.`/g, "`\${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} \${tId}`"],
  [/isPl \? `Zadanie ID "\$\{tId\}" zostało przełączone \(ukończone\/nieukończone\).` : `Task with ID "\$\{tId\}" toggled successfully.`/g, "`\${translate(locale, 'dynamic.cliTaskToggled', customTranslations)}: \${tId}`"],
  [/isPl \? 'Baza SQLite: Brak zarejestrowanych sesji pomiarowych.' : 'SQLite database: No logged time sessions found.'/g, "translate(locale, 'dynamic.cliNoLogsFound', customTranslations)"],
  [/isPl \? '│ ID   │ PRJ ID │ ROZPOCZĘTO │ STATUS   │ CZAS TRWANIA           │' : '│ ID   │ PRJ ID │ STARTED AT │ STATE    │ DURATION               │'/g, "translate(locale, 'dynamic.cliLogsHeader', customTranslations)"],
  [/isPl \? 'Błąd: Niepoprawny format daty. Wymagany to YYYY-MM-DD \(np. 2026-06-15\).' : 'Error: Invalid date format. Must be YYYY-MM-DD.'/g, "translate(locale, 'dynamic.cliInvalidDateFormat', customTranslations)"],
  [/isPl \? 'Baza sqlite: Tabela świąt i urlopów jest pusta.' : 'SQLite database: holidays and leaves table is empty.'/g, "translate(locale, 'dynamic.cliNoHolidays', customTranslations)"],
  [/isPl \? '│  ID  │ DATA       │ TYP         │ NAZWA \(ŚWIĘTO \/ URLOP\)         │' : '│  ID  │ DATE       │ TYPE        │ NAME \(HOLIDAY \/ VACATION\)      │'/g, "translate(locale, 'dynamic.cliHolidaysHeader', customTranslations)"],
  [/isPl \? `Informacja: Brak logów czasowych dla okresu: \$\{period\}.` : `Info: No logging entries found for period: \$\{period\}.`/g, "`\${translate(locale, 'dynamic.cliNoLogsPeriod', customTranslations)} \${period}`"],
  [/isPl \? '--- ZWYKŁY WYPIS LOGÓW SYSTEMOWYCH ---' : '--- PLAIN LIST OF SQLITE LOGS ---'/g, "translate(locale, 'dynamic.cliReportSysList', customTranslations)"],
  [/isPl \? '--- GRAFICZNY RAPORT PROJEKTÓW \(ASCII CHART\) ---' : '--- GRAPHICAL ACTIVE PROJECTS REPRESENTATION \(ASCII\) ---'/g, "translate(locale, 'dynamic.cliReportGraph', customTranslations)"]
];

for (const [rgx, str] of replacements) {
  content = content.replace(rgx, str);
}

// Handle some composed strings
content = content.replace(
  /\`================ \$\{isPl \? 'RAPORT CZASOWY: ' : 'TIME DURATION REPORT: '\}\$\{period\.toUpperCase\(\)\} \(Sort: \$\{sortBy\}\) ================\`/g,
  "`================ ${translate(locale, 'dynamic.cliReportTimeHeader', customTranslations)}: ${period.toUpperCase()} (Sort: ${sortBy}) ================`"
);

fs.writeFileSync('src/components/CliInterface.tsx', content);

// TesterAndHelperWizard.tsx
let testerContent = fs.readFileSync('src/components/TesterAndHelperWizard.tsx', 'utf8');
testerContent = testerContent.replace(/{locale === 'pl' \? 'Wybierz system operacyjny targetu:' : 'Select Target Operating System:'}/g, "Select Target Operating System:");

testerContent = testerContent.replace(/Wybierz dowolny z systemowych kluczy wyświetlania poniżej i wpisz własną frazę\. Zostanie ona natychmiast zaaplikowana, kiedy wybierzesz opcję <strong className="text-orange-500">✨ MY CUSTOM<\/strong> w menu u góry./g, 
  "Select a system translation key from below and override it. Switch locale to 'Custom' above to see the changes actively applying.");
testerContent = testerContent.replace(/\? 'Wybierz język, przeprowadź audyt testów QA lub zapoznaj się z przewodnikiem kompilacji Tauri\.'\s*: 'Select language, conduct QA test audits, or get the Tauri compilation guide.'/g,
  "Select language, conduct QA test audits, or get the Tauri compilation guide.");

fs.writeFileSync('src/components/TesterAndHelperWizard.tsx', testerContent);
