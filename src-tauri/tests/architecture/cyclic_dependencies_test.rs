use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_headless_core_modules_when_analyzing_graph_then_zero_cyclic_dependencies() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then
    // Headless modules that will form future standalone crates:
    let headless_modules = [
        "types",
        "repositories",
        "persistence",
        "engine",
        "cli",
        "sinks",
        "workflows",
    ];

    arch.assert_no_cycles(&headless_modules);
}

#[test]
fn test_given_cli_subsystem_when_analyzing_dependencies_then_no_cycles_with_domain_engine() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then
    // Specifically guarantees that CLI depends on Engine, but Engine NEVER depends on CLI:
    arch.assert_no_cycles(&["cli", "engine", "persistence"]);
}
