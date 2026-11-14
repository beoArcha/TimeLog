use super::constants::{
    CSV_BOM_FLAG, CSV_DELIMITER_FLAG, CSV_DELIMITER_TAB_NAME, ERR_CSV_DELIMITER_INVALID,
    ERR_CSV_OPTION_NEEDS_CSV,
};
use super::registry::format_name;
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::ExportFormat;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CsvDelimiter {
    #[default]
    Comma,
    Semicolon,
    Tab,
}

impl CsvDelimiter {
    pub fn as_char(self) -> char {
        match self {
            Self::Comma => ',',
            Self::Semicolon => ';',
            Self::Tab => '\t',
        }
    }

    /// A tab is awkward to type, so `tab` and the two-character `\t` are accepted next to the
    /// literal tab character.
    pub fn parse(raw: &str) -> Result<Self, CliError> {
        match raw {
            "," => Ok(Self::Comma),
            ";" => Ok(Self::Semicolon),
            "\t" | "\\t" => Ok(Self::Tab),
            other if other.eq_ignore_ascii_case(CSV_DELIMITER_TAB_NAME) => Ok(Self::Tab),
            other => Err(invalid_argument(
                ERR_CSV_DELIMITER_INVALID.replacen("{}", other, 1),
                CSV_DELIMITER_FLAG,
                other,
            )),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct CsvOptions {
    pub delimiter: CsvDelimiter,
    pub bom: bool,
}

/// Format-specific writer settings, resolved from the CLI flags before the Engine runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ExportOptions {
    pub csv: CsvOptions,
}

impl ExportOptions {
    /// Flags that only one format understands are rejected for every other format instead of
    /// being ignored, so a typo in `--format` cannot silently drop `--bom`.
    pub fn resolve(
        format: ExportFormat,
        csv_delimiter: Option<&str>,
        csv_bom: bool,
    ) -> Result<Self, CliError> {
        if format != ExportFormat::Csv {
            ensure_no_csv_flags(format, csv_delimiter, csv_bom)?;
            return Ok(Self::default());
        }
        let delimiter = csv_delimiter
            .map(CsvDelimiter::parse)
            .transpose()?
            .unwrap_or_default();
        Ok(Self {
            csv: CsvOptions {
                delimiter,
                bom: csv_bom,
            },
        })
    }
}

fn ensure_no_csv_flags(
    format: ExportFormat,
    csv_delimiter: Option<&str>,
    csv_bom: bool,
) -> Result<(), CliError> {
    let name = format_name(format);
    let message = |flag: &str| {
        ERR_CSV_OPTION_NEEDS_CSV
            .replacen("{}", flag, 1)
            .replacen("{}", &name, 1)
    };
    if let Some(raw) = csv_delimiter {
        return Err(invalid_argument(
            message(CSV_DELIMITER_FLAG),
            CSV_DELIMITER_FLAG,
            raw,
        ));
    }
    if csv_bom {
        return Err(invalid_argument(message(CSV_BOM_FLAG), CSV_BOM_FLAG, &name));
    }
    Ok(())
}

fn invalid_argument(message: String, field: &str, value: &str) -> CliError {
    CliError::Syntax(CliSyntaxError::InvalidArgument {
        message,
        field: Some(field.to_string()),
        value: Some(value.to_string()),
    })
}
