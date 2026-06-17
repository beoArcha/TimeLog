export type LocaleType = 'pl' | 'en' | 'de' | 'es' | 'pt-br' | 'fr' | 'custom' | 'system';

export interface TranslationDictionary {
  guiInterface: string;
  cliInterface: string;
  rustSource: string;
  searchingEngine: string;
  connectingSqlite: string;
  connectedDaemon: string;
  engineSynced: string;
  parallelThreads: string;
  minimizeToTray: string;
  sqlReset: string;
  newProject: string;
  addTask: string;
  addSubtask: string;
  projectName: string;
  dashboardTitle: string;
  tasksAndSubtasks: string;
  projectTotalTime: string;
  activeTracker: string;
  stopAllThreads: string;
  selectProject: string;
  noTasksInProject: string;
  cancel: string;
  save: string;
  taskName: string;
  addSubtaskTitle: string;
  addNewProject: string;
  enterProjectName: string;
  chooseProjectColor: string;
  enterMainTaskName: string;
  subtaskLabel: string;
  counterLabel: string;
  inProgressLabel: string;
  clearDatabaseConfirm: string;
  addLanguage: string;
  customLanguageTitle: string;
  customLanguageKey: string;
  keyLabel: string;
  valueLabel: string;
  saveCustomTranslation: string;
  testsTitle: string;
  runMockTests: string;
  howToCompileTitle: string;
  helpAndDocumentation: string;
  compileWizard: string;
  holidaysAndLeaves: string;
  addHolidayLeave: string;
  reportsTitle: string;
  periodReport: string;
}

