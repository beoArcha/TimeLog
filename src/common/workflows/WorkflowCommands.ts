import { invoke } from '@tauri-apps/api/core';
import { IWorkflow, WorkflowConfig, WorkflowStatus, WorkflowCheckResult } from './IWorkflow';
import { TauriInteropException } from '@common/exceptions';

export class WorkflowCommands implements IWorkflow {
  async getConfig(): Promise<WorkflowConfig> {
    try {
      return await invoke<WorkflowConfig>('workflow_get_config');
    } catch (err) {
      throw new TauriInteropException('Failed to get workflow config via Tauri', err, 'ERR_TAURI_WORKFLOW_GET_CONFIG');
    }
  }

  async saveConfig(config: WorkflowConfig): Promise<void> {
    try {
      await invoke('workflow_save_config', { config });
    } catch (err) {
      throw new TauriInteropException('Failed to save workflow config via Tauri', err, 'ERR_TAURI_WORKFLOW_SAVE_CONFIG');
    }
  }

  async getStatus(): Promise<WorkflowStatus> {
    try {
      return await invoke<WorkflowStatus>('workflow_get_status');
    } catch (err) {
      throw new TauriInteropException('Failed to get workflow status via Tauri', err, 'ERR_TAURI_WORKFLOW_GET_STATUS');
    }
  }

  async checkRules(nowIso?: string): Promise<WorkflowCheckResult> {
    try {
      return await invoke<WorkflowCheckResult>('workflow_check_rules', { nowIso });
    } catch (err) {
      throw new TauriInteropException('Failed to check workflow rules via Tauri', err, 'ERR_TAURI_WORKFLOW_CHECK_RULES');
    }
  }

  async startDaemon(): Promise<void> {
    try {
      await invoke('workflow_start_daemon');
    } catch (err) {
      throw new TauriInteropException('Failed to start workflow daemon via Tauri', err, 'ERR_TAURI_WORKFLOW_START_DAEMON');
    }
  }

  async stopDaemon(): Promise<void> {
    try {
      await invoke('workflow_stop_daemon');
    } catch (err) {
      throw new TauriInteropException('Failed to stop workflow daemon via Tauri', err, 'ERR_TAURI_WORKFLOW_STOP_DAEMON');
    }
  }
}
