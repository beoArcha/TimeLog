use oxyflow_timelog::cli::formatters::{decide_decoration, detect_decoration, DecorationMode};

#[test]
fn test_given_terminal_when_no_color_is_unset_or_empty_then_returns_rich_decoration() {
    // Arrange
    let is_terminal = true;
    let unset_env = None;
    let empty_env = Some("");

    // Act
    let mode_unset = decide_decoration(is_terminal, unset_env);
    let mode_empty = decide_decoration(is_terminal, empty_env);

    // Assert
    assert_eq!(mode_unset, DecorationMode::Rich);
    assert_eq!(mode_empty, DecorationMode::Rich);
}

#[test]
fn test_given_terminal_when_no_color_is_set_then_returns_plain_decoration() {
    // Arrange
    let is_terminal = true;
    let set_env_one = Some("1");
    let set_env_string = Some("true");

    // Act
    let mode_one = decide_decoration(is_terminal, set_env_one);
    let mode_string = decide_decoration(is_terminal, set_env_string);

    // Assert
    assert_eq!(mode_one, DecorationMode::Plain);
    assert_eq!(mode_string, DecorationMode::Plain);
}

#[test]
fn test_given_non_terminal_when_any_no_color_combination_then_returns_plain_decoration() {
    // Arrange
    let is_terminal = false;
    let unset_env = None;
    let empty_env = Some("");
    let set_env = Some("1");

    // Act
    let mode_unset = decide_decoration(is_terminal, unset_env);
    let mode_empty = decide_decoration(is_terminal, empty_env);
    let mode_set = decide_decoration(is_terminal, set_env);

    // Assert
    assert_eq!(mode_unset, DecorationMode::Plain);
    assert_eq!(mode_empty, DecorationMode::Plain);
    assert_eq!(mode_set, DecorationMode::Plain);
}

#[test]
fn test_given_current_environment_when_detect_decoration_then_returns_valid_mode() {
    // Arrange
    let _active_env = std::env::var("NO_COLOR");

    // Act
    let mode = detect_decoration();

    // Assert
    assert!(matches!(mode, DecorationMode::Rich | DecorationMode::Plain));
}
