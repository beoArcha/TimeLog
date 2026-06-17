import React, { useState, useRef, useEffect } from 'react';
import { Project, Task, TimeLog, HolidayLeave } from '../types';
import { getProjectDurationSeconds, getTaskDurationSeconds, formatSeconds } from '../utils';
import { Terminal, Send, Play, CornerDownRight, ShieldCheck } from 'lucide-react';
import { translate } from '../utils/i18n';
import { DataManager } from '../utils/dataManager';

import { LocaleType, TranslationDictionary, getTranslation } from '../utils/translations';

interface CliInterfaceProps {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  onAddProject: (name: string, color: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  onToggleProjectArchive: (projectId: string) => void;
  nowIso: string;
  locale: LocaleType;
  customTranslations?: Partial<TranslationDictionary>;
  theme?: string;
  holidays: HolidayLeave[];
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;
  patches?: import('../types').PatchLog[];
  sysSettings?: import('../types').Settings;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export default function CliInterface({
  projects,
  tasks,
  logs,
  activeLog,
  onAddProject,
  onAddTask,
  onToggleTaskComplete,
  onStartTimer,
  onStopTimer,
  nowIso,
  locale,
  customTranslations,
  theme,
  holidays,
  setHolidays,
  selectedTaskId,
  setSelectedTaskId,
}: CliInterfaceProps) {
  const [input, setInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: 'OxyFlow CLI Engine [Version 0.1.0]', type: 'info' },
    { text: "Type 'help' to see available commands.", type: 'info' },
    { text: "Connected to local SQLite database in memory.", type: 'success' },
    { text: '', type: 'output' },
  ]);

  const outputEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  // React to locale switches
  useEffect(() => {
    const msg = locale === 'pl' ? `Zmieniono język terminala na: Polski (PL)` :
                locale === 'en' ? `Terminal locale switched to: English (EN)` :
                locale === 'de' ? `Schnittstellensprache geändert zu: Deutsch (DE)` :
                locale === 'es' ? `Idioma de terminal cambiado a: Español (ES)` :
                locale === 'pt-br' ? `Idioma do terminal alterado para: Português (PT-BR)` :
                `Terminal locale changed to: Custom translation dictionary!`;
    setTerminalHistory(prev => [
      ...prev,
      { text: `[SYSTEM_EVENT] ${msg}`, type: 'success' }
    ]);
  }, [locale]);

  const executeCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Append raw input line
    setTerminalHistory(prev => [...prev, { text: `user@oxyflow:~$ ${trimmed}`, type: 'input' }]);

