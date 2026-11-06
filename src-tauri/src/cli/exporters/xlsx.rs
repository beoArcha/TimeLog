use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::{format_duration, ReportTreeDto};
use rust_xlsxwriter::{Color, Format, Workbook, XlsxError};

fn map_xlsx_err(e: XlsxError) -> CliError {
    log::error!("Failed to export XLSX report: {e}");
    CliError::Sink(SinkError::Serialization(e.to_string()))
}

pub fn export_xlsx(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet.set_name("Work Report").map_err(map_xlsx_err)?;

    let header_format = Format::new()
        .set_bold()
        .set_background_color(Color::RGB(0x00E2E8F0));

    let headers = [
        "Project",
        "Task",
        "Subtask",
        "Duration_Seconds",
        "Duration_Formatted",
        "Percentage",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(map_xlsx_err)?;
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
                worksheet
                    .write(current_row, 0, p_name.as_str())
                    .map_err(map_xlsx_err)?;
                worksheet
                    .write(current_row, 1, task.name.as_str())
                    .map_err(map_xlsx_err)?;
                worksheet.write(current_row, 2, "").map_err(map_xlsx_err)?;
                worksheet
                    .write(current_row, 3, task.duration_seconds)
                    .map_err(map_xlsx_err)?;
                worksheet
                    .write(current_row, 4, task.duration_formatted.as_str())
                    .map_err(map_xlsx_err)?;
                worksheet
                    .write(current_row, 5, task.percentage)
                    .map_err(map_xlsx_err)?;
                current_row += 1;
            } else {
                if direct_secs > 0 {
                    worksheet
                        .write(current_row, 0, p_name.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 1, task.name.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet.write(current_row, 2, "").map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 3, direct_secs)
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 4, format_duration(direct_secs).as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 5, direct_pct)
                        .map_err(map_xlsx_err)?;
                    current_row += 1;
                }

                for subtask in &task.subtasks {
                    worksheet
                        .write(current_row, 0, p_name.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 1, task.name.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 2, subtask.name.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 3, subtask.duration_seconds)
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 4, subtask.duration_formatted.as_str())
                        .map_err(map_xlsx_err)?;
                    worksheet
                        .write(current_row, 5, subtask.percentage)
                        .map_err(map_xlsx_err)?;
                    current_row += 1;
                }
            }
        }
    }

    let total_format = Format::new().set_bold();
    let total_pct = if tree.total_seconds > 0 { 100.0 } else { 0.0 };
    worksheet
        .write_with_format(current_row, 0, "Total", &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 1, "", &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 2, "", &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 3, tree.total_seconds, &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 4, tree.total_formatted.as_str(), &total_format)
        .map_err(map_xlsx_err)?;
    worksheet
        .write_with_format(current_row, 5, total_pct, &total_format)
        .map_err(map_xlsx_err)?;

    worksheet.set_column_width(0, 24).map_err(map_xlsx_err)?;
    worksheet.set_column_width(1, 32).map_err(map_xlsx_err)?;
    worksheet.set_column_width(2, 24).map_err(map_xlsx_err)?;
    worksheet.set_column_width(3, 18).map_err(map_xlsx_err)?;
    worksheet.set_column_width(4, 18).map_err(map_xlsx_err)?;
    worksheet.set_column_width(5, 14).map_err(map_xlsx_err)?;

    workbook.save_to_buffer().map_err(map_xlsx_err)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_given_xlsx_error_when_mapping_then_returns_sink_serialization_error() {
        let err = XlsxError::SheetnameLengthExceeded(
            "NameThatIsWayTooLongForAnExcelWorksheetNameMoreThan31Chars".to_string(),
        );
        let cli_err = map_xlsx_err(err);
        match cli_err {
            CliError::Sink(SinkError::Serialization(msg)) => {
                assert!(msg.contains("NameThatIsWayTooLong"));
            }
            other => panic!(
                "expected CliError::Sink(SinkError::Serialization), got {:?}",
                other
            ),
        }
    }
}
