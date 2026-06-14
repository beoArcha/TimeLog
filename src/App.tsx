import React, { useState, useEffect } from 'react';
import { useOxyFlow, OxyContext } from './hooks/useOxyFlow';
import { useLocale } from './providers/LocaleProvider';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { Project, Task, TimeLog, HolidayLeave, PatchLog, Settings as AppSettings } from './types';
import GuiInterface from './components/GuiInterface';
import CliInterface from './components/CliInterface';
import RustSourceExplorer from './components/RustSourceExplorer';
import DbExplorer from './components/DbExplorer';
import ManualTab from './components/ManualTab';
import CreditsTab from './components/CreditsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';
import TrayWidget from './components/TrayWidget';
import SmallGuiWidget from './components/SmallGuiWidget';
import TesterAndHelperWizard from './components/TesterAndHelperWizard';
import { DataManager } from './utils/dataManager';
import { translate } from './utils/i18n';
import { LocaleType, TranslationDictionary, defaultTranslations, getTranslation } from './utils/translations';
import { Sparkles, Terminal, AppWindow, Cpu, Clock, RefreshCw, Layers, Minimize2, Maximize2, X, ChevronUp, ChevronDown, Bell, CheckCircle2, CheckCircle, Shield, AlertTriangle, Sun, Moon, Eye, Laptop, Database, Settings, HelpCircle, Info, Copy, Check, Languages, FileText, BookOpen, Trash2, Heart, Play, Square, User, BarChart, BarChart3, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'oxytime_state_db_6';

export default function App() {
  // Tabs: 'gui' | 'cli' | 'rust'
  const [activeTab, setActiveTab] = useState<'gui' | 'cli' | 'rust'>('gui');

  const { localePref, setLocalePref, locale, setLocale, customTranslations, setCustomTranslations } = useLocale();

  // Theme support: 'dark' | 'light' | 'high-contrast' | 'system'
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast' | 'system'>(() => {
    const saved = localStorage.getItem('oxytime_theme');
    return (saved as any) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');

  useEffect(() => {
    localStorage.setItem('oxytime_theme', theme);
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? 'light' : 'dark');
      };
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as any);
    }
  }, [theme]);

  // Shared application state (SQLite mockup representations)
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [holidays, setHolidays] = useState<HolidayLeave[]>([]);
  const [patches, setPatches] = useState<PatchLog[]>([]);
  const [sysSettings, setSysSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('oxytime_sys_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return {
      autoStart: false,
      autoPauseOnSleep: true,
      includePatchesInReports: true
    };
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Credits & Licensing overlay modal state
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);

  // GUI Variant layout modes: 'small' (compact with down triangle) | 'medium' (condensed) | 'large' (6 tabs)
  const [guiVariant, setGuiVariant] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('oxytime_gui_variant') as any) || 'large';
  });

  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(() => {
    return localStorage.getItem('oxytime_always_on_top') === 'true';
  });

  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'cli' | 'db' | 'options' | 'manual' | 'credits'>('main');

  const [isSmallExpanded, setIsSmallExpanded] = useState<boolean>(true);

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('oxytime_current_proj_id') || '1';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_sys_settings', JSON.stringify(sysSettings));
  }, [sysSettings]);

  useEffect(() => {
    localStorage.setItem('oxytime_gui_variant', guiVariant);
  }, [guiVariant]);

  useEffect(() => {
    localStorage.setItem('oxytime_always_on_top', String(alwaysOnTop));
  }, [alwaysOnTop]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('oxytime_current_proj_id', currentProjectId);
    }
  }, [currentProjectId]);

  // Dictionary matrix translation editor states and copy helper
  const [editingTranslationKey, setEditingTranslationKey] = useState<string | null>(null);
  const [editingTranslationValue, setEditingTranslationValue] = useState<string>('');

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(translate(locale, 'dynamic.copiedToClipboard', customTranslations));
  };

  // System Tray Minimization state
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [trayNotification, setTrayNotification] = useState<string | null>(null);

  // Engine discovery simulation (gui pierwsze co robi to odszukanie działającego procesu silnika)
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('searching');
  const [enginePID, setEnginePID] = useState<number>(0);

  // Engine Configuration States
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(() => localStorage.getItem('oxytime_min_to_tray') !== 'false');
  const [logToApi, setLogToApi] = useState<boolean>(() => localStorage.getItem('oxytime_log_to_api') === 'true');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('oxytime_api_token') || '');
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem('oxytime_api_url') || '');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>(() => (localStorage.getItem('oxytime_api_method') as 'POST' | 'PUT') || 'POST');
  const [apiHeaders, setApiHeaders] = useState<string>(() => localStorage.getItem('oxytime_api_headers') || '');

  // Full GUI closure (zamiast minimalizacji)
  const [isGuiClosed, setIsGuiClosed] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('oxytime_min_to_tray', String(minimizeToTray));
    localStorage.setItem('oxytime_log_to_api', String(logToApi));
    localStorage.setItem('oxytime_api_token', apiToken);
    localStorage.setItem('oxytime_api_url', apiUrl);
    localStorage.setItem('oxytime_api_method', apiMethod);
    localStorage.setItem('oxytime_api_headers', apiHeaders);
  }, [minimizeToTray, logToApi, apiToken, apiUrl, apiMethod, apiHeaders]);

  // Live countdown clock state for reactive metrics
  const [nowIso, setNowIso] = useState<string>(new Date().toISOString());

  // Set up live interval countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize state from LocalStorage or seed default models
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProjects(parsed.projects || []);
        setTasks(parsed.tasks || []);
        setLogs(parsed.logs || []);
        setActiveLog(parsed.activeLog || null);
        setHolidays(parsed.holidays || [
          { id: 'h1', date: '2026-01-01', type: 'holiday', name: 'Nowy Rok (New Year)' },
          { id: 'h2', date: '2026-05-01', type: 'holiday', name: 'Święto Pracy (Labour Day)' },
          { id: 'h3', date: '2026-05-03', type: 'holiday', name: 'Święto Konstytucji 3 Maja' },
          { id: 'h4', date: '2026-06-04', type: 'holiday', name: 'Boże Ciało (Corpus Christi)' },
          { id: 'h5', date: '2026-11-11', type: 'holiday', name: 'Święto Niepodległości (Independence Day)' },
          { id: 'h6', date: '2026-12-25', type: 'holiday', name: 'Boże Narodzenie (Christmas)' },
          { id: 'l1', date: '2026-06-15', type: 'leave', name: 'Urlop wypoczynkowy (Zouk Dance Camp)' },
          { id: 'l2', date: '2026-06-16', type: 'leave', name: 'Urlop wypoczynkowy (Kizomba Festival)' },
          { id: 'l3', date: '2026-06-17', type: 'leave', name: 'Urlop wypoczynkowy (Bachata & Salsa NY)' }
        ]);
        setPatches(parsed.patches || []);
        if (parsed.tasks && parsed.tasks.length > 0) {
          setSelectedTaskId(parsed.tasks[0].id);
        }
        setIsInitialized(true);
        setEngineState('connected');
        setEnginePID(Math.floor(2500 + Math.random() * 5000));
        return;
      } catch (err) {
        console.warn('Failed parsing local OxyFlow store', err);
      }
    }

    // Seed default starting projects & nested tasks for instant gratification!
    const initProjects: Project[] = [
      { id: '1', name: 'OxyFlow Backend Engine', color: 'violet', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { id: '2', name: 'Zouk Flow UI System', color: 'rose', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
      { id: '3', name: 'CLI Daemon Integration', color: 'teal', createdAt: new Date().toISOString() },
    ];

    const initTasks: Task[] = [
      { id: '101', projectId: '1', parentTaskId: null, name: 'Setup sqlite schema state machine', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), completed: true },
      { id: '102', projectId: '1', parentTaskId: null, name: 'Develop recursive calculations for project logging', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), completed: false },
      { id: '1021', projectId: '1', parentTaskId: '102', name: 'Unit test nested hierarchical timings', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), completed: false },
      { id: '1022', projectId: '1', parentTaskId: '102', name: 'Optimize microORM connection pooling', createdAt: new Date().toISOString(), completed: true },
      
      { id: '201', projectId: '2', parentTaskId: null, name: 'Create glowing time display component', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), completed: false },
      { id: '202', projectId: '2', parentTaskId: null, name: 'Integrate dynamic wave animations', createdAt: new Date().toISOString(), completed: true },
      
      { id: '301', projectId: '3', parentTaskId: null, name: 'Map help guidelines onto interactive commands', createdAt: new Date().toISOString(), completed: false },
    ];

    const initLogs: TimeLog[] = [
      { id: 'l1', taskId: '101', projectId: '1', startTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 4800000).toISOString() },
      { id: 'l2', taskId: '1022', projectId: '1', startTime: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 2900000).toISOString() },
      { id: 'l3', taskId: '202', projectId: '2', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString() },
    ];

    const initHolidays: HolidayLeave[] = [
      { id: 'h1', date: '2026-01-01', type: 'holiday', name: 'Nowy Rok (New Year)' },
      { id: 'h2', date: '2026-05-01', type: 'holiday', name: 'Święto Pracy (Labour Day)' },
      { id: 'h3', date: '2026-05-03', type: 'holiday', name: 'Święto Konstytucji 3 Maja' },
      { id: 'h4', date: '2026-06-04', type: 'holiday', name: 'Boże Ciało (Corpus Christi)' },
      { id: 'h5', date: '2026-11-11', type: 'holiday', name: 'Święto Niepodległości (Independence Day)' },
      { id: 'h6', date: '2026-12-25', type: 'holiday', name: 'Boże Narodzenie (Christmas)' },
      { id: 'l1', date: '2026-06-15', type: 'leave', name: 'Urlop wypoczynkowy (Zouk Dance Camp)' },
      { id: 'l2', date: '2026-06-16', type: 'leave', name: 'Urlop wypoczynkowy (Kizomba Festival)' },
      { id: 'l3', date: '2026-06-17', type: 'leave', name: 'Urlop wypoczynkowy (Bachata & Salsa NY)' }
    ];

    setProjects(initProjects);
    setTasks(initTasks);
    setLogs(initLogs);
    setHolidays(initHolidays);
    setPatches([]);
    setSelectedTaskId(initTasks[1].id);
    setIsInitialized(true);
    setEngineState('connected');
    setEnginePID(Math.floor(2500 + Math.random() * 5000));
  }, []);

  // Save changes automatically to browser localStorage
  useEffect(() => {
    if (isInitialized) {
      const stateObj = { projects, tasks, logs, activeLog, holidays, patches };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
    }
  }, [projects, tasks, logs, activeLog, holidays, patches, isInitialized]);

  // Find background engine process on mount (gui pierwsze co robi to odszukanie działającego procesu)
  useEffect(() => {
    if (projects.length > 0 && engineState === 'searching') {
      const timer = setTimeout(() => {
        setEngineState('connected');
        setEnginePID(Math.floor(2000 + Math.random() * 7000));
        
        // Find if there are already running processes/timers in sqlite (unclosed logs)
        const runningLogs = logs.filter(l => l.endTime === null);
        if (runningLogs.length > 0) {
          // Sync activeLog fallback state to the newest unclosed log
          setActiveLog(runningLogs[runningLogs.length - 1]);
        }
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [projects, logs, engineState]);

  const handleAddProject = (name: string, color: string) => {
    const newProj: Project = {
      id: DataManager.getNextId(projects),
      name,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setProjects(prev => [...prev, newProj]);
  };

  const handleToggleProjectArchive = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, archived: !p.archived };
      }
      return p;
    }));
  };

  const handleAddTask = (projectId: string, name: string, parentTaskId: string | null) => {
    const nextId = DataManager.getNextId(tasks);
    const newTask: Task = {
      id: nextId,
      projectId,
      parentTaskId,
      name,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedState = !t.completed;
          // If the completed task has an active running timer, stop it
          if (updatedState) {
            setLogs(currLogs =>
              currLogs.map(l => {
                if (l.taskId === taskId && l.endTime === null) {
                  return { ...l, endTime: new Date().toISOString() };
                }
                return l;
              })
            );
            if (activeLog && activeLog.taskId === taskId) {
              setActiveLog(null);
            }
          }
          return { ...t, completed: updatedState };
        }
        return t;
      })
    );
  };

  const pushToApi = (payload: any, logMsg: string) => {
    if (logToApi && apiUrl) {
      let headersObj = {};
      try {
        if (apiHeaders) headersObj = JSON.parse(apiHeaders);
      } catch (e) {
        console.error('Failed parse headers json');
      }
      fetch(apiUrl, {
        method: apiMethod || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
          ...headersObj,
        },
        body: JSON.stringify(payload),
      }).catch(err => console.error('Failed API:', err));
    } else {
      console.log(`[FILE APPEND logs.txt] ${logMsg}`);
    }
  };

  const handleStartTimer = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedLogs = logs.map(l => {
      if (l.endTime === null) {
        const payload = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
        pushToApi(payload, `Terminating ${l.id}`);
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });

    const newLog: TimeLog = {
      id: DataManager.getNextId(logs, 'log_'),
      taskId,
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      endTime: null,
    };

    const payloadStart = { event: 'START', log: newLog };
    pushToApi(payloadStart, `Starting ${newLog.id}`);

    setLogs([...updatedLogs, newLog]);
    setActiveLog(newLog);
  };

  const handleStopTimer = (specificProjectId?: string) => {
    setLogs(currLogs =>
      currLogs.map(l => {
        if (l.endTime === null && (!specificProjectId || l.projectId === specificProjectId)) {
          const payloadStop = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
          pushToApi(payloadStop, `Terminating ${l.id}`);
          return { ...l, endTime: new Date().toISOString() };
        }
        return l;
      })
    );
    
    if (activeLog && (!specificProjectId || activeLog.projectId === specificProjectId)) {
      setActiveLog(null);
    }
  };

  const handleResetLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
  };

  const showToast = (msg: string) => {
    setTrayNotification(msg);
    setTimeout(() => setTrayNotification(null), 5000);
  };

  const handleMinimizeToTray = () => {
    if (minimizeToTray) {
      setIsMinimized(true);
      showToast(translate(locale, 'dynamic.oxyFlowMinimizedToTrayEngineKe', customTranslations));
    } else {
      setIsGuiClosed(true);
      // "Gui closed but engine keeps running"
      showToast(translate(locale, 'dynamic.gUIClosedOxyFlowEngineLogsUISh', customTranslations));
    }
  };

  const handleToggleTimer = () => {
    if (activeLog) {
      handleStopTimer();
    } else if (selectedTaskId) {
      handleStartTimer(selectedTaskId);
    } else {
      showToast(translate(locale, 'app.noTaskSelected', customTranslations) || 'Zaznacz zadanie aby rozpocząć/zatrzymać timer');
    }
  };

  useGlobalShortcuts({
    onToggleTimer: handleToggleTimer,
  });

  const activeRunningLogs = logs.filter(l => l.endTime === null);

  if (isGuiClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white flex-col gap-4 font-mono">
        <Cpu className="w-12 h-12 text-orange-500 animate-pulse" />
        <h1 className="text-2xl font-bold">{translate(locale, 'app.guiClosedTitle', customTranslations)}</h1>
        <p className="text-[#9B8C83]">{translate(locale, 'app.guiClosedDesc', customTranslations)}</p>
        <button onClick={() => setIsGuiClosed(false)} className="px-6 py-2 mt-4 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-bold cursor-pointer transition-all">
          {translate(locale, 'app.restartGui', customTranslations)}
        </button>
      </div>
    );
  }

  return (
    <OxyContext.Provider value={{
      projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays,
      patches, setPatches, sysSettings, setSysSettings,
      activeLog, setActiveLog, localePref, setLocalePref, locale, setLocale, theme, setTheme, resolvedTheme, setResolvedTheme, customTranslations, setCustomTranslations,
      engineState, enginePID, minimizeToTray, setMinimizeToTray, logToApi, setLogToApi,
      apiToken, setApiToken, apiUrl, setApiUrl, apiMethod, setApiMethod, apiHeaders, setApiHeaders, nowIso, isGuiClosed, setIsGuiClosed
    }}>
    <div id="app-root-container" className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative overflow-hidden p-3 sm:p-6 ${
      resolvedTheme === 'light' 
        ? 'bg-[#F4EFEA] text-[#2C2421] selection:bg-orange-500/20 selection:text-orange-950' 
        : resolvedTheme === 'high-contrast' 
        ? 'bg-black text-white selection:bg-yellow-500/30 selection:text-white' 
        : 'bg-[#0b0f19] text-slate-200 selection:bg-orange-500/30 selection:text-white'
    }`}>
      
      {/* Bio-organic glowing gradient backgrounds for high productivity focus */}
      {resolvedTheme !== 'high-contrast' && (
        <>
          <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms] ${
            resolvedTheme === 'light' ? 'bg-orange-500/5' : 'bg-orange-500/10'
          }`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms] ${
            resolvedTheme === 'light' ? 'bg-rose-500/5' : 'bg-rose-500/10'
          }`} />
          <div className={`absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none ${
            resolvedTheme === 'light' ? 'bg-violet-500/5' : 'bg-violet-500/10'
          }`} />
        </>
      )}

      {/* Real-time System Notification / Tray Alert Toast */}
      <AnimatePresence>
        {trayNotification && (
          <motion.div
            id="tray-toast-notification"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full border-2 p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 ${
              resolvedTheme === 'light'
                ? 'bg-[#FCFAF8]/95 backdrop-blur-xl border-orange-500/50 text-[#2C2421]'
                : resolvedTheme === 'high-contrast'
                ? 'bg-black border-white text-white'
                : 'bg-slate-900/90 backdrop-blur-2xl border-orange-500/40 text-white'
            }`}
          >
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-450 shrink-0 border border-orange-500/30 animate-pulse">
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-orange-500 uppercase">System Notification Tray</span>
                <button 
                  onClick={() => setTrayNotification(null)}
                  className={`text-xs ${resolvedTheme === 'light' ? 'text-[#8A7A71] hover:text-slate-950' : 'text-[#9B8C83] hover:text-white'}`}
                >
                  <X className="w-4 h-4 cursor-pointer" />
                </button>
              </div>
              <p className={`text-xs font-sans mt-1 leading-relaxed ${
                resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-200'
              }`}>
                {trayNotification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main OS Window Frame Container */}
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <TrayWidget
            onRestore={() => {
              setIsMinimized(false);
              showToast(translate(locale, 'app.maximizeRestore', customTranslations));
            }}
            onStopAll={() => {
              handleStopTimer();
              showToast(translate(locale, 'app.stoppedThreads', customTranslations));
            }}
            showToast={showToast}
          />
        ) : guiVariant === 'small' ? (
          <SmallGuiWidget
            alwaysOnTop={alwaysOnTop}
            setAlwaysOnTop={setAlwaysOnTop}
            isSmallExpanded={isSmallExpanded}
            setIsSmallExpanded={setIsSmallExpanded}
            showToast={showToast}
            handleMinimizeToTray={handleMinimizeToTray}
            setGuiVariant={setGuiVariant}
            currentProjectId={currentProjectId}
          />
        ) : (
          /* Normal OS Window Desktop UI Mode (Supports Medium & Large variants) */
          <motion.div
            key="windowed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col w-full"
          >
            <div className={`rounded-[2rem] shadow-3xl overflow-hidden flex flex-col flex-1 border transition-all duration-300 ${
              resolvedTheme === 'light'
                ? 'bg-[#FCFAF7] border-[#DFD7CB]'
                : resolvedTheme === 'high-contrast'
                ? 'bg-black border-2 border-white'
                : 'bg-slate-900/50 backdrop-blur-2xl border-white/10'
            }`}>
              
              {/* Window Controls Header Menu */}
              <div className={`px-6 py-3 flex items-center justify-between border-b transition-all duration-300 ${
                resolvedTheme === 'light'
                  ? 'bg-[#EDE7DE] border-[#DFD7CB] text-[#2C2421]'
                  : resolvedTheme === 'high-contrast'
                  ? 'bg-black border-white border-b-2 text-white'
                  : 'bg-black/40 border-white/10 text-slate-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    <button 
                      onClick={handleMinimizeToTray} 
                      className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center cursor-pointer text-[0px] hover:text-[8px] font-bold text-rose-950" 
                      title={translate(locale, 'app.closeToTray', customTranslations)}
                    >
                      ✕
                    </button>
                    <button 
                      onClick={handleMinimizeToTray} 
                      className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center cursor-pointer text-[0px] hover:text-[8px] font-bold text-yellow-950" 
                      title={translate(locale, 'app.minimizeToTray', customTranslations)}
                    >
                      －
                    </button>
                    <button 
                      className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center cursor-default text-[0px] hover:text-[8px] font-bold text-emerald-950" 
                      title={translate(locale, 'app.fullScreen', customTranslations)}
                    >
                      ⤢
                    </button>
                  </div>
                  <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${
                    resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'
                  }`}>
                    <Shield className="w-3.5 h-3.5 text-orange-500" />
                    oxytime.db [SQLite Daemon Thread] <span className={resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#8A7A71] font-normal'}>PID: {enginePID || translate(locale, 'app.searchingPid', customTranslations)}</span>
                  </span>
                </div>
                
                {/* Search / Daemon discovery state info box */}
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                  engineState === 'searching' 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-350 animate-pulse border border-amber-500/20' 
                    : resolvedTheme === 'light'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                }`}>
                  {engineState === 'searching' ? translate(locale, 'app.searchingEngine', customTranslations) : translate(locale, 'app.activeEngine', customTranslations)}
                </span>
              </div>

              {/* Windowed App Shell Navigation Menu */}
              <header className={`border-b transition-all duration-300 ${
                resolvedTheme === 'light'
                  ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]'
                  : resolvedTheme === 'high-contrast'
                  ? 'bg-black border-white border-b-2'
                  : 'bg-[#FCFAF8]/5 border-white/5'
              }`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                  
                  {/* Logo block */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-lg flex items-center justify-center text-white shrink-0">
                      <Layers className="w-5.5 h-5.5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-left">
                        <h1 className={`font-sans font-bold text-lg ${
                          resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'
                        }`}>LogTime by OxyFlow</h1>
                        <span className="text-[9px] bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-bold font-mono">v0.2</span>
                      </div>
                      <p className={`text-[10px] text-left ${
                        resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'
                      }`}>{translate(locale, 'app.subtitle', customTranslations)}</p>
                    </div>
                  </div>

                  {/* GUI Size Selector & Theme selectors */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    
                    {/* GUI Size variants selector */}
                    <div className={`flex p-1 rounded-xl border transition-all duration-300 ${
                      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
                    }`}>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9B8C83] self-center px-2 hidden md:inline-block">GUI:</span>
                      {(['small', 'medium', 'large'] as const).map(sz => {
                        const isActive = guiVariant === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => {
                              setGuiVariant(sz);
                              showToast(`${translate(locale, 'app.sizeChanged', customTranslations)} ${sz.toUpperCase()}`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                              isActive
                                ? resolvedTheme === 'light'
                                  ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow-sm font-bold'
                                  : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
                                : resolvedTheme === 'light'
                                ? 'text-[#8A7A71] hover:text-[#2C2421] hover:bg-[#FCFAF8]/50'
                                : 'text-[#9B8C83] hover:text-white'
                            }`}
                          >
                            {sz === 'small' ? translate(locale, 'app.sizeSmall', customTranslations) : sz === 'medium' ? translate(locale, 'app.sizeMedium', customTranslations) : translate(locale, 'app.sizeLarge', customTranslations)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Theme Swappers */}
                    <div className={`flex items-center p-1 rounded-xl border w-full sm:w-auto transition-all duration-300 ${
                      resolvedTheme === 'light'
                        ? 'bg-[#EAE4DB] border-[#DFD7CB] shadow-inner'
                        : resolvedTheme === 'high-contrast'
                        ? 'bg-black border-white border-2'
                        : 'bg-slate-950/40 border-white/10'
                    }`}>
                      {(['dark', 'light', 'high-contrast', 'system'] as const).map(th => {
                        const isActive = theme === th;
                        return (
                          <button
                            key={th}
                            onClick={() => setTheme(th)}
                            className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isActive
                                ? resolvedTheme === 'light'
                                  ? 'bg-[#FCFAF8] text-[#2C2421] shadow-sm border border-[#DFD7CB]'
                                  : resolvedTheme === 'high-contrast'
                                  ? 'bg-[#FCFAF8] text-black font-extrabold'
                                  : 'bg-[#FCFAF8]/15 text-white border border-white/10'
                                : resolvedTheme === 'light'
                                ? 'text-[#8A7A71] hover:text-[#2C2421]'
                                : 'text-[#9B8C83] hover:text-white'
                            }`}
                            title={`Styl: ${th}`}
                          >
                            {th === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                            {th === 'light' && <Sun className="w-3.5 h-3.5 text-orange-400 font-bold" />}
                            {th === 'high-contrast' && <Eye className="w-3.5 h-3.5 text-rose-400" />}
                            {th === 'system' && <Laptop className="w-3.5 h-3.5 text-teal-400" />}
                            <span className="hidden xl:inline ml-0.5">
                              {th === 'dark' ? translate(locale, 'app.themeDark', customTranslations) : th === 'light' ? translate(locale, 'app.themeLight', customTranslations) : th === 'high-contrast' ? translate(locale, 'app.themeHighContrast', customTranslations) : translate(locale, 'app.themeSystem', customTranslations)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Language Switcher */}
                    <div className={`flex items-center p-1 rounded-xl border w-full sm:w-auto transition-all duration-300 ${
                      resolvedTheme === 'light'
                        ? 'bg-[#EAE4DB] border-[#DFD7CB] shadow-inner'
                        : resolvedTheme === 'high-contrast'
                        ? 'bg-black border-white border-2'
                        : 'bg-slate-950/40 border-white/10'
                    }`}>
                      <Languages className="w-3.5 h-3.5 text-blue-400 ml-2 mr-1" />
                      {(['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as LocaleType[]).map(lang => {
                        const isActive = localePref === lang;
                        return (
                          <button
                            key={lang}
                            onClick={() => setLocalePref(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                              isActive
                                ? resolvedTheme === 'light'
                                  ? 'bg-[#FCFAF8] text-blue-600 shadow-sm border border-[#DFD7CB]'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : resolvedTheme === 'light'
                                ? 'text-[#8A7A71] hover:text-[#2C2421] hover:bg-[#FCFAF8]/50'
                                : 'text-[#9B8C83] hover:text-white hover:bg-[#FCFAF8]/10'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </header>

              {/* Render dynamic subheadings and specific 6-Tab bar IF DUŻY GUI */}
              {guiVariant === 'large' && (
                <div className={`border-b transition-all duration-300 ${
                  resolvedTheme === 'light' ? 'bg-[#EAE4DB]/50 border-[#DFD7CB]' : 'bg-black/35 border-white/5'
                }`}>
                  <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
                    <div className="flex gap-1.5 py-2.5 whitespace-nowrap min-w-max">
                      {[
  { id: 'main', icon: Clock, iconColor: 'text-orange-400', label: translate(locale, 'tabs.main', customTranslations) },
  { id: 'reports', icon: BarChart, iconColor: 'text-teal-400', label: translate(locale, 'tabs.reports', customTranslations) },
  { id: 'db', icon: Database, iconColor: 'text-indigo-400', label: translate(locale, 'tabs.db', customTranslations) },
  { id: 'options', icon: Settings, iconColor: 'text-yellow-400', label: translate(locale, 'tabs.options', customTranslations) },
  { id: 'backup', icon: UploadCloud, iconColor: 'text-emerald-400', label: translate(locale, 'tabs.backup', customTranslations) },
  { id: 'cli', icon: Terminal, iconColor: 'text-[#9B8C83]', label: translate(locale, 'tabs.cli', customTranslations) },
  { id: 'manual', icon: BookOpen, iconColor: 'text-rose-400', label: translate(locale, 'tabs.manual', customTranslations) },
  { id: 'credits', icon: Sparkles, iconColor: 'text-sky-400', label: translate(locale, 'tabs.credits', customTranslations) }
].map(tb => {
                        const isActive = activeLargeTab === tb.id;
                        return (
                          <button
                            key={tb.id}
                            onClick={() => setActiveLargeTab(tb.id as any)}
                            data-testid={`tab-${tb.id}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer capitalize ${
                              isActive
                                ? resolvedTheme === 'light'
                                  ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow font-extrabold'
                                  : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-extrabold'
                                : resolvedTheme === 'light'
                                ? 'text-[#8A7A71] hover:text-[#2C2421] hover:bg-[#F4EFEA]'
                                : 'text-[#9B8C83] hover:text-white hover:bg-[#FCFAF8]/5'
                            }`}
                          >
                            <tb.icon className={`w-4 h-4 ${tb.iconColor} ${isActive ? 'animate-pulse' : ''}`} />
                            <span>{tb.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Main App Workspace Content inside OS Window */}
              <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 z-10 flex flex-col gap-6">

                {/* Simulated Engine Finder Status alert if scanning, otherwise silent/slim status bar */}
                {engineState === 'searching' ? (
                  <motion.div 
                    id="engine-searching-alert"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs rounded-2xl p-4 flex items-center gap-3 animate-pulse"
                  >
                    <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                    <div className="flex-1 text-left">
                      <strong className="text-white">{getTranslation(locale, 'searchingEngine', customTranslations)}</strong>
                      <p className="text-[10px] text-[#9B8C83] mt-0.5">{getTranslation(locale, 'connectingSqlite', customTranslations)}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    id="engine-ready-status-bar"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-emerald-500/5 border border-emerald-500/10 text-xs rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}
                  >
                    <div className="flex items-start md:items-center gap-2.5 text-left">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-505 animate-ping mt-1 md:mt-0 shrink-0"></div>
                      <p className={`text-[11px] leading-relaxed ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                        {getTranslation(locale, 'connectedDaemon', customTranslations)} (PID: <strong className={`font-mono ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{enginePID}</strong>). <br className="hidden sm:inline md:hidden" />
                        {getTranslation(locale, 'engineSynced', customTranslations)} <strong className="text-emerald-500 font-mono">{activeRunningLogs.length}</strong> {getTranslation(locale, 'parallelThreads', customTranslations)}
                      </p>
                    </div>
                    <button
                      id="minimize-tray-shortcut"
                      onClick={handleMinimizeToTray}
                      className={`text-[10px] border px-3 py-1.5 rounded-xl flex items-center shrink-0 justify-center gap-1.5 transition-all cursor-pointer font-mono w-full sm:w-auto font-semibold ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] hover:bg-slate-50 text-slate-700 hover:text-[#2C2421] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-slate-300 hover:text-white border-white/10'}`}
                    >
                      <Minimize2 className="w-3 h-3 text-orange-400" /> {getTranslation(locale, 'minimizeToTray', customTranslations)}
                    </button>
                  </motion.div>
                )}

                {/* Displaying Rendered Component based on active variant & large tab */}
                <div id="tab-viewport" className="min-h-[480px]">
                  
                  {/* TRYB ŚREDNI (Medium Condensed GUI) - Renders simplified task flow without sidebars */}
                  {guiVariant === 'medium' && (
                    <div className={`flex flex-col gap-6 max-w-[440px] mx-auto p-4 rounded-[2rem] border shadow-2xl pb-10 transition-colors ${
                      resolvedTheme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB] shadow-orange-900/5' : 'bg-black/20 border-white/10'
                    }`}>
                      <div className={`text-center border-b pb-4 ${resolvedTheme === 'light' ? 'border-[#DFD7CB]' : 'border-white/5'}`}>
                        <h2 className={`text-base font-bold flex items-center justify-center gap-2 ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                          <Clock className="w-4 h-4 text-orange-400" />
                          <span>Pulpit OxyFlow (Mobile/Kompakt)</span>
                        </h2>
                        <p className={`text-[10px] mt-1 ${resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>
                          Skondensowany tryb śledzenia czasu, symulujący układ pionowy aplikacji.
                        </p>
                      </div>

                      <GuiInterface
                        projects={projects}
                        tasks={tasks}
                        logs={logs}
                        activeLog={activeLog}
                        onAddProject={handleAddProject}
                        onAddTask={handleAddTask}
                        onToggleTaskComplete={handleToggleTaskComplete}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onToggleProjectArchive={handleToggleProjectArchive}
                        nowIso={nowIso}
                        locale={locale}
                        customTranslations={customTranslations}
                        theme={resolvedTheme}
                        holidays={holidays}
                        setHolidays={setHolidays}
                        patches={patches}
                        sysSettings={sysSettings}
                        selectedTaskId={selectedTaskId}
                        setSelectedTaskId={setSelectedTaskId}
                        isCondensed={true}
                      />
                    </div>
                  )}

                  {/* TRYB DUŻY (Large Segmented GUI) - Renders the 6 specific tabs */}
                  {guiVariant === 'large' && (
                    <AnimatePresence mode="wait">
                      
                      {/* TAB 1: główne zarządzanie czasem */}
                      {activeLargeTab === 'main' && (
                        <motion.div key="large-tab-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <GuiInterface
                            projects={projects}
                            tasks={tasks}
                            logs={logs}
                            activeLog={activeLog}
                            onAddProject={handleAddProject}
                            onAddTask={handleAddTask}
                            onToggleTaskComplete={handleToggleTaskComplete}
                            onStartTimer={handleStartTimer}
                            onStopTimer={handleStopTimer}
                            onToggleProjectArchive={handleToggleProjectArchive}
                            nowIso={nowIso}
                            locale={locale}
                            customTranslations={customTranslations}
                            theme={resolvedTheme}
                            holidays={holidays}
                            setHolidays={setHolidays}
                        patches={patches}
                        sysSettings={sysSettings}
                            selectedTaskId={selectedTaskId}
                            setSelectedTaskId={setSelectedTaskId}
                          />
                        </motion.div>
                      )}

                      {/* TAB 2: cli console handler */}
                      {activeLargeTab === 'cli' && (
                        <motion.div key="large-tab-cli" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <CliInterface
                            projects={projects}
                            tasks={tasks}
                            logs={logs}
                            activeLog={activeLog}
                            onAddProject={handleAddProject}
                            onAddTask={handleAddTask}
                            onToggleTaskComplete={handleToggleTaskComplete}
                            onStartTimer={handleStartTimer}
                            onStopTimer={handleStopTimer}
                            onToggleProjectArchive={handleToggleProjectArchive}
                            nowIso={nowIso}
                            locale={locale}
                            customTranslations={customTranslations}
                            theme={resolvedTheme}
                            holidays={holidays}
                            setHolidays={setHolidays}
                        patches={patches}
                        sysSettings={sysSettings}
                            selectedTaskId={selectedTaskId}
                            setSelectedTaskId={setSelectedTaskId}
                          />
                        </motion.div>
                      )}

                                            {activeLargeTab === 'reports' && (
                        <motion.div key="large-tab-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <GuiInterface
                            projects={projects}
                            tasks={tasks}
                            logs={logs}
                            activeLog={activeLog}
                            onAddProject={handleAddProject}
                            onAddTask={handleAddTask}
                            onToggleTaskComplete={handleToggleTaskComplete}
                            onStartTimer={handleStartTimer}
                            onStopTimer={handleStopTimer}
                            onToggleProjectArchive={handleToggleProjectArchive}
                            nowIso={nowIso}
                            locale={locale}
                            customTranslations={customTranslations}
                            theme={resolvedTheme}
                            holidays={holidays}
                            setHolidays={setHolidays}
                            patches={patches}
                            sysSettings={sysSettings}
                            selectedTaskId={selectedTaskId}
                            setSelectedTaskId={setSelectedTaskId}
                            activeView="reports"
                          />
                        </motion.div>
                      )}

                      {/* TAB 3: podejrzenie bazy SQLite schema state microORM */}
                      {activeLargeTab === 'db' && (
                        <motion.div key="large-tab-db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <DbExplorer />
                        </motion.div>
                      )}

                      {activeLargeTab === 'backup' && (
                        <motion.div key="large-tab-backup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <BackupTab />
                        </motion.div>
                      )}

                      {/* TAB 4: opcje theme switcher, language dictionary keys editor, SQL hard reset */}
                      {activeLargeTab === 'options' && (
                        <motion.div key="large-tab-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <SettingsTab />
                        </motion.div>
                      )}

                                            {/* TAB 5: instrukcja */}
                      {activeLargeTab === 'manual' && (
                        <motion.div key="large-tab-manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <ManualTab />
                        </motion.div>
                      )}

                      {/* TAB 6: podziękowania */}
                      {activeLargeTab === 'credits' && (
                        <motion.div key="large-tab-credits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <CreditsTab />
                        </motion.div>
                      )}

                      </AnimatePresence>
                  )}

                </div>

              </main>

              {/* OS Window Footer controls */}
              <footer className="mt-auto bg-black/50 border-t border-white/10 py-5 px-6 text-center text-[10px] text-[#8A7A71] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <p>OxyFlowOS Environment — SQLite MicroORM</p>
                  <span className="text-white/20 select-none">•</span>
                  <button
                    id="trigger-credits-modal-btn"
                    onClick={() => setShowCreditsModal(true)}
                    className="text-teal-400 hover:text-teal-300 font-bold underline transition-colors cursor-pointer"
                  >
                    {translate(locale, 'dynamic.mITLicenseCreditsOxyFlow', customTranslations)}
                  </button>
                </div>
                <div className="flex gap-4">
                  <span>Silnik: <strong className="text-[#9B8C83] font-semibold">Ready</strong></span>
                  <button 
                    id="db-clean-force-btn"
                    onClick={handleResetLocalStorage}
                    className="text-orange-450 hover:text-orange-350 font-bold transition-all cursor-pointer"
                  >
                    Wyczyść Baze (SQL Reset)
                  </button>
                </div>
              </footer>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern interactive MIT License and Credits modal */}
      <AnimatePresence>
        {showCreditsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              id="credits-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-2xl rounded-[2.5rem] border shadow-2xl p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto ${
                resolvedTheme === 'light'
                  ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                  : resolvedTheme === 'high-contrast'
                  ? 'bg-black border-2 border-white text-white'
                  : 'bg-slate-950 border-white/10 text-white'
              }`}
            >
              <button
                id="close-credits-modal-btn"
                onClick={() => setShowCreditsModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-2xl transition-colors cursor-pointer ${
                  resolvedTheme === 'light' ? 'hover:bg-[#EAE4DB] text-[#5A4A42]' : 'hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
                }`}
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="border-b pb-4 border-white/10">
                <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
                  Credits • Acknowledgements • MIT License
                </span>
                <h3 className={`font-sans font-bold text-2xl mt-2 flex items-center gap-2 ${
                  resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'
                }`}>
                  <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
                  {translate(locale, 'dynamic.aboutFlowCreditsMIT', customTranslations)}
                </h3>
              </div>

              {/* Section 1: OxyFlow creator bio */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                  🕺 {translate(locale, 'dynamic.aBOUTCREATORVIBECODINGVIBE', customTranslations)}
                </h4>
                <div className={`p-5 rounded-3xl border transition-all ${
                  resolvedTheme === 'light'
                    ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
                    : 'bg-[#FCFAF8]/5 border-white/10 text-slate-200'
                }`}>
                  <p className="font-sans text-sm leading-relaxed mb-3">
                    {locale === 'pl' ? (
                      <>
                        Aplikacja stworzona przez <strong className="text-orange-400">vibe coding</strong> przez <strong className="text-teal-400">OxyFlow</strong>.
                      </>
                    ) : (
                      <>
                        This application was engineered through <strong className="text-orange-400">vibe coding</strong> by <strong className="text-teal-400 font-extrabold">OxyFlow</strong>.
                      </>
                    )}
                  </p>
                  <p className="font-sans text-xs leading-relaxed text-[#9B8C83]">
                    {locale === 'pl' ? (
                      <>
                        Nie taki zły tancerz <span className="text-orange-300 font-semibold">Zouka</span> (brazylijskiego), ale też <span className="text-teal-300 font-semibold">Kizomby</span> i <span className="text-pink-300 font-semibold">Bachaty</span>, a do tego cały czas uczy się i rozwija w <span className="text-yellow-300 font-semibold">Salsie NY</span>. Posiada ponad <strong className="text-white font-extrabold">10+ lat doświadczenia</strong> jako programista, a obecnie realizuje się zawodowo jako <strong className="text-white font-semibold">architekt oprogramowania</strong> oraz lider zespołu IT.
                      </>
                    ) : (
                      <>
                        A quite passionate dancer of Brazilian <span className="text-orange-300 font-semibold">Zouk</span>, <span className="text-teal-300 font-semibold">Kizomba</span>, <span className="text-pink-300 font-semibold">Bachata</span>, and continuously perfecting his steps in <span className="text-yellow-300 font-semibold">Salsa NY style</span>. Professionally, he boasts over <strong className="text-white font-extrabold">10+ years of active software developer experience</strong>, currently operating as a high-performance <strong className="text-white font-semibold">software architect</strong> and IT development team lead.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Section 2: Component Creators Credits thanking them */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                    💖 {translate(locale, 'dynamic.cOMPONENTCREATORSACKNOWLEDGEME', customTranslations)}
                  </h4>
                  <ul className={`p-4 rounded-3xl border list-disc pl-5 text-xs flex flex-col gap-1.5 leading-relaxed ${
                    resolvedTheme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/5 border-white/5 text-slate-300'
                  }`}>
                    <li><strong className="text-orange-400">Lucide React</strong>: {translate(locale, 'dynamic.forGorgeousConsistentVectorIco', customTranslations)}</li>
                    <li><strong className="text-orange-400">Motion / Framer Motion</strong>: {translate(locale, 'dynamic.forCinematicReactiveStateTrans', customTranslations)}</li>
                    <li><strong className="text-orange-400">Tailwind CSS v4</strong>: {translate(locale, 'dynamic.forRapidElegantResponsiveUtili', customTranslations)}</li>
                    <li><strong className="text-orange-400">Vite & React 18</strong>: {translate(locale, 'dynamic.forImmediateDevIterationsAndSo', customTranslations)}</li>
                  </ul>
                </div>

                {/* Section 3: The MIT license itself */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                    📄 {translate(locale, 'dynamic.mITLICENSE', customTranslations)}
                  </h4>
                  <div className={`p-4 rounded-3xl border text-[9px] font-mono leading-relaxed h-[120px] overflow-y-auto ${
                    resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42] shadow-inner' : 'bg-black/40 border-white/5 text-[#9B8C83]'
                  }`}>
                    <p className="font-bold mb-1">MIT License</p>
                    <p className="mb-2">Copyright (c) 2026 OxyFlow</p>
                    <p className="mb-2">
                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:
                    </p>
                    <p className="mb-2">
                      The above copyright notice and this permission notice shall be included in all
                      copies or substantial portions of the Software.
                    </p>
                    <p>
                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                      SOFTWARE.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer dismiss button */}
              <div className="flex justify-end gap-2 border-t pt-4 border-white/10 mt-2">
                <button
                  id="close-credits-overlay-btn"
                  onClick={() => setShowCreditsModal(false)}
                  className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl px-5 py-2.5 hover:opacity-95 transition-opacity cursor-pointer shadow-md"
                >
                  {translate(locale, 'dynamic.greatClose', customTranslations)}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating System Taskbar tray restoring dot on margins if minimized to let user easily restore */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
          <button
            id="tray-dot-restore-button"
            onClick={() => {
              setIsMinimized(false);
              showToast("Interfejs OxyFlow przywrócony.");
            }}
            className="w-14 h-14 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/20 cursor-pointer transform hover:scale-110 active:scale-95 transition-all"
            title="Przywróć Interfejs OxyFlow"
          >
            <AppWindow className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

    </div>
    </OxyContext.Provider>
  );
}
