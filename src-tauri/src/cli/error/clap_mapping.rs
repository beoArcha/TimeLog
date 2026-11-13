use super::cli_error::CliSyntaxError;
use clap::error::{ContextKind, ContextValue, Error as ClapError, ErrorKind};

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
    if err.kind() == ErrorKind::InvalidSubcommand {
        return CliSyntaxError::UnknownCommand(msg);
    }

    let field = err.get(ContextKind::InvalidArg).map(flag_name);
    let value = err.get(ContextKind::InvalidValue).map(|v| v.to_string());
    if field.is_none() && value.is_none() {
        return CliSyntaxError::InvalidArgs(msg);
    }
    CliSyntaxError::InvalidArgument {
        message: msg,
        field,
        value,
    }
}

// clap renders the offending argument with its value placeholder ("--format <FORMAT>");
// scripts need only the flag itself.
fn flag_name(arg: &ContextValue) -> String {
    let rendered = arg.to_string();
    rendered
        .split_whitespace()
        .next()
        .unwrap_or(&rendered)
        .to_string()
}
