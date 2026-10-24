import { CliEngineContext, TerminalLine } from "../types";
import { formatSeconds } from "@features/timelogs/utils/TimelogUtils";
import { translate } from "@common/i18n/translator";
import { TerminalOutput } from "../utils/terminalOutput";
import { resolveEntity } from "../resolver/entityResolver";

export const runStartCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const {
    tasks,
    activeLog,
    onStartTimer,
    setSelectedTaskId,
    locale,
    customTranslations,
  } = context;
  const target = args.join(" ").trim();

  if (!target) {
    if (activeLog) {
      runStatusCommand(context, terminalOut);
    } else {
      terminalOut.error(`Error: No target task specified. Usage: start <task_id | "task name">`);
    }
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    terminalOut.error(resolve.error || `${translate(locale, "cli", "ErrTaskNotExist", customTranslations)} ${target}`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const taskObj = resolve.entity;
  if (taskObj.completed) {
    terminalOut.error(translate(
      locale,
      "cli",
      "ErrTaskAlreadyCompleted",
      customTranslations,
      { name: taskObj.name },
    ));
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  setSelectedTaskId(taskObj.id);
  onStartTimer(taskObj.id);
  terminalOut.success(`▶️ ${translate(locale, "cli", "TimerStarted", customTranslations)}: "${taskObj.name}" [ID: ${taskObj.id}]`);

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runSwitchCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const {
    tasks,
    onStartTimer,
    onStopTimer,
    setSelectedTaskId,
    locale,
    customTranslations,
  } = context;
  const target = args.join(" ").trim();

  if (!target) {
    terminalOut.error(`Error: Usage: switch <task_id | "task name">. ${translate(locale, "cli", "SwitchDesc", customTranslations)}`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    terminalOut.error(resolve.error || `${translate(locale, "cli", "ErrTaskNotExist", customTranslations)} "${target}"`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const taskObj = resolve.entity;
  if (taskObj.completed) {
    terminalOut.error(translate(
      locale,
      "cli",
      "ErrTaskAlreadyCompleted",
      customTranslations,
      { name: taskObj.name },
    ));
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  onStopTimer();
  setSelectedTaskId(taskObj.id);
  onStartTimer(taskObj.id);

  terminalOut.success(`🔀 ${translate(locale, "cli", "SwitchSuccess", customTranslations, { name: taskObj.name, taskId: taskObj.id })}`);

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runStopCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { logs, activeLog, tasks, onStopTimer, locale, customTranslations } = context;
  const arg = args[0] ? args[0].toLowerCase() : "";

  if (arg === "all") {
    const activeRunningCount = logs.filter((l) => l.endTime === null).length;
    onStopTimer();
    terminalOut.success(`⏹️ ${translate(locale, "cli", "StoppedAllSessions", customTranslations, { count: activeRunningCount })}`);
  } else if (!activeLog) {
    terminalOut.error(`Error: ${translate(locale, "cli", "NoActiveTimer", customTranslations)}`);
  } else {
    const t = tasks.find((x) => x.id === activeLog.taskId);
    onStopTimer();
    terminalOut.success(`⏹️ ${translate(locale, "cli", "TimerStopped", customTranslations)}: "${t?.name || "Unknown"}".`);
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runStatusCommand = (
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { activeLog, tasks, projects, metrics, locale, customTranslations } = context;

  if (activeLog) {
    const t = tasks.find((x) => x.id === activeLog.taskId);
    const p = t ? projects.find((x) => x.id === t.projectId) : null;
    const diffSeconds =
      metrics?.tasks[activeLog.taskId]?.elapsedSeconds ??
      Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(activeLog.startTime).getTime()) / 1000,
        ),
      );

    terminalOut
      .info(translate(locale, "cli", "StatusHeader", customTranslations))
      .output(`  Task : ${t?.name} (ID: ${t?.id})`)
      .output(`  Project : ${p?.name} (ID: ${p?.id})`)
      .success(`  Time    : ${formatSeconds(diffSeconds)} elapsed`)
      .info("=========================================================");
  } else {
    terminalOut.info(translate(locale, "cli", "StateIdle", customTranslations));
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runTodayCommand = (
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { logs, tasks, projects } = context;

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.startTime.startsWith(todayDate));

  if (todayLogs.length === 0) {
    terminalOut.info(`No time logs recorded for today (${todayDate}).`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  let totalSeconds = 0;
  terminalOut.info(`── Today's Progress (${todayDate}) ──────────────────────────`);

  todayLogs.forEach((log) => {
    const startMs = new Date(log.startTime).getTime();
    const endMs = log.endTime ? new Date(log.endTime).getTime() : Date.now();
    const durSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
    totalSeconds += durSecs;

    const task = tasks.find((t) => t.id === log.taskId);
    const project = task ? projects.find((p) => p.id === task.projectId) : null;

    terminalOut.output(
      `• [${project?.name || 'General'}] ${task?.name || 'Unknown'} - ${formatSeconds(durSecs)}`
    );
  });

  terminalOut.info(`─────────────────────────────────────────────────────────`);
  terminalOut.success(`Total Today: ${formatSeconds(totalSeconds)} (${todayLogs.length} session(s))`);

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};
