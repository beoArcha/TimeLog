use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
pub struct CliAlias {
    pub name: String,
    pub template: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
pub struct CliSink {
    pub name: String,
    pub sink_type: String,
    pub target: String,
    pub config: Option<String>,
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
pub struct LocalizedUserMessage {
    pub locale: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remediation: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
pub struct CliErrorEnvelope {
    pub code: String,
    pub category: String,
    pub exit_code: u8,
    pub timestamp: String,
    pub technical: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<LocalizedUserMessage>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
pub struct CliExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub exit_code: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub envelope: Option<Box<CliErrorEnvelope>>,
}
