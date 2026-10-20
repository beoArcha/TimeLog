use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::{CliAlias, CliSink};
use std::sync::Arc;

pub struct CliPersistence {
    shared: Arc<PersistenceShared>,
}

impl CliPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    // Aliases (Masks)
    pub fn get_all_aliases(&self) -> PersistenceResult<Vec<CliAlias>> {
        let aliases = self.shared.config_repo.get_all_cli_aliases()?;
        Ok(aliases)
    }

    pub fn get_alias(&self, name: &str) -> PersistenceResult<Option<CliAlias>> {
        let alias = self.shared.config_repo.get_cli_alias(name)?;
        Ok(alias)
    }

    pub fn save_alias(&self, alias: &CliAlias) -> PersistenceResult<()> {
        self.shared.config_repo.save_cli_alias(alias)?;
        Ok(())
    }

    pub fn delete_alias(&self, name: &str) -> PersistenceResult<bool> {
        let deleted = self.shared.config_repo.delete_cli_alias(name)?;
        Ok(deleted)
    }

    // Sinks
    pub fn get_all_sinks(&self) -> PersistenceResult<Vec<CliSink>> {
        let sinks = self.shared.config_repo.get_all_cli_sinks()?;
        Ok(sinks)
    }

    pub fn get_sink(&self, name: &str) -> PersistenceResult<Option<CliSink>> {
        let sink = self.shared.config_repo.get_cli_sink(name)?;
        Ok(sink)
    }

    pub fn save_sink(&self, sink: &CliSink) -> PersistenceResult<()> {
        self.shared.config_repo.save_cli_sink(sink)?;
        Ok(())
    }

    pub fn delete_sink(&self, name: &str) -> PersistenceResult<bool> {
        let deleted = self.shared.config_repo.delete_cli_sink(name)?;
        Ok(deleted)
    }

    // Config Key-Value
    pub fn get_all_config_entries(&self) -> PersistenceResult<Vec<(String, String)>> {
        let entries = self.shared.config_repo.get_all_config_entries()?;
        Ok(entries)
    }

    pub fn get_config_value(&self, key: &str) -> PersistenceResult<Option<String>> {
        let val = self.shared.config_repo.get_config_value(key)?;
        Ok(val)
    }

    pub fn set_config_value(&self, key: &str, value: &str) -> PersistenceResult<()> {
        self.shared.config_repo.set_config_value(key, value)?;
        Ok(())
    }
}
