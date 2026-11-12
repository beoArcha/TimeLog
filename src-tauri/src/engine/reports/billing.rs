use super::catalog::Catalog;
use super::constants::{MAX_SAFE_AMOUNT_MINOR, MSG_UNPARSEABLE_RATE, SECONDS_PER_HOUR};
use crate::engine::billing::{
    calculate_bankers_amount, parse_rate_to_cents, resolve_effective_rate,
};
use crate::engine::EngineError;
use crate::types::{ReportBillingTotal, ReportRateStatus, Task};
use std::collections::BTreeMap;

/// What one task (or one of its entries) earns for a given number of seconds.
#[derive(Debug, Clone)]
pub(super) struct Billing {
    pub rate_minor: Option<u64>,
    pub currency: Option<String>,
    pub rate_status: ReportRateStatus,
    pub amount_minor: Option<u64>,
}

/// Resolves rates through the same inheritance chain as `engine::billing`, so reports can never
/// disagree with `calculate_range_billing`.
pub(super) struct RateResolver<'a> {
    catalog: &'a Catalog<'a>,
    default_rate_cents: Option<u64>,
}

impl<'a> RateResolver<'a> {
    pub(super) fn new(catalog: &'a Catalog<'a>, default_rate_cents: Option<u64>) -> Self {
        Self {
            catalog,
            default_rate_cents,
        }
    }

    pub(super) fn bill(&self, task: &Task, seconds: u64) -> Result<Billing, EngineError> {
        let project = self.catalog.project(&task.project_id)?;
        let effective = resolve_effective_rate(task, Some(project), self.default_rate_cents);
        let rate_minor = effective
            .rate
            .as_deref()
            .map(|rate| {
                parse_rate_to_cents(rate).ok_or_else(|| {
                    EngineError::Validation(format!("{MSG_UNPARSEABLE_RATE} '{rate}'"))
                })
            })
            .transpose()?;
        let amount_minor = rate_minor
            .map(|rate| amount_minor(seconds, rate))
            .transpose()?;
        Ok(Billing {
            rate_minor,
            currency: effective.currency,
            rate_status: ReportRateStatus::from(effective.status),
            amount_minor,
        })
    }
}

/// Banker's rounding per call, so a task is rounded once and an entry once; the two need not agree.
fn amount_minor(seconds: u64, rate_minor: u64) -> Result<u64, EngineError> {
    // Checked before rounding because the helper narrows its u128 result to u64.
    let floor = u128::from(seconds) * u128::from(rate_minor) / SECONDS_PER_HOUR;
    if floor > u128::from(MAX_SAFE_AMOUNT_MINOR) {
        return Err(out_of_range());
    }
    ensure_safe(calculate_bankers_amount(seconds, rate_minor))
}

fn ensure_safe(amount: u64) -> Result<u64, EngineError> {
    if amount > MAX_SAFE_AMOUNT_MINOR {
        return Err(out_of_range());
    }
    Ok(amount)
}

fn out_of_range() -> EngineError {
    EngineError::AmountOutOfRange {
        limit: MAX_SAFE_AMOUNT_MINOR,
    }
}

/// Seconds split by rate status.
#[derive(Debug, Clone, Copy, Default)]
pub(super) struct SecondsSplit {
    pub billable: u64,
    pub non_billable: u64,
    pub unconfigured: u64,
}

impl SecondsSplit {
    fn add(&mut self, status: ReportRateStatus, seconds: u64) {
        match status {
            ReportRateStatus::Inherited | ReportRateStatus::Custom => self.billable += seconds,
            ReportRateStatus::NonBillable => self.non_billable += seconds,
            ReportRateStatus::Unconfigured => self.unconfigured += seconds,
        }
    }

    fn merge(&mut self, other: SecondsSplit) {
        self.billable += other.billable;
        self.non_billable += other.non_billable;
        self.unconfigured += other.unconfigured;
    }
}

#[derive(Debug, Default, Clone, Copy)]
struct Bucket {
    split: SecondsSplit,
    amount_minor: u64,
}

/// Seconds and amounts of one scope (a project or the whole document). Per-currency buckets only
/// see time whose task resolved a currency; the split sees all time.
#[derive(Debug, Default)]
pub(super) struct Tally {
    split: SecondsSplit,
    by_currency: BTreeMap<String, Bucket>,
}

impl Tally {
    pub(super) fn add_task(
        &mut self,
        billing: &Billing,
        direct_seconds: u64,
    ) -> Result<(), EngineError> {
        if direct_seconds == 0 {
            return Ok(());
        }
        self.split.add(billing.rate_status, direct_seconds);
        let Some(currency) = billing.currency.as_deref() else {
            return Ok(());
        };
        let bucket = self.by_currency.entry(currency.to_string()).or_default();
        bucket.split.add(billing.rate_status, direct_seconds);
        bucket.amount_minor = ensure_safe(bucket.amount_minor + billing.amount_minor.unwrap_or(0))?;
        Ok(())
    }

    /// Time without a task has no rate to resolve, so it is unconfigured and has no currency.
    pub(super) fn add_taskless(&mut self, seconds: u64) {
        self.split.add(ReportRateStatus::Unconfigured, seconds);
    }

    pub(super) fn merge(&mut self, other: &Tally) -> Result<(), EngineError> {
        self.split.merge(other.split);
        for (currency, incoming) in &other.by_currency {
            let bucket = self.by_currency.entry(currency.clone()).or_default();
            bucket.split.merge(incoming.split);
            bucket.amount_minor = ensure_safe(bucket.amount_minor + incoming.amount_minor)?;
        }
        Ok(())
    }

    pub(super) fn split(&self) -> SecondsSplit {
        self.split
    }

    /// `BTreeMap` iteration yields currencies in ascending order, as the contract requires.
    pub(super) fn currency_totals(&self) -> Vec<ReportBillingTotal> {
        self.by_currency
            .iter()
            .map(|(currency, bucket)| ReportBillingTotal {
                currency: currency.clone(),
                amount_minor: bucket.amount_minor,
                billable_seconds: bucket.split.billable,
                non_billable_seconds: bucket.split.non_billable,
                unconfigured_seconds: bucket.split.unconfigured,
            })
            .collect()
    }
}
