use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_headless_subsystems_when_scanned_then_zero_tauri_gui_coupling() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then
    // Invariant from docs/manifesto/CLI.md:
    // "The Rust CLI module (src-tauri/src/cli/) must NEVER import AppState, tauri::AppHandle,
    // tauri::WebviewWindow, tauri::Manager, or UI tray controllers."
    let headless_modules = [
        "cli",
        "engine",
        "persistence",
        "repositories",
        "types",
        "sinks",
        "workflows",
    ];

    arch.assert_zero_tauri_coupling(&headless_modules);
}
