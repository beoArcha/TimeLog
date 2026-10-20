use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct CliAlias {
    pub name: String,
    pub template: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct CliSink {
    pub name: String,
    pub sink_type: String,
    pub target: String,
    pub config: Option<String>,
    pub enabled: bool,
    pub created_at: String,
}
