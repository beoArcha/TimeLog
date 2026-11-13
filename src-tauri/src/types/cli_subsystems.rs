use super::report::ReportVariant;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum HealthStatus {
    Ok,
    Error,
}

/// One persisted `config` row; `config ls` never lists defaults that were not written to SQLite.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
}

/// Payload of the `oxy.config.list` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ConfigListPayload {
    pub items: Vec<ConfigEntry>,
}

/// Payload of the `oxy.config.get` and `oxy.config.set` envelopes.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ConfigValuePayload {
    pub key: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SinkEntry {
    pub name: String,
    pub sink_type: String,
    pub target: String,
    /// Only whether credentials are stored: machine output is often logged or piped, so the
    /// webhook token itself never leaves the database through the CLI.
    pub has_token: bool,
    pub enabled: bool,
    pub created_at: String,
}

/// Payload of the `oxy.sink.list` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SinkListPayload {
    pub items: Vec<SinkEntry>,
}

/// Payload of the `oxy.sink.set` envelope, shared by the CSV and webhook setters.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SinkSetPayload {
    pub sink_type: String,
    pub target: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SinkTestResult {
    pub name: String,
    pub sink_type: String,
    pub target: String,
    pub passed: bool,
    pub detail: String,
}

/// Payload of the `oxy.sink.test` envelope; a failing sink makes the command fail instead.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SinkTestPayload {
    pub items: Vec<SinkTestResult>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MaskEntry {
    pub name: String,
    pub template: String,
    pub created_at: String,
}

/// Payload of the `oxy.mask.list` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MaskListPayload {
    pub items: Vec<MaskEntry>,
}

/// Payload of the `oxy.mask.set` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MaskSetPayload {
    pub name: String,
    pub template: String,
}

/// Payload of the `oxy.mask.remove` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MaskRemovePayload {
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DoctorCheck {
    pub name: String,
    pub status: HealthStatus,
    pub message: String,
}

/// Payload of the `oxy.doctor` envelope; it is only emitted when every check passed.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DoctorPayload {
    pub overall_status: HealthStatus,
    pub db_path: String,
    #[ts(type = "number")]
    pub db_size_bytes: u64,
    pub checks: Vec<DoctorCheck>,
}

/// Payload of the `oxy.db.backup` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DbBackupPayload {
    pub destination: String,
}

/// Payload of the `oxy.db.restore` envelope.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DbRestorePayload {
    pub source: String,
}

/// Payload of the `oxy.report.export` envelope printed after `report -o <path>` in machine mode.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportExportPayload {
    pub path: String,
    /// CLI name of the export format (`--format`).
    pub format: String,
    pub variant: ReportVariant,
    #[ts(type = "number")]
    pub total_seconds: u64,
}
