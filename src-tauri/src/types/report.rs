use super::billing::RateStatus;
use super::range::{RangeRequest, ResolvedRange};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub const REPORT_SCHEMA_NAME: &str = "oxy.report";
pub const REPORT_SCHEMA_VERSION: u32 = 2;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum ReportVariant {
    Summary,
    Full,
}

/// Mirrors `RateStatus` with camelCase values so the report contract uses one casing style.
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub enum ReportRateStatus {
    Inherited,
    Custom,
    NonBillable,
    Unconfigured,
}

impl From<RateStatus> for ReportRateStatus {
    fn from(status: RateStatus) -> Self {
        match status {
            RateStatus::Inherited => Self::Inherited,
            RateStatus::Custom => Self::Custom,
            RateStatus::NonBillable => Self::NonBillable,
            RateStatus::Unconfigured => Self::Unconfigured,
        }
    }
}

/// Filter IDs are already resolved; name resolution stays in the CLI so the Engine never guesses.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportRequest {
    pub range: RangeRequest,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    pub variant: ReportVariant,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub include_patches: Option<bool>,
}

/// The single report model every export format projects from.
///
/// Invariants consumers rely on:
/// - The model holds raw values only. Formatted or display strings belong to the projection,
///   so one document renders identically in every locale and format.
/// - Durations are whole seconds, money is integer minor units and shares are integer basis
///   points, which keeps sums exact and serialization byte-identical across runtimes.
/// - `entries` is present only for `ReportVariant::Full`; for `Full` it is `[]` (not omitted)
///   when the range is empty.
/// - An empty range yields zero totals and empty arrays, except `days` of a range with both
///   bounds, which lists its zero days.
/// - Only projects and tasks with time in the range appear.
/// - Ordering is deterministic. `projects` and root `tasks` are ordered by `seconds` descending,
///   then `id` ascending. `subtasks` are in depth-first pre-order with siblings ordered by
///   `seconds` descending, then `id` ascending. `billing` items are ordered by `currency`
///   ascending, `days` by `date` ascending and `entries` by `start` ascending, then `id` ascending.
/// - `days` splits entries crossing local midnight in `range.timezone`; see `ReportDay`.
/// - Field order is stable. New fields may only be appended; any other change to the shape
///   must bump `REPORT_SCHEMA_VERSION`.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
#[schemars(title = "oxy.report", extend("$id" = "urn:oxyflow:schema:oxy.report:2"))]
pub struct ReportDocument {
    #[schemars(extend("const" = "oxy.report"))]
    pub schema: String,
    #[ts(type = "number")]
    #[schemars(extend("const" = 2))]
    pub schema_version: u32,
    pub variant: ReportVariant,
    /// RFC3339 UTC with a `Z` suffix and whole seconds.
    pub generated_at: String,
    pub generator: ReportGenerator,
    pub range: ResolvedRange,
    pub filters: ReportFilters,
    pub totals: ReportTotals,
    pub projects: Vec<ReportProject>,
    pub days: Vec<ReportDay>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entries: Option<Vec<ReportEntry>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportGenerator {
    pub name: String,
    pub version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportFilters {
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    /// Tells consumers whether patch time is included in every figure of the document.
    pub include_patches: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportTotals {
    #[ts(type = "number")]
    pub seconds: u64,
    /// Entries with time inside the range, including patches when `filters.includePatches`.
    #[ts(type = "number")]
    pub entry_count: u64,
    /// Document-level split covering all time, including time without a resolved currency.
    #[ts(type = "number")]
    pub billable_seconds: u64,
    #[ts(type = "number")]
    pub non_billable_seconds: u64,
    #[ts(type = "number")]
    pub unconfigured_seconds: u64,
    /// One item per currency; empty when nothing is billable. Per-currency buckets cover only
    /// time with a resolved currency; the document-level fields cover all time.
    pub billing: Vec<ReportBillingTotal>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportBillingTotal {
    pub currency: String,
    /// Σ of root-task and subtask `amount_minor` in this currency, in minor units.
    #[ts(type = "number")]
    pub amount_minor: u64,
    #[ts(type = "number")]
    pub billable_seconds: u64,
    #[ts(type = "number")]
    pub non_billable_seconds: u64,
    #[ts(type = "number")]
    pub unconfigured_seconds: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportProject {
    pub id: String,
    pub name: String,
    /// Time logged on the project without a task (project-level patches);
    /// `seconds` = `direct_seconds` + Σ `tasks[].seconds`.
    #[ts(type = "number")]
    pub direct_seconds: u64,
    #[ts(type = "number")]
    pub seconds: u64,
    /// Share of `totals.seconds` in basis points (0–10000), rounded half-to-even;
    /// 0 when `totals.seconds` is 0. Shares are not guaranteed to sum to 10000.
    #[ts(type = "number")]
    pub share_basis_points: u32,
    pub billing: Vec<ReportBillingTotal>,
    /// Root tasks only; their descendants live in `ReportTask.subtasks`.
    pub tasks: Vec<ReportTask>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportTask {
    pub id: String,
    pub name: String,
    /// Time logged on the task itself, excluding subtasks.
    #[ts(type = "number")]
    pub direct_seconds: u64,
    /// Direct time plus all descendants.
    #[ts(type = "number")]
    pub seconds: u64,
    /// Share of `totals.seconds` in basis points (0–10000), rounded half-to-even;
    /// 0 when `totals.seconds` is 0. Shares are not guaranteed to sum to 10000.
    #[ts(type = "number")]
    pub share_basis_points: u32,
    /// Hourly rate in minor currency units (e.g. cents). 0 for non-billable tasks;
    /// absent only when the rate is unconfigured. Rates are those configured at `generated_at`.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_minor: Option<u64>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    pub rate_status: ReportRateStatus,
    /// Authoritative amount for `direct_seconds` only: each subtask is billed on its own row at
    /// its own rate, with banker's rounding per task. 0 for non-billable tasks; absent only when
    /// the rate is unconfigured.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_minor: Option<u64>,
    /// All descendants of this root task, flattened in depth-first pre-order with siblings
    /// ordered by `seconds` descending, then `id` ascending.
    pub subtasks: Vec<ReportSubtask>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportSubtask {
    pub id: String,
    pub name: String,
    /// Immediate parent: the root task or another subtask.
    pub parent_task_id: String,
    /// Time logged on the subtask itself, excluding its own descendants.
    #[ts(type = "number")]
    pub direct_seconds: u64,
    /// Direct time plus all of its own descendants.
    #[ts(type = "number")]
    pub seconds: u64,
    /// Share of `totals.seconds` in basis points (0–10000), rounded half-to-even;
    /// 0 when `totals.seconds` is 0. Shares are not guaranteed to sum to 10000.
    #[ts(type = "number")]
    pub share_basis_points: u32,
    /// Hourly rate in minor currency units (e.g. cents). 0 for non-billable subtasks;
    /// absent only when the rate is unconfigured. Rates are those configured at `generated_at`.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_minor: Option<u64>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    pub rate_status: ReportRateStatus,
    /// Authoritative amount for `direct_seconds` at this subtask's own rate, with banker's
    /// rounding. 0 for non-billable subtasks; absent only when the rate is unconfigured.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_minor: Option<u64>,
}

/// Entries crossing local midnight are split across days in `range.timezone`
/// (DST days have 23 or 25 hours). When both range bounds exist, every local day in
/// `[from, to)` is emitted, including zero days. With an unbounded side, only days with
/// time are emitted.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportDay {
    /// Local `YYYY-MM-DD` in `range.timezone`.
    pub date: String,
    #[ts(type = "number")]
    pub seconds: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, TS, JsonSchema)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReportEntry {
    pub id: String,
    pub project_id: String,
    pub project_name: String,
    /// Absent for a project-level patch.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    /// Absent for a project-level patch.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_name: Option<String>,
    /// Root task of the hierarchy; equals `task_id` for a root-task entry;
    /// absent for a task-less patch.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub root_task_id: Option<String>,
    /// The immediate parent task.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_task_id: Option<String>,
    /// The immediate parent task.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_task_name: Option<String>,
    /// Stored instant, RFC3339 UTC `Z`, whole seconds; not clamped — `seconds`,
    /// `original_seconds` and `clamped` describe the in-range portion.
    pub start: String,
    /// Absent only for a running entry; its `seconds` are measured up to `generated_at`.
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<String>,
    /// Local `YYYY-MM-DD` of the in-range start in `range.timezone`.
    pub date: String,
    /// Duration inside the range after clamping.
    #[ts(type = "number")]
    pub seconds: u64,
    /// Full duration before clamping.
    #[ts(type = "number")]
    pub original_seconds: u64,
    pub clamped: bool,
    pub is_patch: bool,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    /// Hourly rate in minor currency units (e.g. cents). 0 for non-billable time;
    /// absent only when the rate is unconfigured.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_minor: Option<u64>,
    #[ts(optional)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    /// Informational: rounded individually, so entries may not sum to the task amount.
    /// 0 for non-billable time; absent only when the rate is unconfigured.
    #[ts(optional, type = "number")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_minor: Option<u64>,
}
