use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::xml::{
    export_xml, validate_report_xml_structure, XmlValidationError,
};
use oxyflow_timelog::cli::formatters::{
    ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};

#[test]
fn test_given_full_hierarchy_when_export_xml_then_passes_xsd_structural_validation() {
    let tree = create_full_hierarchy_tree();

    let xml = export_xml(&tree).expect("export_xml should succeed");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "XML validation error: {:?}",
        validation.err()
    );
    let dto = validation.unwrap();
    assert_eq!(dto.schema_version, "1");
    assert_eq!(dto.metadata.period, "Current Sprint");
    assert_eq!(dto.summary.total_seconds, 7200);
    assert_eq!(dto.projects.projects.len(), 1);
    assert_eq!(dto.entries.entries.len(), 2);
}

#[test]
fn test_given_missing_optional_fields_when_export_xml_then_passes_xsd_validation() {
    // Edge case: Tasks without subtasks, entries without subtaskName, note, and endTime
    let tree = ReportTreeDto {
        period: "Minimal Report".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_min".to_string(),
            name: "Simple Project".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_min".to_string(),
                name: "Simple Task".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![ReportEntryDto {
            id: "e_min".to_string(),
            date: "2026-11-07".to_string(),
            project_name: "Simple Project".to_string(),
            task_name: "Simple Task".to_string(),
            subtask_name: None,
            start_time: "2026-11-07T09:00:00Z".to_string(),
            end_time: None,
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            note: None,
        }],
    };

    let xml = export_xml(&tree).expect("export_xml should succeed for minimal report");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    assert!(!xml.contains("<subtasks"));
    assert!(!xml.contains("<subtaskName"));
    assert!(!xml.contains("<endTime"));
    assert!(!xml.contains("<note"));
}

#[test]
fn test_given_special_xml_entities_when_export_xml_then_escapes_safely_and_validates_xsd() {
    // Edge case: All 5 predefined XML entities &, <, >, ", '
    let tree = ReportTreeDto {
        period: "Q1 & Q2 <Special> \"Period\" '26".to_string(),
        total_seconds: 1800,
        total_formatted: "30m 00s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_ent".to_string(),
            name: "R&D <Core> \"App\" 'Fast'".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_ent".to_string(),
                name: "Parsing <XML> & \"JSON\" 'Safe'".to_string(),
                duration_seconds: 1800,
                duration_formatted: "30m 00s".to_string(),
                percentage: 100.0,
                subtasks: vec![ReportSubtaskDto {
                    id: "s_ent".to_string(),
                    name: "Subtask & 'Quote' <Tag> \"Attr\"".to_string(),
                    duration_seconds: 1800,
                    duration_formatted: "30m 00s".to_string(),
                    percentage: 100.0,
                }],
            }],
        }],
        entries: vec![ReportEntryDto {
            id: "e_ent".to_string(),
            date: "2026-11-07".to_string(),
            project_name: "R&D <Core> \"App\" 'Fast'".to_string(),
            task_name: "Parsing <XML> & \"JSON\" 'Safe'".to_string(),
            subtask_name: Some("Subtask & 'Quote' <Tag> \"Attr\"".to_string()),
            start_time: "2026-11-07T12:00:00Z".to_string(),
            end_time: Some("2026-11-07T12:30:00Z".to_string()),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            note: Some("Notes with & < > \" ' inside".to_string()),
        }],
    };

    let xml = export_xml(&tree).expect("export_xml should succeed with special entities");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    assert!(xml.contains("R&amp;D &lt;Core&gt;"));
    assert!(xml.contains("Notes with &amp; &lt; &gt;"));
    let dto = validation.unwrap();
    assert_eq!(dto.projects.projects[0].name, "R&D <Core> \"App\" 'Fast'");
    assert_eq!(
        dto.entries.entries[0].note.as_deref(),
        Some("Notes with & < > \" ' inside")
    );
}

