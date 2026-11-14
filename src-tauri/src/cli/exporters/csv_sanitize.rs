//! CSV Exporter Module with CSV Formula Injection (CWE-1236) Protection.
//!
//! # Formula Injection Neutralization Policy
//!
//! Spreadsheet software (such as Microsoft Excel, LibreOffice Calc, and Google Sheets)
//! automatically interprets cell values starting with formula trigger characters as formulas
//! or dynamic data exchange (DDE) commands:
//! - `=` (standard formula execution)
//! - `+` (formula addition / command prefix)
//! - `-` (formula subtraction / command prefix)
//! - `@` (function call / implicit intersection operator)
//!
//! Furthermore, spreadsheet engines strip or ignore leading whitespace (` `, `\t`) and
//! ASCII control characters (`\r`, `\n`, etc.) before evaluating formula triggers.
//!
//! ## Neutralization Strategy:
//! 1. Locate the first meaningful character (skipping leading whitespace and ASCII control characters).
//! 2. If the character is one of the formula triggers (`=`, `+`, `-`, `@`):
//!    - Check if the entire cell content represents a valid finite number (e.g. `123`, `-123`,
//!      `+123`, `-123.45`, `0.5`). Valid numbers are completely safe in spreadsheets and are
//!      preserved as-is without modification.
//!    - Otherwise, prefix the cell with an apostrophe (`'`). In spreadsheet applications,
//!      a leading apostrophe acts as a text prefix marker, instructing the spreadsheet
//!      to treat the entire cell content strictly as literal text without evaluating formulas.
//! 3. Standard RFC 4180 CSV escaping (double-quote wrapping and doubling internal quotes `""`)
//!    is subsequently applied, only to cells that contain the delimiter, a quote or a line break.

/// Characters that trigger formula execution in spreadsheet software.
const FORMULA_TRIGGERS: [char; 4] = ['=', '+', '-', '@'];

/// Checks whether a character is whitespace or an ASCII/Unicode control character.
pub fn is_whitespace_or_control(c: char) -> bool {
    c.is_whitespace() || c.is_control()
}

/// Checks whether a string represents a valid numeric literal (integer or float).
///
/// Legitimate numbers (e.g. "123", "-123", "+123", "-123.45", "0.5") are safe
/// in spreadsheets and must not be neutralized with an apostrophe.
pub fn is_numeric_value(s: &str) -> bool {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return false;
    }

    let Ok(num) = trimmed.parse::<f64>() else {
        return false;
    };

    // Disallow NaN and Infinities which are not safe spreadsheet numbers
    let lower = trimmed.to_ascii_lowercase();
    num.is_finite() && !lower.contains("nan") && !lower.contains("inf")
}

/// Neutralizes CSV formula injection (CWE-1236) by prefixing potentially dangerous
/// cell values with a single quote (`'`).
///
/// If a value's first non-whitespace, non-control character is `=`, `+`, `-`, or `@`,
/// and the value does not parse as a legitimate number, an apostrophe (`'`) is prepended.
pub fn sanitize_csv_formula(val: &str) -> String {
    let Some(c) = val.chars().find(|c| !is_whitespace_or_control(*c)) else {
        return val.to_string();
    };

    if !FORMULA_TRIGGERS.contains(&c) || is_numeric_value(val) {
        return val.to_string();
    }

    format!("'{val}")
}
