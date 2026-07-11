pub mod cache;
pub mod config;
pub mod core;
pub mod error;
pub mod projects;
pub mod settings;
pub mod shared;
pub mod tasks;
pub mod time_logs;

use core::CorePersistence;
use projects::ProjectsPersistence;
use settings::SettingsPersistence;
use shared::PersistenceShared;
use std::sync::Arc;
use tasks::TasksPersistence;
use time_logs::TimeLogsPersistence;

pub use config::PersistenceConfig;
pub use error::{PersistenceError, PersistenceResult};

pub struct Persistence {
    pub projects: ProjectsPersistence,
    pub tasks: TasksPersistence,
    pub settings: SettingsPersistence,
    pub core: CorePersistence,
    pub time_logs: TimeLogsPersistence,
}

impl Persistence {
    pub fn new(
        config: &PersistenceConfig,
    ) -> Result<Self, crate::repositories::shared::errors::RepositoryError> {
        let shared = Arc::new(PersistenceShared::new(config)?);

        Ok(Self {
            projects: ProjectsPersistence::new(shared.clone()),
            tasks: TasksPersistence::new(shared.clone()),
            settings: SettingsPersistence::new(shared.clone()),
            core: CorePersistence::new(shared.clone()),
            time_logs: TimeLogsPersistence::new(shared),
        })
    }
}
