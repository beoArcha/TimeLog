use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::CliSink;
use rusqlite::params;

impl ConfigRepository {
    pub fn save_cli_sink(&self, sink: &CliSink) -> Result<()> {
        let conn = self.connect()?;
        let enabled_int = if sink.enabled { 1 } else { 0 };
        conn.execute(
            constants::INSERT_OR_REPLACE_CLI_SINK,
            params![
                sink.name,
                sink.sink_type,
                sink.target,
                sink.config,
                enabled_int,
                sink.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_cli_sinks(&self) -> Result<Vec<CliSink>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_CLI_SINKS)?;
        let rows = stmt.query_map([], |row| {
            let enabled_int: i32 = row.get(4)?;
            Ok(CliSink {
                name: row.get(0)?,
                sink_type: row.get(1)?,
                target: row.get(2)?,
                config: row.get(3)?,
                enabled: enabled_int != 0,
                created_at: row.get(5)?,
            })
        })?;

        let mut sinks = Vec::new();
        for item in rows {
            sinks.push(item?);
        }
        Ok(sinks)
    }

    pub fn get_cli_sink(&self, name: &str) -> Result<Option<CliSink>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_CLI_SINK_BY_NAME)?;
        let mut rows = stmt.query(params![name])?;
        if let Some(row) = rows.next()? {
            let enabled_int: i32 = row.get(4)?;
            Ok(Some(CliSink {
                name: row.get(0)?,
                sink_type: row.get(1)?,
                target: row.get(2)?,
                config: row.get(3)?,
                enabled: enabled_int != 0,
                created_at: row.get(5)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete_cli_sink(&self, name: &str) -> Result<bool> {
        let conn = self.connect()?;
        let affected = conn.execute(constants::DELETE_CLI_SINK_BY_NAME, params![name])?;
        Ok(affected > 0)
    }
}
