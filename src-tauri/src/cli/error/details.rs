use super::cli_error::{CliError, CliSyntaxError};
use super::envelope::{CliErrorCandidate, CliErrorDetails};
use crate::cli::resolver::ResolveError;

impl CliError {
    pub fn details(&self) -> Option<CliErrorDetails> {
        match self {
            CliError::Entity(ResolveError::AmbiguousMatch { candidates, .. }) => {
                Some(CliErrorDetails {
                    candidates: Some(candidates.clone()),
                    ..Default::default()
                })
            }
            CliError::Entity(ResolveError::DidYouMean {
                suggestion,
                candidate_id,
                ..
            }) => Some(CliErrorDetails {
                suggestion: Some(CliErrorCandidate {
                    id: candidate_id.clone(),
                    name: suggestion.clone(),
                }),
                ..Default::default()
            }),
            CliError::Syntax(CliSyntaxError::InvalidArgument { field, value, .. }) => {
                Some(CliErrorDetails {
                    field: field.clone(),
                    value: value.clone(),
                    ..Default::default()
                })
            }
            _ => None,
        }
    }
}
