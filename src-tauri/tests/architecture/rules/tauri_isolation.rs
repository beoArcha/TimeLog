use super::helpers::{collect_rust_files, is_comment_line, resolve_module_name};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

const FORBIDDEN_TAURI_PATTERNS: &[&str] = &[
    "use tauri::",
    "tauri::AppHandle",
    "tauri::Manager",
    "tauri::WebviewWindow",
    "tauri::State",
    "#[tauri::command]",
];

/// Verifies that none of the target modules import or reference Tauri GUI components.
pub fn assert_zero_tauri_coupling(src_dir: &Path, headless_modules: &[&str]) {
    let target_set: HashSet<&str> = headless_modules.iter().copied().collect();
    let mut violations = Vec::new();
    let mut files = Vec::new();
    collect_rust_files(src_dir, &mut files);

    for file in files {
        let Some(mod_name) = resolve_module_name(src_dir, &file) else {
            continue;
        };

        if target_set.contains(mod_name.as_str()) {
            violations.extend(find_tauri_violations_in_file(&file, &mod_name));
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

fn find_tauri_violations_in_file(file: &Path, mod_name: &str) -> Vec<String> {
    let Ok(content) = fs::read_to_string(file) else {
        return Vec::new();
    };

    let mut file_violations = Vec::new();
    for (idx, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if is_comment_line(trimmed) {
            continue;
        }

        if is_forbidden_tauri_statement(trimmed) {
            file_violations.push(format!(
                "  - [{}:{}] Module '{}' illegally imports Tauri: '{}'",
                file.display(),
                idx + 1,
                mod_name,
                trimmed
            ));
        }
    }
    file_violations
}

pub(crate) fn is_forbidden_tauri_statement(trimmed: &str) -> bool {
    FORBIDDEN_TAURI_PATTERNS
        .iter()
        .any(|pattern| trimmed.contains(pattern))
}
