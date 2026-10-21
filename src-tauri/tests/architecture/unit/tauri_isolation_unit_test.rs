use crate::architecture::rules::tauri_isolation::is_forbidden_tauri_statement;

#[test]
fn test_should_return_true_when_statement_imports_tauri() {
    // Arrange
    let import_tauri = "use tauri::Manager;";

    // Act
    let forbidden = is_forbidden_tauri_statement(import_tauri);

    // Assert
    assert!(forbidden);
}

#[test]
fn test_should_return_true_when_statement_uses_tauri_command_attribute() {
    // Arrange
    let command_attr = "#[tauri::command]";

    // Act
    let forbidden = is_forbidden_tauri_statement(command_attr);

    // Assert
    assert!(forbidden);
}

#[test]
fn test_should_return_true_when_statement_references_tauri_types() {
    // Arrange
    let app_handle = "fn init(app: tauri::AppHandle) {";
    let webview = "window: tauri::WebviewWindow,";
    let state = "state: tauri::State<'_, AppState>";

    // Act
    let forbidden_app = is_forbidden_tauri_statement(app_handle);
    let forbidden_window = is_forbidden_tauri_statement(webview);
    let forbidden_state = is_forbidden_tauri_statement(state);

    // Assert
    assert!(forbidden_app);
    assert!(forbidden_window);
    assert!(forbidden_state);
}

#[test]
fn test_should_return_false_when_statement_is_clean_domain_code() {
    // Arrange
    let domain_import = "use crate::engine::Engine;";
    let domain_struct = "pub struct SqliteProjectRepo;";
    let domain_fn = "pub fn calculate_elapsed(start: i64) -> u64 {";

    // Act
    let forbidden_import = is_forbidden_tauri_statement(domain_import);
    let forbidden_struct = is_forbidden_tauri_statement(domain_struct);
    let forbidden_fn = is_forbidden_tauri_statement(domain_fn);

    // Assert
    assert!(!forbidden_import);
    assert!(!forbidden_struct);
    assert!(!forbidden_fn);
}
