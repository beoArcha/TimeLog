use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::xml::{export_xml, validate_report_xml_structure};
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
