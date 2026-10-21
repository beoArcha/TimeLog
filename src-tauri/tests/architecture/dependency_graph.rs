use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

/// Represents a source file and its detected crate-internal module dependencies.
#[derive(Debug, Clone)]
pub struct ModuleDependency {
    pub source_file: PathBuf,
    pub source_module: String,
    pub target_module: String,
    pub line_number: usize,
    pub import_statement: String,
}

/// In-memory graph of module-to-module dependencies.
#[derive(Debug, Default)]
pub struct ModuleGraph {
    /// Directed adjacency list: Source Module -> Set of Target Modules
    pub adj: HashMap<String, HashSet<String>>,
    /// Detailed dependency records for error reporting
    pub details: Vec<ModuleDependency>,
    /// All discovered top-level modules
    pub modules: HashSet<String>,
}

impl ModuleGraph {
    /// Builds the module graph by recursively scanning all `.rs` files in the given source directory.
    pub fn build_from_src<P: AsRef<Path>>(src_dir: P) -> Self {
        let mut graph = ModuleGraph::default();
        let src_path = src_dir.as_ref();

        let mut files = Vec::new();
        Self::collect_rs_files(src_path, &mut files);

        for file in files {
            let Some(source_mod) = Self::extract_top_level_module(src_path, &file) else {
                continue;
            };
            graph.modules.insert(source_mod.clone());
            Self::parse_file_dependencies(&file, &source_mod, &mut graph);
        }

        graph
    }

    fn parse_file_dependencies(file: &Path, source_mod: &str, graph: &mut ModuleGraph) {
        let Ok(content) = fs::read_to_string(file) else {
            return;
        };

        for (line_idx, line) in content.lines().enumerate() {
            let trimmed = line.trim();
            let is_crate_import =
                trimmed.starts_with("use crate::") || trimmed.starts_with("crate::");
            if !is_crate_import {
                continue;
            }

            let Some(target_mod) = Self::extract_target_module(trimmed) else {
                continue;
            };

            if target_mod != source_mod && target_mod != "main" && target_mod != "lib" {
                graph
                    .adj
                    .entry(source_mod.to_string())
                    .or_default()
                    .insert(target_mod.clone());

                graph.details.push(ModuleDependency {
                    source_file: file.to_path_buf(),
                    source_module: source_mod.to_string(),
                    target_module: target_mod,
                    line_number: line_idx + 1,
                    import_statement: trimmed.to_string(),
                });
            }
        }
    }

    /// Finds all circular dependency cycles using Depth-First Search.
    /// Returns a list of cycles, where each cycle is a sequence of module names `[A, B, C, A]`.
    pub fn find_cycles(&self, modules_to_check: Option<&HashSet<String>>) -> Vec<Vec<String>> {
        let mut cycles = Vec::new();
        let mut visited = HashSet::new();
        let mut rec_stack = Vec::new();

        let target_modules: Vec<&String> = match modules_to_check {
            Some(filter) => self
                .modules
                .iter()
                .filter(|m| filter.contains(*m))
                .collect(),
            None => self.modules.iter().collect(),
        };

        for &module in &target_modules {
            if !visited.contains(module) {
                self.dfs_find_cycles(
                    module,
                    &mut visited,
                    &mut rec_stack,
                    &mut cycles,
                    modules_to_check,
                );
            }
        }

        cycles
    }

    fn dfs_find_cycles(
        &self,
        current: &str,
        visited: &mut HashSet<String>,
        rec_stack: &mut Vec<String>,
        cycles: &mut Vec<Vec<String>>,
        filter: Option<&HashSet<String>>,
    ) {
        visited.insert(current.to_string());
        rec_stack.push(current.to_string());

        let Some(neighbors) = self.adj.get(current) else {
            rec_stack.pop();
            return;
        };

        for neighbor in neighbors {
            let is_disallowed = filter
                .map(|allowed| !allowed.contains(neighbor))
                .unwrap_or(false);
            if is_disallowed {
                continue;
            }

            if let Some(cycle_start_idx) = rec_stack.iter().position(|m| m == neighbor) {
                let mut cycle = rec_stack[cycle_start_idx..].to_vec();
                cycle.push(neighbor.to_string());
                if !Self::cycle_already_recorded(cycles, &cycle) {
                    cycles.push(cycle);
                }
            } else if !visited.contains(neighbor) {
                self.dfs_find_cycles(neighbor, visited, rec_stack, cycles, filter);
            }
        }

        rec_stack.pop();
    }

    pub(crate) fn cycle_already_recorded(cycles: &[Vec<String>], new_cycle: &[String]) -> bool {
        let new_set: HashSet<_> = new_cycle.iter().collect();
        cycles.iter().any(|existing| {
            let existing_set: HashSet<_> = existing.iter().collect();
            existing_set == new_set && existing.len() == new_cycle.len()
        })
    }

    fn collect_rs_files(dir: &Path, list: &mut Vec<PathBuf>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    Self::collect_rs_files(&path, list);
                } else if path.extension().and_then(|s| s.to_str()) == Some("rs") {
                    list.push(path);
                }
            }
        }
    }

    pub(crate) fn extract_top_level_module(src_root: &Path, file_path: &Path) -> Option<String> {
        let rel_path = file_path.strip_prefix(src_root).ok()?;
        let first_component = rel_path.components().next()?;
        let mod_name = first_component.as_os_str().to_str()?;

        if mod_name.ends_with(".rs") {
            // Root files like lib.rs or main.rs
            None
        } else {
            Some(mod_name.to_string())
        }
    }

    pub(crate) fn extract_target_module(line: &str) -> Option<String> {
        // Examples:
        // "use crate::engine::Engine;" -> "engine"
        // "use crate::types::{Project, Task};" -> "types"
        // "use crate::AppState;" -> "app" (handled via root type mapping or skipped)
        let after_prefix = if let Some(stripped) = line.strip_prefix("use crate::") {
            stripped
        } else {
            line.strip_prefix("crate::")?
        };

        let target_part = after_prefix.split(&[':', ';', '{', ' '][..]).next()?.trim();

        if target_part.is_empty() {
            None
        } else if target_part == "AppState" {
            Some("app".to_string())
        } else {
            Some(target_part.to_string())
        }
    }
}
