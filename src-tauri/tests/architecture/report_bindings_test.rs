use std::fs;
use std::path::PathBuf;

const REPORT_BINDINGS: [&str; 13] = [
    "ReportDocument",
    "ReportTotals",
    "ReportBillingTotal",
    "ReportProject",
    "ReportTask",
    "ReportSubtask",
    "ReportDay",
    "ReportEntry",
    "ReportRequest",
    "ReportVariant",
    "ReportRateStatus",
    "ReportGenerator",
    "ReportFilters",
];

fn read_binding(name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../src/bindings")
        .join(format!("{name}.ts"));
    fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()))
}

#[test]
fn test_given_report_bindings_when_scanned_then_no_bigint_types() {
    // Given
    let sources: Vec<(&str, String)> = REPORT_BINDINGS
        .iter()
        .map(|name| (*name, read_binding(name)))
        .collect();

    // When
    let offenders: Vec<&str> = sources
        .iter()
        .filter(|(_, source)| source.contains("bigint"))
        .map(|(name, _)| *name)
        .collect();

    // Then
    assert!(offenders.is_empty(), "bigint found in: {offenders:?}");
    let find = |name: &str| &sources.iter().find(|(n, _)| *n == name).unwrap().1;
    assert!(find("ReportDay").contains("seconds: number"));
    assert!(find("ReportBillingTotal").contains("amountMinor: number"));
}
