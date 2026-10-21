use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::CliAlias;
use rusqlite::params;

impl ConfigRepository {
    pub fn save_cli_alias(&self, alias: &CliAlias) -> Result<()> {
        let conn = self.connect()?;
        conn.execute(
            constants::INSERT_OR_REPLACE_CLI_ALIAS,
            params![alias.name, alias.template, alias.created_at],
        )?;
        Ok(())
    }

    pub fn get_all_cli_aliases(&self) -> Result<Vec<CliAlias>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_CLI_ALIASES)?;
        let rows = stmt.query_map([], |row| {
            Ok(CliAlias {
                name: row.get(0)?,
                template: row.get(1)?,
                created_at: row.get(2)?,
            })
        })?;

        let mut aliases = Vec::new();
        for item in rows {
            aliases.push(item?);
        }
        Ok(aliases)
    }

    pub fn get_cli_alias(&self, name: &str) -> Result<Option<CliAlias>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_CLI_ALIAS_BY_NAME)?;
        let mut rows = stmt.query(params![name])?;
        if let Some(row) = rows.next()? {
            Ok(Some(CliAlias {
                name: row.get(0)?,
                template: row.get(1)?,
                created_at: row.get(2)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete_cli_alias(&self, name: &str) -> Result<bool> {
        let conn = self.connect()?;
        let affected = conn.execute(constants::DELETE_CLI_ALIAS_BY_NAME, params![name])?;
        Ok(affected > 0)
    }
}
