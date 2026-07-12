use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::RuntimeConfig;
use rusqlite::params;

impl ConfigRepository {
    pub fn save_runtime_config(&self, config: &RuntimeConfig) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(
            constants::INSERT_RUNTIME_CONFIG,
            params![config.id, config.runtime, config.config, config.created_at],
        )?;
        Ok(())
    }

    pub fn get_runtime_configs(&self) -> Result<Vec<RuntimeConfig>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_RUNTIME_CONFIGS)?;
        let rows = stmt.query_map([], |row| {
            Ok(RuntimeConfig {
                id: row.get(0)?,
                runtime: row.get(1)?,
                config: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        let mut configs = Vec::new();
        for r in rows {
            configs.push(r?);
        }
        Ok(configs)
    }
}
