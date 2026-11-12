use super::cli_error::CliSyntaxError;
use clap::error::{Error as ClapError, ErrorKind};

const ANSI_ESC: char = '\x1B';

fn strip_ansi_codes(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();
    while let Some(ch) = chars.next() {
        if ch == ANSI_ESC && chars.peek() == Some(&'[') {
            chars.next();
            for c in chars.by_ref() {
                if ('@'..='~').contains(&c) {
                    break;
                }
            }
            continue;
        }
        out.push(ch);
    }
    out
}

fn extract_first_line_message(raw: &str) -> String {
    let plain = strip_ansi_codes(raw);
    let first_line = plain.lines().next().unwrap_or("").trim();
    let stripped = first_line
        .strip_prefix("error:")
        .map(|s| s.trim_start())
        .unwrap_or(first_line);
    stripped.to_string()
}

pub fn map_clap_error(err: &ClapError) -> CliSyntaxError {
    let msg = extract_first_line_message(&err.to_string());
    match err.kind() {
        ErrorKind::InvalidSubcommand => CliSyntaxError::UnknownCommand(msg),
        _ => CliSyntaxError::InvalidArgs(msg),
    }
}
