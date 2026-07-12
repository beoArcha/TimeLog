pub const SELECT_CONFIG_VALUE: &str = "SELECT value FROM config WHERE key = ?1";
pub const INSERT_OR_REPLACE_CONFIG: &str =
    "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)";

pub const INSERT_RUNTIME_CONFIG: &str = "
    INSERT OR REPLACE INTO runtime_configs (id, runtime, config, created_at)
    VALUES (?1, ?2, ?3, ?4)
";

pub const SELECT_ALL_RUNTIME_CONFIGS: &str = "
    SELECT id, runtime, config, created_at FROM runtime_configs
";

