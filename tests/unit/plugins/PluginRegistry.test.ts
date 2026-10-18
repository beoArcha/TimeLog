import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry } from '@plugins/PluginRegistry';
import { IExporterPlugin, IEventHookPlugin } from '@plugins/contracts/IExporterPlugin';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = PluginRegistry.getInstance();
    registry.reset();
  });

  it('should register and retrieve exporter plugins by id', () => {
    // Arrange
    const mockExporter: IExporterPlugin = {
      id: 'mock-exporter',
      name: 'Mock Exporter',
      fileExtension: 'mock',
      mimeType: 'text/mock',
      export: vi.fn().mockResolvedValue(new Blob(['test'])),
    };

    // Act
    registry.registerExporter(mockExporter);

    // Assert
    expect(registry.getExporter('mock-exporter')).toBe(mockExporter);
    expect(registry.getExporters()).toHaveLength(1);
    expect(registry.getExporters()[0].id).toBe('mock-exporter');
  });

  it('should unregister an exporter correctly', () => {
    // Arrange
    const mockExporter: IExporterPlugin = {
      id: 'mock-exporter',
      name: 'Mock Exporter',
      fileExtension: 'mock',
      mimeType: 'text/mock',
      export: vi.fn(),
    };
    registry.registerExporter(mockExporter);

    // Act
    registry.unregisterExporter('mock-exporter');

    // Assert
    expect(registry.getExporter('mock-exporter')).toBeUndefined();
    expect(registry.getExporters()).toHaveLength(0);
  });

  it('should register event hooks and broadcast events to all registered hooks', async () => {
    // Arrange
    const hook1OnEvent = vi.fn().mockResolvedValue(undefined);
    const hook2OnEvent = vi.fn().mockResolvedValue(undefined);

    const hook1: IEventHookPlugin = { id: 'hook-1', name: 'Hook 1', onEvent: hook1OnEvent };
    const hook2: IEventHookPlugin = { id: 'hook-2', name: 'Hook 2', onEvent: hook2OnEvent };

    registry.registerHook(hook1);
    registry.registerHook(hook2);

    // Act
    await registry.emitEvent('timelog.created', { id: 'log-1', duration: 120 });

    // Assert
    expect(hook1OnEvent).toHaveBeenCalledWith('timelog.created', { id: 'log-1', duration: 120 });
    expect(hook2OnEvent).toHaveBeenCalledWith('timelog.created', { id: 'log-1', duration: 120 });
  });

  it('should not let a failing hook reject the entire event dispatch', async () => {
    // Arrange
    const failingHook: IEventHookPlugin = {
      id: 'failing-hook',
      name: 'Failing',
      onEvent: vi.fn().mockRejectedValue(new Error('Network error')),
    };
    const passingHook: IEventHookPlugin = {
      id: 'passing-hook',
      name: 'Passing',
      onEvent: vi.fn().mockResolvedValue(undefined),
    };

    registry.registerHook(failingHook);
    registry.registerHook(passingHook);

    // Act & Assert
    await expect(registry.emitEvent('test.event', {})).resolves.toBeUndefined();
    expect(passingHook.onEvent).toHaveBeenCalled();
  });
});
