export interface IEngine {
  startTimer(taskId: string): Promise<void>;
  stopTimer(projectId?: string): Promise<void>;
  editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void>;
}
