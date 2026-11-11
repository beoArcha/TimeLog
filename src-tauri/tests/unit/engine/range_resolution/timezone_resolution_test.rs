use chrono_tz::Tz;
use oxyflow_timelog::engine::range::resolve_timezone;
use oxyflow_timelog::engine::EngineError;

#[test]
fn test_given_explicit_and_setting_when_resolving_timezone_then_explicit_wins() {
    // Arrange
    let explicit = Some("America/New_York");
    let setting = Some("Europe/Warsaw");

    // Act
    let result = resolve_timezone(explicit, setting);

    // Assert
    assert_eq!(result, Ok(Tz::America__New_York));
}

#[test]
fn test_given_only_setting_when_resolving_timezone_then_uses_setting() {
    // Arrange
    let setting = Some("Europe/Warsaw");

    // Act
    let result = resolve_timezone(None, setting);

    // Assert
    assert_eq!(result, Ok(Tz::Europe__Warsaw));
}

#[test]
fn test_given_blank_explicit_when_resolving_timezone_then_falls_back_to_setting() {
    // Arrange
    let explicit = Some("  ");
    let setting = Some("Asia/Tokyo");

    // Act
    let result = resolve_timezone(explicit, setting);

    // Assert
    assert_eq!(result, Ok(Tz::Asia__Tokyo));
}

#[test]
fn test_given_system_setting_when_resolving_timezone_then_returns_a_zone_without_error() {
    // Arrange
    let setting = Some("System");

    // Act
    let result = resolve_timezone(None, setting);

    // Assert
    assert!(result.is_ok());
}

#[test]
fn test_given_no_inputs_when_resolving_timezone_then_returns_a_zone_without_error() {
    // Arrange
    let (explicit, setting) = (None, None);

    // Act
    let result = resolve_timezone(explicit, setting);

    // Assert
    assert!(result.is_ok());
}

#[test]
fn test_given_explicit_system_and_stored_zone_when_resolving_timezone_then_explicit_system_wins() {
    // Arrange
    let explicit = Some("System");
    let setting = Some("Pacific/Auckland");

    // Act
    let result = resolve_timezone(explicit, setting);

    // Assert
    assert!(result.is_ok());
    assert_ne!(result, Ok(Tz::Pacific__Auckland));
}

#[test]
fn test_given_invalid_explicit_timezone_when_resolving_timezone_then_returns_invalid_timezone() {
    // Arrange
    let explicit = Some("Mars/Olympus");

    // Act
    let result = resolve_timezone(explicit, Some("Europe/Warsaw"));

    // Assert
    assert_eq!(
        result,
        Err(EngineError::InvalidTimezone("Mars/Olympus".to_string()))
    );
}

#[test]
fn test_given_invalid_stored_timezone_when_resolving_timezone_then_returns_invalid_timezone() {
    // Arrange
    let setting = Some("Not/AZone");

    // Act
    let result = resolve_timezone(None, setting);

    // Assert
    assert_eq!(
        result,
        Err(EngineError::InvalidTimezone("Not/AZone".to_string()))
    );
}

#[test]
fn test_given_lowercase_system_setting_when_resolving_timezone_then_treats_it_as_system() {
    // Arrange
    let setting = Some("system");

    // Act
    let result = resolve_timezone(None, setting);

    // Assert
    assert!(result.is_ok());
}
