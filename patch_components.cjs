const fs = require('fs');
let fileContent = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

if (!fileContent.includes("import { translate }")) {
  fileContent = fileContent.replace(
    "import { TimeLog, Project, Task, VacationDay, TimePatch } from '../types';", 
    "import { TimeLog, Project, Task, VacationDay, TimePatch } from '../types';\nimport { translate } from '../utils/i18n';"
  );
}

// Add locale and customTranslations if not extracted
if (!fileContent.includes("locale, customTranslations")) {
  fileContent = fileContent.replace(
    "const { projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays, patches, setPatches, resolvedTheme } = useOxyFlow();",
    "const { projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays, patches, setPatches, resolvedTheme, locale, customTranslations } = useOxyFlow();"
  );
}

fileContent = fileContent.replace(/Brak poprawek/g, "{translate(locale, 'dynamic.noPatches', customTranslations)}");
fileContent = fileContent.replace(/Dodaj Log Ręcznie \(INSERT SQL\)/g, "{translate(locale, 'dynamic.addLogManually', customTranslations)}");
fileContent = fileContent.replace(/-- Wybierz zadanie --/g, "{translate(locale, 'dynamic.selectTask', customTranslations)}");
fileContent = fileContent.replace(/Brak notki/g, "{translate(locale, 'dynamic.noNote', customTranslations)}");
fileContent = fileContent.replace(/\+ Dodaj Wolne \(SQL INSERT\)/g, "{translate(locale, 'dynamic.addLeave', customTranslations)}");
fileContent = fileContent.replace(/Dodaj Ręczny Patch/g, "{translate(locale, 'dynamic.addManualPatch', customTranslations)}");
fileContent = fileContent.replace(/Brak łatek \(patch_logs\)\. Silnik operuje w standardowym trybie\./g, "{translate(locale, 'dynamic.noPatchesOperatingStandard', customTranslations)}");

fs.writeFileSync('src/components/DbExplorer.tsx', fileContent);

// ------ SmallGuiWidget.tsx ------
let smallContent = fs.readFileSync('src/components/SmallGuiWidget.tsx', 'utf8');
if (!smallContent.includes("import { translate }")) {
  smallContent = smallContent.replace("import { Play, Square, Settings, Minimize2, ListTodo, X } from 'lucide-react';", "import { Play, Square, Settings, Minimize2, ListTodo, X } from 'lucide-react';\nimport { translate } from '../utils/i18n';");
}
// locale and customTranslations are already present in line ~36?
if (!smallContent.includes("locale, customTranslations")) {
  smallContent = smallContent.replace(
    "const { activeLog, setActiveLog, projects, tasks, minimizeToTray, setMinimizeToTray, resolvedTheme } = useOxyFlow();",
    "const { activeLog, setActiveLog, projects, tasks, minimizeToTray, setMinimizeToTray, resolvedTheme, locale, customTranslations } = useOxyFlow();"
  );
}

smallContent = smallContent.replace(/Brak projektów\./g, "{translate(locale, 'dynamic.noProjects', customTranslations)}");
smallContent = smallContent.replace(/Brak zadań w tym profilu\./g, "{translate(locale, 'dynamic.noTasksInProfile', customTranslations)}");

fs.writeFileSync('src/components/SmallGuiWidget.tsx', smallContent);

// ------ GuiInterface.tsx ------
let guiContent = fs.readFileSync('src/components/GuiInterface.tsx', 'utf8');
guiContent = guiContent.replace(/Wybierz projekt/g, "{translate(locale, 'dynamic.selectProject', customTranslations)}");
fs.writeFileSync('src/components/GuiInterface.tsx', guiContent);

// ------ SettingsTab.tsx ------
let settingsContent = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');
if (!settingsContent.includes("import { translate }")) {
  settingsContent = settingsContent.replace("import { Trash2, AlertTriangle, Languages, PaintBucket } from 'lucide-react';", "import { Trash2, AlertTriangle, Languages, PaintBucket } from 'lucide-react';\nimport { translate } from '../utils/i18n';");
}
settingsContent = settingsContent.replace(
  /"UWAGA: Czy na pewno chcesz usunąć WSZYSTKIE logi, zadania i projekty\? Świąt nie usunięto\. Tej operacji nie można cofnąć! Wpisz 'reset' aby potwierdzić:"/,
  "translate(locale, 'dynamic.warningResetApp', customTranslations)"
);
fs.writeFileSync('src/components/SettingsTab.tsx', settingsContent);

// ------ TrayWidget.tsx ------
let trayContent = fs.readFileSync('src/components/TrayWidget.tsx', 'utf8');
if (!trayContent.includes("import { translate }")) {
  trayContent = trayContent.replace("import { Play, Square, Maximize2, Coffee } from 'lucide-react';", "import { Play, Square, Maximize2, Coffee } from 'lucide-react';\nimport { translate } from '../utils/i18n';");
}
if (!trayContent.includes("locale, customTranslations")) {
  trayContent = trayContent.replace(
    "const { activeLog, setActiveLog, projects, tasks, minimizeToTray, setMinimizeToTray, resolvedTheme, nowIso } = useOxyFlow();",
    "const { activeLog, setActiveLog, projects, tasks, minimizeToTray, setMinimizeToTray, resolvedTheme, nowIso, locale, customTranslations } = useOxyFlow();"
  );
}
trayContent = trayContent.replace(/Brak aktywnych timerów w tym momencie\./g, "{translate(locale, 'dynamic.noActiveTimersThisMoment', customTranslations)}");
fs.writeFileSync('src/components/TrayWidget.tsx', trayContent);
