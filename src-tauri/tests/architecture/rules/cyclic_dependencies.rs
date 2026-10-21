use crate::architecture::dependency_graph::ModuleGraph;
use std::collections::HashSet;

/// Verifies that the specified set of modules contains zero circular dependencies.
pub fn assert_no_cycles(graph: &ModuleGraph, modules: &[&str]) {
    let filter: HashSet<String> = modules.iter().map(|s| s.to_string()).collect();
    let cycles = graph.find_cycles(Some(&filter));

    if !cycles.is_empty() {
        let mut msg = format!(
            "Architecture Violation: Found {} circular dependency cycle(s) among modules {:?}:\n",
            cycles.len(),
            modules
        );
        for (idx, cycle) in cycles.iter().enumerate() {
            msg.push_str(&format!("  Cycle #{}: {}\n", idx + 1, cycle.join(" -> ")));
        }
        panic!("{}", msg);
    }
}
