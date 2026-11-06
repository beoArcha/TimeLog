use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use rust_xlsxwriter::{Color, Format, Workbook};

pub fn export_xlsx(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet
        .set_name("Work Report")
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;

    let header_format = Format::new()
        .set_bold()
        .set_background_color(Color::RGB(0x00E2E8F0));

    let headers = [
        "Project",
        "Task",
        "Start Time",
        "End Time",
        "Duration",
        "Billable/Rate/Amount",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
    }

    let mut current_row: u32 = 1;

    for project in &tree.projects {
        let p_name = &project.name;
        for task in &project.tasks {
            if task.subtasks.is_empty() {
                worksheet
                    .write(current_row, 0, p_name.as_str())
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                worksheet
                    .write(current_row, 1, task.name.as_str())
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                worksheet
                    .write(current_row, 2, "-")
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                worksheet
                    .write(current_row, 3, "-")
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                worksheet
                    .write(current_row, 4, task.duration_formatted.as_str())
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                worksheet
                    .write(current_row, 5, "-")
                    .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                current_row += 1;
            } else {
                for subtask in &task.subtasks {
                    let task_label = format!("{} > {}", task.name, subtask.name);
                    worksheet
                        .write(current_row, 0, p_name.as_str())
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    worksheet
                        .write(current_row, 1, task_label.as_str())
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    worksheet
                        .write(current_row, 2, "-")
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    worksheet
                        .write(current_row, 3, "-")
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    worksheet
                        .write(current_row, 4, subtask.duration_formatted.as_str())
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    worksheet
                        .write(current_row, 5, "-")
                        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
                    current_row += 1;
                }
            }
        }
    }

    let _ = worksheet.set_column_width(0, 24);
    let _ = worksheet.set_column_width(1, 32);
    let _ = worksheet.set_column_width(2, 16);
    let _ = worksheet.set_column_width(3, 16);
    let _ = worksheet.set_column_width(4, 16);
    let _ = worksheet.set_column_width(5, 22);

    workbook
        .save_to_buffer()
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))
}