#[test]
fn test_given_unicode_and_polish_diacritics_when_export_xml_then_preserves_multilingual_text() {
    // Edge case: Polish diacritics, Cyrillic, CJK, Emoji
    let tree = ReportTreeDto {
        period: "Zażółć gęślą jaźń 🚀".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_uni".to_string(),
            name: "Zadania Polskie ĄĆĘŁŃÓŚŹŻ".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_uni".to_string(),
                name: "日本語タスク & Украинский текст".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![ReportEntryDto {
            id: "e_uni".to_string(),
            date: "2026-11-07".to_string(),
            project_name: "Zadania Polskie ĄĆĘŁŃÓŚŹŻ".to_string(),
            task_name: "日本語タスク & Украинский текст".to_string(),
            subtask_name: None,
            start_time: "2026-11-07T14:00:00Z".to_string(),
            end_time: Some("2026-11-07T15:00:00Z".to_string()),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            note: Some("Notatka z emotikonem 🎉 i polskimi znakami: ąćęłńóśźż".to_string()),
        }],
    };

    let xml = export_xml(&tree).expect("export_xml should succeed with Unicode");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    let dto = validation.unwrap();
    assert_eq!(dto.metadata.period, "Zażółć gęślą jaźń 🚀");
    assert_eq!(dto.projects.projects[0].name, "Zadania Polskie ĄĆĘŁŃÓŚŹŻ");
    assert_eq!(
        dto.projects.projects[0].tasks.tasks[0].name,
        "日本語タスク & Украинский текст"
    );
    assert_eq!(
        dto.entries.entries[0].note.as_deref(),
        Some("Notatka z emotikonem 🎉 i polskimi znakami: ąćęłńóśźż")
    );
}

#[test]
fn test_given_disallowed_control_chars_when_export_xml_then_sanitizes_without_corrupting_text() {
    // Edge case: Disallowed control characters: \x00 (NUL), \x08 (BS), \x1b (ESC), \x0c (FF)
    let tree = ReportTreeDto {
        period: "Period\u{0000} Test\u{001B}".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_ctrl".to_string(),
            name: "Project\u{0008} Clean".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_ctrl".to_string(),
                name: "Task\u{000C} Safe".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![ReportEntryDto {
            id: "e_ctrl".to_string(),
            date: "2026-11-07".to_string(),
            project_name: "Project\u{0008} Clean".to_string(),
            task_name: "Task\u{000C} Safe".to_string(),
            subtask_name: None,
            start_time: "2026-11-07T16:00:00Z".to_string(),
            end_time: Some("2026-11-07T17:00:00Z".to_string()),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            note: Some("Note\u{0000} with\u{001B} stripped\u{0008} control chars".to_string()),
        }],
    };

    let xml = export_xml(&tree).expect("export_xml should succeed");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    assert!(!xml.contains('\u{0000}'));
    assert!(!xml.contains('\u{0008}'));
    assert!(!xml.contains('\u{001B}'));
    assert!(!xml.contains('\u{000C}'));
    assert!(xml.contains("Period Test"));
    assert!(xml.contains("Project Clean"));
    assert!(xml.contains("Task Safe"));
    assert!(xml.contains("Note with stripped control chars"));
}

#[test]
fn test_given_empty_report_tree_when_export_xml_then_renders_valid_empty_xsd_sections() {
    let tree = create_empty_report_tree();

    let xml = export_xml(&tree).expect("export_xml should succeed for empty tree");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    assert!(xml.contains("<projects/>"));
    assert!(xml.contains("<entries/>"));
    let dto = validation.unwrap();
    assert_eq!(dto.projects.projects.len(), 0);
    assert_eq!(dto.entries.entries.len(), 0);
}

