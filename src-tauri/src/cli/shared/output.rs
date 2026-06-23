use crate::cli::shared::constants::{OUT_STARTED, OUT_STATUS_ACTIVE, OUT_STATUS_COUNT, OUT_STOPPED, OUT_SUCCESS};
use std::fmt;

pub enum CliOutput {
    Started(String),
    Stopped,
    Status(Vec<String>),
    Success(String),
    Json(String),
}

impl fmt::Display for CliOutput {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliOutput::Started(task_id) => write!(f, "{}", OUT_STARTED.replace("{}", task_id)),
            CliOutput::Stopped => write!(f, "{}", OUT_STOPPED),
            CliOutput::Status(active) => {
                writeln!(f, "{}", OUT_STATUS_COUNT.replace("{}", &active.len().to_string()))?;
                for id in active {
                    writeln!(f, "{}", OUT_STATUS_ACTIVE.replace("{}", id))?;
                }
                Ok(())
            }
            CliOutput::Success(msg) => write!(f, "{}", OUT_SUCCESS.replace("{}", msg)),
            CliOutput::Json(data) => write!(f, "{}", data),
        }
    }
}


