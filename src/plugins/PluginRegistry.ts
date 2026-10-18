import { IExporterPlugin, IEventHookPlugin } from './contracts/IExporterPlugin';

/**
 * Central registry for data exporters and lifecycle event plugins.
 * Decouples presentation views from specific export formats and downstream sinks.
 */
export class PluginRegistry {
  private static instance: PluginRegistry | null = null;
  private exporters = new Map<string, IExporterPlugin>();
  private hooks = new Map<string, IEventHookPlugin>();

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerExporter(exporter: IExporterPlugin): void {
    this.exporters.set(exporter.id, exporter);
  }

  public unregisterExporter(id: string): void {
    this.exporters.delete(id);
  }

  public getExporter(id: string): IExporterPlugin | undefined {
    return this.exporters.get(id);
  }

  public getExporters(): IExporterPlugin[] {
    return Array.from(this.exporters.values());
  }

  public registerHook(hook: IEventHookPlugin): void {
    this.hooks.set(hook.id, hook);
  }

  public unregisterHook(id: string): void {
    this.hooks.delete(id);
  }

  public getHooks(): IEventHookPlugin[] {
    return Array.from(this.hooks.values());
  }

  public async emitEvent(eventName: string, payload: unknown): Promise<void> {
    const promises = Array.from(this.hooks.values()).map(hook =>
      hook.onEvent(eventName, payload).catch(err => {
        // Individual hook failures must not crash the event loop
        console.error(`[PluginRegistry] Hook '${hook.id}' failed on event '${eventName}':`, err);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Resets all registered plugins. Used exclusively for clean test tear-downs.
   */
  public reset(): void {
    this.exporters.clear();
    this.hooks.clear();
  }
}
