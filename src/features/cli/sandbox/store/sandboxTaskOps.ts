import { Task } from '@bindings/Task';

export function addTaskOp(
  tasks: Task[],
  nextId: string,
  projectId: string,
  name: string,
  parentTaskId: string | null = null,
  hourlyRate?: string | null
): Task {
  const newTask: Task = {
    id: nextId,
    projectId,
    name,
    completed: false,
    createdAt: new Date().toISOString(),
    status: null,
    parentTaskId,
    hourlyRate: hourlyRate ?? null,
  };
  tasks.push(newTask);
  return newTask;
}

export function setTaskRateOp(
  tasks: Task[],
  taskId: string,
  hourlyRate: string | null
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.hourlyRate = hourlyRate;
  return true;
}

export function renameTaskOp(
  tasks: Task[],
  taskId: string,
  newName: string
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.name = newName;
  return true;
}

export function toggleTaskCompleteOp(
  tasks: Task[],
  taskId: string
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.completed = !task.completed;
  return true;
}

export function archiveTaskOp(
  tasks: Task[],
  taskId: string
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.archived = !task.archived;
  return true;
}

export function reparentTaskOp(
  tasks: Task[],
  taskId: string,
  newParentId: string | null
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.parentTaskId = newParentId;
  return true;
}

export function moveTaskOp(
  tasks: Task[],
  taskId: string,
  newProjectId: string
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.projectId = newProjectId;
  for (const child of tasks) {
    if (child.parentTaskId === taskId) {
      child.projectId = newProjectId;
    }
  }
  return true;
}
