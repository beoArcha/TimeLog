use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum RateMode {
    Inherit,
    Custom,
    NonBillable,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum RateStatus {
    Inherited,
    Custom,
    NonBillable,
    Unconfigured,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct EffectiveRateResult {
    pub rate: Option<String>,
    pub currency: Option<String>,
    pub status: RateStatus,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TaskBillingSummary {
    pub task_id: String,
    pub task_name: String,
    pub project_id: String,
    pub duration_seconds: u64,
    pub effective_rate: Option<String>,
    pub currency: Option<String>,
    pub rate_status: RateStatus,
    pub amount: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct CurrencyBillingSummary {
    pub currency: String,
    pub total_amount: String,
    pub billable_duration_seconds: u64,
    pub non_billable_duration_seconds: u64,
    pub unconfigured_duration_seconds: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RangeBillingResult {
    pub by_currency: HashMap<String, CurrencyBillingSummary>,
    pub by_task: Vec<TaskBillingSummary>,
    pub total_billable_seconds: u64,
    pub total_non_billable_seconds: u64,
    pub total_unconfigured_seconds: u64,
}
