export const STORAGE_KEYS = {
  // --- UI & Preferences (User Domain) ---
  THEME: 'oxytime_theme',
  TEXT_ICON_SIZE: 'oxytime_text_icon_size',
  SYS_SETTINGS: 'oxytime_sys_settings',
  GUI_VARIANT: 'oxytime_gui_variant',
  LAST_NON_COMPACT_VARIANT: 'oxytime_last_non_compact_variant',
  ALWAYS_ON_TOP_SMALL: 'oxytime_always_on_top_small',
  ALWAYS_ON_TOP_MAIN: 'oxytime_always_on_top_main',
  LOCALE_PREF: 'oxytime_locale_pref',
  LOCALE: 'oxytime_locale',
  CUSTOM_TRANSLATIONS: 'oxytime_custom_translations',

  // --- Business Data Domain ---
  STATE_DB: 'timelog_persistence_plugin_state',
  STORAGE_KEY: 'timelog_persistence_plugin_state',
  CURRENT_PROJ_ID: 'oxytime_current_proj_id',
  PROJECT_ORDER: 'oxytime_project_order',
  LAST_TRACKED_TASK_ID: 'oxytime_last_tracked_task_id',
  PATCHES: 'timelog_persistence_plugin_patches',
  HOLIDAYS_KEY: 'timelog_persistence_plugin_holidays',

  // --- Runtime & System Domain ---
  MIN_TO_TRAY: 'oxytime_min_to_tray',
  LOG_TO_API: 'oxytime_log_to_api',
  API_TOKEN: 'oxytime_api_token',
  API_URL: 'oxytime_api_url',
  API_HEADERS: 'oxytime_api_headers',
  API_METHOD: 'oxytime_api_method',
  SETTINGS_KEY: 'timelog_persistence_plugin_settings',
  RUN_CONFIGS_KEY: 'timelog_persistence_plugin_runtime_configs',
  WEBHOOK_QUEUE: 'timelog_persistence_plugin_webhook_queue',
  WORKFLOW_CONFIG: 'oxytime_workflow_config',
} as const;

export type StorageDomain = 'BUSINESS' | 'SETTINGS' | 'SYSTEM';
export type StorageResetScope = StorageDomain | 'ALL';

export const DOMAIN_STORAGE_KEYS: Record<StorageDomain, readonly string[]> = {
  BUSINESS: [
    STORAGE_KEYS.STORAGE_KEY,
    STORAGE_KEYS.STATE_DB,
    STORAGE_KEYS.CURRENT_PROJ_ID,
    STORAGE_KEYS.PROJECT_ORDER,
    STORAGE_KEYS.LAST_TRACKED_TASK_ID,
    STORAGE_KEYS.PATCHES,
    STORAGE_KEYS.HOLIDAYS_KEY,
  ],
  SETTINGS: [
    STORAGE_KEYS.THEME,
    STORAGE_KEYS.TEXT_ICON_SIZE,
    STORAGE_KEYS.SYS_SETTINGS,
    STORAGE_KEYS.GUI_VARIANT,
    STORAGE_KEYS.LAST_NON_COMPACT_VARIANT,
    STORAGE_KEYS.ALWAYS_ON_TOP_SMALL,
    STORAGE_KEYS.ALWAYS_ON_TOP_MAIN,
    STORAGE_KEYS.LOCALE_PREF,
    STORAGE_KEYS.LOCALE,
    STORAGE_KEYS.CUSTOM_TRANSLATIONS,
    STORAGE_KEYS.SETTINGS_KEY,
  ],
  SYSTEM: [
    STORAGE_KEYS.RUN_CONFIGS_KEY,
    STORAGE_KEYS.WEBHOOK_QUEUE,
    STORAGE_KEYS.WORKFLOW_CONFIG,
    STORAGE_KEYS.MIN_TO_TRAY,
    STORAGE_KEYS.LOG_TO_API,
    STORAGE_KEYS.API_TOKEN,
    STORAGE_KEYS.API_URL,
    STORAGE_KEYS.API_HEADERS,
    STORAGE_KEYS.API_METHOD,
  ],
} as const;
