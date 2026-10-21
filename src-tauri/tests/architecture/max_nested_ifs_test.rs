use super::dependency_graph::ModuleGraph;
use super::rules::ArchRule;
use std::path::PathBuf;

fn get_src_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src")
}

#[test]
fn test_given_rust_codebase_when_checked_then_forbids_if_nested_three_or_more_levels() {
    // Given
    let src_dir = get_src_path();
    let graph = ModuleGraph::build_from_src(&src_dir);
    let arch = ArchRule::new(&graph, src_dir);

    // When & Then: Rule of 3 Nested Ifs (depth >= 3 triggers failure) across all native source code with ZERO allowlist
    arch.assert_max_nested_ifs(super::rules::MAX_ALLOWED_IF_DEPTH, &[]);
}
