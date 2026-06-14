const fs = require('fs');

const { en } = require('./en_out.cjs');

// Deep clone
const getBase = () => JSON.parse(JSON.stringify(en));

const translations = {
  'es': {
    gui: {
      newProject: "Nuevo Proyecto",
      addTask: "Agregar Tarea",
      addSubtask: "Agregar Subtarea",
      projectName: "Nombre del Proyecto",
      dashboardTitle: "Panel de Control",
      tasksAndSubtasks: "Tareas y Subtareas",
      projectTotalTime: "Tiempo Total del Proyecto",
      activeTracker: "Rastreadores Activos",
      stopAllThreads: "Suspender todo el rastreo",
      selectProject: "Seleccionar proyecto",
      noTasksInProject: "Aún no hay tareas en este proyecto. ¡Agrega algunas abajo!",
      taskName: "Nombre de la Tarea",
      addSubtaskTitle: "Añadir Nueva Subtarea",
      addNewProject: "Añadir Nuevo Proyecto",
      enterProjectName: "Ingresar nombre del proyecto",
      chooseProjectColor: "Elegir color de acento",
      enterMainTaskName: "Ingresar nombre de la tarea principal",
      subtaskLabel: "Subtarea",
      counterLabel: "Contador",
      inProgressLabel: "En Curso",
      holidaysAndLeaves: "Vacaciones y Días Libres",
      addHolidayLeave: "Añadir día libre/vacación",
      reportsTitle: "Registro de Informes",
      periodReport: "Informe Periódico",
      createdAt: "Creado el",
      color: "Color",
      status: "Estado",
      actions: "Acciones"
    },
    engine: {
      configTitle: "Opciones del Motor y Daemons",
      configDesc: "Configuraciones avanzadas del motor microORM OxyFlow.",
      autoStart: "Iniciar al arrancar el sistema",
      autoPauseOnSleep: "Pausar automáticamente con la suspensión",
      minimizeToTrayDefault: "Minimizar a la bandeja al cerrar",
      includePatchesInReports: "Incluir parches de tiempo en resúmenes",
      searching: "Buscando instancia activa del motor OxyFlow...",
      connecting: "Conectando a la base de datos sqlite3 y analizando...",
      connected: "Conectado al Daemon OxyFlow",
      synced: "Motor sincronizado",
      threads: "hilos de seguimiento (ejecución simultánea).",
      minimizeToTray: "Minimizar a la bandeja",
      sqlReset: "Restablecer base de datos (SQL Reset)"
    },
    tests: {
      testsTitle: "Panel de Pruebas Unitarias (Verificación del motor Rust)",
      runMockTests: "Ejecutar pruebas de integración SQLite y Tauri"
    },
    help: {
      howToCompileTitle: "Compilación y Soporte",
      helpAndDocumentation: "Centro de Ayuda y Documentación",
      compileWizard: "Guía paso a paso de compilación"
    },
    manual: {
      osSelected: "Compilación del SO seleccionada",
      title: "Manual de Compilación, Atajos y Arq.",
      description: "Guía para compilar binarios y resumen de atajos y daemons.",
      compilationTitle: "I. Compilar el Instalador (CLI Tauri)",
      step1: "Asegúrate de instalar Node.js y el gestor de paquetes",
      step2: "Instala las herramientas de compilación de Rust",
      step3: "Ingresa a la carpeta principal e instala los paquetes:",
      step4: "Inicia el proceso de producción. Tauri compilará el JS y luego el binario Rust:",
      step5: "¡Instalador listo! Lo encontrarás en:",
      shortcutsTitle: "II. Atajos de teclado y Daemon",
      shortcutsDesc: "OxyFlow se basa en un daemon Tauri, el motor C++ y SQLite seguirán funcionando.",
      shortcutToggleInterface: "Alternar interfaz (Minimizar)",
      shortcutGlobalReturn: "Restauración rápida global",
      shortcutEmergencyStop: "Parada de emergencia",
      shortcutToggleTimer: "Iniciar / Detener temporizador",
      shortcutSystemCli: "CLI a nivel de sistema"
    },
    credits: {
      description: "Licencia, términos e información del desarrollador.",
      zoukBody: "Creado para funcionar como un asistente de tiempo sin interrupciones."
    },
    app: {
      guiClosedTitle: "Interfaz Cerrada",
      guiClosedDesc: "El motor sigue ejecutándose en segundo plano (~8MB).",
      restartGui: "Reiniciar Cliente",
      maximizeRestore: "Interfaz maximizada.",
      stoppedThreads: "Seguimiento suspendido en SQLite.",
      sizeChanged: "Tamaño modificado a:",
      sizeSmall: "Pequeño",
      sizeMedium: "Mediano",
      sizeLarge: "Grande",
      closeToTray: "Cerrar en la bandeja",
      minimizeToTray: "Minimizar a la bandeja",
      fullScreen: "Pantalla completa",
      searchingPid: "buscando...",
      searchingEngine: "🔍 BUSCANDO MOTOR...",
      activeEngine: "✔️ ACTIVO (SQLite)",
      subtitle: "Motor Rust y SQLite • Soporte para múltiples proyectos",
      themeDark: "Oscuro",
      themeLight: "Claro",
      themeHighContrast: "Alto",
      themeSystem: "Sis",
      noTaskSelected: "Seleccione una tarea primero para iniciar."
    }
  },
  'fr': {
    gui: {
      newProject: "Nouveau Projet",
      addTask: "Ajouter une Tâche",
      addSubtask: "Ajouter une Sous-tâche",
      projectName: "Nom du Projet",
      dashboardTitle: "Tableau de Bord",
      tasksAndSubtasks: "Tâches & Sous-tâches",
      projectTotalTime: "Temps Total du Projet",
      activeTracker: "Traqueurs Actifs",
      stopAllThreads: "Suspendre tout le suivi",
      selectProject: "Sélectionner un projet",
      noTasksInProject: "Pas encore de tâches dans ce projet. Ajoutez-en ci-dessous !",
      taskName: "Nom de la tâche",
      addSubtaskTitle: "Ajouter une nouvelle sous-tâche",
      addNewProject: "Ajouter un nouveau projet",
      enterProjectName: "Entrez le nom du projet",
      chooseProjectColor: "Choisissez la couleur du projet",
      enterMainTaskName: "Entrez le nom de la tâche",
      subtaskLabel: "Sous-tâche",
      counterLabel: "Compteur",
      inProgressLabel: "En Cours",
      holidaysAndLeaves: "Vacances & Congés",
      addHolidayLeave: "Ajouter un congé",
      reportsTitle: "Journalisation des Rapports",
      periodReport: "Rapport Périodique",
      createdAt: "Créé le",
      color: "Couleur",
      status: "Statut",
      actions: "Actions"
    },
    engine: {
      configTitle: "Options du Moteur & Démons",
      configDesc: "Paramètres avancés du moteur microORM.",
      autoStart: "Démarrer avec le système",
      autoPauseOnSleep: "Mettre en pause avec la mise en veille",
      minimizeToTrayDefault: "Minimiser dans la barre en fermant",
      includePatchesInReports: "Inclure les correctifs dans les résumés",
      searching: "Recherche de l'instance du moteur...",
      connecting: "Connexion à sqlite3 et analyse...",
      connected: "Connecté au Démon OxyFlow",
      synced: "Moteur synchronisé",
      threads: "processus en parallèle (projets en cours).",
      minimizeToTray: "Minimiser dans la barre",
      sqlReset: "Réinitialiser la base (SQL Reset)"
    },
    tests: {
      testsTitle: "Panneau de Tests Unitaires",
      runMockTests: "Exécuter les tests d'intégration"
    },
    help: {
      howToCompileTitle: "Compilation & Support",
      helpAndDocumentation: "Centre d'Aide & Docs",
      compileWizard: "Guide de compilation étape par étape"
    },
    manual: {
      osSelected: "OS de compilation sélectionné",
      title: "Manuel de Compilation et Raccourcis",
      description: "Guide pour compiler les binaires et raccourcis du démon.",
      compilationTitle: "I. Construire l'Installateur (Tauri CLI)",
      step1: "Assurez-vous d'installer Node.js",
      step2: "Installez les outils de compilation Rust",
      step3: "Allez dans le répertoire racine et installez les paquets :",
      step4: "Démarrez la compilation. Tauri compilera le framework JS et le binaire :",
      step5: "Installateur prêt ! Vous le trouverez :",
      shortcutsTitle: "II. Raccourcis et Démon Serveur",
      shortcutsDesc: "OxyFlow utilise un démon, donc le moteur SQLite ne s'arrête pas avec l'interface.",
      shortcutToggleInterface: "Basculer l'interface (Minimiser)",
      shortcutGlobalReturn: "Restauration rapide globale",
      shortcutEmergencyStop: "Arrêt d'urgence des chronomètres",
      shortcutToggleTimer: "Démarrer / Arrêter",
      shortcutSystemCli: "CLI Système"
    },
    credits: {
      description: "Licence, termes et biographie du développeur.",
      zoukBody: "Système créé pour être un assistant en arrière-plan sans perturber le flux."
    },
    app: {
      guiClosedTitle: "Interface Fermée",
      guiClosedDesc: "Le moteur continue de fonctionner en arrière-plan (~8Mo RAM).",
      restartGui: "Redémarrer le Client",
      maximizeRestore: "Interface maximisée.",
      stoppedThreads: "Les suivis ont été suspendus.",
      sizeChanged: "Taille de l'interface modifiée :",
      sizeSmall: "Petit",
      sizeMedium: "Moyen",
      sizeLarge: "Grand",
      closeToTray: "Fermer dans la barre",
      minimizeToTray: "Minimiser dans la barre",
      fullScreen: "Plein écran",
      searchingPid: "recherche...",
      searchingEngine: "🔍 RECHERCHE DU MOTEUR...",
      activeEngine: "✔️ ACTIF (SQLite)",
      subtitle: "Moteur Rust & SQLite • Support de multiples projets",
      themeDark: "Sombre",
      themeLight: "Clair",
      themeHighContrast: "Contraste",
      themeSystem: "Sys",
      noTaskSelected: "Veuillez sélectionner une tâche pour démarrer."
    }
  },
  'pt-br': {
    gui: {
      newProject: "Novo Projeto",
      addTask: "Adicionar Tarefa",
      addSubtask: "Adicionar Subtarefa",
      projectName: "Nome do Projeto",
      dashboardTitle: "Painel de Controle",
      tasksAndSubtasks: "Tarefas & Subtarefas",
      projectTotalTime: "Tempo Total do Projeto",
      activeTracker: "Rastreadores Ativos",
      stopAllThreads: "Suspender todo o rastreamento",
      selectProject: "Selecionar projeto",
      noTasksInProject: "Ainda não há tarefas neste projeto. Adicione-as abaixo!",
      taskName: "Nome da Tarefa",
      addSubtaskTitle: "Adicionar Nova Subtarefa",
      addNewProject: "Adicionar Novo Projeto",
      enterProjectName: "Digite o nome do projeto",
      chooseProjectColor: "Escolha a cor do projeto",
      enterMainTaskName: "Digite o nome da tarefa principal",
      subtaskLabel: "Subtarefa",
      counterLabel: "Contador",
      inProgressLabel: "Em Progresso",
      holidaysAndLeaves: "Feriados & Férias",
      addHolidayLeave: "Adicionar folga/férias",
      reportsTitle: "Registro de Relatórios",
      periodReport: "Relatório Periódico",
      createdAt: "Criado em",
      color: "Cor",
      status: "Status",
      actions: "Ações"
    },
    engine: {
      configTitle: "Opções do Motor e Daemons",
      configDesc: "Configurações avançadas do motor microORM.",
      autoStart: "Iniciar ao iniciar o sistema",
      autoPauseOnSleep: "Pausar rastreadores na suspensão",
      minimizeToTrayDefault: "Minimizar para a bandeja ao fechar",
      includePatchesInReports: "Incluir correções de tempo nos relatórios",
      searching: "Procurando instância ativa do motor...",
      connecting: "Conectando ao banco sqlite3 e analisando...",
      connected: "Conectado ao Daemon OxyFlow",
      synced: "Motor sincronizado",
      threads: "processos de rastreamento (projetos simultâneos).",
      minimizeToTray: "Minimizar para a bandeja",
      sqlReset: "Redefinir Banco de Dados (SQL Reset)"
    },
    tests: {
      testsTitle: "Painel de Testes Unitários",
      runMockTests: "Rodar testes de integração SQLite & Tauri"
    },
    help: {
      howToCompileTitle: "Compilação & Suporte",
      helpAndDocumentation: "Central de Ajuda e Documentos",
      compileWizard: "Guia de compilação passo a passo"
    },
    manual: {
      osSelected: "SO de compilação selecionado",
      title: "Manual de Compilação e Atalhos",
      description: "Guia para compilar os binários e resumo de atalhos e daemons.",
      compilationTitle: "I. Compilar o Instalador (Tauri CLI)",
      step1: "Certifique-se de instalar o Node.js e o gerenciador de pacotes",
      step2: "Instale as ferramentas de compilação do Rust",
      step3: "Vá para a pasta raiz e instale os pacotes:",
      step4: "Inicie a compilação. Tauri vai compilar o JS e o binário:",
      step5: "Instalador pronto! Você o encontrará em:',",
      shortcutsTitle: "II. Atalhos e Daemon na Bandeja do Sistema",
      shortcutsDesc: "O OxyFlow é executado via daemon, o que significa que o SQLite não morre quando a interface é fechada.",
      shortcutToggleInterface: "Alternar interface (Minimizar)",
      shortcutGlobalReturn: "Restauração global rápida",
      shortcutEmergencyStop: "Parada de emergência dos tempos",
      shortcutToggleTimer: "Iniciar / Parar temporizador",
      shortcutSystemCli: "CLI de Sistema"
    },
    credits: {
      description: "Licença, termos de serviço e biografia.",
      zoukBody: "Sistema construído para mesclar perfeitamente CLI em background e um estado visual responsivo."
    },
    app: {
      guiClosedTitle: "Interface Fechada",
      guiClosedDesc: "O motor Rust & SQLite continua rodando no fundo (~8MB RAM).",
      restartGui: "Reiniciar Cliente Visual",
      maximizeRestore: "Interface maximizada.",
      stoppedThreads: "O rastreamento foi suspenso no SQLite.",
      sizeChanged: "Tamanho alterado para:",
      sizeSmall: "Pequeno",
      sizeMedium: "Médio",
      sizeLarge: "Grande",
      closeToTray: "Fechar na Bandeja",
      minimizeToTray: "Minimizar para a bandeja",
      fullScreen: "Tela Cheia",
      searchingPid: "pesquisando...",
      searchingEngine: "🔍 BUSCANDO MOTOR...",
      activeEngine: "✔️ ATIVO (SQLite)",
      subtitle: "Motor Rust e SQLite • Suporte a múltiplos projetos",
      themeDark: "Escuro",
      themeLight: "Claro",
      themeHighContrast: "Alto",
      themeSystem: "Sis",
      noTaskSelected: "Selecione uma tarefa antes de iniciar o contador."
    }
  }
};

const fileMap = {
    'es': 'src/utils/i18n/es.ts',
    'fr': 'src/utils/i18n/fr.ts',
    'pt-br': 'src/utils/i18n/pt-br.ts',
};

const camelCaseVariable = {
    'es': 'es',
    'fr': 'fr',
    'pt-br': 'ptBr'
};

for (const lang of Object.keys(translations)) {
    const outName = `./${lang.replace('-','')}` + '_out.cjs';
    const existing = require(outName)[camelCaseVariable[lang]];
    // start with base
    const full = getBase();
    
    // overwrite with existing existing keys if they exist
    for (const key of Object.keys(full)) {
        if (existing[key]) {
            Object.assign(full[key], existing[key]);
        }
    }
    
    // apply our fresh translated blocks
    for (const key of Object.keys(translations[lang])) {
        if (!full[key]) full[key] = {};
        Object.assign(full[key], translations[lang][key]);
    }
    
    // Convert generic language string
    const stringified = JSON.stringify(full, null, 2);
    const content = `export const ${camelCaseVariable[lang]} = ${stringified};\n`;
    fs.writeFileSync(fileMap[lang], content);
    console.log(`Updated ${lang}`);
}
