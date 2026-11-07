use super::exporter_fixtures::*;
use oxyflow_timelog::cli::exporters::xml::{
    export_xml, is_xml_1_0_char, sanitize_xml_text, XmlReportDto,
};
use oxyflow_timelog::cli::formatters::{ReportProjectDto, ReportTaskDto, ReportTreeDto};

#[test]
fn test_given_tree_when_exporting_xml_then_root_contains_schema_version_1() {
    // Arrange
    let tree = create_full_hierarchy_tree();

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Assert
    assert!(xml.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert!(xml.contains("<report schemaVersion=\"1\">"));
    assert!(xml.ends_with("</report>"));
}

#[test]
fn test_given_tree_when_exporting_xml_then_four_canonical_sections_are_present() {
    // Arrange
    let tree = create_full_hierarchy_tree();

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Assert
    let metadata_pos = xml.find("<metadata>").expect("must contain <metadata>");
    let summary_pos = xml.find("<summary>").expect("must contain <summary>");
    let projects_pos = xml.find("<projects>").expect("must contain <projects>");
    let entries_pos = xml.find("<entries/>").expect("must contain <entries/>");

    assert!(metadata_pos < summary_pos);
    assert!(summary_pos < projects_pos);
    assert!(projects_pos < entries_pos);

    assert!(xml.contains("<title>TimeLog Report</title>"));
    assert!(xml.contains("<period>Current Sprint</period>"));
    assert!(xml.contains("<totalSeconds>7200</totalSeconds>"));
    assert!(xml.contains("<formattedTotalDuration>02h 00m</formattedTotalDuration>"));
}

#[test]
fn test_given_nested_tree_when_exporting_xml_then_hierarchy_is_properly_nested() {
    // Arrange
    let tree = create_full_hierarchy_tree();

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Assert: projects contain project, tasks contain task, subtasks contain subtask
    assert!(xml.contains("<projects><project>"));
    assert!(xml.contains("<name>Alpha \"Platform\" &amp; Engine</name>"));
    assert!(xml.contains("<tasks><task>"));
    assert!(xml.contains("<name>Core Infrastructure &lt;v2&gt;</name>"));
    assert!(xml.contains("<subtasks><subtask>"));
    assert!(xml.contains("<name>Schema Design 'XML'</name>"));
    assert!(xml.contains("<name>Serialization &amp; Tests</name>"));
}

#[test]
fn test_given_empty_tree_when_exporting_xml_then_renders_empty_sections() {
    // Arrange
    let tree = create_empty_report_tree();

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Assert
    assert!(xml.contains("<report schemaVersion=\"1\">"));
    assert!(xml.contains("<period>Today</period>"));
    assert!(xml.contains("<totalSeconds>0</totalSeconds>"));
    assert!(xml.contains("<formattedTotalDuration>00m 00s</formattedTotalDuration>"));
    assert!(xml.contains("<projects/>"));
    assert!(xml.contains("<entries/>"));
}

#[test]
fn test_given_control_characters_when_sanitizing_then_strips_disallowed_and_preserves_valid() {
    // Arrange: test is_xml_1_0_char for allowed and forbidden ranges
    assert!(!is_xml_1_0_char('\u{0000}')); // NULL
    assert!(!is_xml_1_0_char('\u{0007}')); // BELL
    assert!(!is_xml_1_0_char('\u{0008}')); // BACKSPACE
    assert!(!is_xml_1_0_char('\u{000B}')); // VERTICAL TAB
    assert!(!is_xml_1_0_char('\u{000C}')); // FORM FEED
    assert!(!is_xml_1_0_char('\u{001F}')); // UNIT SEPARATOR
    assert!(!is_xml_1_0_char('\u{FFFE}')); // Byte order mark noncharacter
    assert!(!is_xml_1_0_char('\u{FFFF}')); // Noncharacter

    // Whitespace allowed in XML 1.0: TAB, LF, CR
    assert!(is_xml_1_0_char('\t'));
    assert!(is_xml_1_0_char('\n'));
    assert!(is_xml_1_0_char('\r'));

    // Valid Unicode: Polish diacritics, CJK, Emoji
    assert!(is_xml_1_0_char('a'));
    assert!(is_xml_1_0_char('ą'));
    assert!(is_xml_1_0_char('Ż'));
    assert!(is_xml_1_0_char('日'));
    assert!(is_xml_1_0_char('🚀'));

    // Act
    let raw =
        "Project\u{0000} \u{0007}Alpha\twith\nUnicode: Zażółć gęślą jaźń\r\u{FFFE} 🚀\u{FFFF}";
    let sanitized = sanitize_xml_text(raw);

    // Assert
    assert_eq!(
        sanitized,
        "Project Alpha\twith\nUnicode: Zażółć gęślą jaźń\r 🚀"
    );
}

#[test]
fn test_given_tree_with_forbidden_control_characters_when_exporting_xml_then_sanitizes_and_parses_with_quick_xml(
) {
    // Arrange
    let tree = ReportTreeDto {
        period: "Period\u{0000}\u{0007} 2026".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_dirty".to_string(),
            name: "Projet\u{0000} Francais & Zażółć\u{FFFE}".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_dirty".to_string(),
                name: "Task \u{0008}with \u{001F}Emoji 🚀 & Polish ĄĆĘŁ".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
    };

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed despite control chars");

    // Assert: control chars must not be present
    assert!(!xml.contains('\u{0000}'));
    assert!(!xml.contains('\u{0007}'));
    assert!(!xml.contains('\u{0008}'));
    assert!(!xml.contains('\u{001F}'));
    assert!(!xml.contains('\u{FFFE}'));

    assert!(xml.contains("Period 2026"));
    assert!(xml.contains("Projet Francais &amp; Zażółć"));
    assert!(xml.contains("Task with Emoji 🚀 &amp; Polish ĄĆĘŁ"));

    // Act & Assert: Parse entire document with quick_xml reader without errors
    let mut reader = quick_xml::Reader::from_str(&xml);
    reader.config_mut().trim_text(true);
    let mut buf = Vec::new();
    let mut event_count = 0;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(quick_xml::events::Event::Eof) => break,
            Ok(_) => event_count += 1,
            Err(e) => panic!(
                "quick_xml reader failed to parse generated XML at position {}: {:?}",
                reader.buffer_position(),
                e
            ),
        }
        buf.clear();
    }
    assert!(
        event_count > 10,
        "XML document should contain multiple valid elements"
    );
}

