use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::handlers::constants::{
    ERR_CONFIG_INVALID_MACHINE_LOCALE, SUPPORTED_CLI_MACHINE_LOCALES,
};

pub fn validate_id(id: &str) -> Result<String, CliError> {
    if id.trim().is_empty() {
        Err(CliError::Syntax(CliSyntaxError::EmptyId))
    } else {
        Ok(id.trim().to_string())
    }
}

pub fn validate_cli_machine_locale(locale: &str) -> Result<&'static str, CliError> {
    let trimmed = locale.trim().to_ascii_lowercase();
    for &supported in SUPPORTED_CLI_MACHINE_LOCALES {
        if trimmed == supported {
            return Ok(supported);
        }
    }
    Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
        ERR_CONFIG_INVALID_MACHINE_LOCALE.replacen("{}", locale.trim(), 1),
    )))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_cli_machine_locale_supported_and_normalization() {
        assert_eq!(validate_cli_machine_locale("de").unwrap(), "de");
        assert_eq!(validate_cli_machine_locale("DE").unwrap(), "de");
        assert_eq!(validate_cli_machine_locale(" De ").unwrap(), "de");
        assert_eq!(validate_cli_machine_locale("pt-br").unwrap(), "pt-br");
        assert_eq!(validate_cli_machine_locale("PT-BR").unwrap(), "pt-br");
    }

    #[test]
    fn test_validate_cli_machine_locale_rejected_values() {
        assert!(validate_cli_machine_locale("system").is_err());
        assert!(validate_cli_machine_locale("custom").is_err());
        assert!(validate_cli_machine_locale("").is_err());
        assert!(validate_cli_machine_locale("   ").is_err());
        assert!(validate_cli_machine_locale("unsupported_string").is_err());
        assert!(validate_cli_machine_locale("klingon").is_err());
    }
}

