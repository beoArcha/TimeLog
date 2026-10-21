pub mod cyclic_dependencies;
pub mod forbidden_dependencies;
pub mod generic_errors;
pub mod helpers;
pub mod max_nested_ifs;
pub mod sql_isolation;
pub mod tauri_isolation;

pub use max_nested_ifs::{scan_nested_ifs, MAX_ALLOWED_IF_DEPTH};

use crate::architecture::dependency_graph::ModuleGraph;
use std::path::PathBuf;

/// Fluent facade runner for native Rust architectural assertions.
pub struct ArchRule<'a> {
    graph: &'a ModuleGraph,
    src_dir: PathBuf,
}

impl<'a> ArchRule<'a> {
    pub fn new(graph: &'a ModuleGraph, src_dir: PathBuf) -> Self {
        Self { graph, src_dir }
    }

    /// Verifies that the specified set of modules contains zero circular dependencies.
    pub fn assert_no_cycles(&self, modules: &[&str]) {
        cyclic_dependencies::assert_no_cycles(self.graph, modules);
    }

    /// Verifies that the specified module does not depend on any forbidden modules.
    pub fn assert_does_not_depend_on(&self, source_module: &str, forbidden_targets: &[&str]) {
        forbidden_dependencies::assert_does_not_depend_on(
            self.graph,
            source_module,
            forbidden_targets,
        );
    }

    /// Verifies that none of the target modules import or reference Tauri.
    pub fn assert_zero_tauri_coupling(&self, headless_modules: &[&str]) {
        tauri_isolation::assert_zero_tauri_coupling(&self.src_dir, headless_modules);
    }

    /// Verifies that raw SQL queries do not appear outside the dedicated repository layer.
    pub fn assert_sql_isolated_to_repositories(&self, allowed_module: &str) {
        sql_isolation::assert_sql_isolated_to_repositories(&self.src_dir, allowed_module);
    }

    /// Verifies that native functions never return unstructured or generic errors.
    pub fn assert_zero_generic_errors(&self, allowlist: &[&str]) {
        generic_errors::assert_zero_generic_errors(&self.src_dir, allowlist);
    }

    /// Verifies that no block or function nests if statements 3 or more levels deep.
    pub fn assert_max_nested_ifs(&self, max_allowed_depth: usize, allowlist: &[&str]) {
        max_nested_ifs::assert_max_nested_ifs(&self.src_dir, max_allowed_depth, allowlist);
    }
}
