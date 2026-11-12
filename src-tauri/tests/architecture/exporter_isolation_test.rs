use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_cli_exporters_when_checked_then_isolated_from_data_access_and_engine() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When
    let assertion_result = std::panic::catch_unwind(|| {
        arch.assert_exporter_isolation();
    });

    // Then
    assert!(
        assertion_result.is_ok(),
        "Expected CLI exporters to remain strictly isolated from data access and engine"
    );
}
