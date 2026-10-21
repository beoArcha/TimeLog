pub mod auxiliary;
pub mod cache;
pub mod cli;
pub mod config;
pub mod core;
pub mod error;
pub mod holidays;
pub mod patches;
pub mod projects;
pub mod settings;
pub mod shared;
pub mod tasks;
pub mod time_logs;
pub mod webhook_queue;
pub mod workflow;

use auxiliary::AuxiliaryPersistence;
use cli::CliPersistence;
use core::CorePersistence;
use holidays::HolidaysPersistence;
use patches::PatchesPersistence;
use projects::ProjectsPersistence;
use settings::SettingsPersistence;
use shared::PersistenceShared;
use std::sync::Arc;
use tasks::TasksPersistence;
use time_logs::TimeLogsPersistence;
use webhook_queue::WebhookQueuePersistence;
use workflow::WorkflowPersistence;

pub use config::PersistenceConfig;
pub use error::{PersistenceError, PersistenceResult};

pub struct Persistence {
    pub projects: ProjectsPersistence,
    pub tasks: TasksPersistence,
    pub settings: SettingsPersistence,
    pub core: CorePersistence,
    pub time_logs: TimeLogsPersistence,
    pub holidays: HolidaysPersistence,
    pub patches: PatchesPersistence,
    pub auxiliary: AuxiliaryPersistence,
    pub webhook_queue: WebhookQueuePersistence,
    pub workflow: WorkflowPersistence,
    pub cli: CliPersistence,
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
            time_logs: TimeLogsPersistence::new(shared.clone()),
            holidays: HolidaysPersistence::new(shared.clone()),
            patches: PatchesPersistence::new(shared.clone()),
            auxiliary: AuxiliaryPersistence::new(shared.clone()),
            webhook_queue: WebhookQueuePersistence::new(shared.clone()),
            workflow: WorkflowPersistence::new(shared.clone()),
            cli: CliPersistence::new(shared),
        })
    }
}
