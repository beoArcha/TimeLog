import { isDesktopEnvironment } from '../utils/environment';
import {
  IEngine,
  ITimerEngine,
  IMetricsEngine,
  ITimeLogsEngine,
  IValidationEngine,
} from './IEngine';
import { IBillingEngine } from './billing/types';
import { EngineCommands } from './EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { IRouter } from '../types/routing';

export class EngineRouter implements IEngine, IRouter<IEngine> {
  private static instance: EngineRouter | null = null;
  private implementation: IEngine;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new EngineCommands();
    } else {
      this.implementation = new EnginePlugin();
    }
  }

  static getInstance(): EngineRouter {
    if (!this.instance) {
      this.instance = new EngineRouter();
    }
    return this.instance;
  }

  setImplementationForTesting(impl: IEngine): void {
    this.implementation = impl;
  }

  static resetForTesting(): void {
    EngineRouter.instance = null;
  }

  get timer(): ITimerEngine {
    return this.implementation.timer;
  }

  get metrics(): IMetricsEngine {
    return this.implementation.metrics;
  }

  get timeLogs(): ITimeLogsEngine {
    return this.implementation.timeLogs;
  }

  get validation(): IValidationEngine {
    return this.implementation.validation;
  }

  get billing(): IBillingEngine {
    return this.implementation.billing;
  }
}
