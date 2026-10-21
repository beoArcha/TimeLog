use crate::architecture::dependency_graph::ModuleGraph;
use std::collections::{HashMap, HashSet};
use std::path::Path;

#[test]
fn test_should_extract_target_module_when_use_crate_statement_is_present() {
    // Arrange
    let import_engine = "use crate::engine::Engine;";
    let import_types = "use crate::types::{Project, Task};";
    let import_persistence = "use crate::persistence::ProjectRepo;";

    // Act
    let mod_engine = ModuleGraph::extract_target_module(import_engine);
    let mod_types = ModuleGraph::extract_target_module(import_types);
    let mod_persistence = ModuleGraph::extract_target_module(import_persistence);

    // Assert
    assert_eq!(mod_engine, Some("engine".to_string()));
    assert_eq!(mod_types, Some("types".to_string()));
    assert_eq!(mod_persistence, Some("persistence".to_string()));
}

#[test]
fn test_should_extract_target_module_when_inline_crate_reference_is_present() {
    // Arrange
    let inline_call = "crate::engine::do_work()";

    // Act
    let target = ModuleGraph::extract_target_module(inline_call);

    // Assert
    assert_eq!(target, Some("engine".to_string()));
}

#[test]
fn test_should_map_app_state_to_app_module_when_imported() {
    // Arrange
    let import_app_state = "use crate::AppState;";

    // Act
    let target = ModuleGraph::extract_target_module(import_app_state);

    // Assert
    assert_eq!(target, Some("app".to_string()));
}

#[test]
fn test_should_return_none_when_import_is_external_or_empty() {
    // Arrange
    let external_import = "use std::collections::HashMap;";
    let empty_crate_import = "use crate::;";

    // Act
    let external_target = ModuleGraph::extract_target_module(external_import);
    let empty_target = ModuleGraph::extract_target_module(empty_crate_import);

    // Assert
    assert_eq!(external_target, None);
    assert_eq!(empty_target, None);
}

#[test]
fn test_should_extract_module_name_when_file_is_inside_module_directory() {
    // Arrange
    let src_root = Path::new("src");
    let file_path = Path::new("src/engine/timer.rs");

    // Act
    let top_level = ModuleGraph::extract_top_level_module(src_root, file_path);

    // Assert
    assert_eq!(top_level, Some("engine".to_string()));
}

#[test]
fn test_should_return_none_when_file_is_root_crate_source() {
    // Arrange
    let src_root = Path::new("src");
    let main_rs = Path::new("src/main.rs");
    let lib_rs = Path::new("src/lib.rs");

    // Act
    let main_mod = ModuleGraph::extract_top_level_module(src_root, main_rs);
    let lib_mod = ModuleGraph::extract_top_level_module(src_root, lib_rs);

    // Assert
    assert_eq!(main_mod, None);
    assert_eq!(lib_mod, None);
}

#[test]
fn test_should_return_true_when_cycle_is_already_recorded() {
    // Arrange
    let existing_cycles = vec![vec![
        "engine".to_string(),
        "persistence".to_string(),
        "engine".to_string(),
    ]];
    let duplicate_cycle = vec![
        "engine".to_string(),
        "persistence".to_string(),
        "engine".to_string(),
    ];

    // Act
    let already_recorded = ModuleGraph::cycle_already_recorded(&existing_cycles, &duplicate_cycle);

    // Assert
    assert!(already_recorded);
}

#[test]
fn test_should_return_true_when_cycle_is_recorded_with_rotational_permutation() {
    // Arrange
    let existing_cycles = vec![vec![
        "a".to_string(),
        "b".to_string(),
        "c".to_string(),
        "a".to_string(),
    ]];
    let rotated_cycle = vec![
        "b".to_string(),
        "c".to_string(),
        "a".to_string(),
        "b".to_string(),
    ];

    // Act
    let already_recorded = ModuleGraph::cycle_already_recorded(&existing_cycles, &rotated_cycle);

    // Assert
    assert!(already_recorded);
}

#[test]
fn test_should_return_false_when_cycle_has_different_nodes() {
    // Arrange
    let existing_cycles = vec![vec!["a".to_string(), "b".to_string(), "a".to_string()]];
    let different_cycle = vec!["a".to_string(), "c".to_string(), "a".to_string()];

    // Act
    let already_recorded = ModuleGraph::cycle_already_recorded(&existing_cycles, &different_cycle);

    // Assert
    assert!(!already_recorded);
}

#[test]
fn test_should_return_empty_cycles_when_graph_is_acyclic_dag() {
    // Arrange
    let mut adj = HashMap::new();
    let mut a_targets = HashSet::new();
    a_targets.insert("b".to_string());
    adj.insert("a".to_string(), a_targets);

    let mut b_targets = HashSet::new();
    b_targets.insert("c".to_string());
    adj.insert("b".to_string(), b_targets);

    let mut modules = HashSet::new();
    modules.insert("a".to_string());
    modules.insert("b".to_string());
    modules.insert("c".to_string());

    let graph = ModuleGraph {
        adj,
        details: Vec::new(),
        modules,
    };

    // Act
    let cycles = graph.find_cycles(None);

    // Assert
    assert!(cycles.is_empty(), "DAG must not yield cycles: {:?}", cycles);
}

#[test]
fn test_should_detect_direct_cycle_between_two_mutually_dependent_modules() {
    // Arrange
    let mut adj = HashMap::new();
    let mut a_targets = HashSet::new();
    a_targets.insert("b".to_string());
    adj.insert("a".to_string(), a_targets);

    let mut b_targets = HashSet::new();
    b_targets.insert("a".to_string());
    adj.insert("b".to_string(), b_targets);

    let mut modules = HashSet::new();
    modules.insert("a".to_string());
    modules.insert("b".to_string());

    let graph = ModuleGraph {
        adj,
        details: Vec::new(),
        modules,
    };

    // Act
    let cycles = graph.find_cycles(None);

    // Assert
    assert_eq!(cycles.len(), 1);
    assert_eq!(cycles[0].len(), 3);
    assert_eq!(cycles[0].first(), cycles[0].last());
}

#[test]
fn test_should_filter_cycles_when_module_allowlist_is_provided() {
    // Arrange: Create a cycle between d and e, but filter only includes a and b
    let mut adj = HashMap::new();
    let mut d_targets = HashSet::new();
    d_targets.insert("e".to_string());
    adj.insert("d".to_string(), d_targets);

    let mut e_targets = HashSet::new();
    e_targets.insert("d".to_string());
    adj.insert("e".to_string(), e_targets);

    let mut modules = HashSet::new();
    modules.insert("d".to_string());
    modules.insert("e".to_string());

    let graph = ModuleGraph {
        adj,
        details: Vec::new(),
        modules,
    };

    let mut filter = HashSet::new();
    filter.insert("a".to_string());
    filter.insert("b".to_string());

    // Act
    let cycles = graph.find_cycles(Some(&filter));

    // Assert
    assert!(cycles.is_empty());
}