#[test]
fn test_given_large_report_document_when_export_xml_then_scales_efficiently_and_validates_xsd() {
    // Edge case: 10 projects, 20 tasks, 40 subtasks, 150 entries
    let mut projects = Vec::new();
    let mut entries = Vec::new();

    for p_idx in 1..=10 {
        let mut tasks = Vec::new();
        for t_idx in 1..=2 {
            let mut subtasks = Vec::new();
            for s_idx in 1..=2 {
                subtasks.push(ReportSubtaskDto {
                    id: format!("sub-{p_idx}-{t_idx}-{s_idx}"),
                    name: format!("Subtask {p_idx}.{t_idx}.{s_idx}"),
                    duration_seconds: 900,
                    duration_formatted: "15m 00s".to_string(),
                    percentage: 2.5,
                });
            }
            tasks.push(ReportTaskDto {
                id: format!("task-{p_idx}-{t_idx}"),
                name: format!("Task {p_idx}.{t_idx}"),
                duration_seconds: 1800,
                duration_formatted: "30m 00s".to_string(),
                percentage: 5.0,
                subtasks,
            });
        }
        projects.push(ReportProjectDto {
            id: format!("proj-{p_idx}"),
            name: format!("Project {p_idx}"),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 10.0,
            tasks,
        });
    }

    for e_idx in 1..=150 {
        entries.push(ReportEntryDto {
            id: format!("entry-{e_idx}"),
            date: "2026-11-07".to_string(),
            project_name: format!("Project {}", (e_idx % 10) + 1),
            task_name: format!("Task {}.1", (e_idx % 10) + 1),
            subtask_name: Some(format!("Subtask {}.1.1", (e_idx % 10) + 1)),
            start_time: "2026-11-07T10:00:00Z".to_string(),
            end_time: Some("2026-11-07T10:15:00Z".to_string()),
            duration_seconds: 900,
            duration_formatted: "15m 00s".to_string(),
            note: Some(format!("Work entry #{e_idx} completed.")),
        });
    }

    let tree = ReportTreeDto {
        period: "Month of November 2026".to_string(),
        total_seconds: 36000,
        total_formatted: "10h 00m".to_string(),
        projects,
        entries,
    };

    let xml = export_xml(&tree).expect("export_xml should succeed for large report");
    let validation = validate_report_xml_structure(&xml);

    assert!(
        validation.is_ok(),
        "Validation failed: {:?}",
        validation.err()
    );
    let dto = validation.unwrap();
    assert_eq!(dto.projects.projects.len(), 10);
    assert_eq!(dto.entries.entries.len(), 150);
}

fn extract_all_tag_values(xml: &str, tag: &str) -> Vec<String> {
    let open_tag = format!("<{}>", tag);
    let close_tag = format!("</{}>", tag);
    let mut values = Vec::new();
    let mut cursor = 0;

    while let Some(start_idx) = xml[cursor..].find(&open_tag) {
        let content_start = cursor + start_idx + open_tag.len();
        if let Some(end_idx) = xml[content_start..].find(&close_tag) {
            values.push(xml[content_start..content_start + end_idx].to_string());
            cursor = content_start + end_idx + close_tag.len();
        } else {
            break;
        }
    }
    values
}

fn assert_all_non_negative_integers(values: &[String], tag_name: &str) {
    assert!(
        !values.is_empty(),
        "Expected at least one <{}> tag",
        tag_name
    );
    for val in values {
        assert!(
            val.chars().all(|c| c.is_ascii_digit()) && !val.is_empty(),
            "<{}> value '{}' is not a valid xs:nonNegativeInteger",
            tag_name,
            val
        );
        assert!(
            val.parse::<u64>().is_ok(),
            "<{}> value '{}' failed u64 parse",
            tag_name,
            val
        );
    }
}

fn assert_all_decimals(values: &[String], tag_name: &str) {
    assert!(
        !values.is_empty(),
        "Expected at least one <{}> tag",
        tag_name
    );
    for val in values {
        assert!(
            val.parse::<f64>().is_ok(),
            "<{}> value '{}' is not a valid xs:decimal",
            tag_name,
            val
        );
    }
}

