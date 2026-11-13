pub mod clap_mapping;
pub mod cli_error;
pub mod codes;
pub mod envelope;
pub mod exit_codes;

pub use clap_mapping::map_clap_error;
pub use cli_error::{BusinessRuleViolation, CliError, CliSyntaxError, SinkError};
pub use codes::CliErrorCode;
pub use envelope::{
    CliErrorCandidate, CliErrorDetails, CliErrorEnvelope, LocalizedUserMessage,
};
pub use exit_codes::*;
