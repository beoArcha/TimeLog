use crate::architecture::dependency_graph::ModuleGraph;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

/// Fluent assertion runner for Rust architectural rules.
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
        let filter: HashSet<String> = modules.iter().map(|s| s.to_string()).collect();
        let cycles = self.graph.find_cycles(Some(&filter));

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

    /// Verifies that the specified module does not depend on any forbidden modules.
    pub fn assert_does_not_depend_on(&self, source_module: &str, forbidden_targets: &[&str]) {
        let forbidden_set: HashSet<&str> = forbidden_targets.iter().copied().collect();

        let mut violations = Vec::new();
        for dep in &self.graph.details {
            if dep.source_module == source_module
                && forbidden_set.contains(dep.target_module.as_str())
            {
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

    /// Verifies that none of the target modules import or reference Tauri.
    pub fn assert_zero_tauri_coupling(&self, headless_modules: &[&str]) {
        let target_set: HashSet<&str> = headless_modules.iter().copied().collect();
        let mut violations = Vec::new();

        let mut files = Vec::new();
        Self::collect_files(&self.src_dir, &mut files);

        for file in files {
            if let Some(mod_name) = Self::get_module_name(&self.src_dir, &file) {
                if target_set.contains(mod_name.as_str()) {
                    if let Ok(content) = fs::read_to_string(&file) {
                        for (idx, line) in content.lines().enumerate() {
                            let trimmed = line.trim();
                            // Skip comments
                            if trimmed.starts_with("//")
                                || trimmed.starts_with("/*")
                                || trimmed.starts_with('*')
                            {
                                continue;
                            }
                            if trimmed.contains("use tauri::")
                                || trimmed.contains("tauri::AppHandle")
                                || trimmed.contains("tauri::Manager")
                                || trimmed.contains("tauri::WebviewWindow")
                                || trimmed.contains("tauri::State")
                                || trimmed.contains("#[tauri::command]")
                            {
                                violations.push(format!(
                                    "  - [{}:{}] Module '{}' illegally imports Tauri: '{}'",
                                    file.display(),
                                    idx + 1,
                                    mod_name,
                                    trimmed
                                ));
                            }
                        }
                    }
                }
            }
        }

        if !violations.is_empty() {
            panic!(
                "Architecture Violation: Headless modules {:?} MUST have zero Tauri GUI coupling. Found {} violations:\n{}",
                headless_modules,
                violations.len(),
                violations.join("\n")
            );
        }
    }

    /// Verifies that raw SQL queries (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE)
    /// do not appear outside the dedicated `repositories` module.
    pub fn assert_sql_isolated_to_repositories(&self, allowed_module: &str) {
        let mut violations = Vec::new();
        let mut files = Vec::new();
        Self::collect_files(&self.src_dir, &mut files);

        let sql_keywords = [
            "SELECT ",
            "INSERT INTO ",
            "UPDATE ",
            "DELETE FROM ",
            "CREATE TABLE IF NOT EXISTS ",
        ];

        for file in files {
            if let Some(mod_name) = Self::get_module_name(&self.src_dir, &file) {
                if mod_name != allowed_module {
                    if let Ok(content) = fs::read_to_string(&file) {
                        for (idx, line) in content.lines().enumerate() {
                            let upper = line.to_uppercase();
                            let trimmed = line.trim();
                            // Skip comments
                            if trimmed.starts_with("//")
                                || trimmed.starts_with("/*")
                                || trimmed.starts_with('*')
                            {
                                continue;
                            }

                            for kw in &sql_keywords {
                                if upper.contains(kw)
                                    && (trimmed.contains('"') || trimmed.contains('`'))
                                {
                                    violations.push(format!(
                                        "  - [{}:{}] Raw SQL keyword '{}' found outside '{}': '{}'",
                                        file.display(),
                                        idx + 1,
                                        kw.trim(),
                                        allowed_module,
                                        trimmed
                                    ));
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        if !violations.is_empty() {
            panic!(
                "Architecture Violation: Raw SQL queries must remain strictly encapsulated inside '{}'. Found {} violations:\n{}",
                allowed_module,
                violations.len(),
                violations.join("\n")
            );
        }
    }

    fn collect_files(dir: &Path, list: &mut Vec<PathBuf>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    Self::collect_files(&path, list);
                } else if path.extension().and_then(|s| s.to_str()) == Some("rs") {
                    list.push(path);
                }
            }
        }
    }

    fn get_module_name(src_root: &Path, file_path: &Path) -> Option<String> {
        let rel = file_path.strip_prefix(src_root).ok()?;
        let first = rel.components().next()?.as_os_str().to_str()?;
        if first.ends_with(".rs") {
            None
        } else {
            Some(first.to_string())
        }
    }
}
