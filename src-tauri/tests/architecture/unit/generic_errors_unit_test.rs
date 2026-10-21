use crate::architecture::rules::generic_errors::detect_forbidden_error_signature;

#[test]
fn test_should_detect_forbidden_error_when_return_type_is_string() {
    // Arrange
    let signature = "pub fn run(&self) -> Result<(), String> {";

    // Act
    let detected = detect_forbidden_error_signature(signature);

    // Assert
    assert_eq!(detected, Some(", String>"));
}

#[test]
fn test_should_detect_forbidden_error_when_return_type_is_string_slice() {
    // Arrange
    let signature = "pub fn parse() -> Result<Data, &str>";

    // Act
    let detected = detect_forbidden_error_signature(signature);

    // Assert
    assert_eq!(detected, Some(", &str>"));
}

#[test]
fn test_should_detect_forbidden_error_when_return_type_is_boxed_dyn_error() {
    // Arrange
    let signature_short = "fn execute() -> Result<(), Box<dyn Error>> {";
    let signature_std = "fn execute() -> Result<(), Box<dyn std::error::Error>> {";

    // Act
    let detected_short = detect_forbidden_error_signature(signature_short);
    let detected_std = detect_forbidden_error_signature(signature_std);

    // Assert
    assert_eq!(detected_short, Some(", Box<dyn Error>"));
    assert_eq!(detected_std, Some(", Box<dyn std::error::Error>"));
}

#[test]
fn test_should_detect_forbidden_error_when_return_type_is_anyhow_error() {
    // Arrange
    let signature = "pub fn load_state() -> Result<State, anyhow::Error>";

    // Act
    let detected = detect_forbidden_error_signature(signature);

    // Assert
    assert_eq!(detected, Some(", anyhow::Error>"));
}

#[test]
fn test_should_detect_forbidden_error_when_return_type_is_unit() {
    // Arrange
    let signature = "pub fn sync() -> Result<bool, ()>";

    // Act
    let detected = detect_forbidden_error_signature(signature);

    // Assert
    assert_eq!(detected, Some(", ()>"));
}

#[test]
fn test_should_detect_forbidden_error_when_type_alias_uses_forbidden_pattern() {
    // Arrange
    let type_alias = "type Result<T> = std::result::Result<T, String>;";

    // Act
    let detected = detect_forbidden_error_signature(type_alias);

    // Assert
    assert_eq!(detected, Some(", String>"));
}

#[test]
fn test_should_return_none_when_signature_uses_custom_domain_error() {
    // Arrange
    let domain_signature = "pub fn create_project() -> Result<Project, PersistenceError>";
    let engine_signature = "pub fn validate() -> std::result::Result<ValidationOk, EngineError>";

    // Act
    let detected_domain = detect_forbidden_error_signature(domain_signature);
    let detected_engine = detect_forbidden_error_signature(engine_signature);

    // Assert
    assert_eq!(detected_domain, None);
    assert_eq!(detected_engine, None);
}

#[test]
fn test_should_return_none_when_line_is_not_a_result_signature() {
    // Arrange
    let non_sig = r#"let error_msg = format!("Error: {}, String>", value);"#;

    // Act
    let detected = detect_forbidden_error_signature(non_sig);

    // Assert
    assert_eq!(detected, None);
}
