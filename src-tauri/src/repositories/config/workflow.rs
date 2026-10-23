use super::constants;
use super::ConfigRepository;
use crate::repositories::shared::errors::Result;
use crate::types::WorkflowConfig;

impl ConfigRepository {
    pub fn get_workflow_config(&self) -> Result<WorkflowConfig> {
        let conn = self.connect()?;
        if let Some(val) = Self::query_config_value(&conn, constants::KEY_WORKFLOW_CONFIG)? {
            if val.trim().is_empty() || val.trim() == "null" {
                return Ok(WorkflowConfig::default());
            }
            let config = serde_json::from_str::<WorkflowConfig>(&val)?;
            return Ok(config);
        }
        Ok(WorkflowConfig::default())
    }

    pub fn save_workflow_config(&self, config: &WorkflowConfig) -> Result<()> {
        let conn = self.connect()?;
        let json_str = serde_json::to_string(config)?;
        Self::store_config_value(&conn, constants::KEY_WORKFLOW_CONFIG, &json_str)?;
        Ok(())
    }
}
