import { CliEngineContext, TerminalLine } from "../types";
import { formatSeconds } from "@features/timelogs/utils/TimelogUtils";
import { translate } from "@common/i18n/translator";
import { TerminalOutput } from "../utils/terminalOutput";

export const runStartCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[],
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const {
    tasks,
    onStartTimer,
    selectedTaskId,
    setSelectedTaskId,
    locale,
    customTranslations,
  } = context;
  const tId = args[0];

  if (!tId) {
    const currentTaskId =
      selectedTaskId || (tasks && tasks.length > 0 ? tasks[0].id : null);
    if (!currentTaskId) {
      terminalOut.error(`Error: No task is currently selected. ${translate(locale, "cli", "ErrNoTaskSelectedHelp", customTranslations)}`);
    } else {
      const taskObj = tasks.find((t) => t.id === currentTaskId);
      if (!taskObj) {
        terminalOut.error(`${translate(locale, "cli", "ErrTaskNotExist", customTranslations)} ${currentTaskId}`);
      } else if (taskObj.completed) {
        terminalOut.error(translate(
          locale,
          "cli",
          "ErrTaskAlreadyCompleted",
          customTranslations,
          { name: taskObj.name },
        ));
      } else {
        onStartTimer(currentTaskId);
        terminalOut.success(`▶️ ${translate(locale, "cli", "TimerStarted", customTranslations)}: "${taskObj.name}" [ID: ${currentTaskId}]`);
      }
    }
  } else {
    const taskObj = tasks.find((t) => t.id === tId);
    if (!taskObj) {
      terminalOut.error(`${translate(locale, "cli", "ErrTaskNotExist", customTranslations)} ${tId}`);
    } else if (taskObj.completed) {
      terminalOut.error(translate(
        locale,
        "cli",
        "ErrTaskAlreadyCompleted",
        customTranslations,
        { name: taskObj.name },
      ));
    } else {
      setSelectedTaskId(tId);
      onStartTimer(tId);
      terminalOut.success(`▶️ ${translate(locale, "cli", "TimerStarted", customTranslations)}: "${taskObj.name}" [ID: ${tId}]`);
    }
  }

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

  const targetLower = target.toLowerCase();
  const taskObj =
    tasks.find(
      (t) => t.id === target || t.name.toLowerCase() === targetLower,
    ) || tasks.find((t) => t.name.toLowerCase().includes(targetLower));

  if (!taskObj) {
    terminalOut.error(`${translate(locale, "cli", "ErrTaskNotExist", customTranslations)} "${target}"`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

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
  } else {
    if (!activeLog) {
      terminalOut.info(translate(locale, "cli", "NoActiveTimer", customTranslations));
    } else {
      const t = tasks.find((x) => x.id === activeLog.taskId);
      onStopTimer();
      terminalOut.success(`⏹️ ${translate(locale, "cli", "TimerStopped", customTranslations)}: "${t?.name || "Unknown"}".`);
    }
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
