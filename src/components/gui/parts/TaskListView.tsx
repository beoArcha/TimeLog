import React from 'react';
import { GuiState } from '../useGuiLogic';
import { Plus, TrendingUp, Folder, CheckSquare, Square as EmptySquare, Trash2, Pencil, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '../../../utils/i18n';
import { getTranslation } from '../../../utils/translations';
import { getProjectDurationSeconds, getTaskDurationSeconds, formatSeconds } from '../../../utils';
import { getThemeStyles } from './guiStyles';

export default function TaskListView({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    tasks, logs, nowIso, locale, customTranslations, theme,
    selectedProject, projectTasks, rootTasks,
    newTaskName, setNewTaskName, onAddTask,
    onToggleTaskComplete, onRenameTask, onDeleteTask,
    onStartTimer,
    showSubtaskFormForId, setShowSubtaskFormForId,
    newSubtaskName, setNewSubtaskName,
    editingId, setEditingId, editName, setEditName
  } = state;

  const th = getThemeStyles(theme);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newTaskName.trim(), null);
    setNewTaskName('');
  };

  const handleAddSubtaskSubmit = (parentTaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newSubtaskName.trim(), parentTaskId);
    setNewSubtaskName('');
    setShowSubtaskFormForId(null);
  };

  if (!selectedProject) {
    return (
      <div className={`border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all ${theme === 'light'
          ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
          : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <Folder className="w-12 h-12 text-[#9B8C83] mx-auto mb-3" />
        <h3 className={`text-base font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{translate(locale, 'dynamic.selectProject', customTranslations)}</h3>
        <p className={`text-xs mt-1 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>Zaznacz projekt w bocznym menu po lewej stronie, aby zacząć zarządzać czasem.</p>
      </div>
    );
  }

  return (
    <div id="project-tasks-sheet" className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${theme === 'light'
        ? 'bg-[#FCFAF8] border-[#DFD7CB]'
        : theme === 'high-contrast'
          ? 'bg-black border-2 border-white'
          : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      {/* Header with Title and Create Task Input */}
      <div>
        <div className={`flex flex-col ${isCondensed ? 'gap-2 items-start' : 'sm:flex-row sm:items-start justify-between gap-2'} border-b pb-5 mb-5 ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
          }`}>
          <div className={`flex-1 min-w-0 ${isCondensed ? 'w-full' : ''}`}>
            <span className={`text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25 ${isCondensed ? 'inline-block mb-2 whitespace-nowrap' : ''}`}>
              {getTranslation(locale, 'selectProject', customTranslations)}
            </span>
            <h2 className={`font-sans font-bold mt-1.5 flex items-center gap-2 ${isCondensed ? 'text-xl' : 'text-2xl'} ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
              }`}>
              <span className={`w-3.5 h-3.5 rounded-full bg-[var(--project-color,orange)] shrink-0 shadow-md`} style={{ backgroundColor: selectedProject.color ? `var(--tw-color-${selectedProject.color}-500)` : undefined }} />
              <span className="truncate" title={selectedProject.name}>{selectedProject.name}</span>
            </h2>

            {/* Move Total up directly below project name in condensed mode */}
            {isCondensed && (
              <div className={`mt-3 font-mono text-xs border px-3 py-1.5 rounded-2xl flex flex-wrap items-center gap-2 w-fit ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
                }`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-semibold">{translate(locale, 'dynamic.total', customTranslations)}:</span>
                </div>
                <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                  {formatSeconds(getProjectDurationSeconds(selectedProject.id, tasks, logs, nowIso))}
                </span>
              </div>
            )}
          </div>

          {!isCondensed && (
            <div className={`text-left sm:text-right font-mono text-sm border px-3 py-1.5 rounded-2xl flex flex-wrap items-center gap-2 transition-all w-fit ${theme === 'light'
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
          )}
        </div>

        {/* Add Root Task Form */}
        <form onSubmit={handleAddTaskSubmit} className={`flex gap-3 ${isCondensed ? 'mt-2' : ''}`}>
          <input
            id="new-task-input"
            type="text"
            placeholder={getTranslation(locale, 'enterMainTaskName', customTranslations)}
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            className={`flex-1 px-4 py-3 sm:py-3.5 border rounded-[1.25rem] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${theme === 'light'
                ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
              }`}
          />
          <button
            id="add-task-btn"
            type="submit"
            className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-semibold rounded-[1.25rem] px-5 sm:px-6 py-3 sm:py-3.5 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4.5 h-4.5" /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{getTranslation(locale, 'addTask', customTranslations)}</span>
          </button>
        </form>
      </div>

      {/* Tree Grid List of Tasks & Subtasks */}
      <div id="tasks-tree-container" className={`flex flex-col gap-3.5 overflow-y-auto pr-1 ${isCondensed ? 'max-h-[60vh] min-h-[300px]' : 'max-h-[420px]'}`}>
        {rootTasks.length === 0 ? (
          <div className={`text-center py-16 border border-dashed rounded-[2rem] transition-all duration-300 ${theme === 'light'
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
                className={`rounded-3xl p-5 border transition-all flex flex-col gap-4 group/root relative overflow-hidden backdrop-blur-md ${isAnyRunning
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
                <div className={`flex ${isCondensed ? 'flex-col gap-3.5' : 'items-center justify-between gap-4'} animate-fade-in pl-1`}>
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 w-full">
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

                    <div className="min-w-0 flex-1 flex items-center justify-between group/taskedit">
                      {editingId === rootTask.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            if (onRenameTask && editName.trim() && editName.trim() !== rootTask.name) {
                              onRenameTask(rootTask.id, editName.trim());
                            }
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onRenameTask && editName.trim() && editName.trim() !== rootTask.name) {
                                onRenameTask(rootTask.id, editName.trim());
                              }
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className={`font-semibold text-sm rounded px-1 outline-none w-full max-w-sm mr-2 ${theme === 'light' ? 'bg-white text-[#2C2421] border-[#DFD7CB]' : 'bg-black text-white border-white/20'
                            } border`}
                        />
                      ) : (
                        <span className={`font-semibold text-sm flex flex-wrap items-center gap-2 transition-all duration-300 min-w-0 w-full ${rootTask.completed
                            ? 'line-through text-[#9B8C83] font-normal'
                            : theme === 'light'
                              ? 'text-[#2C2421]'
                              : 'text-slate-100'
                          }`}>
                          <span
                            className="truncate block max-w-full"
                            title={rootTask.name.length > 512 ? rootTask.name.slice(0, 512) + '...' : rootTask.name}
                          >
                            {rootTask.name}
                          </span>
                          {isChildRunning && runningSubtask && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-550/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                              <span className="truncate max-w-[120px]" title={runningSubtask.name.length > 512 ? runningSubtask.name.slice(0, 512) + '...' : runningSubtask.name}>
                                {getTranslation(locale, 'subtaskLabel', customTranslations)}: {runningSubtask.name}
                              </span>
                            </span>
                          )}
                          {isCurrentRunning && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                              {getTranslation(locale, 'inProgressLabel', customTranslations)}
                            </span>
                          )}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono block mt-0.5 whitespace-normal leading-tight ${theme === 'light' ? 'text-[#8A7A71]' : 'text-[#9B8C83]'
                        }`}>
                        ID: {rootTask.id} • SQLite table entry {isAnyRunning ? '(Sygnał liczenia aktywny)' : ''}
                      </span>

                      {/* Hover Edit Action */}
                      {editingId !== rootTask.id && (
                        <div className="opacity-0 group-hover/taskedit:opacity-100 flex items-center transition duration-200 mt-1 w-fit">
                          <button
                            type="button"
                            title={translate(locale, 'common.editName', customTranslations)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(rootTask.id);
                              setEditName(rootTask.name);
                            }}
                            className={`p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-orange-500/10`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Usuń zadanie"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteTask) onDeleteTask(rootTask.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Controls & Metrics */}
                  <div className={`flex items-center gap-3 ${isCondensed ? 'w-full justify-between pt-3 border-t ' + (theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10') : ''}`}>
                    <span className={`text-xs font-mono font-extrabold px-3 py-1.5 rounded-full border transition-all ${isAnyRunning
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
                          onClick={() => onStartTimer(rootTask.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer"
                          title={translate(locale, 'common.stopTimer', customTranslations)}
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                        </button>
                      ) : (
                        <button
                          id={`start-btn-${rootTask.id}`}
                          onClick={() => !rootTask.completed && onStartTimer(rootTask.id)}
                          disabled={rootTask.completed}
                          className={`rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer ${rootTask.completed
                              ? 'bg-[#FCFAF8]/5 text-[#9B8C83] border border-transparent cursor-not-allowed opacity-50'
                              : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
                            }`}
                          title={translate(locale, 'common.startTimer', customTranslations)}
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                        </button>
                      )}

                      {/* Toggle Add Subtask */}
                      <button
                        id={`show-subtask-form-btn-${rootTask.id}`}
                        onClick={() => setShowSubtaskFormForId(showSubtaskFormForId === rootTask.id ? null : rootTask.id)}
                        className={`rounded-xl px-2.5 py-2 text-[11px] font-semibold flex items-center gap-1 transition-all border cursor-pointer shrink-0 ${theme === 'light'
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
                      className={`p-2.5 rounded-2xl border flex gap-2 ml-8 mt-1 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
                        }`}
                    >
                      <input
                        id={`new-subtask-input-${rootTask.id}`}
                        type="text"
                        required
                        placeholder={translate(locale, 'dynamic.enterSubtaskName', customTranslations)}
                        value={newSubtaskName}
                        onChange={e => setNewSubtaskName(e.target.value)}
                        className={`flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${theme === 'light'
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
                  <div className={`flex flex-col gap-2 ml-8 border-l pl-4 mt-2 overflow-y-auto pr-1 ${isCondensed ? 'max-h-[250px]' : ''} ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
                    }`}>
                    {subTasks.map(subTask => {
                      const subDuration = getTaskDurationSeconds(subTask.id, tasks, logs, nowIso);
                      const isSubRunning = logs.some(l => l.taskId === subTask.id && l.endTime === null);

                      return (
                        <div
                          id={`subtask-item-${subTask.id}`}
                          key={subTask.id}
                          className={`flex items-center justify-between gap-4 py-2 px-3 rounded-xl group/sub transition-all ${isSubRunning
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

                            <div className="min-w-0 flex-1 flex items-center justify-between group/taskedit">
                              {editingId === subTask.id ? (
                                <input
                                  autoFocus
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onBlur={() => {
                                    if (onRenameTask && editName.trim() && editName.trim() !== subTask.name) {
                                      onRenameTask(subTask.id, editName.trim());
                                    }
                                    setEditingId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (onRenameTask && editName.trim() && editName.trim() !== subTask.name) {
                                        onRenameTask(subTask.id, editName.trim());
                                      }
                                      setEditingId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingId(null);
                                    }
                                  }}
                                  className={`font-semibold text-xs rounded px-1 outline-none w-full max-w-sm mr-2 ${theme === 'light' ? 'bg-white text-[#2C2421] border-[#DFD7CB]' : 'bg-black text-white border-white/20'
                                    } border`}
                                />
                              ) : (
                                <span className={`text-xs font-semibold flex flex-wrap items-center gap-2 transition-all duration-300 min-w-0 w-full ${subTask.completed
                                    ? 'line-through text-[#9B8C83] font-normal'
                                    : theme === 'light'
                                      ? 'text-[#2C2421]'
                                      : 'text-slate-200'
                                  }`}>
                                  <span
                                    className="truncate block max-w-full"
                                    title={subTask.name.length > 512 ? subTask.name.slice(0, 512) + '...' : subTask.name}
                                  >
                                    {subTask.name}
                                  </span>
                                  {isSubRunning && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                  )}
                                </span>
                              )}
                              {/* Hover Edit Action */}
                              {editingId !== subTask.id && (
                                <div className="opacity-0 group-hover/taskedit:opacity-100 flex items-center transition duration-200 shrink-0 ml-2">
                                  <button
                                    type="button"
                                    title={translate(locale, 'common.editName', customTranslations)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(subTask.id);
                                      setEditName(subTask.name);
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-orange-500/10"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Usuń podzadanie"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onDeleteTask) onDeleteTask(subTask.id);
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 ml-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={`flex items-center gap-3 shrink-0`}>
                            <span className={`font-mono text-[10px] px-2 py-1 rounded-md border transition-all ${isSubRunning
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
                                onClick={() => onStartTimer(subTask.id)}
                                title={translate(locale, 'common.stopTimer', customTranslations)}
                                className="bg-rose-500 text-white rounded-lg p-2 transition-colors cursor-pointer animate-pulse shrink-0"
                              >
                                <Square className="w-3.5 h-3.5 fill-white text-white" />
                              </button>
                            ) : (
                              <button
                                id={`start-subtask-btn-${subTask.id}`}
                                onClick={() => !subTask.completed && onStartTimer(subTask.id)}
                                disabled={subTask.completed}
                                title={translate(locale, 'common.startTimer', customTranslations)}
                                className={`text-[#9B8C83] hover:text-white rounded-lg p-2 transition-all cursor-pointer shrink-0 ${theme === 'light' ? 'bg-[#EAE4DB] hover:bg-teal-500 group-hover/sub:bg-teal-500 text-[#5A4A42]' : 'bg-[#FCFAF8]/5 hover:bg-teal-500 group-hover/sub:bg-teal-500'
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
  );
}
