pub mod cache;
pub mod cli;
pub mod config;
pub mod core;
pub mod debug;
pub mod error;
pub mod external_api;
pub mod holidays;
pub mod locale;
pub mod patches;
pub mod projects;
pub mod settings;
pub mod shared;
pub mod tasks;
pub mod time_logs;
pub mod ui_state;
pub mod webhook_queue;
pub mod workflow;

use cli::CliPersistence;
use core::CorePersistence;
use debug::DebugPersistence;
use external_api::ExternalApiPersistence;
use holidays::HolidaysPersistence;
use locale::LocalePersistence;
use patches::PatchesPersistence;
use projects::ProjectsPersistence;
use settings::SettingsPersistence;
use shared::PersistenceShared;
use std::sync::Arc;
use tasks::TasksPersistence;
use time_logs::TimeLogsPersistence;
use ui_state::UiStatePersistence;
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
    pub ui_state: UiStatePersistence,
    pub external_api: ExternalApiPersistence,
    pub locale: LocalePersistence,
    pub webhook_queue: WebhookQueuePersistence,
    pub workflow: WorkflowPersistence,
    pub cli: CliPersistence,
    pub debug: DebugPersistence,
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
            ui_state: UiStatePersistence::new(shared.clone()),
            external_api: ExternalApiPersistence::new(shared.clone()),
            locale: LocalePersistence::new(shared.clone()),
            webhook_queue: WebhookQueuePersistence::new(shared.clone()),
            workflow: WorkflowPersistence::new(shared.clone()),
            cli: CliPersistence::new(shared.clone()),
            debug: DebugPersistence::new(shared),
        })
    }
}
