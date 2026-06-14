const fs = require('fs');

const languages = ['en', 'pl', 'de', 'es', 'fr', 'pt-br'];

const newKeys = {
  pl: {
    'settings.title': 'Ustawienia Systemowe i Języki (Dictionary Matrix Options)',
    'settings.description': 'Konfiguruj parametry silnika czasu, motywy interfejsu oraz modyfikuj słownik translacji.',
    'settings.resetSuccess': 'Baza wyczyszczona pomyślnie. (SQL DELETE ALL)',
    'settings.resetCancel': 'Anulowano reset - błędne potwierdzenie.',
    'settings.hardResetDesc': 'Twardy reset bazy MicroORM do stanu fabrycznego. Wszystkie zadania i rejestry czasu zostaną usunięte bezpowrotnie!',
    'settings.hardResetBtn': 'FORMAT: Reset Bazy Danych',
    'settings.holidaysTitle': 'Urlopy i dni wolne',
    'themes.lightDesc': 'Przejrzysty, minimalistyczny',
    'themes.darkDesc': 'Wysoki kontrast',
    'themes.highContrastDesc': 'Tryb terminala',
    'themes.systemDesc': 'Synchronizacja z OS',
    'engine.configTitle': 'Konfiguracja Silnika',
    'engine.configDesc': 'Skonfiguruj zachowanie silnika OxyFlow w tle, autostart oraz wybudzenia.',
    'engine.autoStart': 'Uruchamiaj aplikację ze startem systemu (AutoStart)',
    'engine.autoPauseOnSleep': 'Autopauza po uśpieniu i wznowieniu (patch_logs)',
    'engine.includePatchesInReports': 'Uwzględnij ręczne poprawki z patch_logs w raportach',
    'engine.minimizeToTrayDefault': 'Domyślnie minimalizuj do paska (Tray Daemon) zamiast zamykać okno',
    'engine.sqlReset': 'Reset bazy (SQL)'
  },
  en: {
    'settings.title': 'System Settings & Languages',
    'settings.description': 'Configure time engine parameters, interface themes, and modify translation dictionaries.',
    'settings.resetSuccess': 'Database successfully cleared. (SQL DELETE ALL)',
    'settings.resetCancel': 'Reset cancelled - invalid confirmation.',
    'settings.hardResetDesc': 'Hard reset of MicroORM database to factory defaults. All tasks and time logs will be irretrievably deleted!',
    'settings.hardResetBtn': 'FORMAT: Database Hard Reset',
    'settings.holidaysTitle': 'Holidays & Vacations',
    'themes.lightDesc': 'Clean, minimal',
    'themes.darkDesc': 'High contrast',
    'themes.highContrastDesc': 'Code mode',
    'themes.systemDesc': 'Auto-sync OS',
    'engine.configTitle': 'Engine Configuration',
    'engine.configDesc': 'Configure background OxyFlow engine behavior, auto-start, and wakeups.',
    'engine.autoStart': 'Run application on system startup (AutoStart)',
    'engine.autoPauseOnSleep': 'Auto-pause on sleep and resume (patch_logs)',
    'engine.includePatchesInReports': 'Include manual patches from patch_logs in time reports',
    'engine.minimizeToTrayDefault': 'Minimize to System Tray Daemon by default instead of closing GUI',
    'engine.sqlReset': 'Reset database (SQL)'
  },
  de: {
    'settings.title': 'Systemeinstellungen & Sprachen',
    'settings.description': 'Konfigurieren Sie Zeitmaschinenparameter, Oberflächendesigns und ändern Sie Übersetzungsverzeichnisse.',
    'settings.resetSuccess': 'Datenbank erfolgreich gelöscht. (SQL DELETE ALL)',
    'settings.resetCancel': 'Zurücksetzen abgebrochen - ungültige Bestätigung.',
    'settings.hardResetDesc': 'Harter Reset der MicroORM-Datenbank auf Werkseinstellungen. Alle Aufgaben und Zeitprotokolle werden gelöscht!',
    'settings.hardResetBtn': 'FORMAT: Datenbank-Hard-Reset',
    'settings.holidaysTitle': 'Urlaub & freie Tage',
    'themes.lightDesc': 'Klar, minimal',
    'themes.darkDesc': 'Hoher Kontrast',
    'themes.highContrastDesc': 'Terminalmodus',
    'themes.systemDesc': 'Auto-Sync OS',
    'engine.configTitle': 'Motor-Konfiguration',
    'engine.configDesc': 'Konfigurieren Sie das Verhalten der OxyFlow-Engine im Hintergrund, Autostart und Wakeups.',
    'engine.autoStart': 'Anwendung beim Systemstart ausführen (AutoStart)',
    'engine.autoPauseOnSleep': 'Auto-Pause bei Ruhezustand (patch_logs)',
    'engine.includePatchesInReports': 'Manuelle Patches aus patch_logs in Zeitberichten berücksichtigen',
    'engine.minimizeToTrayDefault': 'Standardmäßig in Taskleiste minimieren',
    'engine.sqlReset': 'Datenbank zurücksetzen'
  },
  es: {
    'settings.title': 'Configuración del sistema e idiomas',
    'settings.description': 'Configure los parámetros del motor de tiempo, los temas de la interfaz y los diccionarios.',
    'settings.resetSuccess': 'Base de datos borrada con éxito. (SQL DELETE ALL)',
    'settings.resetCancel': 'Restablecimiento cancelado.',
    'settings.hardResetDesc': 'Restablecimiento completo de la base de datos MicroORM. ¡Se eliminarán todas las tareas!',
    'settings.hardResetBtn': 'FORMATO: Restablecimiento completo',
    'settings.holidaysTitle': 'Vacaciones y días libres',
    'themes.lightDesc': 'Limpio, minimalista',
    'themes.darkDesc': 'Alto contraste',
    'themes.highContrastDesc': 'Modo terminal',
    'themes.systemDesc': 'Sincronizar SO',
    'engine.configTitle': 'Configuración del motor',
    'engine.configDesc': 'Configure el comportamiento del motor, inicio automático y reactivaciones.',
    'engine.autoStart': 'Ejecutar al inicio del sistema (AutoStart)',
    'engine.autoPauseOnSleep': 'Pausa automática al suspender (patch_logs)',
    'engine.includePatchesInReports': 'Incluir parches en informes de tiempo',
    'engine.minimizeToTrayDefault': 'Minimizar a la bandeja del sistema por defecto'
  },
  fr: {
    'settings.title': 'Paramètres système et langues',
    'settings.description': 'Configurez les paramètres du moteur de temps, les thèmes, et traductions.',
    'settings.resetSuccess': 'Base de données effacée avec succès. (SQL DELETE ALL)',
    'settings.resetCancel': 'Réinitialisation annulée.',
    'settings.hardResetDesc': 'Réinitialisation matérielle de base de données. Toutes les tâches seront supprimées!',
    'settings.hardResetBtn': 'FORMAT: Réinitialisation base',
    'settings.holidaysTitle': 'Vacances et jours fériés',
    'themes.lightDesc': 'Clair, minimaliste',
    'themes.darkDesc': 'Contraste élevé',
    'themes.highContrastDesc': 'Mode terminal',
    'themes.systemDesc': 'Synchro OS',
    'engine.configTitle': 'Configuration du moteur',
    'engine.configDesc': 'Configurez le comportement du moteur en arrière-plan, le démarrage...',
    'engine.autoStart': 'Exécuter au démarrage (AutoStart)',
    'engine.autoPauseOnSleep': 'Mise en pause auto (patch_logs)',
    'engine.includePatchesInReports': 'Inclure les correctifs manuels dans les rapports',
    'engine.minimizeToTrayDefault': 'Réduire dans la barre par défaut'
  },
  'pt-br': {
    'settings.title': 'Configurações do sistema',
    'settings.description': 'Configure os parâmetros do motor, temas e traduções.',
    'settings.resetSuccess': 'Banco de dados limpo. (SQL DELETE ALL)',
    'settings.resetCancel': 'Redefinição cancelada.',
    'settings.hardResetDesc': 'Redefinição completa. Todas as tarefas e registros de tempo serão excluídos!',
    'settings.hardResetBtn': 'FORMATO: Hard Reset',
    'settings.holidaysTitle': 'Férias e Feriados',
    'themes.lightDesc': 'Limpo, minimalista',
    'themes.darkDesc': 'Alto contraste',
    'themes.highContrastDesc': 'Modo terminal',
    'themes.systemDesc': 'Sincronizar OS',
    'engine.configTitle': 'Configuração do motor',
    'engine.configDesc': 'Configure o comportamento em segundo plano do motor OxyFlow.',
    'engine.autoStart': 'Executar ao iniciar o sistema',
    'engine.autoPauseOnSleep': 'Pausar automaticamente ao suspender (patch_logs)',
    'engine.includePatchesInReports': 'Incluir ajustes em relatórios',
    'engine.minimizeToTrayDefault': 'Minimizar para a bandeja nativamente'
  }
};

