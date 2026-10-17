import { MockCommandArgs } from '../types';

export const AUXILIARY_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  get_holidays: async () => {
    const raw = localStorage.getItem('mock_holidays');
    return raw ? JSON.parse(raw) : [];
  },
  save_holidays: async (args) => {
    localStorage.setItem('mock_holidays', JSON.stringify(args.holidays ?? []));
    return Promise.resolve();
  },
  get_patches: async () => {
    const raw = localStorage.getItem('mock_patches');
    return raw ? JSON.parse(raw) : [];
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
      localStorage.setItem('mock_current_project_id', args.id);
    }
    return Promise.resolve();
  },
  get_last_non_compact_variant: async () => {
    return localStorage.getItem('mock_last_non_compact_variant') || 'full';
  },
  save_last_non_compact_variant: async (args) => {
    localStorage.setItem('mock_last_non_compact_variant', args.variant ?? 'full');
    return Promise.resolve();
  },
  get_external_api_settings: async () => {
    const raw = localStorage.getItem('mock_external_api_settings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Ignore parsing error
      }
    }
    return {
      logToApi: false,
      apiToken: '',
      apiUrl: '',
      apiMethod: 'POST',
      apiHeaders: '',
    };
  },
  save_external_api_settings: async (args) => {
    localStorage.setItem(
      'mock_external_api_settings',
      JSON.stringify(args.settings ?? {})
    );
    return Promise.resolve();
  },
  get_locale_pref: async () => {
    return localStorage.getItem('mock_locale_pref') || 'system';
  },
  save_locale_pref: async (args) => {
    localStorage.setItem('mock_locale_pref', args.pref ?? 'system');
    return Promise.resolve();
  },
  get_locale: async () => {
    return localStorage.getItem('mock_locale') || 'system';
  },
  save_locale: async (args) => {
    localStorage.setItem('mock_locale', args.locale ?? 'system');
    return Promise.resolve();
  },
  get_custom_translations: async () => {
    return localStorage.getItem('mock_custom_translations') || '{}';
  },
  save_custom_translations: async (args) => {
    localStorage.setItem(
      'mock_custom_translations',
      args.translations ?? '{}'
    );
    return Promise.resolve();
  },
};
