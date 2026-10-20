use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_source_code_when_scanned_for_raw_sql_then_isolated_to_repositories() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: Raw SQL statements must remain strictly encapsulated inside repositories
    arch.assert_sql_isolated_to_repositories("repositories");
}
