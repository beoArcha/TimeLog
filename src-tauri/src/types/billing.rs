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

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum BillingError {
    #[error("Stored billing rate cannot be negative")]
    NegativeRate,
    #[error("Billing rate exceeds the supported maximum of {0} cents")]
    RateExceedsMaximum(u64),
    #[error("Billing rate exceeds the supported storage range")]
    RateExceedsStorage,
}

pub const MAX_BILLING_RATE_CENTS: u64 = 9_007_199_254_740_991;

pub fn validate_billing_rate_cents(cents: u64) -> Result<u64, BillingError> {
    if cents > MAX_BILLING_RATE_CENTS {
        return Err(BillingError::RateExceedsMaximum(MAX_BILLING_RATE_CENTS));
    }
    Ok(cents)
}

pub fn checked_billing_rate_to_i64(cents: u64) -> Result<i64, BillingError> {
    i64::try_from(validate_billing_rate_cents(cents)?).map_err(|_| BillingError::RateExceedsStorage)
}

pub fn validate_stored_billing_rate_cents(cents: i64) -> Result<u64, BillingError> {
    let cents = u64::try_from(cents).map_err(|_| BillingError::NegativeRate)?;
    validate_billing_rate_cents(cents)
}

pub fn format_cents(cents: u64) -> String {
    let whole = cents / 100;
    let frac = cents % 100;
    format!("{}.{:02}", whole, frac)
}

pub fn parse_rate_to_cents(s: &str) -> Option<u64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    let cents = if let Some((whole_str, frac_str)) = trimmed.split_once('.') {
        if whole_str.is_empty() || !whole_str.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        let whole = whole_str.parse::<u64>().ok()?;
        if !frac_str.chars().all(|c| c.is_ascii_digit()) || frac_str.len() > 2 {
            return None;
        }
        let frac = match frac_str.len() {
            0 => 0,
            1 => frac_str.parse::<u64>().ok()? * 10,
            2 => frac_str.parse::<u64>().ok()?,
            _ => return None,
        };
        whole.checked_mul(100)?.checked_add(frac)?
    } else {
        if !trimmed.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        let whole = trimmed.parse::<u64>().ok()?;
        whole.checked_mul(100)?
    };
    if cents > MAX_BILLING_RATE_CENTS {
        return None;
    }
    Some(cents)
}

pub fn parse_rate_or_cents(s: &str) -> Option<u64> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    if let Some(cents_str) = trimmed
        .strip_suffix('c')
        .or_else(|| trimmed.strip_suffix('¢'))
    {
        let cents_trimmed = cents_str.trim();
        if cents_trimmed.is_empty() || !cents_trimmed.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        let cents = cents_trimmed.parse::<u64>().ok()?;
        if cents > MAX_BILLING_RATE_CENTS {
            return None;
        }
        Some(cents)
    } else if trimmed.contains('.') {
        parse_rate_to_cents(trimmed)
    } else {
        if !trimmed.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }
        let cents = trimmed
            .parse::<u64>()
            .ok()
            .and_then(|val| val.checked_mul(100))?;
        if cents > MAX_BILLING_RATE_CENTS {
            return None;
        }
        Some(cents)
    }
}
