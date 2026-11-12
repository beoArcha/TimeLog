use crate::cli::handlers::constants::{
    OUT_STARTED, OUT_STATUS_ACTIVE, OUT_STATUS_COUNT, OUT_STOPPED, OUT_SUCCESS,
};
use std::fmt;

#[derive(Debug, PartialEq, Eq)]
pub enum CliOutput {
    Started(String),
    Stopped,
    Status(Vec<String>),
    Success(String),
    /// Bare entity ID printed by mutations in quiet mode.
    Id(String),
    Json(String),
    Raw(String),
}

impl CliOutput {
    /// Quiet mutations print only the affected entity ID so shell callers can capture it.
    pub fn mutation(is_quiet: bool, entity_id: &str, message: String) -> Self {
        if is_quiet {
            Self::Id(entity_id.to_string())
        } else {
            Self::Success(message)
        }
    }

    /// Quiet lists are bare rows: no header and no status prefix, so the output stays grep- and cut-friendly.
    pub fn list(is_quiet: bool, header: &str, rows: &str) -> Self {
        if is_quiet {
            Self::Raw(rows.trim_end().to_string())
        } else {
            Self::Success(format!("{header}{rows}"))
        }
    }

    /// An empty quiet list prints nothing, because the notice would otherwise be parsed as a row.
    pub fn empty_list(is_quiet: bool, message: &str) -> Self {
        if is_quiet {
            Self::Raw(String::new())
        } else {
            Self::Success(message.to_string())
        }
    }
}

impl fmt::Display for CliOutput {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliOutput::Started(task_id) => write!(f, "{}", OUT_STARTED.replace("{}", task_id)),
            CliOutput::Stopped => write!(f, "{}", OUT_STOPPED),
            CliOutput::Status(active) => {
                writeln!(
                    f,
                    "{}",
                    OUT_STATUS_COUNT.replace("{}", &active.len().to_string())
                )?;
                for id in active {
                    writeln!(f, "{}", OUT_STATUS_ACTIVE.replace("{}", id))?;
                }
                Ok(())
            }
            CliOutput::Success(msg) => write!(f, "{}", OUT_SUCCESS.replace("{}", msg)),
            CliOutput::Id(id) => write!(f, "{}", id),
            CliOutput::Json(data) => write!(f, "{}", data),
            CliOutput::Raw(data) => write!(f, "{}", data),
        }
    }
}
