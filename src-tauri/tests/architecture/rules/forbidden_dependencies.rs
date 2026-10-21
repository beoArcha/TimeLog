use crate::architecture::dependency_graph::ModuleGraph;
use std::collections::HashSet;

/// Verifies that the specified module does not depend on any forbidden modules.
pub fn assert_does_not_depend_on(
    graph: &ModuleGraph,
    source_module: &str,
    forbidden_targets: &[&str],
) {
    let forbidden_set: HashSet<&str> = forbidden_targets.iter().copied().collect();
    let mut violations = Vec::new();

    for dep in &graph.details {
        let is_target_source = dep.source_module == source_module;
        let is_forbidden_target = forbidden_set.contains(dep.target_module.as_str());

        if is_target_source && is_forbidden_target {
            violations.push(format!(
                "  - [{}:{}] '{}' imports forbidden module '{}' via '{}'",
                dep.source_file.display(),
                dep.line_number,
                source_module,
                dep.target_module,
                dep.import_statement
            ));
        }
    }

    if !violations.is_empty() {
        panic!(
            "Architecture Violation: Module '{}' violates layer boundaries by importing forbidden targets {:?}:\n{}",
            source_module,
            forbidden_targets,
            violations.join("\n")
        );
    }
}
