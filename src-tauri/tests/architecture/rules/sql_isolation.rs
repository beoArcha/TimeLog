use super::helpers::{collect_rust_files, is_comment_line, resolve_module_name};
use std::fs;
use std::path::Path;

const SQL_KEYWORDS: &[&str] = &[
    "SELECT ",
    "INSERT INTO ",
    "UPDATE ",
    "DELETE FROM ",
    "CREATE TABLE IF NOT EXISTS ",
];

/// Verifies that raw SQL queries (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE)
/// do not appear outside the dedicated `repositories` module.
pub fn assert_sql_isolated_to_repositories(src_dir: &Path, allowed_module: &str) {
    let mut violations = Vec::new();
    let mut files = Vec::new();
    collect_rust_files(src_dir, &mut files);

    for file in files {
        let Some(mod_name) = resolve_module_name(src_dir, &file) else {
            continue;
        };

        if mod_name != allowed_module {
            violations.extend(find_sql_violations_in_file(
                &file,
                &mod_name,
                allowed_module,
            ));
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

fn find_sql_violations_in_file(file: &Path, _mod_name: &str, allowed_module: &str) -> Vec<String> {
    let Ok(content) = fs::read_to_string(file) else {
        return Vec::new();
    };

    let mut violations = Vec::new();
    for (idx, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if is_comment_line(trimmed) {
            continue;
        }

        if let Some(keyword) = extract_raw_sql_keyword(line, trimmed) {
            violations.push(format!(
                "  - [{}:{}] Raw SQL keyword '{}' found outside '{}': '{}'",
                file.display(),
                idx + 1,
                keyword.trim(),
                allowed_module,
                trimmed
            ));
        }
    }
    violations
}

pub(crate) fn extract_raw_sql_keyword(line: &str, trimmed: &str) -> Option<&'static str> {
    let has_quotes = trimmed.contains('"') || trimmed.contains('`');
    if !has_quotes {
        return None;
    }

    let upper = line.to_uppercase();
    SQL_KEYWORDS.iter().copied().find(|kw| upper.contains(kw))
}
