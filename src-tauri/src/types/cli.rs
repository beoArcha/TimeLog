use super::report::ReportGenerator;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub const ENVELOPE_SCHEMA_NAME: &str = "oxy.envelope";
pub const ENVELOPE_SCHEMA_VERSION: u32 = 1;

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
#[serde(rename_all = "camelCase")]
pub struct CliErrorCandidate {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct CliErrorDetails {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub candidates: Option<Vec<CliErrorCandidate>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub suggestion: Option<CliErrorCandidate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub field: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub value: Option<String>,
}

impl CliErrorDetails {
    pub fn is_empty(&self) -> bool {
        self.candidates.as_ref().is_none_or(Vec::is_empty)
            && self.suggestion.is_none()
            && self.field.is_none()
            && self.value.is_none()
    }
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
    #[ts(optional)]
    pub user: Option<LocalizedUserMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub details: Option<CliErrorDetails>,
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

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct EnvelopeMeta {
    pub generated_at: String,
    pub generator: ReportGenerator,
}

/// Versioned wrapper around every successful `--json` / `--machine` payload.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
#[schemars(title = "oxy.envelope", extend("$id" = "urn:oxyflow:schema:oxy.envelope:1"))]
pub struct SuccessEnvelope {
    pub schema: String,
    pub schema_version: u32,
    #[ts(type = "unknown")]
    #[schemars(with = "serde_json::Value")]
    pub data: serde_json::Value,
    pub meta: EnvelopeMeta,
}
