import { MockCommandArgs } from '../types';

export interface MockDesktopSqliteSettings {
  autoStart: boolean;
  includePatchesInReports: boolean;
  activeSinks: string[];
  theme: string;
  textAndIconSize: string;
  guiVariant: string;
  alwaysOnTopSmall: boolean;
  alwaysOnTopMain: boolean;
  minimizeToTray: boolean;
}

let mockDesktopDbSettings: MockDesktopSqliteSettings | null = null;

export const resetMockDesktopSettings = (seed?: Partial<MockDesktopSqliteSettings>) => {
  if (seed) {
    mockDesktopDbSettings = {
      autoStart: false,
      includePatchesInReports: false,
      activeSinks: ['Csv'],
      theme: 'system',
      textAndIconSize: 'medium',
      guiVariant: 'full',
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: true,
      ...seed,
    };
  } else {
    mockDesktopDbSettings = null;
  }
};

export const getMockDesktopSettingsSnapshot = (): MockDesktopSqliteSettings => ({
  autoStart: false,
  includePatchesInReports: false,
  activeSinks: ['Csv'],
  theme: 'system',
  textAndIconSize: 'medium',
  guiVariant: 'full',
  alwaysOnTopSmall: false,
  alwaysOnTopMain: false,
  minimizeToTray: true,
  ...(mockDesktopDbSettings ?? {}),
});

export const SETTINGS_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  get: async () => {
    if (mockDesktopDbSettings) {
      return { ...mockDesktopDbSettings };
    }
    const saved = localStorage.getItem('timelog_persistence_plugin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parsing error
      }
    }
    const theme = localStorage.getItem('oxytime_theme') || 'system';
    const textAndIconSize = localStorage.getItem('oxytime_text_icon_size') || 'medium';
    const guiVariant = localStorage.getItem('oxytime_gui_variant') || 'full';
    const alwaysOnTopSmall = localStorage.getItem('oxytime_always_on_top_small') === 'true';
    const alwaysOnTopMain = localStorage.getItem('oxytime_always_on_top_main') === 'true';
    const minimizeToTray = localStorage.getItem('oxytime_min_to_tray') !== 'false';
    let autoStart = false;
    let includePatchesInReports = true;
    const sysSaved = localStorage.getItem('oxytime_sys_settings');
    if (sysSaved) {
      try {
        const parsed = JSON.parse(sysSaved) as Record<string, boolean>;
        autoStart = parsed.autoStart ?? false;
        includePatchesInReports = parsed.includePatchesInReports ?? true;
      } catch {
        // Ignore parsing error
      }
    }
    return {
      autoStart,
      includePatchesInReports,
      activeSinks: ['Csv'],
      theme,
      textAndIconSize,
      guiVariant,
      alwaysOnTopSmall,
      alwaysOnTopMain,
      minimizeToTray,
    };
  },
  save: async (args) => {
    if (mockDesktopDbSettings && args.settings && typeof args.settings === 'object') {
      const s = args.settings as Record<string, unknown>;
      mockDesktopDbSettings = {
        autoStart: typeof s.autoStart === 'boolean' ? s.autoStart : mockDesktopDbSettings.autoStart,
        includePatchesInReports:
          typeof s.includePatchesInReports === 'boolean'
            ? s.includePatchesInReports
            : mockDesktopDbSettings.includePatchesInReports,
        activeSinks: Array.isArray(s.activeSinks) ? (s.activeSinks as string[]) : mockDesktopDbSettings.activeSinks,
        theme: typeof s.theme === 'string' ? s.theme : mockDesktopDbSettings.theme,
        textAndIconSize:
          typeof s.textAndIconSize === 'string' ? s.textAndIconSize : mockDesktopDbSettings.textAndIconSize,
        guiVariant: typeof s.guiVariant === 'string' ? s.guiVariant : mockDesktopDbSettings.guiVariant,
        alwaysOnTopSmall:
          typeof s.alwaysOnTopSmall === 'boolean'
            ? s.alwaysOnTopSmall
            : mockDesktopDbSettings.alwaysOnTopSmall,
        alwaysOnTopMain:
          typeof s.alwaysOnTopMain === 'boolean'
            ? s.alwaysOnTopMain
            : mockDesktopDbSettings.alwaysOnTopMain,
        minimizeToTray:
          typeof s.minimizeToTray === 'boolean'
            ? s.minimizeToTray
            : mockDesktopDbSettings.minimizeToTray,
      };
    } else if (args.settings) {
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify(args.settings));
    }
    return Promise.resolve();
  },
  get_settings: async () => {
    return SETTINGS_HANDLERS.get({});
  },
  save_settings: async (args) => {
    return SETTINGS_HANDLERS.save(args);
  },
  save_runtime_config: async (args) => {
    const raw = localStorage.getItem('mock_runtime_configs');
    const configs = raw ? JSON.parse(raw) : [];
    if (args.config) {
      const idx = configs.findIndex((c: { id: string }) => c.id === (args.config as { id: string }).id);
      if (idx !== -1) {
        configs[idx] = args.config;
      } else {
        configs.push(args.config);
      }
    }
    localStorage.setItem('mock_runtime_configs', JSON.stringify(configs));
    return Promise.resolve();
  },
  get_runtime_configs: async () => {
    const raw = localStorage.getItem('mock_runtime_configs');
    return raw ? JSON.parse(raw) : [];
  },
};
