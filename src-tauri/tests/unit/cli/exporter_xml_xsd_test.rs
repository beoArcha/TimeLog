use crate::shared::exporter_fixtures::create_sample_document;
use crate::shared::report_document_builders::{a_document, a_project_patch_entry, an_entry};
use crate::shared::xsd_validator::{assert_valid_report_xml, Xsd, REPORT_XSD_V2};
use oxyflow_timelog::cli::exporters::export_xml;
use oxyflow_timelog::types::{RangePreset, ReportRateStatus, ReportVariant};

fn xsd() -> Xsd {
    Xsd::parse(REPORT_XSD_V2).expect("the v2 XSD must parse")
}

fn export(document: &oxyflow_timelog::types::ReportDocument) -> String {
    export_xml(document).expect("export_xml should succeed")
}

#[test]
fn test_given_full_document_when_exporting_xml_then_it_validates_against_the_v2_xsd() {
    // Arrange
    let document = create_sample_document(ReportVariant::Full);

    // Act
    let xml = export(&document);

    // Assert
    assert_valid_report_xml(&xml);
}

#[test]
fn test_given_summary_document_when_exporting_xml_then_it_validates_against_the_v2_xsd() {
    // Arrange
    let document = create_sample_document(ReportVariant::Summary);

    // Act
    let xml = export(&document);

    // Assert
    assert_valid_report_xml(&xml);
    assert!(!xml.contains("<days"));
    assert!(!xml.contains("<entries"));
}

#[test]
fn test_given_empty_documents_when_exporting_xml_then_both_variants_validate() {
    for variant in [ReportVariant::Full, ReportVariant::Summary] {
        // Arrange
        let mut document = a_document(variant);
        document.projects.clear();
        document.days.clear();
        document.totals.billing.clear();
        document.totals.seconds = 0;
        if variant == ReportVariant::Full {
            document.entries = Some(Vec::new());
        }

        // Act
        let xml = export(&document);

        // Assert
        assert_valid_report_xml(&xml);
    }
}

#[test]
fn test_given_every_range_preset_and_rate_status_when_exporting_xml_then_each_value_validates() {
    let presets = [
        RangePreset::Today,
        RangePreset::Yesterday,
        RangePreset::Week,
        RangePreset::LastWeek,
        RangePreset::Month,
        RangePreset::LastMonth,
        RangePreset::All,
    ];
    for preset in presets {
        // Arrange
        let mut document = a_document(ReportVariant::Summary);
        document.range.preset = Some(preset);

        // Act
        let xml = export(&document);

        // Assert
        assert_valid_report_xml(&xml);
        let serialized = serde_json::to_value(preset).expect("preset serializes");
        let expected = format!("preset=\"{}\"", serialized.as_str().expect("string value"));
        assert!(xml.contains(&expected), "{expected} in {xml}");
    }

    let statuses = [
        ReportRateStatus::Inherited,
        ReportRateStatus::Custom,
        ReportRateStatus::NonBillable,
        ReportRateStatus::Unconfigured,
    ];
    for status in statuses {
        // Arrange
        let mut document = a_document(ReportVariant::Summary);
        document.projects[0].tasks[0].rate_status = status;

        // Act
        let xml = export(&document);

        // Assert
        assert_valid_report_xml(&xml);
        let serialized = serde_json::to_value(status).expect("status serializes");
        let expected = format!(
            "rateStatus=\"{}\"",
            serialized.as_str().expect("string value")
        );
        assert!(xml.contains(&expected), "{expected} in {xml}");
    }
}

#[test]
fn test_given_optional_fields_present_and_absent_when_exporting_xml_then_both_validate() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.range.from = None;
    document.range.preset = None;
    document.filters.project_id = Some("p1".to_string());
    document.filters.task_id = Some("t1".to_string());
    let mut running = an_entry();
    running.end = None;
    running.note = None;
    running.rate_minor = None;
    running.currency = None;
    running.amount_minor = None;
    document.entries = Some(vec![an_entry(), running, a_project_patch_entry()]);

    // Act
    let xml = export(&document);

    // Assert
    assert_valid_report_xml(&xml);
}

