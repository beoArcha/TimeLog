use super::helpers::{collect_rust_files, resolve_relative_path};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

/// Maximum allowable nested `if` statement depth across the entire native Rust codebase.
/// Depth 1: `if a {`
/// Depth 2: `  if b {`
/// Depth 3: `    if c {` -> Architectural violation!
pub const MAX_ALLOWED_IF_DEPTH: usize = 2;

/// Architectural Rule: Rule of 3 Nested Ifs.
/// Enforces cyclomatic simplicity and prevents deep arrow anti-patterns
/// by rejecting if statements nested 3 or more levels deep.
pub fn assert_max_nested_ifs(src_dir: &Path, max_allowed_depth: usize, allowlist: &[&str]) {
    let allow_set: HashSet<&str> = allowlist.iter().copied().collect();
    let mut violations = Vec::new();
    let mut files = Vec::new();
    collect_rust_files(src_dir, &mut files);

    for file in files {
        let rel_path = resolve_relative_path(src_dir, &file);
        if allow_set.contains(rel_path.as_str()) {
            continue;
        }

        if let Ok(content) = fs::read_to_string(&file) {
            let file_violations = scan_nested_ifs(&content, &rel_path, max_allowed_depth);
            violations.extend(file_violations);
        }
    }

    if !violations.is_empty() {
        panic!(
            "Architecture Violation: Found {} occurrence(s) of if statements nested {} or more levels deep (Rule of 3 Ifs: max allowed depth is {}):\n{}",
            violations.len(),
            max_allowed_depth + 1,
            max_allowed_depth,
            violations.join("\n")
        );
    }
}

/// Scans Rust source code for `if` statements exceeding the maximum allowed nesting depth.
pub fn scan_nested_ifs(content: &str, file_label: &str, max_allowed_depth: usize) -> Vec<String> {
    let cleaned = strip_comments_and_strings(content);
    let chars: Vec<char> = cleaned.chars().collect();
    let raw_lines: Vec<&str> = content.lines().collect();

    let mut scanner = ControlFlowScanner::new(&chars, &raw_lines, file_label, max_allowed_depth);
    scanner.scan()
}

struct ControlFlowScanner<'a> {
    chars: &'a [char],
    raw_lines: &'a [&'a str],
    file_label: &'a str,
    max_allowed_depth: usize,
    scope_stack: Vec<usize>,
    last_keyword: Option<&'static str>,
    pending_if_depth: Option<usize>,
    line_number: usize,
    index: usize,
    violations: Vec<String>,
}

impl<'a> ControlFlowScanner<'a> {
    fn new(
        chars: &'a [char],
        raw_lines: &'a [&'a str],
        file_label: &'a str,
        max_allowed_depth: usize,
    ) -> Self {
        Self {
            chars,
            raw_lines,
            file_label,
            max_allowed_depth,
            scope_stack: vec![0],
            last_keyword: None,
            pending_if_depth: None,
            line_number: 1,
            index: 0,
            violations: Vec::new(),
        }
    }

    fn scan(&mut self) -> Vec<String> {
        let n = self.chars.len();
        while self.index < n {
            let ch = self.chars[self.index];

            if ch == '\n' {
                self.line_number += 1;
                self.index += 1;
                continue;
            }

            if ch == '{' {
                self.handle_block_open();
                continue;
            }

            if ch == '}' {
                self.handle_block_close();
                continue;
            }

            if self.try_consume_keyword("else", 4) {
                self.last_keyword = Some("else");
                continue;
            }

            if self.try_consume_keyword("if", 2) {
                self.handle_if_statement();
                continue;
            }

            self.index += 1;
        }

        std::mem::take(&mut self.violations)
    }

    fn handle_block_open(&mut self) {
        let current_depth = *self.scope_stack.last().unwrap_or(&0);
        let depth = self.pending_if_depth.take().unwrap_or(current_depth);
        self.scope_stack.push(depth);
        self.last_keyword = None;
        self.index += 1;
    }

    fn handle_block_close(&mut self) {
        if self.scope_stack.len() > 1 {
            self.scope_stack.pop();
        }
        self.last_keyword = None;
        self.pending_if_depth = None;
        self.index += 1;
    }

    fn handle_if_statement(&mut self) {
        let current_depth = *self.scope_stack.last().unwrap_or(&0);
        let if_depth = if self.last_keyword == Some("else") {
            current_depth
        } else {
            current_depth + 1
        };

        self.pending_if_depth = Some(if_depth);
        self.last_keyword = Some("if");

        if if_depth > self.max_allowed_depth {
            let snippet = self
                .raw_lines
                .get(self.line_number - 1)
                .unwrap_or(&"")
                .trim();
            self.violations.push(format!(
                "  - [{}:{}] If statement nested at depth {} exceeds maximum allowed depth of {}: '{}'",
                self.file_label,
                self.line_number,
                if_depth,
                self.max_allowed_depth,
                snippet
            ));
        }
    }

    fn try_consume_keyword(&mut self, keyword: &'static str, len: usize) -> bool {
        let n = self.chars.len();
        if self.index + len > n {
            return false;
        }

        let prev_char = if self.index > 0 {
            self.chars[self.index - 1]
        } else {
            ' '
        };
        if is_identifier_char(prev_char) {
            return false;
        }

        let slice = &self.chars[self.index..self.index + len];
        let matches = slice.iter().zip(keyword.chars()).all(|(a, b)| *a == b);
        if !matches {
            return false;
        }

        let next_char = if self.index + len < n {
            self.chars[self.index + len]
        } else {
            ' '
        };
        if is_identifier_char(next_char) {
            return false;
        }

        self.index += len;
        true
    }
}

