import { MockCommandArgs } from '../types';
import { STORAGE_KEYS } from '@common/constants';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { PersistenceException } from '@common/exceptions/AppExceptions';

function safeParseJson<T>(raw: string | null, fallback: T, contextName: string): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException(
        `Failed parsing ${contextName} from mock storage, using fallback`,
        err,
        'WARN_MOCK_STORAGE_PARSE',
        'INFO'
      )
    );
    return fallback;
  }
}

export const AUXILIARY_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  get_holidays: async () => {
    return safeParseJson(localStorage.getItem('mock_holidays'), [], 'holidays');
  },
  save_holidays: async (args) => {
    localStorage.setItem('mock_holidays', JSON.stringify(args.holidays ?? []));
    return Promise.resolve();
  },
  get_patches: async () => {
    return safeParseJson(localStorage.getItem('mock_patches'), [], 'patches');
  },
  save_patches: async (args) => {
    localStorage.setItem('mock_patches', JSON.stringify(args.patches ?? []));
    return Promise.resolve();
  },
  get_current_project_id: async () => {
    return localStorage.getItem('mock_current_project_id');
  },
  save_current_project_id: async (args) => {
    if (args.id === null || args.id === undefined) {
      localStorage.removeItem('mock_current_project_id');
    } else {
      localStorage.setItem('mock_current_project_id', String(args.id));
    }
    return Promise.resolve();
  },
  get_last_non_compact_variant: async () => {
    return localStorage.getItem('mock_last_non_compact_variant') || 'full';
  },
  save_last_non_compact_variant: async (args) => {
    localStorage.setItem('mock_last_non_compact_variant', String(args.variant ?? 'full'));
    return Promise.resolve();
  },
  get_external_api_settings: async () => {
    const raw = localStorage.getItem('mock_external_api_settings');
    if (raw) {
      const parsed = safeParseJson<Record<string, unknown> | null>(raw, null, 'external_api_settings');
      if (parsed) return parsed;
    }
    const logToApi =
      (localStorage.getItem('oxytime_log_to_api') ??
        localStorage.getItem('timelog_persistence_plugin_logToApi')) === 'true';
    const apiToken =
      localStorage.getItem('oxytime_api_token') ??
      localStorage.getItem('timelog_persistence_plugin_apiToken') ??
      '';
    const apiUrl =
      localStorage.getItem('oxytime_api_url') ??
      localStorage.getItem('timelog_persistence_plugin_apiUrl') ??
      '';
    const apiMethod =
      (localStorage.getItem('oxytime_api_method') ??
        localStorage.getItem('timelog_persistence_plugin_apiMethod') ??
        'POST') as 'POST' | 'PUT';
    const apiHeaders =
      localStorage.getItem('oxytime_api_headers') ??
      localStorage.getItem('timelog_persistence_plugin_apiHeaders') ??
      '';
    return {
      logToApi,
      apiToken,
      apiUrl,
      apiMethod,
      apiHeaders,
    };
  },
  save_external_api_settings: async (args) => {
    localStorage.setItem(
      'mock_external_api_settings',
      JSON.stringify(args.settings ?? {})
    );
    return Promise.resolve();
  },
  get_runtime_config: async () => {
    return safeParseJson(localStorage.getItem('mock_runtime_config'), [], 'runtime_config');
  },
  save_runtime_config: async (args) => {
    localStorage.setItem('mock_runtime_config', JSON.stringify(args.configs ?? []));
    return Promise.resolve();
  },
  get_tray_icon_and_text_size: async () => {
    return localStorage.getItem('mock_tray_icon_and_text_size') || 'Medium';
  },
  save_tray_icon_and_text_size: async (args) => {
    localStorage.setItem('mock_tray_icon_and_text_size', String(args.size ?? 'Medium'));
    return Promise.resolve();
  },
  get_always_on_top: async () => {
    return localStorage.getItem('mock_always_on_top') === 'true';
  },
  save_always_on_top: async (args) => {
    localStorage.setItem('mock_always_on_top', String(args.alwaysOnTop));
    return Promise.resolve();
  },
  get_minimize_to_tray: async () => {
    return localStorage.getItem('mock_minimize_to_tray') === 'true';
  },
  save_minimize_to_tray: async (args) => {
    localStorage.setItem('mock_minimize_to_tray', String(args.minimizeToTray));
    return Promise.resolve();
  },
  get_gui_layout_variant: async () => {
    return localStorage.getItem('mock_gui_layout_variant') || 'full';
  },
  save_gui_layout_variant: async (args) => {
    localStorage.setItem('mock_gui_layout_variant', String(args.variant ?? 'full'));
    return Promise.resolve();
  },
  get_window_dimensions: async () => {
    return safeParseJson(
      localStorage.getItem('mock_window_dimensions'),
      { width: 800, height: 600 },
      'window_dimensions'
    );
  },
  save_window_dimensions: async (args) => {
    localStorage.setItem(
      'mock_window_dimensions',
      JSON.stringify(args.dimensions ?? { width: 800, height: 600 })
    );
    return Promise.resolve();
  },
  get_locale_pref: async () => {
    return (
      localStorage.getItem(STORAGE_KEYS.LOCALE_PREF) ??
      localStorage.getItem('mock_locale_pref') ??
      'system'
    );
  },
  save_locale_pref: async (args) => {
    const pref = String(args.pref ?? 'system');
    localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, pref);
    localStorage.setItem('mock_locale_pref', pref);
    return Promise.resolve();
  },
  get_locale: async () => {
    return (
      localStorage.getItem(STORAGE_KEYS.LOCALE) ??
      localStorage.getItem('mock_locale') ??
      'en'
    );
  },
  save_locale: async (args) => {
    const loc = String(args.locale ?? 'en');
    localStorage.setItem(STORAGE_KEYS.LOCALE, loc);
    localStorage.setItem('mock_locale', loc);
    return Promise.resolve();
  },
  get_custom_translations: async () => {
    return (
      localStorage.getItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS) ??
      localStorage.getItem('mock_custom_translations') ??
      '{}'
    );
  },
  save_custom_translations: async (args) => {
    const val = String(args.translations ?? '{}');
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, val);
    localStorage.setItem('mock_custom_translations', val);
    return Promise.resolve();
  },
  enqueue_webhook: async (args) => {
    const queue = safeParseJson<unknown[]>(localStorage.getItem('mock_webhook_queue'), [], 'webhook_queue');
    if (args.item) {
      queue.push(args.item);
    }
    localStorage.setItem(
      'mock_webhook_queue',
      JSON.stringify(queue, (_key, val) => (typeof val === 'bigint' ? Number(val) : val))
    );
    return Promise.resolve();
  },
  get_pending_webhooks: async () => {
    const queue = safeParseJson<Array<{ status?: string }>>(
      localStorage.getItem('mock_webhook_queue'),
      [],
      'webhook_queue'
    );
    return queue.filter((item) => item.status === 'pending');
  },
  update_webhook_status: async (args) => {
    const queue = safeParseJson<Array<Record<string, unknown>>>(
      localStorage.getItem('mock_webhook_queue'),
      [],
      'webhook_queue'
    );
    const item = queue.find((i) => i.id === args.id);
    if (item) {
      item.status = args.status;
      item.retryCount = args.retryCount;
      item.nextRetryAt = args.nextRetryAt;
      item.lastError = args.lastError;
    }
    localStorage.setItem(
      'mock_webhook_queue',
      JSON.stringify(queue, (_key, val) => (typeof val === 'bigint' ? Number(val) : val))
    );
    return Promise.resolve();
  },
  delete_webhook: async (args) => {
    const queue = safeParseJson<Array<{ id: string }>>(
      localStorage.getItem('mock_webhook_queue'),
      [],
      'webhook_queue'
    );
    const filtered = queue.filter((i) => i.id !== args.id);
    localStorage.setItem('mock_webhook_queue', JSON.stringify(filtered));
    return Promise.resolve();
  },
  clear_webhook_queue: async () => {
    localStorage.removeItem('mock_webhook_queue');
    return Promise.resolve();
  },
  get_webhook_queue_stats: async () => {
    const queue = safeParseJson<Array<{ status?: string }>>(
      localStorage.getItem('mock_webhook_queue'),
      [],
      'webhook_queue'
    );
    let pending = 0;
    let failed = 0;
    let delivered = 0;
    for (const item of queue) {
      if (item.status === 'pending') pending++;
      else if (item.status === 'failed') failed++;
      else if (item.status === 'delivered') delivered++;
    }
    return { pending, failed, delivered };
  },
};