#[test]
fn test_given_full_hierarchy_when_export_xml_then_data_types_comply_with_xsd_canonical_primitives()
{
    let tree = create_full_hierarchy_tree();
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // 1. Strict xs:nonNegativeInteger assertions (totalSeconds, durationSeconds)
    let total_seconds = extract_all_tag_values(&xml, "totalSeconds");
    assert_all_non_negative_integers(&total_seconds, "totalSeconds");

    let duration_seconds = extract_all_tag_values(&xml, "durationSeconds");
    assert_all_non_negative_integers(&duration_seconds, "durationSeconds");
    // Full hierarchy contains 1 project + 1 task + 2 subtasks + 2 entries = 6 durationSeconds
    assert_eq!(duration_seconds.len(), 6);

    // 2. Strict xs:decimal assertions (percentage)
    let percentages = extract_all_tag_values(&xml, "percentage");
    assert_all_decimals(&percentages, "percentage");
    // 1 project + 1 task + 2 subtasks = 4 percentages
    assert_eq!(percentages.len(), 4);

    // 3. Exact element sequence verification inside sections
    let meta_open = xml.find("<metadata>").expect("metadata section");
    let meta_close = xml.find("</metadata>").expect("metadata end");
    let meta_content = &xml[meta_open..meta_close];
    let title_pos = meta_content.find("<title>");
    let period_pos = meta_content.find("<period>").expect("period required");
    if let Some(t_pos) = title_pos {
        assert!(t_pos < period_pos, "<title> must precede <period>");
    }

    let summary_open = xml.find("<summary>").expect("summary section");
    let summary_close = xml.find("</summary>").expect("summary end");
    let summary_content = &xml[summary_open..summary_close];
    let total_sec_pos = summary_content
        .find("<totalSeconds>")
        .expect("totalSeconds required");
    let fmt_dur_pos = summary_content
        .find("<formattedTotalDuration>")
        .expect("formattedTotalDuration required");
    assert!(
        total_sec_pos < fmt_dur_pos,
        "<totalSeconds> must precede <formattedTotalDuration>"
    );
}

#[test]
fn test_given_fractional_percentages_when_export_xml_then_conforms_to_xs_decimal() {
    let tree = ReportTreeDto {
        period: "Precision Sprint".to_string(),
        total_seconds: 3000,
        total_formatted: "50m 00s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_frac".to_string(),
            name: "Fractional Precision Project".to_string(),
            duration_seconds: 3000,
            duration_formatted: "50m 00s".to_string(),
            percentage: 33.333333333333336,
            tasks: vec![ReportTaskDto {
                id: "t_frac".to_string(),
                name: "Fractional Task".to_string(),
                duration_seconds: 3000,
                duration_formatted: "50m 00s".to_string(),
                percentage: 66.66666666666667,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    };

    let xml = export_xml(&tree).expect("export_xml should succeed");
    let validation = validate_report_xml_structure(&xml);
    assert!(validation.is_ok());

    let percentages = extract_all_tag_values(&xml, "percentage");
    assert_all_decimals(&percentages, "percentage");
}

#[test]
fn test_given_missing_prolog_when_validate_structure_then_fails_with_missing_prolog() {
    let xml = "<report schemaVersion=\"1\"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(result.unwrap_err(), XmlValidationError::MissingProlog);
}

#[test]
fn test_given_missing_root_or_wrong_version_when_validate_structure_then_fails_with_missing_root_element(
) {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"2\"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(result.unwrap_err(), XmlValidationError::MissingRootElement);
}

#[test]
fn test_given_missing_metadata_section_when_validate_structure_then_fails() {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(
        result.unwrap_err(),
        XmlValidationError::MissingSection("<metadata>")
    );
}

#[test]
fn test_given_missing_summary_section_when_validate_structure_then_fails() {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><metadata><period>P</period></metadata><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(
        result.unwrap_err(),
        XmlValidationError::MissingSection("<summary>")
    );
}

#[test]
fn test_given_missing_projects_section_when_validate_structure_then_fails() {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(
        result.unwrap_err(),
        XmlValidationError::MissingSection("<projects>")
    );
}

#[test]
fn test_given_missing_entries_section_when_validate_structure_then_fails() {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(
        result.unwrap_err(),
        XmlValidationError::MissingSection("<entries>")
    );
}

#[test]
fn test_given_inverted_section_order_when_validate_structure_then_fails_with_invalid_section_order()
{
    // Inverted: <summary> placed before <metadata>
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><metadata><period>P</period></metadata><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert_eq!(result.unwrap_err(), XmlValidationError::InvalidSectionOrder);
}

#[test]
fn test_given_malformed_xml_syntax_when_validate_structure_then_fails_with_deserialization_error() {
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<report schemaVersion=\"1\"><metadata><period>Unclosed tag</metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>";
    let result = validate_report_xml_structure(xml);
    assert!(matches!(
        result.unwrap_err(),
        XmlValidationError::Deserialization(_)
    ));
}
