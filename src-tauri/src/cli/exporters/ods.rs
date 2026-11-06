use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::{format_duration, ReportTreeDto};
use spreadsheet_ods::{OdsError, Sheet, WorkBook};

fn map_ods_err(e: OdsError) -> CliError {
    log::error!("Failed to export ODS report: {e}");
    CliError::Sink(SinkError::Serialization(e.to_string()))
}

pub fn export_ods(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = WorkBook::new_empty();
    let mut sheet = Sheet::new("Work Report");

    let headers = [
        "Project",
        "Task",
        "Subtask",
        "Duration_Seconds",
        "Duration_Formatted",
        "Percentage",
    ];

    for (col, header) in headers.iter().enumerate() {
        sheet.set_value(0, col as u32, *header);
    }

    let mut current_row: u32 = 1;

    for project in &tree.projects {
        let p_name = &project.name;
        for task in &project.tasks {
            let subtasks_secs: u64 = task.subtasks.iter().map(|s| s.duration_seconds).sum();
            let direct_secs = task.duration_seconds.saturating_sub(subtasks_secs);
            let direct_pct = if task.duration_seconds > 0 {
                (direct_secs as f64 / task.duration_seconds as f64) * task.percentage
            } else {
                0.0
            };

            if task.subtasks.is_empty() {
                sheet.set_value(current_row, 0, p_name.as_str());
                sheet.set_value(current_row, 1, task.name.as_str());
                sheet.set_value(current_row, 2, "");
                sheet.set_value(current_row, 3, task.duration_seconds as f64);
                sheet.set_value(current_row, 4, task.duration_formatted.as_str());
                sheet.set_value(current_row, 5, task.percentage);
                current_row += 1;
            } else {
                if direct_secs > 0 {
                    let direct_fmt = format_duration(direct_secs);
                    sheet.set_value(current_row, 0, p_name.as_str());
                    sheet.set_value(current_row, 1, task.name.as_str());
                    sheet.set_value(current_row, 2, "");
                    sheet.set_value(current_row, 3, direct_secs as f64);
                    sheet.set_value(current_row, 4, direct_fmt.as_str());
                    sheet.set_value(current_row, 5, direct_pct);
                    current_row += 1;
                }

                for subtask in &task.subtasks {
                    sheet.set_value(current_row, 0, p_name.as_str());
                    sheet.set_value(current_row, 1, task.name.as_str());
                    sheet.set_value(current_row, 2, subtask.name.as_str());
                    sheet.set_value(current_row, 3, subtask.duration_seconds as f64);
                    sheet.set_value(current_row, 4, subtask.duration_formatted.as_str());
                    sheet.set_value(current_row, 5, subtask.percentage);
                    current_row += 1;
                }
            }
        }
    }

    let total_pct = if tree.total_seconds > 0 { 100.0 } else { 0.0 };
    sheet.set_value(current_row, 0, "Total");
    sheet.set_value(current_row, 1, "");
    sheet.set_value(current_row, 2, "");
    sheet.set_value(current_row, 3, tree.total_seconds as f64);
    sheet.set_value(current_row, 4, tree.total_formatted.as_str());
    sheet.set_value(current_row, 5, total_pct);

    workbook.push_sheet(sheet);

    spreadsheet_ods::write_ods_buf(&mut workbook, Vec::new()).map_err(map_ods_err)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_given_ods_error_when_mapping_then_returns_sink_serialization_error() {
        let err = OdsError::Ods("custom ods test error".to_string());
        let cli_err = map_ods_err(err);
        match cli_err {
            CliError::Sink(SinkError::Serialization(msg)) => {
                assert!(msg.contains("custom ods test error"));
            }
            other => panic!(
                "expected CliError::Sink(SinkError::Serialization), got {:?}",
                other
            ),
        }
    }
}
