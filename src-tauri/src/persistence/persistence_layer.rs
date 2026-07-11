use std::sync::Arc;
use super::persistence_config::PersistenceConfig;
use super::persistence_shared::PersistenceShared;
use super::projects::ProjectsPersistence;
use super::tasks::TasksPersistence;
use super::settings::SettingsPersistence;
use super::core::CorePersistence;

pub struct PersistenceLayer {
    pub projects: ProjectsPersistence,
    pub tasks: TasksPersistence,
    pub settings: SettingsPersistence,
    pub core: CorePersistence,
}

impl PersistenceLayer {
    pub fn new(
        config: &PersistenceConfig,
    ) -> Result<Self, crate::repositories::shared::errors::RepositoryError> {
        let shared = Arc::new(PersistenceShared::new(config)?);

        Ok(Self {
            projects: ProjectsPersistence::new(shared.clone()),
            tasks: TasksPersistence::new(shared.clone()),
            settings: SettingsPersistence::new(shared.clone()),
            core: CorePersistence::new(shared),
        })
    }
}
