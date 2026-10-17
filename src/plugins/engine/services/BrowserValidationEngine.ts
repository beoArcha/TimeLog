import { IValidationEngine } from '@common/engine/IEngine';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { validateProjectName, validateTaskName, validateTaskHierarchy } from '../validation';

export class BrowserValidationEngine implements IValidationEngine {
  async validateProjectName(
    name: string,
    existingProjects: Project[],
    excludeProjectId?: string
  ): Promise<void> {
    validateProjectName(name, existingProjects, excludeProjectId);
  }

  async validateTaskName(name: string): Promise<void> {
    validateTaskName(name);
  }

  async validateTaskHierarchy(
    taskId: string | null | undefined,
    parentTaskId: string | null | undefined,
    tasks: Task[]
  ): Promise<void> {
    validateTaskHierarchy(taskId, parentTaskId, tasks);
  }
}
