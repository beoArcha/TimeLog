pub const SELECT_CONFIG_VALUE: &str = "SELECT value FROM config WHERE key = ?1";
pub const INSERT_OR_REPLACE_CONFIG: &str =
    "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)";
