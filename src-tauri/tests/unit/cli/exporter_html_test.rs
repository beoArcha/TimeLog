use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::{escape_html, export_html};
use oxyflow_timelog::cli::formatters::{
    ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};

#[test]
fn test_given_tree_when_export_html_then_contains_responsive_markup_and_escaped_entities() {
    let tree = create_sample_tree();
    let html = export_html(&tree).expect("export_html should succeed");

    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains(r#"<meta charset="UTF-8">"#));
    assert!(html.contains("API &quot;Service&quot;"));
    assert!(html.contains("Database Setup"));
    assert!(html.contains("01h 00m"));
    assert!(html.contains("oXyFlow Work Report"));
    assert!(html.contains("<table>"));
    assert!(html.contains("</table>"));
}

#[test]
fn test_given_task_with_subtasks_and_direct_time_when_export_html_then_preserves_parent_time_and_subtasks(
) {
    let tree = create_tree_with_subtasks_and_direct_time();
    let html = export_html(&tree).expect("export_html should succeed");

    assert!(html.contains("Alpha Project"));
    assert!(html.contains("Main Feature"));
    assert!(html.contains("30m 00s"));
    assert!(html.contains("50.0%"));
    assert!(html.contains("Subtask A"));
    assert!(html.contains("20m 00s"));
    assert!(html.contains("33.3%"));
    assert!(html.contains("Subtask B"));
    assert!(html.contains("10m 00s"));
    assert!(html.contains("16.7%"));
}

#[test]
fn test_given_empty_report_when_export_html_then_renders_valid_html_structure_and_empty_state_row()
{
    let tree = create_empty_tree();
    let html = export_html(&tree).expect("export_html should succeed");

    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains(r#"<meta charset="UTF-8">"#));
    assert!(html.contains("oXyFlow Work Report"));
    assert!(html.contains("00m 00s"));
    assert!(html.contains("No time logs recorded for the selected period."));
    assert!(html.contains(r#"<tr class="empty-row">"#));
}

#[test]
fn test_given_malicious_xss_payloads_when_export_html_then_neutralizes_all_scripts_and_tags() {
    // Edge case: XSS payloads in project, task, and subtask names
    let tree = ReportTreeDto {
        period: "<script>alert('pwned')</script>".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_xss".to_string(),
            name: r#"Project <img src=x onerror=alert(1)> & "quotes""#.to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_xss".to_string(),
                name: "<svg onload=alert(document.cookie)>".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![ReportSubtaskDto {
                    id: "s_xss".to_string(),
                    name: r#"<iframe src="javascript:alert(1)"></iframe>"#.to_string(),
                    duration_seconds: 1800,
                    duration_formatted: "30m 00s".to_string(),
                    percentage: 50.0,
                }],
            }],
        }],
        entries: vec![],
    };

    let html = export_html(&tree).expect("export_html should succeed safely");

    // Raw unescaped dangerous tags must never be present
    assert!(!html.contains("<script>"));
    assert!(!html.contains("</script>"));
    assert!(!html.contains("<img src=x"));
    assert!(!html.contains("<svg onload"));
    assert!(!html.contains("<iframe"));

    // Properly escaped representations are present
    assert!(html.contains("&lt;script&gt;alert(&#39;pwned&#39;)&lt;/script&gt;"));
    assert!(html.contains("&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;"));
    assert!(html.contains("&lt;svg onload=alert(document.cookie)&gt;"));
    assert!(html.contains("&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;/iframe&gt;"));
}

#[test]
fn test_given_unicode_polish_diacritics_and_emoji_when_export_html_then_preserves_multilingual_content(
) {
    // Edge case: Polish diacritics, Cyrillic, CJK, Emoji
    let tree = ReportTreeDto {
        period: "Zażółć gęślą jaźń 🚀".to_string(),
        total_seconds: 7200,
        total_formatted: "02h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_uni".to_string(),
            name: "Raport Finansowy: ĄĆĘŁŃÓŚŹŻ".to_string(),
            duration_seconds: 7200,
            duration_formatted: "02h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_uni".to_string(),
                name: "日本語タスク & Украинский текст 💡".to_string(),
                duration_seconds: 7200,
                duration_formatted: "02h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![ReportSubtaskDto {
                    id: "s_uni".to_string(),
                    name: "Podzadanie: 🔥 Świetna robota!".to_string(),
                    duration_seconds: 3600,
                    duration_formatted: "01h 00m".to_string(),
                    percentage: 50.0,
                }],
            }],
        }],
        entries: vec![],
    };

    let html = export_html(&tree).expect("export_html should succeed");

    assert!(html.contains("Zażółć gęślą jaźń 🚀"));
    assert!(html.contains("Raport Finansowy: ĄĆĘŁŃÓŚŹŻ"));
    assert!(html.contains("日本語タスク &amp; Украинский текст 💡"));
    assert!(html.contains("Podzadanie: 🔥 Świetna robota!"));
}

#[test]
fn test_given_disallowed_control_characters_when_export_html_then_strips_them_without_corrupting_text(
) {
    // Edge case: NUL, BEL, BS, ESC control characters inside fields
    let tree = ReportTreeDto {
        period: "Period\u{0000} Clean".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_ctrl".to_string(),
            name: "Project\u{0007} Sanitized\u{0008}".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_ctrl".to_string(),
                name: "Task\u{001B} Safe".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    };

    let html = export_html(&tree).expect("export_html should succeed");

    // No control characters present
    assert!(!html.contains('\u{0000}'));
    assert!(!html.contains('\u{0007}'));
    assert!(!html.contains('\u{0008}'));
    assert!(!html.contains('\u{001B}'));

    assert!(html.contains("Period Clean"));
    assert!(html.contains("Project Sanitized"));
    assert!(html.contains("Task Safe"));
}

#[test]
fn test_given_escape_html_helper_when_called_then_escapes_entities_and_filters_control_chars() {
    assert_eq!(
        escape_html(r#"<script>alert("XSS & 'quotes'")</script>"#),
        "&lt;script&gt;alert(&quot;XSS &amp; &#39;quotes&#39;&quot;)&lt;/script&gt;"
    );
    assert_eq!(escape_html("Plain text 123"), "Plain text 123");
    assert_eq!(escape_html("Hello\u{0000} World\u{0008}!"), "Hello World!");
    assert_eq!(escape_html("Zażółć gęślą jaźń 🚀"), "Zażółć gęślą jaźń 🚀");
}
