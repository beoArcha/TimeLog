use super::codes::CliErrorCode;
use crate::cli::shared::constants::{
    FORMAT_ERROR_BANNER, FORMAT_ERROR_REMEDIATION, FORMAT_ERROR_SUGGESTION,
};
use serde::{Deserialize, Serialize};
use std::process::ExitCode;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CliErrorEnvelope {
    pub code: String,
    pub category: String,
    pub exit_code: u8,
    pub timestamp: String,
    pub technical: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<LocalizedUserMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LocalizedUserMessage {
    pub locale: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remediation: Option<String>,
}

impl CliErrorEnvelope {
    pub fn new(
        code: CliErrorCode,
        exit_code: u8,
        technical: String,
        user: Option<LocalizedUserMessage>,
    ) -> Self {
        Self {
            code: code.as_str().to_string(),
            category: code.category().to_string(),
            exit_code,
            timestamp: chrono::Utc::now().to_rfc3339(),
            technical,
            user,
        }
    }

    pub fn to_exit_code(&self) -> ExitCode {
        ExitCode::from(self.exit_code)
    }

    pub fn render_stderr(&self, is_machine: bool) {
        if is_machine {
            let json = serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string());
            eprintln!("{}", json);
        } else {
            let banner = FORMAT_ERROR_BANNER.replacen("{}", &self.code, 1).replacen(
                "{}",
                &self.technical,
                1,
            );
            eprintln!("{}", banner);

            if let Some(ref u) = self.user {
                if let Some(ref s) = u.suggestion {
                    let line = FORMAT_ERROR_SUGGESTION.replacen("{}", s, 1);
                    eprintln!("{}", line);
                }
                if let Some(ref r) = u.remediation {
                    let line = FORMAT_ERROR_REMEDIATION.replacen("{}", r, 1);
                    eprintln!("{}", line);
                }
            }
        }
    }
}
