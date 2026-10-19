use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::settings::{handle as handle_settings, SettingsCommand};
use oxy_flow::cli::shared::output::CliOutput;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_configured_persistence_when_view_settings_command_executed_then_returns_success_output(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("cli_settings_test");
    let persistence = Persistence::new(&config).unwrap();
    let cmd = SettingsCommand::View;

    // When
    let res = handle_settings(cmd, &persistence);

    // Then
    assert!(res.is_ok());
    if let Ok(CliOutput::Success(msg)) = res {
        assert!(msg.contains("Settings:"));
    } else {
        panic!("Expected CliOutput::Success");
    }
}
