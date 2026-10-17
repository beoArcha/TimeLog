pub const SELECT_CONFIG_VALUE: &str = "SELECT value FROM config WHERE key = ?1";
pub const INSERT_OR_REPLACE_CONFIG: &str =
    "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)";
pub const DELETE_CONFIG_KEY: &str = "DELETE FROM config WHERE key = ?1";

pub const INSERT_RUNTIME_CONFIG: &str = "
    INSERT OR REPLACE INTO runtime_configs (id, runtime, config, created_at)
    VALUES (?1, ?2, ?3, ?4)
";

pub const SELECT_ALL_RUNTIME_CONFIGS: &str = "
    SELECT id, runtime, config, created_at FROM runtime_configs
";

// Configuration keys for auxiliary UI, API, and locale settings
pub const KEY_CURRENT_PROJECT_ID: &str = "ui_current_project_id";
pub const KEY_LAST_NON_COMPACT_VARIANT: &str = "ui_last_non_compact_variant";

pub const KEY_API_LOG_TO_API: &str = "api_log_to_api";
pub const KEY_API_TOKEN: &str = "api_token";
pub const KEY_API_URL: &str = "api_url";
pub const KEY_API_METHOD: &str = "api_method";
pub const KEY_API_HEADERS: &str = "api_headers";

pub const KEY_LOCALE_PREF: &str = "locale_pref";
pub const KEY_LOCALE: &str = "locale";
pub const KEY_CUSTOM_TRANSLATIONS: &str = "custom_translations";

// Default configuration values
pub const DEFAULT_NON_COMPACT_VARIANT: &str = "full";
pub const DEFAULT_API_METHOD: &str = "POST";
pub const DEFAULT_LOCALE: &str = "system";
pub const DEFAULT_CUSTOM_TRANSLATIONS: &str = "{}";
