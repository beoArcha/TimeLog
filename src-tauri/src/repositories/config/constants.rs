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

pub const INSERT_OR_REPLACE_WEBHOOK_QUEUE_ITEM: &str = "
    INSERT OR REPLACE INTO webhook_queue (id, url, method, headers, payload, status, retry_count, next_retry_at, last_error, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
";

pub const SELECT_PENDING_WEBHOOKS: &str = "
    SELECT id, url, method, headers, payload, status, retry_count, next_retry_at, last_error, created_at
    FROM webhook_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
";

pub const UPDATE_WEBHOOK_STATUS: &str = "
    UPDATE webhook_queue
    SET status = ?2, retry_count = ?3, next_retry_at = ?4, last_error = ?5
    WHERE id = ?1
";

pub const DELETE_WEBHOOK_BY_ID: &str = "DELETE FROM webhook_queue WHERE id = ?1";

pub const CLEAR_WEBHOOK_QUEUE: &str = "DELETE FROM webhook_queue";

pub const SELECT_WEBHOOK_QUEUE_STATS: &str = "
    SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0)
    FROM webhook_queue
";

// Configuration keys for UI state, API, and locale settings
pub const KEY_CURRENT_PROJECT_ID: &str = "ui_current_project_id";
pub const KEY_LAST_NON_COMPACT_VARIANT: &str = "ui_last_non_compact_variant";
pub const KEY_PROJECT_ORDER: &str = "ui_project_order";

pub const KEY_API_LOG_TO_API: &str = "api_log_to_api";
pub const KEY_API_TOKEN: &str = "api_token";
pub const KEY_API_URL: &str = "api_url";
pub const KEY_API_METHOD: &str = "api_method";
pub const KEY_API_HEADERS: &str = "api_headers";

pub const KEY_LOCALE_PREF: &str = "locale_pref";
pub const KEY_LOCALE: &str = "locale";
pub const KEY_CUSTOM_TRANSLATIONS: &str = "custom_translations";
pub const KEY_WORKFLOW_CONFIG: &str = "workflow_config";

// Default configuration values
pub const DEFAULT_NON_COMPACT_VARIANT: &str = "full";
pub const DEFAULT_API_METHOD: &str = "POST";
pub const DEFAULT_LOCALE: &str = "system";
pub const DEFAULT_CUSTOM_TRANSLATIONS: &str = "{}";

pub const SELECT_ALL_CONFIG_ENTRIES: &str = "SELECT key, value FROM config ORDER BY key ASC";

pub const INSERT_OR_REPLACE_CLI_ALIAS: &str = "
    INSERT OR REPLACE INTO cli_aliases (name, template, created_at)
    VALUES (?1, ?2, ?3)
";

pub const SELECT_ALL_CLI_ALIASES: &str = "
    SELECT name, template, created_at FROM cli_aliases ORDER BY name ASC
";

pub const SELECT_CLI_ALIAS_BY_NAME: &str = "
    SELECT name, template, created_at FROM cli_aliases WHERE name = ?1
";

pub const DELETE_CLI_ALIAS_BY_NAME: &str = "DELETE FROM cli_aliases WHERE name = ?1";

pub const INSERT_OR_REPLACE_CLI_SINK: &str = "
    INSERT OR REPLACE INTO cli_sinks (name, sink_type, target, config, enabled, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
";

pub const SELECT_ALL_CLI_SINKS: &str = "
    SELECT name, sink_type, target, config, enabled, created_at FROM cli_sinks ORDER BY name ASC
";

pub const SELECT_CLI_SINK_BY_NAME: &str = "
    SELECT name, sink_type, target, config, enabled, created_at FROM cli_sinks WHERE name = ?1
";

pub const DELETE_CLI_SINK_BY_NAME: &str = "DELETE FROM cli_sinks WHERE name = ?1";