#[test]
fn test_given_special_characters_when_exporting_xml_then_it_still_validates() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    document.projects[0].name = "R&D <Core> \"App\" 'Fast' 🚀 Zażółć".to_string();
    document.entries.as_mut().expect("full entries")[0].note =
        Some("a & b < c > d \" e ' f\r\ng".to_string());

    // Act
    let xml = export(&document);

    // Assert
    assert_valid_report_xml(&xml);
}

#[test]
fn test_given_a_large_document_when_exporting_xml_then_it_validates() {
    // Arrange
    let mut document = a_document(ReportVariant::Full);
    let entries = (0..2_000)
        .map(|index| {
            let mut entry = an_entry();
            entry.id = format!("log-{index}");
            entry
        })
        .collect();
    document.entries = Some(entries);
    document.totals.entry_count = 2_000;

    // Act
    let xml = export(&document);

    // Assert
    assert_valid_report_xml(&xml);
}

#[test]
fn test_given_the_validator_when_a_required_attribute_is_missing_then_it_fails() {
    // Arrange
    let xml = export(&a_document(ReportVariant::Summary)).replace(" variant=\"summary\"", "");

    // Act
    let result = xsd().validate(&xml);

    // Assert
    assert!(result
        .unwrap_err()
        .contains("missing required attribute 'variant'"));
}

#[test]
fn test_given_the_validator_when_an_enumeration_value_is_unknown_then_it_fails() {
    // Arrange
    let xml = export(&a_document(ReportVariant::Summary))
        .replace("variant=\"summary\"", "variant=\"tiny\"");

    // Act
    let result = xsd().validate(&xml);

    // Assert
    assert!(result.unwrap_err().contains("is not a valid one of"));
}

#[test]
fn test_given_the_validator_when_the_schema_version_is_not_fixed_value_then_it_fails() {
    // Arrange
    let xml = export(&a_document(ReportVariant::Summary))
        .replace("schemaVersion=\"2\"", "schemaVersion=\"1\"");

    // Act
    let result = xsd().validate(&xml);

    // Assert
    assert!(result.unwrap_err().contains("must be '2'"));
}

#[test]
fn test_given_the_validator_when_sections_are_out_of_order_then_it_fails() {
    // Arrange
    let xml = export(&a_document(ReportVariant::Full));
    let filters_line = xml
        .lines()
        .find(|line| line.trim_start().starts_with("<filters "))
        .expect("filters line")
        .to_string();
    let swapped = xml.replace(&format!("{filters_line}\n"), "");
    let swapped = swapped.replace(
        "<generator ",
        &format!("{}\n  <generator ", filters_line.trim()),
    );

    // Act
    let result = xsd().validate(&swapped);

    // Assert
    assert!(result.is_err());
}

#[test]
fn test_given_the_validator_when_an_unknown_element_or_attribute_appears_then_it_fails() {
    // Arrange
    let base = export(&a_document(ReportVariant::Summary));
    let with_element = base.replace("</report>", "  <extra/>\n</report>");
    let with_attribute = base.replace("<totals ", "<totals bogus=\"1\" ");

    // Act
    let element_result = xsd().validate(&with_element);
    let attribute_result = xsd().validate(&with_attribute);

    // Assert
    assert!(element_result
        .unwrap_err()
        .contains("unexpected element <extra>"));
    assert!(attribute_result
        .unwrap_err()
        .contains("unexpected attribute 'bogus'"));
}

#[test]
fn test_given_the_validator_when_a_number_or_date_is_malformed_then_it_fails() {
    // Arrange
    let base = export(&a_document(ReportVariant::Full));
    let negative = base.replace("seconds=\"3600\" entryCount", "seconds=\"-1\" entryCount");
    let bad_date = base.replace("date=\"2026-01-01\"", "date=\"01/01/2026\"");

    // Act
    let negative_result = xsd().validate(&negative);
    let date_result = xsd().validate(&bad_date);

    // Assert
    assert!(negative_result.is_err());
    assert!(date_result.is_err());
}