    // Parse commands and arguments
    // Simple quotes regex parser, e.g. addproject "New Project Name"
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(trimmed)) !== null) {
      matches.push(match[1] || match[2] || match[0]);
    }

    if (matches.length === 0) return;

    const commandName = matches[0].toLowerCase();
    const args = matches.slice(1);

    const outputs: TerminalLine[] = [];

    switch (commandName) {
      case 'help':
      case 'oxyhelp': {
        const isPl = false; // CLI terminal is strictly English
        outputs.push(
          { text: translate(locale, 'dynamic.cliHelpTitle', customTranslations), type: 'info' },
          { text: `  projects                      - ${translate(locale, 'dynamic.cliProjectsDesc', customTranslations)}`, type: 'output' },
          { text: `  tasks <id_projektu/proj_id>   - ${translate(locale, 'dynamic.cliTasksDesc', customTranslations)}`, type: 'output' },
          { text: `  addproject "<nazwa/name>"     - ${translate(locale, 'dynamic.cliAddProjectDesc', customTranslations)}`, type: 'output' },
          { text: `  addtask <pId> "<nazwa/name>"  - ${translate(locale, 'dynamic.cliAddTaskDesc', customTranslations)}`, type: 'output' },
          { text: `  addsubtask <parent_id> "<n>"  - ${translate(locale, 'dynamic.cliAddSubtaskDesc', customTranslations)}`, type: 'output' },
          { text: `  start [task_id]               - ${translate(locale, 'dynamic.cliStartDesc', customTranslations)}`, type: 'output' },
          { text: `  stop [all]                    - ${translate(locale, 'dynamic.cliStopDesc', customTranslations)}`, type: 'output' },
          { text: `  status                        - ${translate(locale, 'dynamic.cliStatusDesc', customTranslations)}`, type: 'output' },
          { text: `  complete <task_id>            - ${translate(locale, 'dynamic.cliCompleteDesc', customTranslations)}`, type: 'output' },
          { text: `  logs                          - ${translate(locale, 'dynamic.cliLogsDesc', customTranslations)}`, type: 'output' },
          { text: `  time <subtask/task/profile> <id> [today/week/month] - ${translate(locale, 'dynamic.cliTimeCmdDesc', customTranslations)}`, type: 'output' },
          { text: `  holidays [add type Y-M-D "N"] - ${translate(locale, 'dynamic.cliHolidaysDesc', customTranslations)}`, type: 'output' },
          { text: `  report [today/week/month/all] - ${translate(locale, 'dynamic.cliReportDesc', customTranslations)}`, type: 'output' },
          { text: `  clear                         - ${translate(locale, 'dynamic.cliClearDesc', customTranslations)}`, type: 'output' },
          { text: `==================================================================`, type: 'info' }
        );
        break;
      }

      case 'projects':
      case 'projlist': {
        const isPl = false; // CLI terminal is strictly English
        if (projects.length === 0) {
          outputs.push({ text: translate(locale, 'dynamic.cliErrNoProjects', customTranslations), type: 'error' });
        } else {
          outputs.push({ text: '┌──────┬────────────────────────────────┬────────────────────────┐', type: 'info' });
          outputs.push({ text: translate(locale, 'dynamic.cliProjHeader', customTranslations), type: 'info' });
          outputs.push({ text: '├──────┼────────────────────────────────┼────────────────────────┤', type: 'info' });
          projects.forEach(p => {
            const timeStr = formatSeconds(getProjectDurationSeconds(p.id, tasks, logs, nowIso));
            const idCol = p.id.padEnd(4);
            const nameCol = p.name.slice(0, 30).padEnd(30);
            const timeCol = timeStr.padEnd(22);
            outputs.push({ text: `│ ${idCol} │ ${nameCol} │ ${timeCol} │`, type: 'output' });
          });
          outputs.push({ text: '└──────┴────────────────────────────────┴────────────────────────┘', type: 'info' });
        }
        break;
      }

      case 'tasks': {
        const isPl = false; // CLI terminal is strictly English
        const pId = args[0];
        if (!pId) {
          outputs.push({ text: translate(locale, 'dynamic.cliRequiresProjId', customTranslations), type: 'error' });
          break;
        }
        const proj = projects.find(p => p.id === pId);
        if (!proj) {
          outputs.push({ text: `${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} ${pId}`, type: 'error' });
          break;
        }

        const projTasks = tasks.filter(t => t.projectId === pId);
        const rootTasks = projTasks.filter(t => t.parentTaskId === null);

        if (rootTasks.length === 0) {
          outputs.push({ text: `${proj.name}: ${translate(locale, 'dynamic.cliProjNoTasksYet', customTranslations)}`, type: 'info' });
        } else {
          outputs.push({ text: `${translate(locale, 'dynamic.cliProjTasksHeader', customTranslations)}: ${proj.name} [ID: ${proj.id}]`, type: 'success' });
          rootTasks.forEach(root => {
            const statusSymbol = root.completed ? '[X]' : '[ ]';
            const duration = formatSeconds(getTaskDurationSeconds(root.id, tasks, logs, nowIso));
            const isSetLabel = root.id === selectedTaskId ? ' (Selected)' : '';
            outputs.push({ 
              text: `${statusSymbol} ID: ${root.id.padEnd(4)} - ${root.name} (${duration})${isSetLabel}`, 
              type: root.completed ? 'info' : 'output' 
            });

            // List subtasks
            const subs = projTasks.filter(t => t.parentTaskId === root.id);
            subs.forEach(sub => {
              const subStatus = sub.completed ? '[X]' : '[ ]';
              const subDuration = formatSeconds(getTaskDurationSeconds(sub.id, tasks, logs, nowIso));
              const isSubSetLabel = sub.id === selectedTaskId ? ' (Selected)' : '';
              outputs.push({ 
                text: `      ↳ ${subStatus} ID: ${sub.id.padEnd(4)} - ${sub.name} (${subDuration})${isSubSetLabel}`, 
                type: 'info' 
              });
            });
          });
        }
        break;
      }

      case 'addproject': {
        const isPl = false; // CLI terminal is strictly English
        const name = args[0];
        if (!name) {
          outputs.push({ text: translate(locale, 'dynamic.cliErrSpecifyProjQuotes', customTranslations), type: 'error' });
        } else {
          onAddProject(name, 'indigo');
          outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessCreatedProj', customTranslations)}: ${name}`, type: 'success' });
        }
        break;
      }

      case 'addtask': {
        const isPl = false; // CLI terminal is strictly English
        const pId = args[0];
        const taskName = args[1];
        if (!pId || !taskName) {
          outputs.push({ text: translate(locale, 'dynamic.cliErrUsageAddTask', customTranslations), type: 'error' });
        } else {
          const projExists = projects.some(p => p.id === pId);
          if (!projExists) {
            outputs.push({ text: `${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} ${pId}`, type: 'error' });
          } else {
            onAddTask(pId, taskName, null);
            outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessAddedTask', customTranslations)}: ${taskName}`, type: 'success' });
          }
        }
        break;
      }

      case 'addsubtask': {
        const isPl = false; // CLI terminal is strictly English
        const parentId = args[0];
        const subName = args[1];
        if (!parentId || !subName) {
          outputs.push({ text: translate(locale, 'dynamic.cliErrUsageAddSubtask', customTranslations), type: 'error' });
        } else {
          const parentTask = tasks.find(t => t.id === parentId);
          if (!parentTask) {
            outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${parentId}`, type: 'error' });
          } else {
            onAddTask(parentTask.projectId, subName, parentId);
            outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessAddedSubtask', customTranslations)}: ${subName}`, type: 'success' });
          }
        }
        break;
      }

      case 'start': {
        const isPl = false; // CLI terminal is strictly English
        const tId = args[0];
        if (!tId) {
          // No task ID specified: start the currently set task!
          const currentTaskId = selectedTaskId || (tasks && tasks.length > 0 ? tasks[0].id : null);
          if (!currentTaskId) {
            outputs.push({ 
              text: isPl 
                ? 'Błąd: Brak obecnie wybranego zadania. Wybierz zadanie w GUI lub podaj ID, np. start 102.' 
                : 'Error: No task is currently selected. Select one in GUI or specify ID, e.g. start 102.', 
              type: 'error' 
            });
          } else {
            const taskObj = tasks.find(t => t.id === currentTaskId);
            if (!taskObj) {
              outputs.push({ 
                text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${currentTaskId}`, 
                type: 'error' 
              });
            } else if (taskObj.completed) {
              outputs.push({ 
                text: isPl 
                  ? `Błąd: Zadanie "${taskObj.name}" jest już oznaczone jako ukończone.` 
                  : `Error: Task "${taskObj.name}" is already completed.`, 
                type: 'error' 
              });
            } else {
              onStartTimer(currentTaskId);
              outputs.push({ 
                text: isPl 
                  ? `▶️ Timer rozpoczęty dla obecnie ustawionego zadania: "${taskObj.name}" [ID: ${currentTaskId}]`
                  : `▶️ Timer started for currently set task: "${taskObj.name}" [ID: ${currentTaskId}]`, 
                type: 'success' 
              });
            }
          }
        } else {
          // Start the specified task
          const taskObj = tasks.find(t => t.id === tId);
          if (!taskObj) {
            outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
          } else if (taskObj.completed) {
            outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskCompleted', customTranslations)} ${taskObj.name}`, type: 'error' });
          } else {
            setSelectedTaskId(tId); // make this task the currently active choice
            onStartTimer(tId);
            outputs.push({ text: `▶️ ${translate(locale, 'dynamic.cliTimerStarted', customTranslations)}: ${taskObj.name} [ID: ${tId}]`, type: 'success' });
          }
        }
        break;
      }

      case 'stop': {
        const isPl = false; // CLI terminal is strictly English
        const arg = args[0] ? args[0].toLowerCase() : '';
        if (arg === 'all') {
          const activeRunningCount = logs.filter(l => l.endTime === null).length;
          onStopTimer(); // stops all active timers
          outputs.push({ 
            text: isPl 
              ? `⏹️ Zatrzymano wszystkie (${activeRunningCount}) aktywne pomiary czasu we wszystkich projektach.` 
              : `⏹️ Stopped all (${activeRunningCount}) active tracking sessions across all projects.`, 
            type: 'success' 
          });
        } else {
          if (!activeLog) {
            outputs.push({ text: translate(locale, 'dynamic.cliNoActiveTimer', customTranslations), type: 'info' });
          } else {
            const t = tasks.find(x => x.id === activeLog.taskId);
            onStopTimer();
            outputs.push({ text: isPl ? `⏹️ Timer zatrzymany dla zadania: "${t?.name || 'Nieznane'}". Zapisano w SQLite.` : `⏹️ Timer stopped for task: "${t?.name || 'Unknown'}". Saved to SQLite.`, type: 'success' });
          }
        }
        break;
      }

      case 'status': {
        const isPl = false; // CLI terminal is strictly English
        if (activeLog) {
          const t = tasks.find(x => x.id === activeLog.taskId);
          const p = t ? projects.find(x => x.id === t.projectId) : null;
          const diffSeconds = getTaskDurationSeconds(activeLog.taskId, tasks, logs, nowIso);
          outputs.push(
            { text: translate(locale, 'dynamic.cliStatusHeader', customTranslations), type: 'info' },
            { text: `  ${isPl ? 'Zadanie' : 'Task'} : ${t?.name} (ID: ${t?.id})`, type: 'output' },
            { text: `  ${isPl ? 'Projekt' : 'Project'} : ${p?.name} (ID: ${p?.id})`, type: 'output' },
            { text: `  ${isPl ? 'Czas' : 'Time'}    : ${formatSeconds(diffSeconds)} elapsed`, type: 'success' },
            { text: '=========================================================', type: 'info' }
          );
        } else {
          outputs.push({ text: translate(locale, 'dynamic.cliStateIdle', customTranslations), type: 'info' });
        }
        break;
      }

      case 'complete': {
        const isPl = false; // CLI terminal is strictly English
        const tId = args[0];
        if (!tId) {
          outputs.push({ text: translate(locale, 'dynamic.cliUsageCompleteTask', customTranslations), type: 'error' });
        } else {
          const tExists = tasks.some(t => t.id === tId);
          if (!tExists) {
            outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
          } else {
            onToggleTaskComplete(tId);
            outputs.push({ text: `${translate(locale, 'dynamic.cliTaskToggled', customTranslations)}: ${tId}`, type: 'success' });
          }
        }
        break;
      }

      case 'logs': {
        const isPl = false; // CLI terminal is strictly English

        let filteredLogs = [...logs];
        const filterArg = args[0] ? args[0].toLowerCase() : 'all';
        const sortArg = args[1] ? args[1].toLowerCase() : 'date';

        // Filters
        const transRunning = (translate(locale, 'dynamic.filterRunning', customTranslations) || 'running').toLowerCase();
        const transCaptured = (translate(locale, 'dynamic.filterCaptured', customTranslations) || 'captured').toLowerCase();
        
        if (filterArg === 'running' || filterArg === transRunning) {
          filteredLogs = filteredLogs.filter(log => !log.endTime);
        } else if (filterArg === 'captured' || filterArg === transCaptured || filterArg === 'gotowy') {
          filteredLogs = filteredLogs.filter(log => log.endTime);
        }

        // Sorting
        const transDate = (translate(locale, 'dynamic.sortDate', customTranslations) || 'date').toLowerCase();
        const transDuration = (translate(locale, 'dynamic.sortDuration', customTranslations) || 'duration').toLowerCase();
        const transProject = (translate(locale, 'dynamic.sortProject', customTranslations) || 'project').toLowerCase();
        const transStatus = (translate(locale, 'dynamic.sortStatus', customTranslations) || 'status').toLowerCase();

        if (sortArg === 'duration' || sortArg === transDuration || sortArg === 'czas') {
          filteredLogs.sort((a, b) => {
            const getDur = (log: TimeLog) => {
              const s = new Date(log.startTime).getTime();
              const e = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
              return Math.max(0, e - s);
            };
            return getDur(b) - getDur(a);
          });
        } else if (sortArg === 'project' || sortArg === transProject || sortArg === 'projekt') {
          filteredLogs.sort((a, b) => a.projectId.localeCompare(b.projectId));
        } else if (sortArg === 'status' || sortArg === transStatus) {
          filteredLogs.sort((a, b) => (a.endTime ? 1 : 0) - (b.endTime ? 1 : 0));
        } else {
          filteredLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // date default
        }

        if (filteredLogs.length === 0) {
          outputs.push({ text: translate(locale, 'dynamic.cliNoLogsFound', customTranslations), type: 'info' });
        } else {
          const hId = (translate(locale, 'dynamic.cliLogId', customTranslations) || 'ID').padEnd(4).substring(0, 4);
          const hPrj = (translate(locale, 'dynamic.cliLogPrjId', customTranslations) || 'PRJ ID').padEnd(6).substring(0, 6);
          const hStart = (translate(locale, 'dynamic.cliLogStart', customTranslations) || 'STARTED AT').padEnd(10).substring(0, 10);
          const hStat = (translate(locale, 'dynamic.cliLogStatus', customTranslations) || 'STATUS').padEnd(8).substring(0, 8);
          const hDur = (translate(locale, 'dynamic.cliLogDuration', customTranslations) || 'DURATION').padEnd(22).substring(0, 22);

          outputs.push({ text: '┌──────┬────────┬────────────┬──────────┬────────────────────────┐', type: 'info' });
          outputs.push({ text: `│ ${hId} │ ${hPrj} │ ${hStart} │ ${hStat} │ ${hDur} │`, type: 'info' });
          outputs.push({ text: '├──────┼────────┼────────────┼──────────┼────────────────────────┤', type: 'info' });
          filteredLogs.forEach(log => {
            const startStr = new Date(log.startTime).toLocaleTimeString().substring(0, 10);
            const statusLabel = log.endTime ? (filterArg === transRunning ? 'Captured' : 'Gotowy') : 'AKTYWNY';
            // ensure proper rendering based on endtime
            const finalStatusLabel = log.endTime ? transCaptured.toUpperCase() : transRunning.toUpperCase();

            const p = projects.find(x => x.id === log.projectId);
            const start = new Date(log.startTime).getTime();
            const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
            const elapsed = Math.max(0, Math.floor((end - start) / 1000));
            
            const idCol = log.id.slice(-4).padEnd(4);
            const prjCol = log.projectId.padEnd(6).substring(0, 6);
            const dateCol = startStr.padEnd(10).substring(0, 10);
            const statCol = finalStatusLabel.padEnd(8).substring(0, 8);
            const durCol = formatSeconds(elapsed).padEnd(22).substring(0, 22);
            outputs.push({ text: `│ ${idCol} │ ${prjCol} │ ${dateCol} │ ${statCol} │ ${durCol} │`, type: log.endTime ? 'output' : 'success' });
          });
          outputs.push({ text: '└──────┴────────┴────────────┴──────────┴────────────────────────┘', type: 'info' });
        }
        break;
      }

      case 'holidays':
      case 'holiday': {
        const isPl = false; // CLI terminal is strictly English
        const subAction = args[0] ? args[0].toLowerCase() : '';
        if (subAction === 'add') {
          const type = args[1]?.toLowerCase();
          const date = args[2];
          const name = args[3];
          if (!type || !date || !name || (type !== 'holiday' && type !== 'leave')) {
            outputs.push({ 
              text: isPl 
                ? 'Błąd: Użycie: holidays add <holiday|leave> <YYYY-MM-DD> "<nazwa_swieta_lub_urlopu>".' 
                : 'Error: Usage: holidays add <holiday|leave> <YYYY-MM-DD> "<name>".', 
              type: 'error' 
            });
          } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
              outputs.push({ text: translate(locale, 'dynamic.cliInvalidDateFormat', customTranslations), type: 'error' });
            } else {
              const newHoliday: HolidayLeave = {
                id: DataManager.getNextId(holidays, 'hol_'),
                date,
                type: type as 'holiday' | 'leave',
                name,
              };
              setHolidays(prev => [...prev, newHoliday]);
              outputs.push({ 
                text: isPl 
                  ? `Sukces: Zapisano ${type === 'holiday' ? 'święto' : 'urlop'} "${name}" [${date}] w bazie SQLite.` 
                  : `Success: Saved ${type === 'holiday' ? 'holiday' : 'leave'} "${name}" [${date}] in SQLite table.`, 
                type: 'success' 
              });
            }
          }
        } else {
          if (holidays.length === 0) {
            outputs.push({ text: translate(locale, 'dynamic.cliNoHolidays', customTranslations), type: 'info' });
          } else {
            outputs.push({ text: '┌──────┬────────────┬─────────────┬────────────────────────────────┐', type: 'info' });
            outputs.push({ text: translate(locale, 'dynamic.cliHolidaysHeader', customTranslations), type: 'info' });
            outputs.push({ text: '├──────┼────────────┼─────────────┼────────────────────────────────┤', type: 'info' });
            holidays.forEach(h => {
              const typeStr = h.type === 'holiday' ? (isPl ? 'ŚWIĘTO' : 'HOLIDAY') : (isPl ? 'URLOP' : 'LEAVE');
              const idCol = h.id.replace('hol_', '').slice(-4).padEnd(4);
              const dateCol = h.date.padEnd(10);
              const typeCol = typeStr.padEnd(11);
              const nameCol = h.name.slice(0, 30).padEnd(30);
              outputs.push({ text: `│ ${idCol} │ ${dateCol} │ ${typeCol} │ ${nameCol} │`, type: 'output' });
            });
            outputs.push({ text: '└──────┴────────────┴─────────────┴────────────────────────────────┘', type: 'info' });
          }
        }
        break;
      }

      case 'report': {
        const isPl = false; // CLI terminal is strictly English
        const period = args[0] ? args[0].toLowerCase() : 'all';
        const sortBy = args[1] ? args[1].toLowerCase() : 'duration'; // 'duration' or 'date'

        let startMs = 0;
        const now = new Date(nowIso);

        if (period === 'today') {
          const d = new Date(now);
          d.setHours(0,0,0,0);
          startMs = d.getTime();
        } else if (period === 'week') {
          const d = new Date(now);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          monday.setHours(0,0,0,0);
          startMs = monday.getTime();
        } else if (period === 'month') {
          const d = new Date(now.getFullYear(), now.getMonth(), 1);
          startMs = d.getTime();
        } else {
          startMs = 0;
        }

        const filteredLogs = logs.filter(log => {
          const logTime = new Date(log.startTime).getTime();
          return logTime >= startMs;
        });

        if (filteredLogs.length === 0) {
          outputs.push({ text: `${translate(locale, 'dynamic.cliNoLogsPeriod', customTranslations)} ${period}`, type: 'info' });
          break;
        }

        outputs.push({ text: `================ ${translate(locale, 'dynamic.cliReportTimeHeader', customTranslations)}: ${period.toUpperCase()} (Sort: ${sortBy}) ================`, type: 'info' });

        // Ordinary listing
        outputs.push({ text: translate(locale, 'dynamic.cliReportSysList', customTranslations), type: 'info' });
        
        let sortedLogs = [...filteredLogs];
        if (sortBy === 'date') {
          sortedLogs.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        } else {
          sortedLogs.sort((a,b) => {
            const durA = (a.endTime ? new Date(a.endTime).getTime() : new Date(nowIso).getTime()) - new Date(a.startTime).getTime();
            const durB = (b.endTime ? new Date(b.endTime).getTime() : new Date(nowIso).getTime()) - new Date(b.startTime).getTime();
            return durB - durA; // descending duration
          });
        }

        sortedLogs.forEach(log => {
          const p = projects.find(x => x.id === log.projectId);
          const t = tasks.find(x => x.id === log.taskId);
          const start = new Date(log.startTime).getTime();
          const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
          const elapsed = Math.max(0, Math.floor((end - start) / 1000));
          const dateStr = new Date(log.startTime).toLocaleDateString() + ' ' + new Date(log.startTime).toLocaleTimeString();
          outputs.push({ 
            text: `[${dateStr}] [Proj: ${p?.name || 'N/A'}] Task ID: ${log.taskId} ("${t?.name || 'N/A'}") -> Czas: ${formatSeconds(elapsed)}`, 
            type: 'output' 
          });
        });

        // Graphical ascii representation
        outputs.push({ text: '', type: 'output' });
        outputs.push({ text: translate(locale, 'dynamic.cliReportGraph', customTranslations), type: 'info' });

        const projectTimeMap: Record<string, number> = {};
        filteredLogs.forEach(log => {
          const start = new Date(log.startTime).getTime();
          const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
          projectTimeMap[log.projectId] = (projectTimeMap[log.projectId] || 0) + Math.max(0, Math.floor((end - start) / 1000));
        });

        const projectDurations = Object.entries(projectTimeMap).map(([pId, seconds]) => {
          const p = projects.find(x => x.id === pId);
          return { name: p?.name || `Project ${pId}`, seconds };
        });

        if (sortBy === 'duration') {
          projectDurations.sort((a,b) => b.seconds - a.seconds);
        } else {
          projectDurations.sort((a,b) => a.name.localeCompare(b.name));
        }

        const maxSec = Math.max(...projectDurations.map(x => x.seconds), 1);
        projectDurations.forEach(pd => {
          const squaresCount = Math.round((pd.seconds / maxSec) * 20);
          const bar = '█'.repeat(squaresCount) + '░'.repeat(20 - squaresCount);
          outputs.push({ 
            text: `${pd.name.padEnd(28)} [${bar}] ${formatSeconds(pd.seconds)}`, 
            type: 'success' 
          });
        });

        outputs.push({ text: '=======================================================', type: 'info' });
        break;
      }

      case 'time': {
        const type = args[0];
        const targetId = args[1];
        const period = args[2] || 'all';

        if (!type || !targetId) {
          outputs.push({ text: 'Error: Usage: time <subtask/task/profile> <id> [today/week/month]', type: 'error' });
          break;
        }

        let dur = 0;
        let pName = targetId;

        // In a real Rust backend, this would make an SQL call filtering by start_stamp
        // Here we simulate the logic based on the period constraint
        const filterLogsByPeriod = (L: TimeLog[]) => L.filter(log => {
          let testDate = new Date(log.startTime);
          let nDate = new Date(nowIso);
          if (period === 'today') {
            return testDate.toDateString() === nDate.toDateString();
          } else if (period === 'week') {
            // Simplified current week check
            const diff = nDate.getTime() - testDate.getTime();
            return diff < 7 * 24 * 3600 * 1000;
          } else if (period === 'month') {
             return testDate.getMonth() === nDate.getMonth() && testDate.getFullYear() === nDate.getFullYear();
          }
          return true; // all
        });

        const filteredLogs = filterLogsByPeriod(logs);

        if (type === 'profile') {
          dur = getProjectDurationSeconds(targetId, tasks, filteredLogs, nowIso);
          pName = projects.find(p => p.id === targetId)?.name || targetId;
        } else if (type === 'task' || type === 'subtask') {
          dur = getTaskDurationSeconds(targetId, tasks, filteredLogs, nowIso);
          pName = tasks.find(t => t.id === targetId)?.name || targetId;
        } else {
          outputs.push({ text: 'Error: Type must be subtask, task, or profile.', type: 'error' });
          break;
        }

        outputs.push({ text: `[${period.toUpperCase()}] Time elapsed for ${type.toUpperCase()} "${pName}": ${formatSeconds(dur)}`, type: 'success' });
        break;
      }

      case 'clear':
        setTerminalHistory([]);
        return;

      default:
        outputs.push({ text: `Nieznane polecenie: "${commandName}". Wpisz "help", aby zobaczyć listę komend.`, type: 'error' });
    }

    setTerminalHistory(prev => [...prev, ...outputs, { text: '', type: 'output' }]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input);
    setInput('');
  };

  return (
    <div id="cli-interface" className={`flex flex-col gap-4 backdrop-blur-md rounded-3xl p-6 border shadow-2xl relative transition-all duration-300 ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100'
        : theme === 'high-contrast'
        ? 'bg-black border-2 border-white text-white'
        : 'bg-white/5 border-white/10 text-white'
    }`}>
      
      {/* Top Console Bar */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        theme === 'light' ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
          </div>
          <span className={`text-xs font-mono flex items-center gap-1.5 ml-2 ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}>
            <Terminal className="w-3.5 h-3.5 text-orange-500" />
            OxyFlow Engine CLI Shell (127.0.0.1)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className={`text-[10px] border px-2 py-0.5 rounded-md font-mono flex items-center gap-1 ${
            theme === 'light'
              ? 'bg-slate-500/10 border-slate-200 text-slate-700'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <ShieldCheck className="w-3 h-3 text-orange-500" /> Rust CLI client emulator
          </span>
        </div>
      </div>

      {/* Screen Display */}
      <div 
        id="terminal-history" 
        className={`rounded-2xl p-4 min-h-[380px] max-h-[480px] overflow-y-auto font-mono text-xs leading-relaxed flex flex-col gap-1.5 focus:outline-none border ${
          theme === 'light'
            ? 'bg-slate-900 border-slate-300 text-slate-200 shadow-inner'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-black/20 border-white/15 text-slate-300'
        }`}
      >
        {terminalHistory.map((line, index) => {
          let colorClass = theme === 'light' ? 'text-slate-300' : 'text-slate-300';
          if (line.type === 'input') colorClass = 'text-white font-bold border-l-2 border-l-orange-500 pl-1.5 my-1';
          else if (line.type === 'error') colorClass = 'text-rose-450 font-semibold bg-rose-500/10 p-1.5 rounded-lg';
          else if (line.type === 'success') colorClass = 'text-orange-400 font-semibold';
          else if (line.type === 'info') colorClass = 'text-teal-400';

          return (
            <div key={index} className={`${colorClass} whitespace-pre-wrap`}>
              {line.text}
            </div>
          );
        })}
        <div ref={outputEndRef} />
      </div>

      {/* Input Submit */}
      <form onSubmit={handleFormSubmit} className={`flex gap-2 p-1.5 rounded-2xl border transition-all ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200'
          : theme === 'high-contrast'
          ? 'bg-black border-white'
          : 'bg-black/25 border-white/10'
      }`}>
        <span className="text-orange-500 font-mono text-sm self-center pl-2 font-bold select-none">
          oxyflow&gt;
        </span>
        <input
          id="cli-input-field"
          type="text"
          className={`flex-1 bg-transparent font-mono text-xs border-none outline-none focus:ring-0 py-2 ${
            theme === 'light' ? 'text-slate-800 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
          }`}
          placeholder={locale === 'pl' ? 'Wpisz komendę, np. help, projects, start 1, stop...' : 'Enter command, e.g. help, projects, start 1, stop...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button
          id="cli-submit-btn"
          type="submit"
          className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
        >
          {locale === 'pl' ? 'Wyślij' : locale === 'en' ? 'Send' : locale === 'de' ? 'Senden' : locale === 'es' ? 'Enviar' : 'Enviar'} <Send className="w-3 h-3" />
        </button>
      </form>

      {/* CLI Quick Guide */}
      <div className={`border rounded-2xl p-3 flex flex-wrap items-center gap-2 text-[10px] font-mono transition-all ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200 text-slate-600'
          : theme === 'high-contrast'
          ? 'bg-black border-white text-white'
          : 'bg-white/5 border-white/10 text-slate-400'
      }`}>
        <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, 'dynamic.quickShortcuts', customTranslations)}</span>
        <button 
          id="cmd-project-list-btn"
          type="button" 
          onClick={() => executeCommand('projects')} 
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${
            theme === 'light'
              ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
              : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
          }`}
        >
          projects
        </button>
        <button 
          id="cmd-status-btn"
          type="button" 
          onClick={() => executeCommand('status')} 
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${
            theme === 'light'
              ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
              : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
          }`}
        >
          status
        </button>
        <button 
          id="cmd-logs-btn"
          type="button" 
          onClick={() => executeCommand('logs')} 
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${
            theme === 'light'
              ? 'bg-white hover:bg-slate-100 text-orange-600 border-slate-200'
              : 'bg-white/5 hover:bg-white/10 text-orange-400 border-white/10'
          }`}
        >
          logs
        </button>
        <button 
          id="cmd-stop-btn"
          type="button" 
          onClick={() => executeCommand('stop')} 
          className={`px-2.5 py-1 rounded border cursor-pointer transition-all ${
            theme === 'light'
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-150'
              : 'bg-white/5 hover:bg-rose-500/20 text-rose-300 border-white/10'
          }`}
        >
          stop
        </button>
      </div>

    </div>
  );
}
