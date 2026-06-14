import React, { useState } from 'react';
import { Project, Task, TimeLog, HolidayLeave } from '../types';
import { getProjectDurationSeconds, getTaskDurationSeconds, formatSeconds, formatFriendlyDuration } from '../utils';
import { 
  Play, 
  Square, 
  Plus, 
  Folder, 
  CheckSquare, 
  Square as EmptySquare,
  Clock, 
  ChevronRight, 
  Database,
  ArrowRight,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Tag,
  Calendar,
  BarChart3,
  CalendarDays,
  Trash2,
  BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { translate } from '../utils/i18n';
import { DataManager } from '../utils/dataManager';
import { LocaleType, TranslationDictionary, getTranslation } from '../utils/translations';

interface GuiInterfaceProps {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  onAddProject: (name: string, color: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  onToggleProjectArchive?: (projectId: string) => void;
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
  isCondensed?: boolean;
  activeView?: string;
}

export default function GuiInterface({
  projects,
  tasks,
  logs,
  activeLog,
  onAddProject,
  onAddTask,
  onToggleTaskComplete,
  onStartTimer,
  onStopTimer,
  onToggleProjectArchive,
  nowIso,
  locale,
  customTranslations,
  theme = 'dark',
  holidays,
  setHolidays,
  patches = [],
  sysSettings,
  selectedTaskId,
  setSelectedTaskId,
  isCondensed = false,
  activeView = 'tasks',
}: GuiInterfaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  
  
  // Holidays form state
  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayType, setNewHolidayType] = useState<'holiday' | 'leave'>('leave');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Report filters state
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [reportSort, setReportSort] = useState<'date' | 'duration'>('duration');
  
  // Forms state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('violet');
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string>(''); // For subtasks
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [showSubtaskFormForId, setShowSubtaskFormForId] = useState<string | null>(null);

  // Inspector state
  const [showDbInspector, setShowDbInspector] = useState(false);

  const th = {
    bgMuted: theme === 'light' ? 'bg-[#F4EFEA]' : 'bg-black/20',
    bgCard: theme === 'light' ? 'bg-[#FCFAF8]' : 'bg-[#FCFAF8]/5',
    textMain: theme === 'light' ? 'text-[#2C2421]' : 'text-white',
    textMuted: theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]',
    border: theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10',
    borderHl: theme === 'light' ? 'border-[#D0C5B5]' : 'border-white/20',
    shadow: theme === 'light' ? 'shadow-sm shadow-[#2C2421]/5' : 'shadow-lg shadow-black/50',
    bgBadge: theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-[#FCFAF8]/10'
  };


  const colors = [
    { name: 'rose', bg: 'bg-rose-500', hex: '#f43f5e', text: 'text-rose-500' },
    { name: 'teal', bg: 'bg-teal-500', hex: '#14b8a6', text: 'text-teal-500' },
    { name: 'amber', bg: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-500' },
    { name: 'violet', bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-500' },
    { name: 'indigo', bg: 'bg-indigo-500', hex: '#6366f1', text: 'text-indigo-500' },
    { name: 'emerald', bg: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-500' },
  ];

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProjectId) return;
    onAddTask(selectedProjectId, newTaskName.trim(), null);
    setNewTaskName('');
  };

  const handleAddSubtaskSubmit = (parentTaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || !selectedProjectId) return;
    onAddTask(selectedProjectId, newSubtaskName.trim(), parentTaskId);
    setNewSubtaskName('');
    setShowSubtaskFormForId(null);
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;
    const newH: HolidayLeave = {
      id: DataManager.getNextId(holidays, 'hol_'),
      date: newHolidayDate,
      type: newHolidayType,
      name: newHolidayName.trim()
    };
    setHolidays(prev => [...prev, newH]);
    setNewHolidayName('');
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectTasks = selectedProject 
    ? tasks.filter(t => t.projectId === selectedProject.id) 
    : [];

  const rootTasks = projectTasks.filter(t => t.parentTaskId === null);

  // Active task details for display
  const activeTask = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;

  return (
    <div id="gui-container" className={`grid grid-cols-1 ${isCondensed ? '' : 'lg:grid-cols-12'} gap-8 ${
      theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'
    }`}>
      
      {/* 1. Projects Sidebar - Left 4 Cols */}
      {!isCondensed && (
        <div id="projects-sidebar" className="lg:col-span-4 flex flex-col gap-6">
        <div className={`backdrop-blur-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
          <div className={`flex items-center justify-between mb-4 border-b pb-3 ${
            theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
          }`}>
            <h3 className={`font-sans font-semibold text-lg flex items-center gap-2 ${
              theme === 'light' ? 'text-[#2C2421]' : 'text-white'
            }`}>
              <Folder className="w-5 h-5 text-orange-400" />
              {translate(locale, 'dynamic.projects', customTranslations)} ({projects.length})
            </h3>
            <span className="text-[10px] bg-orange-500/20 border border-orange-500/30 text-orange-600 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
              MicroORM Tables
            </span>
          </div>

          {/* Quick Create Project */}
          <form onSubmit={handleAddProjectSubmit} className={`mb-6 p-3 rounded-2xl border transition-all ${
            theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
            <div className="flex flex-col gap-2">
              <input
                id="new-project-input"
                type="text"
                placeholder={getTranslation(locale, 'enterProjectName', customTranslations)}
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className={`w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all ${
                  theme === 'light'
                    ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                    : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
                }`}
              />
              <div className="flex items-center justify-between gap-1 mt-1">
                <div className="flex gap-1.5">
                  {colors.map(col => (
                    <button
                      id={`color-picker-${col.name}`}
                      key={col.name}
                      type="button"
                      onClick={() => setNewProjectColor(col.name)}
                      className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                        newProjectColor === col.name ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-80'
                      }`}
                    >
                      {newProjectColor === col.name && (
                        <span className="w-1.5 h-1.5 bg-[#FCFAF8] rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  id="add-project-btn"
                  type="submit"
                  className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> {getTranslation(locale, 'save', customTranslations)}
                </button>
              </div>
            </div>
          </form>

          {/* Project List */}
          <div id="projects-list-container" className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-[#9B8C83] text-xs font-sans">
                {translate(locale, 'dynamic.nenhumProjetoAindaAdicioneUmAc', customTranslations)}
              </div>
            ) : (
              projects.map(p => {
                const projColor = colors.find(c => c.name === p.color) || colors[0];
                const totalSeconds = getProjectDurationSeconds(p.id, tasks, logs, nowIso);
                const isSelected = selectedProjectId === p.id;
                
                return (
                  <div
                    id={`project-item-${p.id}`}
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`text-left w-full p-3.5 rounded-2xl flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer group ${
                      isSelected
                        ? theme === 'light'
                          ? 'bg-orange-50 border-l-4 border-l-orange-500 border border-[#DFD7CB]/80 shadow-sm'
                          : theme === 'high-contrast'
                          ? 'bg-black border-l-4 border-l-yellow-400 border-2 border-white'
                          : 'bg-[#FCFAF8]/10 border-l-4 border-l-orange-400 border border-white/15'
                        : theme === 'light'
                        ? 'bg-transparent border border-transparent hover:bg-[#EAE4DB] text-[#2C2421]'
                        : 'bg-transparent border border-transparent hover:bg-[#FCFAF8]/5'
                    } ${p.archived ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 z-10 animate-fade-in">
                      <span className={`w-3 h-3 rounded-full ${projColor.bg} shadow-md shadow-black/20`} />
                      <div>
                        <p className={`font-semibold text-sm ${
                          theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                        }`}>{p.archived && <span className="text-[10px] bg-red-500 text-white px-1 py-0.5 rounded mr-1 leading-none uppercase">{translate(locale, 'dynamic.archiveNoun', customTranslations)}</span>}{p.name}</p>
                        <p className={`text-[10px] font-sans tracking-wide flex items-center gap-2 ${
                          theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'
                        }`}>
                          {translate(locale, 'dynamic.createdAtLabel', customTranslations)} {new Date(p.createdAt).toLocaleDateString()}
                          
                          {/* Archive Action button (appears on hover) */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleProjectArchive && onToggleProjectArchive(p.id);
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition duration-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              theme === 'light' ? 'bg-[#DFD7CB] text-[#5A4A42] hover:bg-red-500 hover:text-white' : 'bg-[#FCFAF8]/10 text-slate-300 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            {p.archived ? translate(locale, 'dynamic.unarchive', customTranslations) : translate(locale, 'dynamic.archive', customTranslations)}
                          </button>
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 z-10 font-mono text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                      theme === 'light'
                        ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#5A4A42]'
                        : theme === 'high-contrast'
                        ? 'bg-black border-white text-white'
                        : 'bg-[#FCFAF8]/5 border-white/10 text-[#9B8C83]'
                    }`}>
                      <Clock className="w-3.5 h-3.5 text-orange-450" />
                      {formatSeconds(totalSeconds)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Wave Banner representing Zouk wave heartbeat */}
        <div className={`border rounded-3xl p-6 relative overflow-hidden shadow-2xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-gradient-to-tr from-orange-500/5 to-rose-500/5 border-[#DFD7CB]'
            : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-gradient-to-tr from-orange-500/10 to-rose-500/10 border-white/10 text-white'
        }`}>
          {/* Wave visual background decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d">
              <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium tracking-wide border ${
                theme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/10 border-white/10'
              }`}>{translate(locale, 'dynamic.countingEngine', customTranslations)}</span>
            </div>
            <h4 className={`font-sans font-bold text-lg mt-1 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-100'}`}>{translate(locale, 'dynamic.createdForRhythm', customTranslations)}</h4>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-[#7A6A61]' : 'text-slate-300'}`}>
              {translate(locale, 'dynamic.heroDescription', customTranslations)}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* 2. Tasks & Detailed Flow - Right 8 Cols */}
      <div id="tasks-main" className={`${isCondensed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6`}>
        
        {/* Active Timer Card - Gorgeous Floating Zouk Glow */}
        <AnimatePresence mode="wait">
          {activeLog ? (
            <motion.div
              id="active-timer-banner"
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className={`p-6 rounded-[2rem] border shadow-2xl flex flex-col ${isCondensed ? 'items-start' : 'sm:flex-row items-center justify-between'} gap-4 relative overflow-hidden backdrop-blur-md transition-all ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400/5 via-rose-500/5 to-orange-400/5 border-orange-500/30'
                  : 'bg-gradient-to-r from-orange-400/20 via-rose-500/20 to-orange-400/20 border-orange-400/30'
              }`}
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-32 bg-orange-450 rounded-full filter blur-xl animate-pulse"></div>
              </div>

              <div className={`flex items-center gap-4 z-10 ${isCondensed ? 'w-full' : 'sm:w-auto w-full'}`}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg animate-spin-slow shrink-0 ${
                    theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-orange-500' : 'bg-[#FCFAF8]/10 border-white/10 text-orange-450'
                  }`}>
                    <Clock className="w-6 h-6 animate-pulse text-orange-500" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold px-2 py-0.5 rounded-full font-mono uppercase whitespace-nowrap">
                      {getTranslation(locale, 'activeTracker', customTranslations)}
                    </span>
                    {activeProject && (
                      <span className={`text-xs font-semibold drop-shadow-sm flex items-center gap-1.5 truncate ${
                        theme === 'light' ? 'text-[#2C2421]' : 'text-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-[var(--project-color,orange)] shrink-0`} style={{ backgroundColor: activeProject.color ? `var(--tw-color-${activeProject.color}-500)` : undefined }} />
                        <span className="truncate">{activeProject.name}</span>
                      </span>
                    )}
                  </div>
                  <h4 className={`font-sans font-extrabold text-lg mt-1 leading-snug truncate ${
                    theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                  }`}>
                    {activeTask?.name}
                  </h4>
                </div>
              </div>

              <div className={`flex items-center gap-4 z-10 w-full ${isCondensed ? 'justify-between pt-4 border-t' : 'sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0'} ${
                theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
              }`}>
                <div className="text-right">
                  <p className={`text-[10px] font-semibold tracking-wider font-mono uppercase ${
                    theme === 'light' ? 'text-[#5A4A42]' : 'text-[#9B8C83]'
                  }`}>
                    {translate(locale, 'dynamic.registradoHoje', customTranslations)}
                  </p>
                  <p id="active-timer-display" className={`text-3xl font-extrabold tracking-tight font-mono ${
                    theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                  }`}>
                    {formatSeconds(getTaskDurationSeconds(activeTask?.id || '', tasks, logs, nowIso))}
                  </p>
                </div>
                <button
                  id="stop-timer-btn"
                  onClick={onStopTimer}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-4 transition-all duration-300 flex items-center justify-center shadow-lg transform active:scale-95 group cursor-pointer"
                >
                  <Square className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div id="active-timer-idle-banner" className={`backdrop-blur-md rounded-[2rem] p-6 border flex flex-col ${isCondensed ? 'gap-6' : 'md:flex-row items-center justify-between gap-4'} transition-all duration-300 ${
              theme === 'light'
                ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-sm shadow-[#DFD7CB]/50'
                : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 border rounded-xl flex items-center justify-center shrink-0 ${
                  theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
                }`}>
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className={`font-semibold text-sm leading-tight ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                    {translate(locale, 'dynamic.todosOsRastreadoresParados', customTranslations)}
                  </h4>
                  <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>
                    {translate(locale, 'dynamic.selecioneUmaTarefaAbaixoEJogue', customTranslations)}
                  </p>
                </div>
              </div>
              <div className={isCondensed ? 'w-full pt-4 border-t border-[#DFD7CB] dark:border-white/10 text-center' : 'text-right'}>
                <span className={`text-xs border px-3 py-1.5 rounded-full font-mono font-medium whitespace-nowrap inline-block ${
                  theme === 'light'
                    ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]'
                    : 'bg-[#FCFAF8]/5 text-slate-300 border-white/10'
                }`}>
                  {translate(locale, 'dynamic.idleSQLReady', customTranslations)}
                </span>
              </div>
            </div>
          )}
        </AnimatePresence>



        {/* Core Task Management Sheet for Current Selected Project */}
        {activeView === 'tasks' && (
          selectedProject ? (
          <div id="project-tasks-sheet" className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${
            theme === 'light'
              ? 'bg-[#FCFAF8] border-[#DFD7CB]'
              : theme === 'high-contrast'
              ? 'bg-black border-2 border-white'
              : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
            
            {/* Header with Title and Create Task Input */}
            <div>
              <div className={`flex flex-col ${isCondensed ? 'gap-4 items-start' : 'sm:flex-row sm:items-center justify-between gap-2'} border-b pb-4 mb-4 ${
                theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
              }`}>
                <div>
                  <span className={`text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25 ${isCondensed ? 'inline-block mb-1 whitespace-nowrap' : ''}`}>
                    {getTranslation(locale, 'selectProject', customTranslations)}
                  </span>
                  <h2 className={`font-sans font-bold mt-1.5 flex flex-wrap items-center gap-2 ${isCondensed ? 'text-xl' : 'text-2xl'} ${
                    theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                  }`}>
                    <span className={`w-3.5 h-3.5 rounded-full bg-[var(--project-color,orange)] shrink-0 shadow-md`} style={{ backgroundColor: selectedProject.color ? `var(--tw-color-${selectedProject.color}-500)` : undefined }} />
                    <span className="truncate">{selectedProject.name}</span>
                  </h2>
                </div>
                <div className={`text-left sm:text-right font-mono text-sm border px-3 py-1.5 rounded-2xl flex flex-wrap items-center gap-2 transition-all ${isCondensed ? 'w-full justify-between' : 'w-fit'} ${
                  theme === 'light'
                    ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]'
                    : theme === 'high-contrast'
                    ? 'bg-black border-white text-white'
                    : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="font-semibold">{translate(locale, 'dynamic.total', customTranslations)}:</span>
                  </div>
                  <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                    {formatSeconds(getProjectDurationSeconds(selectedProject.id, tasks, logs, nowIso))}
                  </span>
                </div>
              </div>

              {/* Add Root Task Form */}
              <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
                <input
                  id="new-task-input"
                  type="text"
                  placeholder={getTranslation(locale, 'enterMainTaskName', customTranslations)}
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  className={`flex-1 px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${
                    theme === 'light'
                      ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                      : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
                  }`}
                />
                <button
                  id="add-task-btn"
                  type="submit"
                  className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-semibold rounded-2xl px-5 py-3 text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{getTranslation(locale, 'addTask', customTranslations)}</span>
                </button>
              </form>
            </div>

            {/* Tree Grid List of Tasks & Subtasks */}
            <div id="tasks-tree-container" className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {rootTasks.length === 0 ? (
                <div className={`text-center py-16 border border-dashed rounded-[2rem] transition-all duration-300 ${
                  theme === 'light'
                    ? 'border-[#DFD7CB] text-[#8A7A71] bg-[#F4EFEA]/50'
                    : 'border-white/10 text-[#9B8C83]'
                }`}>
                  <Folder className="w-8 h-8 mx-auto text-[#9B8C83] mb-2" />
                  <p className="text-sm font-semibold">{getTranslation(locale, 'noTasksInProject', customTranslations)}</p>
                  <p className="text-xs text-[#8A7A71] mt-1">
                    {translate(locale, 'dynamic.createAMainProjectTaskAboveThe', customTranslations)}
                  </p>
                </div>
              ) : (
                rootTasks.map(rootTask => {
                  const subTasks = projectTasks.filter(t => t.parentTaskId === rootTask.id);
                  const rootDuration = getTaskDurationSeconds(rootTask.id, tasks, logs, nowIso);
                  
                  // Task itself is running
                  const isCurrentRunning = logs.some(l => l.taskId === rootTask.id && l.endTime === null);
                  // One of its children is running
                  const runningSubtask = subTasks.find(sub => logs.some(l => l.taskId === sub.id && l.endTime === null));
                  const isChildRunning = !!runningSubtask;
                  const isAnyRunning = isCurrentRunning || isChildRunning;

                  return (
                    <div 
                      id={`root-task-card-${rootTask.id}`}
                      key={rootTask.id} 
                      className={`rounded-3xl p-4 border transition-all flex flex-col gap-3 group/root relative overflow-hidden backdrop-blur-md ${
                        isAnyRunning 
                          ? theme === 'light'
                            ? 'bg-gradient-to-r from-orange-400/5 to-rose-500/5 border-orange-500/40 shadow-md text-[#2C2421]'
                            : 'bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-500/40 shadow-xl text-white' 
                          : theme === 'light'
                          ? 'bg-[#F4EFEA] border-[#DFD7CB]/80 hover:border-orange-500/25 hover:bg-[#EAE4DB] text-[#2C2421]'
                          : 'bg-[#FCFAF8]/5 border-white/10 hover:border-orange-500/25 hover:bg-[#FCFAF8]/10 text-white'
                      }`}
                    >
                      {isAnyRunning && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-rose-500" />
                      )}

                      {/* Root Task Info Line */}
                      <div className={`flex ${isCondensed ? 'flex-col gap-3' : 'items-center justify-between gap-4'} animate-fade-in pl-1`}>
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <button
                            id={`check-task-${rootTask.id}`}
                            onClick={() => onToggleTaskComplete(rootTask.id)}
                            className={`${th.textMuted} hover:text-orange-500 transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0`}
                          >
                            {rootTask.completed ? (
                              <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/10" />
                            ) : (
                              <EmptySquare className="w-5 h-5" />
                            )}
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <span className={`font-semibold text-sm flex flex-wrap items-center gap-2 transition-all duration-300 ${
                              rootTask.completed
                                ? 'line-through text-[#9B8C83] font-normal'
                                : theme === 'light'
                                ? 'text-[#2C2421]'
                                : 'text-slate-100'
                            }`}>
                              <span className="truncate break-all max-w-full">{rootTask.name}</span>
                              {isChildRunning && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-550/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                  <span className="truncate max-w-[120px]">{getTranslation(locale, 'subtaskLabel', customTranslations)}: {runningSubtask.name}</span>
                                </span>
                              )}
                              {isCurrentRunning && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                  {getTranslation(locale, 'inProgressLabel', customTranslations)}
                                </span>
                              )}
                            </span>
                            <span className={`text-[10px] font-mono block mt-0.5 whitespace-normal leading-tight ${
                              theme === 'light' ? 'text-[#8A7A71]' : 'text-[#9B8C83]'
                            }`}>
                              ID: {rootTask.id} • SQLite table entry {isAnyRunning ? '(Sygnał liczenia aktywny)' : ''}
                            </span>
                          </div>
                        </div>
                        {/* Controls & Metrics */}
                        <div className={`flex items-center gap-2 ${isCondensed ? 'w-full justify-between pt-2 border-t ' + (theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10') : ''}`}>
                          <span className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border transition-all ${
                            isAnyRunning 
                              ? 'bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-300 shadow-md scale-105 animate-pulse' 
                              : theme === 'light'
                              ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42]'
                              : 'bg-[#FCFAF8]/5 border-white/10 text-slate-200'
                          }`}>
                            {getTranslation(locale, 'counterLabel', customTranslations)}: {formatSeconds(rootDuration)}
                          </span>
 
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Start/Stop Button */}
                            {isCurrentRunning ? (
                              <button
                                id={`stop-btn-${rootTask.id}`}
                                onClick={() => onStopTimer(selectedProjectId || undefined)}
                                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer"
                                title="Stop"
                              >
                                <Square className="w-3.5 h-3.5 fill-white" />
                              </button>
                            ) : (
                              <button
                                id={`start-btn-${rootTask.id}`}
                                onClick={() => !rootTask.completed && onStartTimer(rootTask.id)}
                                disabled={rootTask.completed}
                                className={`rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer ${
                                  rootTask.completed 
                                    ? 'bg-[#FCFAF8]/5 text-[#9B8C83] border border-transparent cursor-not-allowed opacity-50' 
                                    : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
                                }`}
                                title="Rozpocznij"
                              >
                                <Play className="w-3.5 h-3.5 fill-white text-white" />
                              </button>
                            )}
  
                            {/* Toggle Add Subtask */}
                            <button
                              id={`show-subtask-form-btn-${rootTask.id}`}
                              onClick={() => setShowSubtaskFormForId(showSubtaskFormForId === rootTask.id ? null : rootTask.id)}
                              className={`rounded-xl px-2.5 py-2 text-[11px] font-semibold flex items-center gap-1 transition-all border cursor-pointer shrink-0 ${
                                theme === 'light'
                                  ? 'bg-[#EAE4DB] hover:bg-[#DFD7CB] text-[#5A4A42] border-[#DFD7CB]'
                                  : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/15 text-slate-200 hover:text-white border-white/10'
                              }`}
                              title={getTranslation(locale, 'addSubtask', customTranslations)}
                            >
                              <Plus className="w-3.5 h-3.5 text-orange-500" /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{getTranslation(locale, 'subtaskLabel', customTranslations)}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subtasks form trigger collapsible */}
                      <AnimatePresence>
                        {showSubtaskFormForId === rootTask.id && (
                          <motion.form
                            id={`subtask-form-${rootTask.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={(e) => handleAddSubtaskSubmit(rootTask.id, e)}
                            className={`p-2.5 rounded-2xl border flex gap-2 ml-8 mt-1 ${
                              theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
                            }`}
                          >
                            <input
                              id={`new-subtask-input-${rootTask.id}`}
                              type="text"
                              required
                              placeholder={translate(locale, 'dynamic.enterSubtaskName', customTranslations)}
                              value={newSubtaskName}
                              onChange={e => setNewSubtaskName(e.target.value)}
                              className={`flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${
                                theme === 'light'
                                  ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                                  : 'bg-slate-950 text-white border-white/10 placeholder-[#8A7A71]'
                              }`}
                            />
                            <button
                              id={`submit-subtask-btn-${rootTask.id}`}
                              type="submit"
                              className="bg-gradient-to-tr from-orange-400 to-rose-500 text-white text-xs font-semibold rounded-xl px-3 py-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                            >
                              {getTranslation(locale, 'save', customTranslations)}
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      {/* Subtasks Rendering */}
                      {subTasks.length > 0 && (
                        <div className={`flex flex-col gap-2 ml-8 border-l pl-4 mt-2 ${
                          theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
                        }`}>
                          {subTasks.map(subTask => {
                            const subDuration = getTaskDurationSeconds(subTask.id, tasks, logs, nowIso);
                            const isSubRunning = logs.some(l => l.taskId === subTask.id && l.endTime === null);

                            return (
                              <div 
                                id={`subtask-item-${subTask.id}`}
                                key={subTask.id} 
                                className={`flex ${isCondensed ? 'flex-col gap-2' : 'items-center justify-between gap-4'} py-1.5 px-3 rounded-xl group/sub transition-all ${
                                  isSubRunning 
                                    ? 'bg-orange-500/10 border border-orange-500/20' 
                                    : theme === 'light'
                                    ? 'hover:bg-[#EAE4DB]/80 border border-transparent text-[#2C2421]'
                                    : 'hover:bg-[#FCFAF8]/5 border border-transparent'
                                }`}
                              >
                                <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                                  <button
                                    id={`check-subtask-${subTask.id}`}
                                    onClick={() => onToggleTaskComplete(subTask.id)}
                                    className={`${th.textMuted} hover:text-orange-500 transition-colors cursor-pointer mt-0.5 sm:mt-0 shrink-0`}
                                  >
                                    {subTask.completed ? (
                                      <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10" />
                                    ) : (
                                      <EmptySquare className="w-4 h-4" />
                                    )}
                                  </button>
                                  
                                  <div className="min-w-0 flex-1">
                                    <span className={`text-xs font-semibold flex flex-wrap items-center gap-2 transition-all duration-300 ${
                                      subTask.completed
                                        ? 'line-through text-[#9B8C83] font-normal'
                                        : theme === 'light'
                                        ? 'text-[#2C2421]'
                                        : 'text-slate-200'
                                    }`}>
                                      <span className="truncate max-w-full break-all">{subTask.name}</span>
                                      {isSubRunning && (
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className={`flex items-center gap-2 ${isCondensed ? 'w-full justify-between pl-6' : ''}`}>
                                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                                    isSubRunning 
                                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold' 
                                      : theme === 'light'
                                      ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#7A6A61]'
                                      : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
                                  }`}>
                                    {formatSeconds(subDuration)}
                                  </span>

                                  {isSubRunning ? (
                                    <button
                                      id={`stop-subtask-btn-${subTask.id}`}
                                      onClick={() => onStopTimer(selectedProjectId || undefined)}
                                      className="bg-rose-500 text-white rounded-lg p-1.5 transition-colors cursor-pointer animate-pulse shrink-0"
                                    >
                                      <Square className="w-3 h-3 fill-white text-white" />
                                    </button>
                                  ) : (
                                    <button
                                      id={`start-subtask-btn-${subTask.id}`}
                                      onClick={() => !subTask.completed && onStartTimer(subTask.id)}
                                      disabled={subTask.completed}
                                      className={`text-[#9B8C83] hover:text-white rounded-lg p-1.5 transition-all cursor-pointer shrink-0 ${
                                        theme === 'light' ? 'bg-[#EAE4DB] group-hover/sub:bg-teal-500 text-[#5A4A42]' : 'bg-[#FCFAF8]/5 group-hover/sub:bg-teal-500'
                                      }`}
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all ${
            theme === 'light'
              ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
              : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
            <Folder className="w-12 h-12 text-[#9B8C83] mx-auto mb-3" />
            <h3 className={`text-base font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{translate(locale, 'dynamic.selectProject', customTranslations)}</h3>
            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>Zaznacz projekt w bocznym menu po lewej stronie, aby zacząć zarządzać czasem.</p>
          </div>
        ))}

        {/* Tab 3: Time Reports & Charts */}
        {activeView === 'reports' && (
          <div id="reports-panel" className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${
            theme === 'light'
              ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]'
              : theme === 'high-contrast'
              ? 'bg-black border-2 border-white'
              : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
            <div>
              <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
                {translate(locale, 'dynamic.sQLAnalyticsEngine', customTranslations)}
              </span>
              <h2 className={`font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 ${
                theme === 'light' ? 'text-[#2C2421]' : 'text-white'
              }`}>
                <BarChart3 className="w-6 h-6 text-orange-400" />
                {translate(locale, 'dynamic.timeSummariesReports', customTranslations)}
              </h2>
            </div>

            {/* Quick Aggregates Grid - Today, Week, Month */}
            {(() => {
              const now = new Date(nowIso);
              const startOfToday = new Date(now).setHours(0,0,0,0);
              
              const dWeek = new Date(now);
              const wDay = dWeek.getDay();
              const diffToMonday = dWeek.getDate() - wDay + (wDay === 0 ? -6 : 1);
              const startOfWeek = new Date(dWeek.setDate(diffToMonday)).setHours(0,0,0,0);

              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

              const getSumSeconds = (timeLimitMs: number) => {
                let sum = logs.reduce((acc, log) => {
                  const logStart = new Date(log.startTime).getTime();
                  if (logStart >= timeLimitMs) {
                    const logEnd = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
                    return acc + Math.max(0, Math.floor((logEnd - logStart) / 1000));
                  }
                  return acc;
                }, 0);

                if (sysSettings?.includePatchesInReports) {
                  sum += patches.reduce((acc, p) => {
                    const pStart = new Date(p.startTime).getTime();
                    if (pStart >= timeLimitMs) {
                      const pEnd = p.endTime ? new Date(p.endTime).getTime() : new Date(nowIso).getTime();
                      return acc + Math.max(0, Math.floor((pEnd - pStart) / 1000));
                    }
                    return acc;
                  }, 0);
                }

                return sum;
              };

              const todaySec = getSumSeconds(startOfToday);
              const weekSec = getSumSeconds(startOfWeek);
              const monthSec = getSumSeconds(startOfMonth);

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-5 rounded-3xl border transition-all ${
                    theme === 'light' ? 'bg-teal-50/30 border-teal-100 shadow-sm shadow-teal-50' : 'bg-[#FCFAF8]/5 border-white/10'
                  }`}>
                    <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.tODAYTOTAL', customTranslations)}</p>
                    <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-teal-700' : 'text-emerald-400'}`}>
                      {formatSeconds(todaySec)}
                    </p>
                    <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.sQLiteLogsSumForToday', customTranslations)}</p>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-all ${
                    theme === 'light' ? 'bg-orange-50/30 border-orange-150 shadow-sm shadow-orange-50' : 'bg-[#FCFAF8]/5 border-white/10'
                  }`}>
                    <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.wEEKTOTAL', customTranslations)}</p>
                    <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>
                      {formatSeconds(weekSec)}
                    </p>
                    <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.fromMondayUntilNow', customTranslations)}</p>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-all ${
                    theme === 'light' ? 'bg-rose-50/30 border-rose-150 shadow-sm shadow-rose-50' : 'bg-[#FCFAF8]/5 border-white/10'
                  }`}>
                    <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.mONTHTOTAL', customTranslations)}</p>
                    <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-rose-700' : 'text-rose-450'}`}>
                      {formatSeconds(monthSec)}
                    </p>
                    <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.accumulatedMonthSeconds', customTranslations)}</p>
                  </div>
                </div>
              );
            })()}

            {/* Filter controls */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-black/25 border-white/10'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.period', customTranslations)}</span>
                {(['today', 'week', 'month', 'all'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${
                      reportPeriod === p
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
                    }`}
                  >
                    {p === 'today' ? (translate(locale, 'dynamic.today', customTranslations)) :
                     p === 'week' ? (translate(locale, 'dynamic.week', customTranslations)) :
                     p === 'month' ? (translate(locale, 'dynamic.month', customTranslations)) :
                     (translate(locale, 'dynamic.all', customTranslations))}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.sortBy', customTranslations)}</span>
                <select
                  value={reportSort}
                  onChange={e => setReportSort(e.target.value as 'date' | 'duration')}
                  className={`px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${
                    theme === 'light' ? 'bg-[#FCFAF8] text-[#2C2421] border-[#DFD7CB]' : 'bg-slate-900 border-white/10 text-white'
                  }`}
                >
                  <option value="duration">{translate(locale, 'dynamic.durationHighestFirst', customTranslations)}</option>
                  <option value="date">{translate(locale, 'dynamic.dateChronological', customTranslations)}</option>
                </select>
              </div>
            </div>

            {/* Filtered logs lists and visual progress bars */}
            {(() => {
              const now = new Date(nowIso);
              let limitMs = 0;
              if (reportPeriod === 'today') {
                limitMs = new Date(now).setHours(0,0,0,0);
              } else if (reportPeriod === 'week') {
                const d = new Date(now);
                const w = d.getDay();
                const diff = d.getDate() - w + (w === 0 ? -6 : 1);
                limitMs = new Date(d.setDate(diff)).setHours(0,0,0,0);
              } else if (reportPeriod === 'month') {
                limitMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
              }

              const filteredLogs = logs.filter(log => {
                const logTime = new Date(log.startTime).getTime();
                return logTime >= limitMs;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="text-center py-12 text-[#9B8C83] text-xs font-mono">
                    ⚠️ {translate(locale, 'dynamic.noDataInSqliteLogsForTheSelect', customTranslations)}
                  </div>
                );
              }

              // Compute duration per project and task breakdown
              const projectTimeData: Record<string, { seconds: number; tasks: Record<string, number>}> = {};
              
              const combinedLogs = sysSettings?.includePatchesInReports ? [...filteredLogs, ...patches.filter(p => new Date(p.startTime).getTime() >= limitMs)] : filteredLogs;
              
              combinedLogs.forEach(log => {
                const start = new Date(log.startTime).getTime();
                const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
                const duration = Math.max(0, Math.floor((end - start)/1000));
                
                if (!projectTimeData[log.projectId]) {
                   projectTimeData[log.projectId] = { seconds: 0, tasks: {} };
                }
                projectTimeData[log.projectId].seconds += duration;
                
                if (log.taskId) {
                   projectTimeData[log.projectId].tasks[log.taskId] = (projectTimeData[log.projectId].tasks[log.taskId] || 0) + duration;
                }
              });

              // Projects charts data
              const projectChart = Object.entries(projectTimeData).map(([pId, data]) => {
                const p = projects.find(x => x.id === pId);
                const taskBreakdown = Object.entries(data.tasks).map(([tId, sec]) => {
                    return { task: tasks.find(t => t.id === tId), seconds: sec };
                }).filter(t => t.task).sort((a,b) => b.seconds - a.seconds);
                return { id: pId, name: p?.name || `Project ${pId}`, color: p?.color || 'violet', seconds: data.seconds, tasks: taskBreakdown };
              });

              if (reportSort === 'duration') {
                projectChart.sort((a,b) => b.seconds - a.seconds);
              } else {
                projectChart.sort((a,b) => a.name.localeCompare(b.name));
              }

              const maxSec = Math.max(...projectChart.map(x => x.seconds), 1);

              // Sort individual logs
              const displayLogs = [...filteredLogs];
              if (reportSort === 'date') {
                displayLogs.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
              } else {
                displayLogs.sort((a,b) => {
                  const endA = a.endTime ? new Date(a.endTime).getTime() : new Date(nowIso).getTime();
                  const endB = b.endTime ? new Date(b.endTime).getTime() : new Date(nowIso).getTime();
                  return (endB - new Date(b.startTime).getTime()) - (endA - new Date(a.startTime).getTime());
                });
              }

              return (
                <div className="flex flex-col gap-6">
                  {/* Graphical bars representation */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase flex items-center gap-1.5">
                      📊 {translate(locale, 'dynamic.gRAPHICALPROJECTTIMEDISTRIBUTI', customTranslations)}
                    </h4>
                    <div className="flex flex-col gap-4">
                      {projectChart.map(pc => {
                        const widthPct = Math.min(100, Math.max(5, (pc.seconds / maxSec) * 100));
                        return (
                          <div key={pc.id} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full bg-${pc.color}-500`} />
                                {pc.name}
                              </span>
                              <span className="font-mono text-orange-450">{formatSeconds(pc.seconds)}</span>
                            </div>
                            <div className={`w-full h-3 rounded-full overflow-hidden relative ${
                              theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-[#FCFAF8]/5'
                            }`}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${widthPct}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full`}
                              />
                            </div>
                            {pc.tasks.length > 0 && (
                               <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-white/10 dark:border-white/5">
                                 {pc.tasks.map(tt => (
                                   <div key={tt.task!.id} className="flex justify-between items-center text-[10px] text-[#8A7A71] dark:text-[#9B8C83]">
                                      <span className="truncate">{tt.task!.name}</span>
                                      <span className="font-mono">{formatSeconds(tt.seconds)}</span>
                                   </div>
                                 ))}
                               </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Regular logs output */}
                  <div className="flex flex-col gap-3 mt-4">
                    <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                      📋 {translate(locale, 'dynamic.pLAINSQLITELOGSDUMP', customTranslations)} ({displayLogs.length})
                    </h4>
                    <div className={`rounded-[1.5rem] border max-h-[250px] overflow-y-auto p-4 flex flex-col gap-2 ${
                      theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] shadow-inner' : 'bg-black/20 border-white/5'
                    }`}>
                      {displayLogs.map(log => {
                        const p = projects.find(x => x.id === log.projectId);
                        const t = tasks.find(x => x.id === log.taskId);
                        const start = new Date(log.startTime).getTime();
                        const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
                        const durSeconds = Math.max(0, Math.floor((end - start) / 1000));
                        
                        return (
                          <div 
                            key={log.id} 
                            className={`flex flex-col sm:flex-row justify-between sm:items-center gap-1 py-1.5 border-b last:border-0 text-xs ${
                              theme === 'light' ? 'border-[#DFD7CB] text-[#5A4A42]' : 'border-white/5 text-slate-300'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1">
                              <span className="font-mono text-indigo-400 text-[10px] shrink-0 font-bold">[{new Date(log.startTime).toLocaleTimeString()}]</span>
                              <strong className={`${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-200'}`}>"{t?.name || 'N/A'}"</strong>
                              <span className={`${th.textMuted} text-[10px]`}>({p?.name})</span>
                            </span>
                            <span className="font-mono text-orange-400 shrink-0 self-end sm:self-auto font-bold">{formatSeconds(durSeconds)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Floating Database Inspector Trigger */}
        <div className="flex justify-end mt-2">
          <button
            id="toggle-db-inspector-btn"
            onClick={() => setShowDbInspector(!showDbInspector)}
            className={`flex items-center gap-2 border font-mono text-xs px-4 py-2 rounded-2xl transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-[#F4EFEA] hover:bg-[#EAE4DB] text-[#5A4A42] border-[#DFD7CB]'
                : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-orange-400" />
            {showDbInspector ? translate(locale, 'dynamic.hideSqlitePreview', customTranslations) : translate(locale, 'dynamic.exploreSqliteStructure', customTranslations)}
          </button>
        </div>

        {/* DB Schema Inspector */}
        <AnimatePresence>
          {showDbInspector && (
            <motion.div
              id="db-inspector-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`rounded-3xl p-6 border shadow-2xl font-mono text-xs gap-4 flex flex-col backdrop-blur-xl transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] shadow-[#DFD7CB]'
                  : theme === 'high-contrast'
                  ? 'bg-black border-2 border-white text-white'
                  : 'bg-[#FCFAF8]/5 border-white/10 text-slate-100'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-3 ${
                theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-400" />
                  <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-100'}`}>oxytime.db • SQLite Client (Simulated microORM State)</span>
                </div>
                <span className="bg-orange-500/20 border border-orange-500/30 text-[10px] text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">ONLINE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Projects Table */}
                <div className={`p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
                }`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans">TABLE projects</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b text-[10px] ${
                        theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                      }`}>
                        <th className="py-1">id</th>
                        <th className="py-1">name</th>
                        <th className="py-1">created_at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(p => (
                        <tr key={p.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                          <td className="py-1 prose-sm font-bold text-indigo-550 dark:text-indigo-400">{p.id}</td>
                          <td className="py-1">{p.name}</td>
                          <td className="py-1 text-[9px] text-[#8A7A71]">{new Date(p.createdAt).toISOString().slice(0,10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tasks Table */}
                <div className={`p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
                }`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans">TABLE tasks</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b text-[10px] ${
                        theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                      }`}>
                        <th className="py-1">id</th>
                        <th className="py-1">proj_id</th>
                        <th className="py-1">parent_id</th>
                        <th className="py-1">name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 5).map(t => (
                        <tr key={t.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                          <td className="py-1 font-bold text-indigo-550 dark:text-indigo-400">{t.id}</td>
                          <td className="py-1">{t.projectId}</td>
                          <td className="py-1 text-[#8A7A71]">{t.parentTaskId || 'NULL'}</td>
                          <td className="py-1 truncate max-w-[80px]" title={t.name}>{t.name}</td>
                        </tr>
                      ))}
                      {tasks.length > 5 && (
                        <tr>
                          <td colSpan={4} className="text-[10px] text-[#8A7A71] py-1 text-center">
                            {translate(locale, 'dynamic.andMoreRows', customTranslations).replace('{x}', (tasks.length - 5).toString())}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Logs Table (Time Logs) */}
              <div className={`p-3 rounded-xl border ${
                theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
              }`}>
                <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans">TABLE time_logs</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b text-[10px] ${
                        theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                      }`}>
                        <th className="py-1">id</th>
                        <th className="py-1">task_id</th>
                        <th className="py-1">start_time</th>
                        <th className="py-1">end_time</th>
                        <th className="py-1">duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(-4).map(l => {
                        const start = new Date(l.startTime).toLocaleTimeString();
                        const end = l.endTime ? new Date(l.endTime).toLocaleTimeString() : 'ACTIVE';
                        const startMs = new Date(l.startTime).getTime();
                        const endMs = l.endTime ? new Date(l.endTime).getTime() : new Date(nowIso).getTime();
                        const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));

                        return (
                           <tr key={l.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                            <td className="py-1 text-indigo-550 dark:text-indigo-400 font-bold">{l.id.slice(0,6)}</td>
                            <td className="py-1">{l.taskId}</td>
                            <td className="py-1 text-[10px]">{start}</td>
                            <td className="py-1 text-[10px] font-semibold text-orange-500 dark:text-orange-400">{end}</td>
                            <td className="py-1 text-[10px] text-right font-mono">{diffSec}s</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
