use crate::types::{RangePreset, RangeRequest};
use clap::{ArgGroup, Args};

/// Period selection shared by `log list` and every `report` form.
#[derive(Args, Debug, Clone, Default, PartialEq, Eq)]
#[command(group(ArgGroup::new("preset").multiple(false)))]
pub struct PeriodArgs {
    #[arg(long, help = "Scope to today", group = "preset")]
    pub today: bool,
    #[arg(long, help = "Scope to yesterday", group = "preset")]
    pub yesterday: bool,
    #[arg(
        long,
        help = "Scope to the current week (Monday start)",
        group = "preset"
    )]
    pub week: bool,
    #[arg(long, help = "Scope to last week (Monday start)", group = "preset")]
    pub last_week: bool,
    #[arg(long, help = "Scope to the current month", group = "preset")]
    pub month: bool,
    #[arg(long, help = "Scope to last month", group = "preset")]
    pub last_month: bool,
    #[arg(
        long,
        help = "Start of range, inclusive (YYYY-MM-DD or RFC3339)",
        conflicts_with = "preset"
    )]
    pub from: Option<String>,
    #[arg(
        long,
        help = "End of range, exclusive (YYYY-MM-DD covers that whole day, or RFC3339)",
        conflicts_with = "preset"
    )]
    pub to: Option<String>,
}

impl PeriodArgs {
    fn chosen_preset(&self) -> Option<RangePreset> {
        [
            (self.today, RangePreset::Today),
            (self.yesterday, RangePreset::Yesterday),
            (self.week, RangePreset::Week),
            (self.last_week, RangePreset::LastWeek),
            (self.month, RangePreset::Month),
            (self.last_month, RangePreset::LastMonth),
        ]
        .into_iter()
        .find_map(|(set, preset)| set.then_some(preset))
    }

    fn has_bounds(&self) -> bool {
        self.from.is_some() || self.to.is_some()
    }

    fn is_empty(&self) -> bool {
        self.chosen_preset().is_none() && !self.has_bounds()
    }

    /// With neither a preset nor custom bounds the period is all time.
    pub fn preset(&self) -> Option<RangePreset> {
        self.chosen_preset()
            .or_else(|| (!self.has_bounds()).then_some(RangePreset::All))
    }

    pub fn to_range_request(&self, tz: Option<&str>) -> RangeRequest {
        RangeRequest {
            preset: self.preset(),
            from: self.from.clone(),
            to: self.to.clone(),
            timezone: tz.map(str::to_string),
        }
    }

    /// A subcommand's own period wins; the parent command's applies only when the subcommand sets none.
    pub fn or(self, parent: PeriodArgs) -> PeriodArgs {
        if self.is_empty() {
            parent
        } else {
            self
        }
    }
}