fn is_identifier_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

pub(crate) fn strip_comments_and_strings(src: &str) -> String {
    let mut result = String::with_capacity(src.len());
    let chars: Vec<char> = src.chars().collect();
    let n = chars.len();
    let mut i = 0;

    let mut in_line_comment = false;
    let mut in_block_comment = 0usize;
    let mut in_string = false;
    let mut in_raw_string = false;
    let mut raw_hash_count = 0usize;
    let mut in_char = false;

    while i < n {
        let ch = chars[i];
        let next = if i + 1 < n { chars[i + 1] } else { '\0' };

        if in_line_comment {
            if ch == '\n' {
                in_line_comment = false;
                result.push('\n');
            } else {
                result.push(' ');
            }
            i += 1;
        } else if in_block_comment > 0 {
            if ch == '/' && next == '*' {
                in_block_comment += 1;
                result.push(' ');
                result.push(' ');
                i += 2;
            } else if ch == '*' && next == '/' {
                in_block_comment -= 1;
                result.push(' ');
                result.push(' ');
                i += 2;
            } else if ch == '\n' {
                result.push('\n');
                i += 1;
            } else {
                result.push(' ');
                i += 1;
            }
        } else if in_raw_string {
            if ch == '"' && is_raw_string_terminated(&chars, i, raw_hash_count) {
                in_raw_string = false;
                for _ in 0..=raw_hash_count {
                    result.push(' ');
                }
                i += 1 + raw_hash_count;
                continue;
            }
            if ch == '\n' {
                result.push('\n');
            } else {
                result.push(' ');
            }
            i += 1;
        } else if in_string {
            if ch == '\\' {
                result.push(' ');
                result.push(' ');
                i += 2;
            } else if ch == '"' {
                in_string = false;
                result.push(' ');
                i += 1;
            } else if ch == '\n' {
                result.push('\n');
                i += 1;
            } else {
                result.push(' ');
                i += 1;
            }
        } else if in_char {
            if ch == '\\' {
                result.push(' ');
                result.push(' ');
                i += 2;
            } else if ch == '\'' {
                in_char = false;
                result.push(' ');
                i += 1;
            } else {
                result.push(' ');
                i += 1;
            }
        } else if ch == '/' && next == '/' {
            in_line_comment = true;
            result.push(' ');
            result.push(' ');
            i += 2;
        } else if ch == '/' && next == '*' {
            in_block_comment = 1;
            result.push(' ');
            result.push(' ');
            i += 2;
        } else if ch == 'r' && (next == '"' || next == '#') {
            if let Some((hash_count, start_offset)) = detect_raw_string_start(&chars, i) {
                in_raw_string = true;
                raw_hash_count = hash_count;
                for _ in i..start_offset {
                    result.push(' ');
                }
                i = start_offset;
            } else {
                result.push(ch);
                i += 1;
            }
        } else if ch == '"' {
            in_string = true;
            result.push(' ');
            i += 1;
        } else if ch == '\'' {
            if is_char_literal_start(&chars, i) {
                in_char = true;
                result.push(' ');
                i += 1;
            } else {
                result.push(ch);
                i += 1;
            }
        } else {
            result.push(ch);
            i += 1;
        }
    }

    result
}

fn is_raw_string_terminated(chars: &[char], quote_idx: usize, hash_count: usize) -> bool {
    let n = chars.len();
    if quote_idx + hash_count >= n {
        return false;
    }
    for h in 0..hash_count {
        if chars[quote_idx + 1 + h] != '#' {
            return false;
        }
    }
    true
}

fn detect_raw_string_start(chars: &[char], r_idx: usize) -> Option<(usize, usize)> {
    let n = chars.len();
    let mut h = 0;
    let mut pos = r_idx + 1;
    while pos < n && chars[pos] == '#' {
        h += 1;
        pos += 1;
    }
    if pos < n && chars[pos] == '"' {
        Some((h, pos + 1))
    } else {
        None
    }
}

fn is_char_literal_start(chars: &[char], quote_idx: usize) -> bool {
    let n = chars.len();
    let is_regular_char = quote_idx + 2 < n && chars[quote_idx + 2] == '\'';
    let is_escaped_char =
        quote_idx + 3 < n && chars[quote_idx + 1] == '\\' && chars[quote_idx + 3] == '\'';
    is_regular_char || is_escaped_char
}
