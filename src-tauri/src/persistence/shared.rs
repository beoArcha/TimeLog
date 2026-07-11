use super::cache::PersistenceCache;
use super::config::PersistenceConfig;
use super::error::{PersistenceError, PersistenceResult};
use crate::repositories::business::BusinessRepository;
use crate::repositories::config::ConfigRepository;
use crate::sinks::csv::CsvSink;
use crate::types::PersistenceEvent;

pub struct PersistenceShared {
    pub business_repo: BusinessRepository,
    pub config_repo: ConfigRepository,
    pub csv_sink: CsvSink,
    pub cache: PersistenceCache,
}

impl PersistenceShared {
    pub fn new(
        config: &PersistenceConfig,
    ) -> Result<Self, crate::repositories::shared::errors::RepositoryError> {
        let business_repo = BusinessRepository::new(&config.db_path)?;
        let config_repo = ConfigRepository::new(&config.db_path)?;
        let csv_sink = CsvSink::new(&config.csv_directory);
        let cache = PersistenceCache::new();

        Ok(Self {
            business_repo,
            config_repo,
            csv_sink,
            cache,
        })
    }

    pub fn execute_write<F, E>(&self, db_op: F, event: PersistenceEvent) -> PersistenceResult<()>
    where
        F: FnOnce() -> Result<(), E>,
        PersistenceError: From<E>,
    {
        db_op()?;
        self.cache.clear();
        self.csv_sink.emit(&event);
        Ok(())
    }
}
