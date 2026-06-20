import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLocale } from '../providers/LocaleProvider';
import { Project, Task, TimeLog, HolidayLeave, PatchLog, Settings as AppSettings, FrontendEvent } from '../types';
import { GuiSize } from '../bindings/GuiSize';
import { TextAndIconSize } from '../bindings/TextAndIconSize';
import { AlwaysOnTopConfig } from '../bindings/AlwaysOnTopConfig';
import { DataManager } from '../utils/dataManager';
import { translate } from '../utils/i18n';
import { getTranslation } from '../utils/translations';

const LOCAL_STORAGE_KEY = 'oxytime_state_db_6';

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

const handleSetGuiSize = async (size: GuiSize, textIconSize: TextAndIconSize) => {
  if (!isTauri()) return;
  try {
    await invoke('set_gui_size', { size, textAndIconSize: textIconSize });
  } catch (err) {
    console.error('Tauri resize error:', err);
  }
};

const handleWindowAlwaysOnTop = async (onTop: boolean) => {
  if (!isTauri()) return;
  try {
    await invoke('set_always_on_top', { alwaysOnTop: onTop });
  } catch (err) {
    console.error('Tauri always on top error:', err);
  }
};

export const useOxyAppState = () => {
  const [activeTab, setActiveTab] = useState<'gui' | 'cli' | 'rust'>('gui');

  const { localePref, setLocalePref, locale, setLocale, customTranslations, setCustomTranslations } = useLocale();

  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast' | 'system'>(() => {
    const saved = localStorage.getItem('oxytime_theme');
    return (saved as any) || 'system';
  });

  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>(() => {
    const saved = localStorage.getItem('oxytime_text_icon_size');
    return (saved as TextAndIconSize) || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_text_icon_size', textAndIconSize);
  }, [textAndIconSize]);

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

  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);

  const [guiSize, setGuiSize] = useState<GuiSize>(() => {
    return (localStorage.getItem('oxytime_gui_variant') as GuiSize) || 'large';
  });

  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(() => {
    return localStorage.getItem('oxytime_always_on_top_small') === 'true';
  });

  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(() => {
    return localStorage.getItem('oxytime_always_on_top_main') === 'true';
  });

  const [lastNonSmallVariant, setLastNonSmallVariant] = useState<Exclude<GuiSize, 'small'>>(() => {
    const saved = localStorage.getItem('oxytime_last_non_small_variant');
    return (saved as Exclude<GuiSize, 'small'>) || 'large';
  });

  const getAlwaysOnTopConfig = (): AlwaysOnTopConfig => {
    return {
      small: alwaysOnTopSmall,
      main: alwaysOnTopMain,
    };
  };

  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits'>('main');

  const [isSmallExpanded, setIsSmallExpanded] = useState<boolean>(true);

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('oxytime_current_proj_id') || '1';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_sys_settings', JSON.stringify(sysSettings));
  }, [sysSettings]);

  useEffect(() => {
    localStorage.setItem('oxytime_gui_variant', guiSize);
    if (guiSize !== 'small') {
      setLastNonSmallVariant(guiSize);
      localStorage.setItem('oxytime_last_non_small_variant', guiSize);
    }
  }, [guiSize]);

  useEffect(() => {
    localStorage.setItem('oxytime_always_on_top_small', String(alwaysOnTopSmall));
    localStorage.setItem('oxytime_always_on_top_main', String(alwaysOnTopMain));
  }, [alwaysOnTopSmall, alwaysOnTopMain]);

  useEffect(() => {
    const applyWindowConfig = async () => {
      await handleSetGuiSize(guiSize, textAndIconSize);
      await new Promise(resolve => setTimeout(resolve, 50));
      if (guiSize !== 'small') {
        await handleWindowAlwaysOnTop(alwaysOnTopMain);
      } else {
        await handleWindowAlwaysOnTop(alwaysOnTopSmall);
      }
    };
    applyWindowConfig();
  }, [guiSize, textAndIconSize, alwaysOnTopSmall, alwaysOnTopMain]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('oxytime_current_proj_id', currentProjectId);
    }
  }, [currentProjectId]);

  const [editingTranslationKey, setEditingTranslationKey] = useState<string | null>(null);
  const [editingTranslationValue, setEditingTranslationValue] = useState<string>('');

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [trayNotification, setTrayNotification] = useState<string | null>(null);

  const [engineState, setEngineState] = useState<'searching' | 'connected'>('searching');
  const [enginePID, setEnginePID] = useState<number>(0);

  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(() => localStorage.getItem('oxytime_min_to_tray') !== 'false');
  const [logToApi, setLogToApi] = useState<boolean>(() => localStorage.getItem('oxytime_log_to_api') === 'true');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('oxytime_api_token') || '');
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem('oxytime_api_url') || '');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT'>(() => (localStorage.getItem('oxytime_api_method') as 'POST' | 'PUT') || 'POST');
  const [apiHeaders, setApiHeaders] = useState<string>(() => localStorage.getItem('oxytime_api_headers') || '');

  const [isGuiClosed, setIsGuiClosed] = useState<boolean>(false);
  
  const [isMediumHeaderOpen, setIsMediumHeaderOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('oxytime_min_to_tray', String(minimizeToTray));
    localStorage.setItem('oxytime_log_to_api', String(logToApi));
    localStorage.setItem('oxytime_api_token', apiToken);
    localStorage.setItem('oxytime_api_url', apiUrl);
    localStorage.setItem('oxytime_api_method', apiMethod);
    localStorage.setItem('oxytime_api_headers', apiHeaders);

    if (isTauri()) {
      invoke('set_minimize_to_tray', { minimize: minimizeToTray }).catch(err => {
        console.error('Failed to sync minimizeToTray with Rust:', err);
      });
    }
  }, [minimizeToTray, logToApi, apiToken, apiUrl, apiMethod, apiHeaders]);

  const [nowIso, setNowIso] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        console.warn('Failed parsing local LogTime by OxyFlow store', err);
      }
    }

    const initProjects: Project[] = [
      { id: '1', name: 'LogTime by OxyFlow Backend Engine', color: 'violet', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
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

  useEffect(() => {
    if (isInitialized) {
      const stateObj = { projects, tasks, logs, activeLog, holidays, patches };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
    }
  }, [projects, tasks, logs, activeLog, holidays, patches, isInitialized]);

  useEffect(() => {
    if (projects.length > 0 && engineState === 'searching') {
      const timer = setTimeout(() => {
        setEngineState('connected');
        setEnginePID(Math.floor(2000 + Math.random() * 7000));
        
        const runningLogs = logs.filter(l => l.endTime === null);
        if (runningLogs.length > 0) {
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

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, name: newName };
      }
      return p;
    }));
  };

  const handleRenameTask = (taskId: string, newName: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, name: newName };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => {
      const tasksToDelete = new Set([taskId]);
      prev.forEach(t => {
        if (t.parentTaskId === taskId) {
          tasksToDelete.add(t.id);
        }
      });
      return prev.filter(t => !tasksToDelete.has(t.id));
    });
    setLogs(prev => prev.filter(l => l.taskId !== taskId && !tasks.find(t => t.parentTaskId === taskId && t.id === l.taskId)));
    if (activeLog && (activeLog.taskId === taskId || tasks.find(t => t.parentTaskId === taskId && t.id === activeLog.taskId))) {
      setActiveLog(null);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedState = !t.completed;
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

    const isCurrentlyRunning = logs.some(l => l.taskId === taskId && l.endTime === null);
    if (isCurrentlyRunning) {
      setLogs(currLogs => 
        currLogs.map(l => {
          if (l.taskId === taskId && l.endTime === null) {
            const payloadStop = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
            pushToApi(payloadStop, `Terminating ${l.id}`);
            return { ...l, endTime: new Date().toISOString() };
          }
          return l;
        })
      );
      if (activeLog?.taskId === taskId) {
        setActiveLog(null);
      }
      return;
    }

    const motherTaskId = task.parentTaskId;

    const updatedLogs = logs.map(l => {
      if (l.endTime === null) {
        if (motherTaskId && l.taskId === motherTaskId) {
          return l;
        }
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

    let logsToSet = [...updatedLogs, newLog];

    let motherLog = null;
    if (motherTaskId) {
       const isMotherRunning = logsToSet.some(l => l.taskId === motherTaskId && l.endTime === null);
       if (!isMotherRunning) {
          const motherTask = tasks.find(t => t.id === motherTaskId);
          if (motherTask) {
             motherLog = {
               id: DataManager.getNextId(logsToSet, 'log_m_'),
               taskId: motherTaskId,
               projectId: motherTask.projectId,
               startTime: new Date().toISOString(),
               endTime: null,
             };
             const payloadStartM = { event: 'START', log: motherLog };
             pushToApi(payloadStartM, `Starting Mother Task ${motherLog.id}`);
             logsToSet = [...logsToSet, motherLog];
          }
       }
    }

    setLogs(logsToSet);
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

  const handleMinimizeToTray = async () => {
    if (isTauri()) {
      try {
        if (minimizeToTray) {
          await invoke('hide_window');
        } else {
          await invoke('exit_app');
        }
      } catch (err) {
        console.error('Tauri close/hide error:', err);
      }
    } else {
      if (minimizeToTray) {
        setIsMinimized(true);
        showToast(translate(locale, 'dynamic.oxyFlowMinimizedToTrayEngineKe', customTranslations));
      } else {
        setIsGuiClosed(true);
        showToast(translate(locale, 'dynamic.gUIClosedOxyFlowEngineLogsUISh', customTranslations));
      }
    }
  };

  const handleCloseWindow = async () => {
    if (isTauri()) {
      try {
        await invoke('close_window');
      } catch (err) {
        console.error('Tauri close error:', err);
      }
    } else {
      setIsGuiClosed(true);
    }
  };

  const handleMinimizeWindow = async () => {
    if (isTauri()) {
      try {
        await invoke('minimize_window');
      } catch (err) {
        console.error('Tauri minimize error:', err);
      }
    } else {
      setIsMinimized(true);
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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(translate(locale, 'dynamic.copiedToClipboard', customTranslations));
  };

  const guiSizeRef = useRef(guiSize);
  const minimizeToTrayRef = useRef(minimizeToTray);
  const alwaysOnTopSmallRef = useRef(alwaysOnTopSmall);
  const alwaysOnTopMainRef = useRef(alwaysOnTopMain);
  const localeRef = useRef(locale);
  const customTranslationsRef = useRef(customTranslations);
  const handleStopTimerRef = useRef(handleStopTimer);
  const showToastRef = useRef(showToast);

  useEffect(() => {
    guiSizeRef.current = guiSize;
    minimizeToTrayRef.current = minimizeToTray;
    alwaysOnTopSmallRef.current = alwaysOnTopSmall;
    alwaysOnTopMainRef.current = alwaysOnTopMain;
    localeRef.current = locale;
    customTranslationsRef.current = customTranslations;
    handleStopTimerRef.current = handleStopTimer;
    showToastRef.current = showToast;
  }, [guiSize, textAndIconSize, minimizeToTray, alwaysOnTopSmall, alwaysOnTopMain, locale, customTranslations, handleStopTimer, showToast]);

  useEffect(() => {
    let active = true;
    let unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      if (!isTauri()) return;
      try {
        const { listen } = await import('@tauri-apps/api/event');

        const uMax = await listen('native-window-maximized' satisfies FrontendEvent, () => {
          setGuiSize('large');
          showToastRef.current("Rozmiar zmieniony na DUŻY (Maksymalizacja)");
        });
        if (!active) { uMax(); } else { unlisteners.push(uMax); }

        const uRest = await listen('native-window-restored' satisfies FrontendEvent, () => {
          setGuiSize('large');
        });
        if (!active) { uRest(); } else { unlisteners.push(uRest); }



        // --- Tray menu event listeners ---
        const uVariant = await listen<GuiSize>('tray-set-gui-variant' satisfies FrontendEvent, async (event) => {
          const variant = event.payload;
          setGuiSize(variant);
          await handleSetGuiSize(variant, textAndIconSize);
          const flag = variant === 'small' ? alwaysOnTopSmallRef.current : alwaysOnTopMainRef.current;
          await handleWindowAlwaysOnTop(flag);
          showToastRef.current(`GUI: ${variant === 'small' ? 'Mały' : variant === 'medium' ? 'Średni' : 'Duży'}`);
        });
        if (!active) { uVariant(); } else { unlisteners.push(uVariant); }

        const uOnTop = await listen('tray-toggle-on-top' satisfies FrontendEvent, async () => {
          if (guiSizeRef.current === 'small') {
            const newVal = !alwaysOnTopSmallRef.current;
            setAlwaysOnTopSmall(newVal);
            await handleWindowAlwaysOnTop(newVal);
            showToastRef.current(newVal ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
          } else {
            const newVal = !alwaysOnTopMainRef.current;
            setAlwaysOnTopMain(newVal);
            await handleWindowAlwaysOnTop(newVal);
            showToastRef.current(newVal ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
          }
        });
        if (!active) { uOnTop(); } else { unlisteners.push(uOnTop); }

        const uStop = await listen('tray-stop-all-timers' satisfies FrontendEvent, () => {
          handleStopTimerRef.current();
          showToastRef.current(translate(localeRef.current, 'app.stoppedThreads', customTranslationsRef.current));
        });
        if (!active) { uStop(); } else { unlisteners.push(uStop); }

      } catch (err) {
        console.error('Tauri listener setup error:', err);
      }
    };

    setupListeners();

    return () => {
      active = false;
      unlisteners.forEach(un => un());
    };
  }, []);

  return {
    // Context States
    projects, setProjects,
    tasks, setTasks,
    logs, setLogs,
    activeLog, setActiveLog,
    holidays, setHolidays,
    patches, setPatches,
    sysSettings, setSysSettings,
    localePref, setLocalePref,
    locale, setLocale,
    theme, setTheme,
    resolvedTheme, setResolvedTheme,
    textAndIconSize, setTextAndIconSize,
    customTranslations, setCustomTranslations,
    engineState, setEngineState,
    enginePID, setEnginePID,
    minimizeToTray, setMinimizeToTray,
    alwaysOnTopSmall, setAlwaysOnTopSmall,
    alwaysOnTopMain, setAlwaysOnTopMain,
    logToApi, setLogToApi,
    apiToken, setApiToken,
    apiMethod, setApiMethod,
    apiHeaders, setApiHeaders,
    apiUrl, setApiUrl,
    nowIso, setNowIso,
    isGuiClosed, setIsGuiClosed,
    guiSize, setGuiSize,

    // Local / UI States
    activeTab, setActiveTab,
    selectedTaskId, setSelectedTaskId,
    showCreditsModal, setShowCreditsModal,
    alwaysOnTopConfig: getAlwaysOnTopConfig(),
    lastNonSmallVariant, setLastNonSmallVariant,
    activeLargeTab, setActiveLargeTab,
    isSmallExpanded, setIsSmallExpanded,
    currentProjectId, setCurrentProjectId,
    isMinimized, setIsMinimized,
    trayNotification, setTrayNotification,
    isMediumHeaderOpen, setIsMediumHeaderOpen,
    isInitialized, setIsInitialized,

    // Handlers
    handleAddProject,
    handleToggleProjectArchive,
    handleAddTask,
    handleRenameProject,
    handleRenameTask,
    handleDeleteTask,
    handleToggleTaskComplete,
    handleStartTimer,
    handleStopTimer,
    handleResetLocalStorage,
    showToast,
    handleMinimizeToTray,
    handleCloseWindow,
    handleMinimizeWindow,
    handleToggleTimer,
    handleCopyText,
  };
};