export const defaultTranslations: Record<string, TranslationDictionary> = {
  pl: {
    guiInterface: 'Interfejs GUI',
    cliInterface: 'Konsola CLI',
    rustSource: 'Źródła RUST',
    searchingEngine: 'Szukanie aktywnej instancji silnika LogTime by OxyFlow...',
    connectingSqlite: 'Łączenie z bazą sqlite3 i analizowanie rozpoczętych wierszy logs.',
    connectedDaemon: 'Połączono z daemonem LogTime by OxyFlow',
    engineSynced: 'Silnik zsynchronizował',
    parallelThreads: 'równoległych wątków pomiaru (projekty działają równolegle).',
    minimizeToTray: 'Zgłoś do zasobnika (tray)',
    sqlReset: 'Wyczyść Bazę (SQL Reset)',
    newProject: 'Nowy Projekt',
    addTask: 'Dodaj zadanie',
    addSubtask: 'Dodaj podzadanie',
    projectName: 'Nazwa projektu',
    dashboardTitle: 'Pulpit Nawigacyjny',
    tasksAndSubtasks: 'Zadania i Podzadania',
    projectTotalTime: 'Suma czasu projektu',
    activeTracker: 'Aktywne Pomiaru',
    stopAllThreads: 'Wstrzymaj wszystkie procesy',
    selectProject: 'Wybierz projekt',
    noTasksInProject: 'Brak zadań w tym projekcie. Dodaj nowe poniżej!',
    cancel: 'Anuluj',
    save: 'Zapisz',
    taskName: 'Nazwa zadania',
    addSubtaskTitle: 'Dodaj nowe podzadanie',
    addNewProject: 'Dodaj nowy projekt',
    enterProjectName: 'Wpisz nazwę projektu',
    chooseProjectColor: 'Wybierz podświetlenie projektu',
    enterMainTaskName: 'Wpisz nazwę głównego zadania',
    subtaskLabel: 'Podzadanie',
    counterLabel: 'Licznik',
    inProgressLabel: 'W toku',
    clearDatabaseConfirm: 'Czy na pewno chcesz zresetować całą bazę danych SQLite? Wszystkie wpisy zostaną usunięte.',
    addLanguage: 'Własne Tłumaczenie',
    customLanguageTitle: 'Dodaj własny język lub zmodyfikuj klucze',
    customLanguageKey: 'Klucz tłumaczenia',
    keyLabel: 'Klucz systemowy',
    valueLabel: 'Twoje tłumaczenie',
    saveCustomTranslation: 'Zapisz i aktywuj własny zestaw',
    testsTitle: 'Panel Testów Jednostkowych (Rust-Engine QA)',
    runMockTests: 'Uruchom testy integracji SQLite & Tauri',
    howToCompileTitle: 'Kompilacja i Pomoc (Tauri Wizard)',
    helpAndDocumentation: 'Dokumentacja & Wsparcie',
    compileWizard: 'Kreator kompilacji krok po kroku',
    holidaysAndLeaves: 'Święta i Urlopy',
    addHolidayLeave: 'Dodaj święto/urlop',
    reportsTitle: 'Dziennik Raportów',
    periodReport: 'Raport okresowy'
  },
  en: {
    guiInterface: 'GUI Interface',
    cliInterface: 'CLI Console',
    rustSource: 'RUST Codebase',
    searchingEngine: 'Searching for active LogTime by OxyFlow engine instance...',
    connectingSqlite: 'Connecting to sqlite3 database and analyzing active log rows.',
    connectedDaemon: 'Connected to LogTime by OxyFlow Daemon',
    engineSynced: 'Engine synchronized',
    parallelThreads: 'parallel tracking threads (projects run concurrently).',
    minimizeToTray: 'Minimize to tray',
    sqlReset: 'Reset Database (SQL Reset)',
    newProject: 'New Project',
    addTask: 'Add Task',
    addSubtask: 'Add Subtask',
    projectName: 'Project Name',
    dashboardTitle: 'Dashboard Control Panel',
    tasksAndSubtasks: 'Tasks & Subtasks',
    projectTotalTime: 'Project Total Time',
    activeTracker: 'Active Trackers',
    stopAllThreads: 'Suspend all tracking',
    selectProject: 'Select project',
    noTasksInProject: 'No tasks in this project yet. Add some below!',
    cancel: 'Cancel',
    save: 'Save',
    taskName: 'Task Name',
    addSubtaskTitle: 'Add New Subtask',
    addNewProject: 'Add New Project',
    enterProjectName: 'Enter project name',
    chooseProjectColor: 'Choose project accent color',
    enterMainTaskName: 'Enter main task name',
    subtaskLabel: 'Subtask',
    counterLabel: 'Counter',
    inProgressLabel: 'In Progress',
    clearDatabaseConfirm: 'Are you sure you want to completely clear the SQLite local database? All sessions will be purged.',
    addLanguage: 'Custom Translations',
    customLanguageTitle: 'Create custom translations or tweak keys',
    customLanguageKey: 'Translation Key',
    keyLabel: 'System Key',
    valueLabel: 'Your translation value',
    saveCustomTranslation: 'Activate custom dictionary',
    testsTitle: 'QA Unit Tests Panel (Rust-Engine Verification)',
    runMockTests: 'Run SQLite & Tauri integration tests',
    howToCompileTitle: 'Compilation & Support (Tauri Wizard)',
    helpAndDocumentation: 'Docs & Help Center',
    compileWizard: 'Step-by-step compilation guide',
    holidaysAndLeaves: 'Holidays & Vacations',
    addHolidayLeave: 'Add holiday/leave',
    reportsTitle: 'Reports Logging',
    periodReport: 'Periodical report'
  },
  de: {
    guiInterface: 'GUI-Schnittstelle',
    cliInterface: 'CLI-Konsole',
    rustSource: 'RUST-Quellcode',
    searchingEngine: 'Suchen nach aktiver LogTime by OxyFlow-Engine-Instanz...',
    connectingSqlite: 'Herstellen einer Verbindung zur sqlite3-Datenbank und Analysieren aktiver Protokollzeilen.',
    connectedDaemon: 'Mit LogTime by OxyFlow-Daemon verbunden',
    engineSynced: 'Die Engine hat synchronisiert',
    parallelThreads: 'parallele Tracking-Threads (Projekte laufen gleichzeitig).',
    minimizeToTray: 'In System-Tray minimieren',
    sqlReset: 'Datenbank zurücksetzen (SQL-Reset)',
    newProject: 'Neues Projekt',
    addTask: 'Aufgabe hinzufügen',
    addSubtask: 'Unteraufgabe hinzufügen',
    projectName: 'Projektname',
    dashboardTitle: 'Dashboard-Kontrollpanel',
    tasksAndSubtasks: 'Aufgaben & Unteraufgaben',
    projectTotalTime: 'Gesamtzeit des Projekts',
    activeTracker: 'Aktive Tracker',
    stopAllThreads: 'Alle tracking-Prozesse stoppen',
    selectProject: 'Projekt auswählen',
    noTasksInProject: 'Noch keine Aufgaben in diesem Projekt. Fügen Sie unten welche hinzu!',
    cancel: 'Abbrechen',
    save: 'Speichern',
    taskName: 'Aufgabenname',
    addSubtaskTitle: 'Neue Unteraufgabe hinzufügen',
    addNewProject: 'Neues Projekt hinzufügen',
    enterProjectName: 'Projektname eingeben',
    chooseProjectColor: 'Projekt-Akzentfarbe auswählen',
    enterMainTaskName: 'Hauptaufgabennamen eingeben',
    subtaskLabel: 'Unteraufgabe',
    counterLabel: 'Zähler',
    inProgressLabel: 'Laufend',
    clearDatabaseConfirm: 'Sind Sie sicher, dass Sie die lokale SQLite-Datenbank vollständig löschen möchten? Alle Sitzungen werden gelöscht.',
    addLanguage: 'Eigene Übersetzung',
    customLanguageTitle: 'Eigene Übersetzung erstellen oder Schlüssel anpassen',
    customLanguageKey: 'Übersetzungsschlüssel',
    keyLabel: 'Systemschlüssel',
    valueLabel: 'Ihre Übersetzung',
    saveCustomTranslation: 'Eigene Übersetzung aktivieren',
    testsTitle: 'QS-Unit-Tests-Panel (Verifizierung der Rust-Engine)',
    runMockTests: 'SQLite- und Tauri-Integrations-Tests ausführen',
    howToCompileTitle: 'Kompilierung & Support (Tauri-Assistent)',
    helpAndDocumentation: 'Dokumentation & Hilfe',
    compileWizard: 'Schritt-für-Schritt Compiler-Anleitung',
    holidaysAndLeaves: 'Feiertage & Urlaub',
    addHolidayLeave: 'Feiertag/Urlaub hinzufügen',
    reportsTitle: 'Berichte & Protokolle',
    periodReport: 'Periodischer Bericht'
  },
  es: {
    guiInterface: 'Interfaz GUI',
    cliInterface: 'Consola CLI',
    rustSource: 'Código RUST',
    searchingEngine: 'Buscando instancia activa del motor LogTime by OxyFlow...',
    connectingSqlite: 'Conectando a la base de datos sqlite3 y analizando registros activos.',
    connectedDaemon: 'Conectado al demonio LogTime by OxyFlow',
    engineSynced: 'El motor se encuentra sincronizado con',
    parallelThreads: 'hilos de seguimiento paralelos (los proyectos corren concurrentemente).',
    minimizeToTray: 'Minimizar a la bandeja del sistema',
    sqlReset: 'Restablecer base de datos (SQL Reset)',
    newProject: 'Nuevo Proyecto',
    addTask: 'Añadir tarea',
    addSubtask: 'Añadir subtarea',
    projectName: 'Nombre del Proyecto',
    dashboardTitle: 'Panel de Control Principal',
    tasksAndSubtasks: 'Tareas y Subtareas',
    projectTotalTime: 'Tiempo Total del Proyecto',
    activeTracker: 'Seguimiento Activo',
    stopAllThreads: 'Suspender todo el seguimiento',
    selectProject: 'Seleccionar proyecto',
    noTasksInProject: '¡No hay tareas en este proyecto todavía! Añade algunas abajo.',
    cancel: 'Cancelar',
    save: 'Guardar',
    taskName: 'Nombre de la tarea',
    addSubtaskTitle: 'Añadir Nueva Subtarea',
    addNewProject: 'Añadir Nuevo Proyecto',
    enterProjectName: 'Escriba el nombre del proyecto',
    chooseProjectColor: 'Elija el color de acento del proyecto',
    enterMainTaskName: 'Escriba el nombre de la tarea principal',
    subtaskLabel: 'Subtarea',
    counterLabel: 'Contador',
    inProgressLabel: 'En curso',
    clearDatabaseConfirm: '¿Está seguro de que desea borrar por completo la base de datos local SQLite? Se eliminarán todas las sesiones.',
    addLanguage: 'Traducción Personalizada',
    customLanguageTitle: 'Crear traducciones personalizadas o ajustar claves',
    customLanguageKey: 'Clave de traducción',
    keyLabel: 'Clave del sistema',
    valueLabel: 'Tu valor de traducción',
    saveCustomTranslation: 'Activar diccionario personalizado',
    testsTitle: 'Panel de Pruebas Unitarias (Verificación del motor Rust)',
    runMockTests: 'Ejecutar pruebas de integración SQLite y Tauri',
    howToCompileTitle: 'Compilación y Soporte (Asistente de Tauri)',
    helpAndDocumentation: 'Documentación y Ayuda',
    compileWizard: 'Guía de compilación paso a paso',
    holidaysAndLeaves: 'Días Festivos y Vacaciones',
    addHolidayLeave: 'Añadir festivo/vacaciones',
    reportsTitle: 'Panel de Informes',
    periodReport: 'Informe periódico'
  },
  'pt-br': {
    guiInterface: 'Interface GUI',
    cliInterface: 'Console CLI',
    rustSource: 'Código Fonte RUST',
    searchingEngine: 'Buscando instância ativa do motor LogTime by OxyFlow...',
    connectingSqlite: 'Conectando ao banco de dados sqlite3 e analisando as linhas ativas de registro.',
    connectedDaemon: 'Conectado ao daemon LogTime by OxyFlow',
    engineSynced: 'O motor sincronizou',
    parallelThreads: 'threads de rastreamento paralelas (projetos rodam simultaneamente).',
    minimizeToTray: 'Minimizar para a bandeja (tray)',
    sqlReset: 'Limpar Banco de Dados (SQL Reset)',
    newProject: 'Novo Projeto',
    addTask: 'Adicionar Tarefa',
    addSubtask: 'Adicionar Subtarefa',
    projectName: 'Nome do Projeto',
    dashboardTitle: 'Painel de Controle',
    tasksAndSubtasks: 'Tarefas e Subtarefas',
    projectTotalTime: 'Tempo Total do Projeto',
    activeTracker: 'Rastreadores Ativos',
    stopAllThreads: 'Suspender todo o monitoramento',
    selectProject: 'Selecionar projeto',
    noTasksInProject: 'Nenhuma tarefa neste projeto ainda. Adicione algumas abaixo!',
    cancel: 'Cancelar',
    save: 'Salvar',
    taskName: 'Nome da Tarefa',
    addSubtaskTitle: 'Adicionar Nova Subtarefa',
    addNewProject: 'Adicionar Novo Projeto',
    enterProjectName: 'Digite o nome do projeto',
    chooseProjectColor: 'Escolha a cor de destaque do projeto',
    enterMainTaskName: 'Digite o nome da tarefa principal',
    subtaskLabel: 'Subtarefa',
    counterLabel: 'Contador',
    inProgressLabel: 'Em andamento',
    clearDatabaseConfirm: 'Tem certeza de que deseja limpar completamente o banco de dados SQLite local? Todas as sessões serão apagadas.',
    addLanguage: 'Tradução Personalizada',
    customLanguageTitle: 'Criar traduções personalizadas ou ajustar chaves',
    customLanguageKey: 'Chave de tradução',
    keyLabel: 'Chave do sistema',
    valueLabel: 'Sua tradução',
    saveCustomTranslation: 'Ativar dicionário personalizado',
    testsTitle: 'Painel de Testes Unitários de Controle de Qualidade (Verificação do motor Rust)',
    runMockTests: 'Executar testes de integração SQLite e Tauri',
    howToCompileTitle: 'Compilação & Suporte (Assistente Tauri)',
    helpAndDocumentation: 'Documentação e Central de Ajuda',
    compileWizard: 'Guia de compilação passo a passo',
    holidaysAndLeaves: 'Feriados & Férias',
    addHolidayLeave: 'Adicionar feriado/férias',
    reportsTitle: 'Relatórios de Período',
    periodReport: 'Relatório periódico'
  }
};

export const getTranslation = (
  locale: LocaleType,
  key: keyof TranslationDictionary,
  customDict?: Partial<TranslationDictionary>
): string => {
  if (locale === 'custom') {
    return customDict?.[key] || defaultTranslations['en'][key];
  }
  return defaultTranslations[locale]?.[key] || defaultTranslations['en'][key];
};
