use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::ReportTreeDto;
use spreadsheet_ods::{Sheet, WorkBook};

pub fn export_ods(tree: &ReportTreeDto) -> Result<Vec<u8>, CliError> {
    let mut workbook = WorkBook::new_empty();
    let mut sheet = Sheet::new("Work Report");

    let headers = [
        "Project",
        "Task",
        "Start Time",
        "End Time",
        "Duration",
        "Billable/Rate/Amount",
    ];

    for (col, header) in headers.iter().enumerate() {
        sheet.set_value(0, col as u32, *header);
    }

    let mut current_row: u32 = 1;

    for project in &tree.projects {
        let p_name = &project.name;
        for task in &project.tasks {
            if task.subtasks.is_empty() {
                sheet.set_value(current_row, 0, p_name.as_str());
                sheet.set_value(current_row, 1, task.name.as_str());
                sheet.set_value(current_row, 2, "-");
                sheet.set_value(current_row, 3, "-");
                sheet.set_value(current_row, 4, task.duration_formatted.as_str());
                sheet.set_value(current_row, 5, "-");
                current_row += 1;
            } else {
                for subtask in &task.subtasks {
                    let task_label = format!("{} > {}", task.name, subtask.name);
                    sheet.set_value(current_row, 0, p_name.as_str());
                    sheet.set_value(current_row, 1, task_label.as_str());
                    sheet.set_value(current_row, 2, "-");
                    sheet.set_value(current_row, 3, "-");
                    sheet.set_value(current_row, 4, subtask.duration_formatted.as_str());
                    sheet.set_value(current_row, 5, "-");
                    current_row += 1;
                }
            }
        }
    }

    workbook.push_sheet(sheet);

    spreadsheet_ods::write_ods_buf(&mut workbook, Vec::new())
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))
}
