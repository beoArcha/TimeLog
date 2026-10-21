use oxy_flow::common::attach_parent_console;

#[test]
fn test_attach_parent_console_invokes_without_panic() {
    // Arrange & Act
    let result = attach_parent_console();

    // Assert
    // On non-Windows platforms it is a no-op returning true.
    // On Windows, AttachConsole returns a boolean indicating whether attachment succeeded
    // (or was already attached). In both cases it must complete safely without panicking.
    let _ = result;
}
