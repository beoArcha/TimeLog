use super::helpers::{collect_rust_files, is_comment_line, resolve_relative_path};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

const FORBIDDEN_ERROR_PATTERNS: &[&str] = &[
    ", String>",
    ", &str>",
    ", Box<dyn Error>",
    ", Box<dyn std::error::Error>",
    ", anyhow::Error>",
    ", ()>",
];

/// Verifies that all functions and type definitions across native modules return
/// strongly-typed custom domain errors, strictly forbidding generic standard errors:
/// - `Result<_, String>` or `Result<_, &str>` (Stringly-typed anti-pattern)
/// - `Result<_, Box<dyn Error>>` or `Result<_, Box<dyn std::error::Error>>` (Generic dynamic boxed error)
/// - `Result<_, anyhow::Error>` (Unstructured error)
/// - `Result<_, ()>` (Empty unit error)
pub fn assert_zero_generic_errors(src_dir: &Path, allowlist: &[&str]) {
    let allow_set: HashSet<&str> = allowlist.iter().copied().collect();
    let mut violations = Vec::new();
    let mut files = Vec::new();
    collect_rust_files(src_dir, &mut files);

    for file in files {
        let rel_path = resolve_relative_path(src_dir, &file);
        if allow_set.contains(rel_path.as_str()) {
            continue;
        }

        violations.extend(find_generic_error_violations_in_file(&file));
    }

    if !violations.is_empty() {
        panic!(
            "Architecture Violation: Native modules must NEVER return generic standard errors (String, &str, Box<dyn Error>, anyhow, ()). All functions must use custom domain errors.\nFound {} violation(s):\n{}",
            violations.len(),
            violations.join("\n")
        );
    }
}

fn find_generic_error_violations_in_file(file: &Path) -> Vec<String> {
    let Ok(content) = fs::read_to_string(file) else {
        return Vec::new();
    };

    let mut violations = Vec::new();
    for (idx, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if is_comment_line(trimmed) {
            continue;
        }

        if let Some(pattern) = detect_forbidden_error_signature(trimmed) {
            violations.push(format!(
                "  - [{}:{}] Forbidden generic error pattern '{}' in: '{}'",
                file.display(),
                idx + 1,
                pattern.trim_start_matches(", ").trim_end_matches('>'),
                trimmed
            ));
        }
    }
    violations
}

pub(crate) fn detect_forbidden_error_signature(trimmed: &str) -> Option<&'static str> {
    let is_signature = trimmed.contains("-> Result<")
        || trimmed.contains("-> std::result::Result<")
        || trimmed.contains("type Result<");

    if !is_signature {
        return None;
    }

    FORBIDDEN_ERROR_PATTERNS
        .iter()
        .copied()
        .find(|pattern| trimmed.contains(pattern))
}
