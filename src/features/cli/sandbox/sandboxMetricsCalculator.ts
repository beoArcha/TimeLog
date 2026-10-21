import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ProjectComputedMetrics } from '@bindings/ProjectComputedMetrics';
import { TaskComputedMetrics } from '@bindings/TaskComputedMetrics';

/**
 * Pure calculation utility evaluating metrics across in-memory sandbox entities.
 */
export const calculateSandboxMetrics = (
  projects: Project[],
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): EngineComputedMetrics => {
  const effectiveNowIso = nowIso || new Date().toISOString();
  const nowMs = new Date(effectiveNowIso).getTime();
  const projectElapsed: Record<string, ProjectComputedMetrics> = {};
  const taskElapsed: Record<string, TaskComputedMetrics> = {};

  for (const proj of projects) {
    projectElapsed[proj.id] = {
      projectId: proj.id,
      totalElapsedSeconds: 0,
      todayElapsedSeconds: 0,
      thisWeekElapsedSeconds: 0,
      activeTaskCount: tasks.filter((t) => t.projectId === proj.id && !t.completed).length,
      completedTaskCount: tasks.filter((t) => t.projectId === proj.id && t.completed).length,
      isRunning: false,
    };
  }

  for (const task of tasks) {
    taskElapsed[task.id] = {
      taskId: task.id,
      elapsedSeconds: 0,
      selfElapsedSeconds: 0,
      isRunning: false,
      hasRunningChild: false,
    };
  }

  for (const log of logs) {
    const s = new Date(log.startTime).getTime();
    const isRunning = !log.endTime;
    const e = log.endTime ? new Date(log.endTime).getTime() : nowMs;
    const dur = Math.max(0, Math.floor((e - s) / 1000));

    if (projectElapsed[log.projectId]) {
      projectElapsed[log.projectId].totalElapsedSeconds += dur;
      projectElapsed[log.projectId].todayElapsedSeconds += dur;
      projectElapsed[log.projectId].thisWeekElapsedSeconds += dur;
      if (isRunning) projectElapsed[log.projectId].isRunning = true;
    }

    if (taskElapsed[log.taskId]) {
      taskElapsed[log.taskId].elapsedSeconds += dur;
      taskElapsed[log.taskId].selfElapsedSeconds += dur;
      if (isRunning) taskElapsed[log.taskId].isRunning = true;
    }
  }

  return {
    snapshotNowIso: effectiveNowIso,
    projects: projectElapsed,
    tasks: taskElapsed,
  };
};
