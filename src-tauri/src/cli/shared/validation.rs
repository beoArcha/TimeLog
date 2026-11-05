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
        let rejected_cases = [
            "system",
            "custom",
            "",
            "   ",
            "\t",
            "\n",
            "\r\n",
            "język",
            "日本語",
            "русский",
            "français",
            "en_US",
            "en/US",
            "en.US",
            "en\\US",
            "!@#",
            "en_gb",
            "de/DE",
            "unsupported_string",
            "klingon",
        ];

        for &val in &rejected_cases {
            let res = validate_cli_machine_locale(val);
            assert!(
                res.is_err(),
                "Expected validation to reject '{val}', but got Ok"
            );
            if let Err(CliError::Syntax(CliSyntaxError::InvalidArgs(msg))) = res {
                assert!(
                    msg.contains("Invalid machine locale"),
                    "Expected error message for '{val}' to contain 'Invalid machine locale', got: {msg}"
                );
            } else {
                panic!("Expected CliError::Syntax(InvalidArgs) for '{val}'");
            }
        }
    }
}
