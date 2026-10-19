import { IWorkflowConfigStore, WorkflowConfig, DEFAULT_WORKFLOW_CONFIG } from '@common/workflows/IWorkflow';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { PersistenceException } from '@common/exceptions/AppExceptions';

export class LocalStorageWorkflowConfigStore implements IWorkflowConfigStore {
  async getConfig(): Promise<WorkflowConfig> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG);
      if (stored) {
        return { ...DEFAULT_WORKFLOW_CONFIG, ...JSON.parse(stored) };
      }
    } catch (err) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed parsing workflow configuration from localStorage, falling back to defaults',
          err,
          'WARN_WORKFLOW_CONFIG_PARSE',
          'INFO'
        )
      );
    }
    return { ...DEFAULT_WORKFLOW_CONFIG };
  }

  async saveConfig(config: WorkflowConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, JSON.stringify(config));
    } catch (err) {
      ErrorHandler.handle(
        new PersistenceException('Failed writing workflow configuration to localStorage', err, 'ERR_WORKFLOW_CONFIG_WRITE')
      );
      throw err;
    }
  }
}
