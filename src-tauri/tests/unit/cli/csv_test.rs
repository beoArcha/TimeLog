use oxyflow_timelog::cli::exporters::csv_sanitize::{
    is_numeric_value, is_whitespace_or_control, sanitize_csv_formula,
};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct ParityCase {
    id: String,
    description: String,
    input: String,
    expected: String,
    #[serde(rename = "isNumeric")]
    is_numeric: bool,
    #[serde(rename = "shouldNeutralize")]
    should_neutralize: bool,
}

const PARITY_FIXTURE_JSON: &str =
    include_str!("../../../../tests/shared/fixtures/csv-formula-parity-cases.json");

#[test]
fn test_given_shared_parity_matrix_when_evaluated_then_all_vectors_pass_exact_assertions() {
    // Arrange
    let cases: Vec<ParityCase> =
        serde_json::from_str(PARITY_FIXTURE_JSON).expect("Valid parity JSON");

    // Act & Assert
    for case in cases {
        let actual_sanitized = sanitize_csv_formula(&case.input);
        let actual_numeric = is_numeric_value(&case.input);
        let neutralized = actual_sanitized.starts_with('\'') && !case.input.starts_with('\'');

        assert_eq!(
            actual_sanitized, case.expected,
            "Parity failure for vector '{}': {}",
            case.id, case.description
        );
        assert_eq!(
            actual_numeric, case.is_numeric,
            "Numeric mismatch for vector '{}': {}",
            case.id, case.description
        );
        assert_eq!(
            neutralized, case.should_neutralize,
            "Neutralization mismatch for vector '{}': {}",
            case.id, case.description
        );
    }
}

#[test]
fn test_given_unicode_whitespace_when_is_whitespace_or_control_then_returns_true() {
    // Arrange
    let whitespaces = [
        ' ', '\t', '\n', '\x0C', '\r', '\x0B', '\u{0085}', '\u{00A0}', '\u{1680}', '\u{2000}',
        '\u{2001}', '\u{2002}', '\u{2003}', '\u{2004}', '\u{2005}', '\u{2006}', '\u{2007}',
        '\u{2008}', '\u{2009}', '\u{200A}', '\u{2028}', '\u{2029}', '\u{202F}', '\u{205F}',
        '\u{3000}',
    ];

    // Act & Assert
    for c in whitespaces {
        assert!(
            is_whitespace_or_control(c),
            "Expected U+{:04X} to be whitespace_or_control",
            c as u32
        );
    }
}

#[test]
fn test_given_control_characters_when_is_whitespace_or_control_then_returns_true() {
    // Arrange & Act & Assert
    assert!(is_whitespace_or_control('\u{0000}'));
    assert!(is_whitespace_or_control('\u{001F}'));
    assert!(is_whitespace_or_control('\u{007F}'));
    assert!(is_whitespace_or_control('\u{0080}'));
    assert!(is_whitespace_or_control('\u{009F}'));
}

#[test]
fn test_given_format_characters_when_is_whitespace_or_control_then_returns_false() {
    // Arrange
    let format_chars = [
        '\u{FEFF}', // BOM / ZWNBSP
        '\u{200B}', // Zero-width space
        '\u{200C}', // ZWNJ
        '\u{200D}', // ZWJ
        '\u{2060}', // Word joiner
    ];

    // Act & Assert
    for c in format_chars {
        assert!(
            !is_whitespace_or_control(c),
            "Expected format char U+{:04X} to NOT be whitespace_or_control",
            c as u32
        );
    }
}

#[test]
fn test_given_unicode_whitespace_preceding_formula_when_sanitize_csv_formula_then_neutralizes() {
    // Arrange & Act & Assert
    assert_eq!(sanitize_csv_formula("\u{00A0}=1+1"), "'\u{00A0}=1+1");
    assert_eq!(sanitize_csv_formula("\u{1680}+cmd"), "'\u{1680}+cmd");
    assert_eq!(sanitize_csv_formula("\u{2000}-calc"), "'\u{2000}-calc");
    assert_eq!(
        sanitize_csv_formula("\u{3000}@SUM(A1)"),
        "'\u{3000}@SUM(A1)"
    );
    assert_eq!(
        sanitize_csv_formula("\u{00A0}\u{3000}\t =1+1"),
        "'\u{00A0}\u{3000}\t =1+1"
    );
}

#[test]
fn test_given_format_characters_preceding_formula_when_sanitize_csv_formula_then_preserves_raw() {
    // Arrange & Act & Assert
    assert_eq!(sanitize_csv_formula("\u{FEFF}=1+1"), "\u{FEFF}=1+1");
    assert_eq!(sanitize_csv_formula("\u{200B}=1+1"), "\u{200B}=1+1");
}

#[test]
fn test_given_valid_numeric_values_when_is_numeric_value_then_returns_true() {
    // Arrange & Act & Assert
    assert!(is_numeric_value("123"));
    assert!(is_numeric_value("+123"));
    assert!(is_numeric_value("-123"));
    assert!(is_numeric_value("-123.45"));
    assert!(is_numeric_value("+42.0"));
    assert!(is_numeric_value("0"));
    assert!(is_numeric_value("-0"));
    assert!(is_numeric_value(".5"));
    assert!(is_numeric_value("-.5"));
    assert!(is_numeric_value("1e5"));
    assert!(is_numeric_value("-1e-3"));
    assert!(is_numeric_value("   -5   "));
    assert!(is_numeric_value("\u{00A0}-123.45"));
    assert!(is_numeric_value("\u{3000}+42"));
    assert!(is_numeric_value("\u{0085}-50"));
}

#[test]
fn test_given_non_numeric_values_when_is_numeric_value_then_returns_false() {
    // Arrange & Act & Assert
    assert!(!is_numeric_value(""));
    assert!(!is_numeric_value("   "));
    assert!(!is_numeric_value("=1+1"));
    assert!(!is_numeric_value("@SUM(A1:A2)"));
    assert!(!is_numeric_value("+cmd|calc"));
    assert!(!is_numeric_value("-calc"));
    assert!(!is_numeric_value("-1+1"));
    assert!(!is_numeric_value("-"));
    assert!(!is_numeric_value("+"));
    assert!(!is_numeric_value("Project 1"));
    assert!(!is_numeric_value("\u{FEFF}-123"));
}
