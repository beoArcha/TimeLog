use crate::shared::exporter_fixtures::create_sample_document;
use crate::shared::report_document_builders::{a_document, a_project_patch_entry};
use crate::shared::xsd_validator::{parse_xml, Node};
use oxyflow_timelog::cli::exporters::xml::{export_xml, is_xml_1_0_char, sanitize_xml_text};
use oxyflow_timelog::types::{ReportDocument, ReportVariant};

fn exported(document: &ReportDocument) -> String {
    export_xml(document).expect("export_xml should succeed")
}

fn parsed(xml: &str) -> Node {
    parse_xml(xml).expect("exported XML must be well-formed")
}

#[test]
fn test_given_full_document_when_exporting_xml_then_root_carries_schema_version_and_variant() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let xml = exported(&document);

    // Assert
    assert!(xml.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"));
    assert!(xml.contains("<report schema=\"oxy.report\" schemaVersion=\"2\" variant=\"full\">"));
    assert!(xml.ends_with("</report>\n"));
}

#[test]
fn test_given_full_document_when_exporting_xml_then_sections_follow_the_document_order() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let xml = exported(&document);

    // Assert
    let positions: Vec<usize> = [
        "<generatedAt>",
        "<generator ",
        "<range ",
        "<filters ",
        "<totals ",
        "<projects>",
        "<days>",
        "<entries>",
    ]
    .iter()
    .map(|section| {
        xml.find(section)
            .unwrap_or_else(|| panic!("missing {section}"))
    })
    .collect();
    assert!(positions.windows(2).all(|pair| pair[0] < pair[1]), "{xml}");
}

#[test]
fn test_given_summary_document_when_exporting_xml_then_days_and_entries_are_omitted() {
    // Arrange
    let document = a_document(ReportVariant::Summary);

    // Act
    let xml = exported(&document);

    // Assert
    let root = parsed(&xml);
    assert_eq!(root.attr("variant"), Some("summary"));
    assert!(root.child("projects").is_some());
    assert!(root.child("days").is_none());
    assert!(root.child("entries").is_none());
    assert!(!xml.contains("<day "));
    assert!(!xml.contains("<entry "));
}

#[test]
fn test_given_full_document_without_data_when_exporting_xml_then_lists_are_self_closing() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.projects.clear();
    document.days.clear();
    document.entries = Some(Vec::new());
    document.totals.billing.clear();

    // Act
    let xml = exported(&document);

    // Assert
    assert!(xml.contains("<projects/>"));
    assert!(xml.contains("<days/>"));
    assert!(xml.contains("<entries/>"));
    assert!(!xml.contains("<billing "));
}

#[test]
fn test_given_projects_with_subtasks_when_exporting_xml_then_subtasks_are_flat_with_parent_ids() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let task = &mut document.projects[0].tasks[0];
    let mut grandchild = task.subtasks[0].clone();
    grandchild.id = "t3".to_string();
    grandchild.name = "Grandchild".to_string();
    grandchild.parent_task_id = "t2".to_string();
    task.subtasks.push(grandchild);

    // Act
    let root = parsed(&exported(&document));

    // Assert
    let task_node = root
        .child("projects")
        .and_then(|projects| projects.child("project"))
        .and_then(|project| project.child("task"))
        .expect("task element");
    let subtasks: Vec<(&str, &str)> = task_node
        .children_named("subtask")
        .map(|s| (s.attr("id").unwrap(), s.attr("parentTaskId").unwrap()))
        .collect();
    assert_eq!(subtasks, vec![("t2", "t1"), ("t3", "t2")]);
    assert!(task_node
        .children_named("subtask")
        .all(|s| s.child("subtask").is_none()));
}

#[test]
fn test_given_unconfigured_rate_when_exporting_xml_then_pricing_attributes_are_omitted() {
    // Arrange
    let document = a_document(ReportVariant::Full);

    // Act
    let root = parsed(&exported(&document));

    // Assert
    let project = root
        .child("projects")
        .and_then(|projects| projects.child("project"))
        .expect("project element");
    let task = project.child("task").expect("task element");
    assert_eq!(task.attr("rateStatus"), Some("unconfigured"));
    assert!(task.attr("rateMinor").is_none());
    assert!(task.attr("currency").is_none());
    assert!(task.attr("amountMinor").is_none());
    let subtask = task.child("subtask").expect("subtask element");
    assert_eq!(subtask.attr("rateStatus"), Some("custom"));
    assert_eq!(subtask.attr("rateMinor"), Some("15000"));
    assert_eq!(subtask.attr("currency"), Some("PLN"));
    assert_eq!(subtask.attr("amountMinor"), Some("15000"));
}

#[test]
fn test_given_project_level_patch_when_exporting_xml_then_task_fields_are_omitted() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let mut patch = a_project_patch_entry();
    patch.note = None;
    patch.end = None;
    document.entries = Some(vec![patch]);

    // Act
    let root = parsed(&exported(&document));

    // Assert
    let entry = root
        .child("entries")
        .and_then(|entries| entries.child("entry"))
        .expect("entry element");
    for attribute in ["taskId", "rootTaskId", "parentTaskId", "end"] {
        assert!(entry.attr(attribute).is_none(), "{attribute}");
    }
    for element in ["taskName", "parentTaskName", "note"] {
        assert!(entry.child(element).is_none(), "{element}");
    }
    assert_eq!(entry.attr("isPatch"), Some("true"));
    assert!(entry.child("projectName").is_some());
}

