use crate::cli::error::{CliError, CliSyntaxError};
use crate::engine::billing::{format_cents, parse_rate_or_cents, validate_currency_code};

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum BillingValueAction<T> {
    #[default]
    Unchanged,
    Clear,
    Set(T),
}

#[derive(Debug, Clone, Default)]
pub struct NormalizedBillingCreation {
    pub hourly_rate: Option<String>,
    pub billing_rate_cents: Option<i64>,
    pub currency: Option<String>,
    pub billing_currency: Option<String>,
}

impl NormalizedBillingCreation {
    pub fn parse(
        rate: Option<String>,
        rate_cents: Option<u64>,
        currency: Option<String>,
    ) -> Result<Self, CliError> {
        if rate.is_some() && rate_cents.is_some() {
            return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
                "Cannot specify both --rate and --rate-cents".to_string(),
            )));
        }

        let (hourly_rate, billing_rate_cents) = if let Some(cents) = rate_cents {
            crate::engine::billing::validate_billing_rate_cents(cents).map_err(CliError::Engine)?;
            let cents_i64 = i64::try_from(cents).map_err(|_| {
                CliError::Engine(crate::engine::EngineError::Validation(format!(
                    "Rate cents value '{}' exceeds supported range",
                    cents
                )))
            })?;
            (Some(format_cents(cents)), Some(cents_i64))
        } else if let Some(r) = rate {
            let trimmed = r.trim();
            let cents = parse_rate_or_cents(trimmed).ok_or_else(|| {
                CliError::Engine(crate::engine::EngineError::Validation(format!(
                    "Invalid rate format: '{}'",
                    trimmed
                )))
            })?;
            crate::engine::billing::validate_billing_rate_cents(cents).map_err(CliError::Engine)?;
            let cents_i64 = i64::try_from(cents).map_err(|_| {
                CliError::Engine(crate::engine::EngineError::Validation(format!(
                    "Rate cents value '{}' exceeds supported range",
                    cents
                )))
            })?;
            (Some(format_cents(cents)), Some(cents_i64))
        } else {
            (None, None)
        };

        let (curr, billing_curr) = if let Some(c) = currency {
            let trimmed = c.trim();
            let validated = validate_currency_code(trimmed)?;
            (Some(validated.clone()), Some(validated))
        } else {
            (None, None)
        };

        Ok(Self {
            hourly_rate,
            billing_rate_cents,
            currency: curr,
            billing_currency: billing_curr,
        })
    }
}

#[derive(Debug, Clone, Default)]
pub struct NormalizedBillingUpdate {
    pub rate: BillingValueAction<String>,
    pub rate_cents: BillingValueAction<i64>,
    pub currency: BillingValueAction<String>,
    pub billing_currency: BillingValueAction<String>,
}

impl NormalizedBillingUpdate {
    pub fn parse(
        rate: Option<String>,
        rate_cents: Option<u64>,
        currency: Option<String>,
    ) -> Result<Self, CliError> {
        if rate.is_some() && rate_cents.is_some() {
            return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
                "Cannot specify both --rate and --rate-cents".to_string(),
            )));
        }

        let (rate_action, rate_cents_action) = if let Some(cents) = rate_cents {
            crate::engine::billing::validate_billing_rate_cents(cents).map_err(CliError::Engine)?;
            let cents_i64 = i64::try_from(cents).map_err(|_| {
                CliError::Engine(crate::engine::EngineError::Validation(format!(
                    "Rate cents value '{}' exceeds supported range",
                    cents
                )))
            })?;
            (
                BillingValueAction::Set(format_cents(cents)),
                BillingValueAction::Set(cents_i64),
            )
        } else if let Some(r) = rate {
            let trimmed = r.trim();
            if trimmed.eq_ignore_ascii_case("none")
                || trimmed.eq_ignore_ascii_case("clear")
                || trimmed.eq_ignore_ascii_case("inherit")
            {
                (BillingValueAction::Clear, BillingValueAction::Clear)
            } else {
                let cents = parse_rate_or_cents(trimmed).ok_or_else(|| {
                    CliError::Engine(crate::engine::EngineError::Validation(format!(
                        "Invalid rate format: '{}'",
                        trimmed
                    )))
                })?;
                crate::engine::billing::validate_billing_rate_cents(cents).map_err(CliError::Engine)?;
            let cents_i64 = i64::try_from(cents).map_err(|_| {
                    CliError::Engine(crate::engine::EngineError::Validation(format!(
                        "Rate cents value '{}' exceeds supported range",
                        cents
                    )))
                })?;
                (
                    BillingValueAction::Set(format_cents(cents)),
                    BillingValueAction::Set(cents_i64),
                )
            }
        } else {
            (BillingValueAction::Unchanged, BillingValueAction::Unchanged)
        };

        let (curr_action, billing_curr_action) = if let Some(c) = currency {
            let trimmed = c.trim();
            if trimmed.eq_ignore_ascii_case("none")
                || trimmed.eq_ignore_ascii_case("clear")
                || trimmed.eq_ignore_ascii_case("inherit")
            {
                (BillingValueAction::Clear, BillingValueAction::Clear)
            } else {
                let validated = validate_currency_code(trimmed)?;
                (
                    BillingValueAction::Set(validated.clone()),
                    BillingValueAction::Set(validated),
                )
            }
        } else {
            (BillingValueAction::Unchanged, BillingValueAction::Unchanged)
        };

        Ok(Self {
            rate: rate_action,
            rate_cents: rate_cents_action,
            currency: curr_action,
            billing_currency: billing_curr_action,
        })
    }

    pub fn apply_to_project(&self, project: &mut crate::types::Project) {
        match &self.rate {
            BillingValueAction::Clear => project.hourly_rate = None,
            BillingValueAction::Set(r) => project.hourly_rate = Some(r.clone()),
            BillingValueAction::Unchanged => {}
        }
        match &self.rate_cents {
            BillingValueAction::Clear => project.billing_rate_cents = None,
            BillingValueAction::Set(c) => project.billing_rate_cents = Some(*c),
            BillingValueAction::Unchanged => {}
        }
        match &self.currency {
            BillingValueAction::Clear => project.currency = None,
            BillingValueAction::Set(c) => project.currency = Some(c.clone()),
            BillingValueAction::Unchanged => {}
        }
        match &self.billing_currency {
            BillingValueAction::Clear => project.billing_currency = None,
            BillingValueAction::Set(c) => project.billing_currency = Some(c.clone()),
            BillingValueAction::Unchanged => {}
        }
    }

    pub fn apply_to_task(&self, task: &mut crate::types::Task) {
        match &self.rate {
            BillingValueAction::Clear => task.hourly_rate = None,
            BillingValueAction::Set(r) => task.hourly_rate = Some(r.clone()),
            BillingValueAction::Unchanged => {}
        }
        match &self.rate_cents {
            BillingValueAction::Clear => task.billing_rate_cents = None,
            BillingValueAction::Set(c) => task.billing_rate_cents = Some(*c),
            BillingValueAction::Unchanged => {}
        }
        match &self.currency {
            BillingValueAction::Clear => task.currency = None,
            BillingValueAction::Set(c) => task.currency = Some(c.clone()),
            BillingValueAction::Unchanged => {}
        }
        match &self.billing_currency {
            BillingValueAction::Clear => task.billing_currency = None,
            BillingValueAction::Set(c) => task.billing_currency = Some(c.clone()),
            BillingValueAction::Unchanged => {}
        }
    }
}
