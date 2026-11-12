use super::helpers::{collect_rust_files, is_comment_line};
use std::fs;
use std::path::Path;

pub const FORBIDDEN_EXPORTER_PATTERNS: &[&str] = &[
    "crate::persistence",
    "crate::repositories",
    "crate::engine",
    "rusqlite",
    "crate::cli::handlers",
];

/// Verifies that all CLI exporter modules remain pure projections and have zero coupling
/// to storage, repositories, engine, rusqlite, or CLI handlers.
pub fn assert_exporter_isolation(src_dir: &Path) {
    let exporters_dir = src_dir.join("cli").join("exporters");
    let mut files = Vec::new();
    collect_rust_files(&exporters_dir, &mut files);

    if files.is_empty() {
        panic!(
            "Architecture Violation: Expected to find and scan Rust exporter files in '{}', but 0 .rs files were found.",
            exporters_dir.display()
        );
    }

    let mut violations = Vec::new();
    for file in files {
        violations.extend(find_exporter_violations_in_file(&file));
    }

    if !violations.is_empty() {
        panic!(
            "Architecture Violation: Exporter modules must be pure projections of report data. Found {} violation(s):\n{}",
            violations.len(),
            violations.join("\n")
        );
    }
}

pub fn find_exporter_violations_in_file(file: &Path) -> Vec<String> {
    match fs::read_to_string(file) {
        Ok(content) => find_exporter_violations_in_source(&content, file),
        Err(err) => vec![format!(
            "  - [{}] could not be read: {}",
            file.display(),
            err
        )],
    }
}

pub fn find_exporter_violations_in_source(content: &str, file: &Path) -> Vec<String> {
    let mut violations = Vec::new();
    let lines: Vec<&str> = content.lines().collect();
    let mut idx = 0;

    while idx < lines.len() {
        let line = lines[idx];
        let line_num = idx + 1;
        idx += 1;

        let trimmed = line.trim();
        if is_comment_line(trimmed) {
            continue;
        }

        let code_part = match trimmed.split_once("//") {
            Some((code, _)) => code.trim(),
            None => trimmed,
        };

        if code_part.is_empty() {
            continue;
        }

        if code_part.contains("use crate::{") || code_part.contains("use crate:: {") {
            let (stmt, next_idx) = collect_grouped_use_statement(code_part, &lines, idx);
            idx = next_idx;
            if let Some(forbidden) = detect_forbidden_in_grouped_statement(&stmt) {
                violations.push(format!(
                    "  - [{}:{}] Exporter file '{}' illegally references forbidden import '{}' in: '{}'",
                    file.display(),
                    line_num,
                    file.display(),
                    forbidden,
                    stmt.trim()
                ));
            }
            continue;
        }

        if let Some(forbidden) = detect_forbidden_exporter_import(code_part) {
            violations.push(format!(
                "  - [{}:{}] Exporter file '{}' illegally references forbidden import '{}' in: '{}'",
                file.display(),
                line_num,
                file.display(),
                forbidden,
                trimmed
            ));
        }
    }

    violations
}

fn collect_grouped_use_statement(
    first_line: &str,
    lines: &[&str],
    mut next_idx: usize,
) -> (String, usize) {
    let mut stmt = first_line.to_string();

    while !stmt.contains(';') && next_idx < lines.len() {
        let next_line = lines[next_idx];
        next_idx += 1;

        let trimmed_next = next_line.trim();
        if is_comment_line(trimmed_next) {
            continue;
        }

        let code_only = match trimmed_next.split_once("//") {
            Some((code, _)) => code.trim(),
            None => trimmed_next,
        };

        if !code_only.is_empty() {
            stmt.push(' ');
            stmt.push_str(code_only);
        }
    }

    (stmt, next_idx)
}

pub fn detect_forbidden_exporter_import(code: &str) -> Option<&'static str> {
    if code.contains("use crate::{") || code.contains("use crate:: {") {
        if let Some(forbidden) = detect_forbidden_in_grouped_statement(code) {
            return Some(forbidden);
        }
    }

    FORBIDDEN_EXPORTER_PATTERNS
        .iter()
        .copied()
        .find(|&pattern| contains_word_or_path(code, pattern))
}

pub fn detect_forbidden_in_grouped_statement(stmt: &str) -> Option<&'static str> {
    let open_idx = stmt.find('{')?;
    let close_idx = stmt.rfind('}')?;
    if open_idx >= close_idx {
        return None;
    }

    let inner = &stmt[open_idx + 1..close_idx];
    let items = split_grouped_items(inner);

    for item in items {
        if let Some(forbidden) = check_grouped_item(&item) {
            return Some(forbidden);
        }
    }

    None
}

fn check_grouped_item(item: &str) -> Option<&'static str> {
    let trimmed = item.trim();

    if matches_module_segment(trimmed, "persistence") {
        return Some("crate::persistence");
    }
    if matches_module_segment(trimmed, "repositories") {
        return Some("crate::repositories");
    }
    if matches_module_segment(trimmed, "engine") {
        return Some("crate::engine");
    }
    if matches_module_segment(trimmed, "cli::handlers") {
        return Some("crate::cli::handlers");
    }
    if (trimmed.starts_with("cli::{") || trimmed.starts_with("cli:: {"))
        && contains_word_or_path(trimmed, "handlers")
    {
        return Some("crate::cli::handlers");
    }

    None
}

pub fn matches_module_segment(item: &str, target: &str) -> bool {
    let trimmed = item.trim();
    if !trimmed.starts_with(target) {
        return false;
    }

    let remainder = &trimmed[target.len()..];
    remainder.is_empty() || remainder.starts_with(|c: char| !c.is_alphanumeric() && c != '_')
}

fn split_grouped_items(inside_braces: &str) -> Vec<String> {
    let mut items = Vec::new();
    let mut current = String::new();
    let mut nested_depth = 0;

    for ch in inside_braces.chars() {
        if ch == '{' {
            nested_depth += 1;
            current.push(ch);
        } else if ch == '}' {
            if nested_depth > 0 {
                nested_depth -= 1;
            }
            current.push(ch);
        } else if ch == ',' && nested_depth == 0 {
            let trimmed = current.trim();
            if !trimmed.is_empty() {
                items.push(trimmed.to_string());
            }
            current.clear();
        } else {
            current.push(ch);
        }
    }

    let trimmed = current.trim();
    if !trimmed.is_empty() {
        items.push(trimmed.to_string());
    }

    items
}

fn is_ident_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

pub fn contains_word_or_path(code: &str, pattern: &str) -> bool {
    let mut start = 0;
    while let Some(pos) = code[start..].find(pattern) {
        let abs_pos = start + pos;
        let before_ok = check_char_boundary_before(code, abs_pos);
        let after_ok = check_char_boundary_after(code, abs_pos + pattern.len());

        if before_ok && after_ok {
            return true;
        }

        start = abs_pos + pattern.len();
    }
    false
}

fn check_char_boundary_before(code: &str, abs_pos: usize) -> bool {
    code[..abs_pos]
        .chars()
        .next_back()
        .is_none_or(|prev| !is_ident_char(prev))
}

fn check_char_boundary_after(code: &str, after_pos: usize) -> bool {
    code.get(after_pos..)
        .and_then(|rest| rest.chars().next())
        .is_none_or(|next| !is_ident_char(next))
}
