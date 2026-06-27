export interface IEngine {
  startTimer(taskId: string): Promise<void>;
  stopTimer(projectId?: string): Promise<void>;
}