#[test]
fn test_given_ad03_contract_when_exporting_xml_then_entries_section_is_empty() {
    // Arrange: Decision AD-03 mandates that Rust CLI exports the aggregated report tree
    // without synthetic log entries, hence <entries/> must be an empty element.
    let tree = create_full_hierarchy_tree();

    // Act
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Assert
    assert!(
        xml.contains("<entries/>") || xml.contains("<entries></entries>"),
        "AD-03 requires entries to be an empty section in Rust CLI export"
    );
    assert!(!xml.contains("<entry>"));
}

#[test]
fn test_given_xml_report_dto_deserialization_roundtrip() {
    // Arrange
    let tree = create_full_hierarchy_tree();
    let xml = export_xml(&tree).expect("export_xml should succeed");

    // Act: deserialize back from XML
    let content_without_decl = xml
        .strip_prefix("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
        .expect("must have xml declaration");

    let dto: XmlReportDto =
        quick_xml::de::from_str(content_without_decl).expect("deserialization should succeed");

    // Assert
    assert_eq!(dto.schema_version, "1");
    assert_eq!(dto.metadata.period, "Current Sprint");
    assert_eq!(dto.summary.total_seconds, 7200);
    assert_eq!(dto.projects.projects.len(), 1);
    assert_eq!(dto.projects.projects[0].name, "Alpha \"Platform\" & Engine");
    assert_eq!(dto.projects.projects[0].tasks.tasks.len(), 1);
    assert_eq!(
        dto.projects.projects[0].tasks.tasks[0]
            .subtasks
            .subtasks
            .len(),
        2
    );
}
