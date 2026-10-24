use std::process::ExitCode;

use super::codes::CliErrorCode;
use crate::cli::shared::constants::{
    FORMAT_ERROR_BANNER, FORMAT_ERROR_REMEDIATION, FORMAT_ERROR_SUGGESTION,
};
pub use crate::types::cli::{CliErrorEnvelope, LocalizedUserMessage};

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

    pub fn render_to_string(&self, is_machine: bool) -> String {
        if is_machine {
            serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
        } else {
            let mut out = FORMAT_ERROR_BANNER.replacen("{}", &self.code, 1).replacen(
                "{}",
                &self.technical,
                1,
            );
            if let Some(ref u) = self.user {
                if let Some(ref s) = u.suggestion {
                    out.push('\n');
                    out.push_str(&FORMAT_ERROR_SUGGESTION.replacen("{}", s, 1));
                }
                if let Some(ref r) = u.remediation {
                    out.push('\n');
                    out.push_str(&FORMAT_ERROR_REMEDIATION.replacen("{}", r, 1));
                }
            }
            out
        }
    }

    pub fn render_stderr(&self, is_machine: bool) {
        eprintln!("{}", self.render_to_string(is_machine));
    }
}
