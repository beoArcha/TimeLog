import { isDesktopEnvironment } from '@common/utils/environment';
import { ICliClient } from './ICliClient';
import { TauriCliClient } from '@common/tauri/TauriCliClient';
import { CliExecutionResult } from '@bindings/CliExecutionResult';
import { IRouter } from '@common/types/routing';

export class CliRouter implements ICliClient, IRouter<ICliClient> {
  private static instance: CliRouter | null = null;
  private implementation: ICliClient | null = null;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new TauriCliClient();
    }
  }

  static getInstance(): CliRouter {
    if (!CliRouter.instance) {
      CliRouter.instance = new CliRouter();
    }
    return CliRouter.instance;
  }

  setImplementationForTesting(implementation: ICliClient): void {
    this.implementation = implementation;
  }

  static resetForTesting(): void {
    CliRouter.instance = null;
  }

  hasNativeCli(): boolean {
    return this.implementation !== null;
  }

  async execute(commandLine: string): Promise<CliExecutionResult> {
    if (!this.implementation) {
      throw new Error('Native CLI execution is not available in browser runtime');
    }
    return this.implementation.execute(commandLine);
  }
}
