use std::fs;
use std::path::{Path, PathBuf};

/// Recursively discovers all `.rs` source files within a directory tree.
pub fn collect_rust_files(dir: &Path, list: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_rust_files(&path, list);
        } else if path.extension().and_then(|s| s.to_str()) == Some("rs") {
            list.push(path);
        }
    }
}

/// Resolves the top-level module name relative to the source root (e.g. `src/cli/` -> `"cli"`).
pub fn resolve_module_name(src_root: &Path, file_path: &Path) -> Option<String> {
    let rel = file_path.strip_prefix(src_root).ok()?;
    let first = rel.components().next()?.as_os_str().to_str()?;
    if first.ends_with(".rs") {
        None
    } else {
        Some(first.to_string())
    }
}

/// Normalizes a path relative to the root directory using forward slashes.
pub fn resolve_relative_path(root_dir: &Path, file_path: &Path) -> String {
    file_path
        .strip_prefix(root_dir)
        .ok()
        .and_then(|p| p.to_str())
        .unwrap_or("")
        .replace('\\', "/")
}

/// Checks if a trimmed line is an informational comment or documentation line.
pub fn is_comment_line(trimmed: &str) -> bool {
    trimmed.starts_with("//") || trimmed.starts_with("/*") || trimmed.starts_with('*')
}