#[test]
fn test_given_billing_in_two_currencies_when_exporting_xml_then_totals_list_one_item_per_currency()
{
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    let mut eur = document.totals.billing[0].clone();
    eur.currency = "EUR".to_string();
    eur.amount_minor = 4_200;
    document.totals.billing.push(eur);

    // Act
    let root = parsed(&exported(&document));

    // Assert
    let totals = root.child("totals").expect("totals element");
    let currencies: Vec<(&str, &str)> = totals
        .children_named("billing")
        .map(|b| (b.attr("currency").unwrap(), b.attr("amountMinor").unwrap()))
        .collect();
    assert_eq!(currencies, vec![("PLN", "15000"), ("EUR", "4200")]);
}

#[test]
fn test_given_markup_and_quotes_in_names_and_notes_when_exporting_xml_then_text_is_escaped_and_roundtrips(
) {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let name = "R&D <Core> \"App\" 'Fast'";
    let note = "Notes with & < > \" ' inside\nand a second line";
    document.projects[0].name = name.to_string();
    document.projects[0].tasks[0].name = "Parsing <XML> & \"JSON\"".to_string();
    document.projects[0].tasks[0].subtasks[0].name = "Subtask & 'Quote' <Tag>".to_string();
    let entry = &mut document.entries.as_mut().expect("full entries")[0];
    entry.project_name = name.to_string();
    entry.note = Some(note.to_string());

    // Act
    let xml = exported(&document);

    // Assert
    assert!(
        xml.contains("<name>R&amp;D &lt;Core&gt; \"App\" 'Fast'</name>"),
        "{xml}"
    );
    assert!(xml.contains("Notes with &amp; &lt; &gt;"), "{xml}");
    let root = parsed(&xml);
    let project = root
        .child("projects")
        .and_then(|projects| projects.child("project"))
        .expect("project element");
    assert_eq!(project.child("name").map(|n| n.text.as_str()), Some(name));
    let entry = root
        .child("entries")
        .and_then(|entries| entries.child("entry"))
        .expect("entry element");
    assert_eq!(entry.child("note").map(|n| n.text.as_str()), Some(note));
}

#[test]
fn test_given_quotes_and_line_breaks_in_an_attribute_when_exporting_xml_then_value_roundtrips() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    let id = "p\"1\" <&> 'x'\tline\nbreak";
    document.projects[0].id = id.to_string();

    // Act
    let root = parsed(&exported(&document));

    // Assert
    let project = root
        .child("projects")
        .and_then(|projects| projects.child("project"))
        .expect("project element");
    assert_eq!(project.attr("id"), Some(id));
}

#[test]
fn test_given_carriage_return_in_a_note_when_exporting_xml_then_it_survives_parsing() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.entries.as_mut().expect("full entries")[0].note = Some("one\r\ntwo".to_string());

    // Act
    let xml = exported(&document);

    // Assert
    assert!(xml.contains("one&#13;\ntwo"), "{xml}");
    let root = parsed(&xml);
    let note = root
        .child("entries")
        .and_then(|entries| entries.child("entry"))
        .and_then(|entry| entry.child("note"))
        .expect("note element");
    assert_eq!(note.text, "one\r\ntwo");
}

#[test]
fn test_given_forbidden_control_characters_when_exporting_xml_then_they_are_stripped() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.projects[0].name = "Projet\u{0000} Zażółć\u{FFFE} 🚀".to_string();
    document.entries.as_mut().expect("full entries")[0].note =
        Some("Note \u{000B}with\u{0007} control".to_string());

    // Act
    let xml = exported(&document);

    // Assert
    let root = parsed(&xml);
    let project = root
        .child("projects")
        .and_then(|projects| projects.child("project"))
        .expect("project element");
    assert_eq!(
        project.child("name").map(|n| n.text.as_str()),
        Some("Projet Zażółć 🚀")
    );
    assert!(xml.contains("<note>Note with control</note>"));
}

#[test]
fn test_given_the_same_document_when_exporting_xml_twice_then_bytes_are_identical() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let first = exported(&document);
    let second = exported(&document);

    // Assert
    assert_eq!(first, second);
}

#[test]
fn test_given_projects_with_equal_seconds_when_exporting_xml_then_document_order_is_kept() {
    // Arrange
    let mut document = a_document(ReportVariant::Summary);
    let mut zulu = document.projects[0].clone();
    zulu.id = "p-zulu".to_string();
    zulu.name = "Zulu".to_string();
    let mut alpha = document.projects[0].clone();
    alpha.id = "p-alpha".to_string();
    alpha.name = "Alpha".to_string();
    document.projects = vec![zulu, alpha];

    // Act
    let xml = exported(&document);

    // Assert
    assert!(xml.find(">Zulu<").unwrap() < xml.find(">Alpha<").unwrap());
}

#[test]
fn test_given_control_characters_when_sanitizing_then_strips_disallowed_and_preserves_valid() {
    // Arrange
    let forbidden = [
        '\u{0}', '\u{7}', '\u{8}', '\u{B}', '\u{C}', '\u{1F}', '\u{FFFE}', '\u{FFFF}',
    ];
    let allowed = ['\t', '\n', '\r', 'a', 'ą', 'Ż', '日', '🚀'];
    let raw =
        "Project\u{0000} \u{0007}Alpha\twith\nUnicode: Zażółć gęślą jaźń\r\u{FFFE} 🚀\u{FFFF}";

    // Act
    let sanitized = sanitize_xml_text(raw);

    // Assert
    assert!(forbidden.iter().all(|c| !is_xml_1_0_char(*c)));
    assert!(allowed.iter().all(|c| is_xml_1_0_char(*c)));
    assert_eq!(
        sanitized,
        "Project Alpha\twith\nUnicode: Zażółć gęślą jaźń\r 🚀"
    );
}
