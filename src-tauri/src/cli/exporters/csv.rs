use super::constants::REPORT_COLUMN_HEADERS;
use super::rows::flatten_report;
use crate::cli::formatters::ReportTreeDto;

pub fn export_csv(tree: &ReportTreeDto) -> String {
    let mut lines = vec![REPORT_COLUMN_HEADERS.join(",")];
    for row in flatten_report(tree) {
        let p_name = sanitize_csv(&row.project_name);
        let t_name = sanitize_csv(&row.task_name);
        let s_name = row
            .subtask_name
            .as_deref()
            .map(sanitize_csv)
            .unwrap_or_default();
        lines.push(format!(
            "\"{}\",\"{}\",\"{}\",{},\"{}\",{:.1}",
            p_name, t_name, s_name, row.duration_seconds, row.duration_formatted, row.percentage,
        ));
    }
    lines.join("\n") + "\n"
}

fn sanitize_csv(val: &str) -> String {
    val.replace('"', "\"\"")
}
