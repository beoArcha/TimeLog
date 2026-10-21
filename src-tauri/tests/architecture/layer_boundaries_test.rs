use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_types_module_when_checked_then_acts_as_pure_leaf_without_higher_layer_imports() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: types cannot import engine, persistence, repositories, cli, commands, or app
    arch.assert_does_not_depend_on(
        "types",
        &[
            "engine",
            "persistence",
            "repositories",
            "cli",
            "commands",
            "app",
            "tray",
            "workflows",
        ],
    );
}

#[test]
fn test_given_repositories_module_when_checked_then_does_not_import_business_or_orchestration_layers(
) {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: repositories cannot import persistence, engine, cli, commands, or app
    arch.assert_does_not_depend_on(
        "repositories",
        &[
            "persistence",
            "engine",
            "cli",
            "commands",
            "app",
            "tray",
            "workflows",
        ],
    );
}

#[test]
fn test_given_engine_module_when_checked_then_does_not_import_cli_or_presentation_layers() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: engine cannot import cli, commands, app, tray
    arch.assert_does_not_depend_on("engine", &["cli", "commands", "app", "tray"]);
}

#[test]
fn test_given_cli_module_when_checked_then_does_not_import_gui_commands_or_desktop_app() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: cli cannot import commands, app, or tray
    arch.assert_does_not_depend_on("cli", &["commands", "app", "tray"]);
}
