use crate::cli::error::CliError;
use crate::cli::handlers::constants::{
    DIVIDER_LINE, FORMAT_TODAY_ITEM, FORMAT_TODAY_TOTAL, HEADER_TODAY_PREFIX, LABEL_UNKNOWN_TASK,
    MSG_NO_TODAY_LOGS,
};
use crate::cli::shared::envelope::EnvelopeSchema;
use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;
use crate::types::{
    RangePreset, RangeRequest, ReportDocument, ReportEntry, ReportRequest, ReportVariant,
};

const SCHEMA_TODAY: EnvelopeSchema = EnvelopeSchema::new("oxy.today", 1);

/// `today` and the dashboard share this document so their figures can never disagree.
/// Patches are left out: both commands report tracked sessions, as they did before the
/// report model.
pub(super) fn build_today_report(
    engine: &Engine,
    tz: Option<&str>,
) -> Result<ReportDocument, CliError> {
    let request = ReportRequest {
        range: RangeRequest {
            preset: Some(RangePreset::Today),
            from: None,
            to: None,
            timezone: tz.map(str::to_string),
        },
        project_id: None,
        task_id: None,
        variant: ReportVariant::Full,
        include_patches: Some(false),
    };
    Ok(engine.build_report(&request)?)
}

/// The `Full` variant always carries `entries`; only a `Summary` document omits them.
pub(super) fn today_entries(document: &ReportDocument) -> &[ReportEntry] {
    document.entries.as_deref().unwrap_or_default()
}

pub fn handle_today(
    is_machine: bool,
    engine: &Engine,
    tz: Option<&str>,
) -> Result<CliOutput, CliError> {
    let document = build_today_report(engine, tz)?;
    if is_machine {
        return CliOutput::envelope(SCHEMA_TODAY, &document);
    }
    let today_date = engine.local_date_of_range(&document.range)?;
    Ok(CliOutput::Success(format_daily_summary(
        &document,
        &today_date,
    )))
}

fn format_daily_summary(document: &ReportDocument, today_date: &str) -> String {
    let mut output = HEADER_TODAY_PREFIX.replace("{}", today_date);

    if document.totals.entry_count == 0 {
        output.push_str(MSG_NO_TODAY_LOGS);
        return output;
    }

    for entry in today_entries(document) {
        // Only a project-level patch has no task, and `today` excludes patches.
        let task_name = entry.task_name.as_deref().unwrap_or(LABEL_UNKNOWN_TASK);
        output.push_str(
            &FORMAT_TODAY_ITEM
                .replacen("{}", &entry.project_name, 1)
                .replacen("{}", task_name, 1)
                .replacen("{}", &format!("{:02}", entry.seconds / 60), 1)
                .replacen("{}", &format!("{:02}", entry.seconds % 60), 1),
        );
    }

    let total_seconds = document.totals.seconds;
    output.push_str(DIVIDER_LINE);
    output.push_str(
        &FORMAT_TODAY_TOTAL
            .replacen("{}", &(total_seconds / 3600).to_string(), 1)
            .replacen("{}", &format!("{:02}", (total_seconds % 3600) / 60), 1)
            .replacen("{}", &document.totals.entry_count.to_string(), 1),
    );
    output
}