const flattenObj = (ob) => {
  let result = {};
  for (const i in ob) {
    if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
      const temp = flattenObj(ob[i]);
      for (const j in temp) result[i + '.' + j] = temp[j];
    } else result[i] = ob[i];
  }
  return result;
};

for (const lang of languages) {
  const filePath = "src/utils/i18n/" + lang + ".ts";
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const translationsToMerge = newKeys[lang] || newKeys['en'];
  
  for (const [keyPath, value] of Object.entries(translationsToMerge)) {
    const [sectionPart, ...keyParts] = keyPath.split('.');
    const section = sectionPart;
    const key = keyParts.join('.');
    
    // Quick regex to check if it's already in the section
    const hasSection = content.includes('"' + section + '":') || content.includes(' ' + section + ':');
    
    if (hasSection) {
      if (!content.includes('"' + key + '":') && !content.includes(' ' + key + ':')) {
        // Find section boundary and inject
        let regexToTarget = new RegExp('(\\\\"' + section + '\\\\"|\\\\b' + section + ')\\\\s*:\\\\s*\\\\{');
        content = content.replace(regexToTarget, "$1: {\\n    \"" + key + "\": " + JSON.stringify(value) + ",");
      }
    } else {
        // Create section!
        const val = JSON.stringify(value);
        const exportName = lang.replace('-', '_');
        content = content.replace('export const ' + exportName + ' = {', "export const " + exportName + " = {\\n  \"" + section + "\": {\\n    \"" + key + "\": " + val + "\\n  },");
    }
  }
  
  fs.writeFileSync(filePath, content);
}
console.log('patched');
