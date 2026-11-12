use crate::cli::error::CliError;
use crate::engine::range::format_utc;
use crate::engine::reports::constants::{GENERATOR_NAME, GENERATOR_VERSION};
use crate::types::{EnvelopeMeta, ReportGenerator, SuccessEnvelope};
use chrono::{DateTime, Utc};
use serde::Serialize;

/// Identity of a machine-readable payload. Bump `version` on any breaking change to its `data` shape.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EnvelopeSchema {
    pub name: &'static str,
    pub version: u32,
}

impl EnvelopeSchema {
    pub const fn new(name: &'static str, version: u32) -> Self {
        Self { name, version }
    }

    pub fn wrap<T: Serialize>(self, data: &T) -> Result<SuccessEnvelope, CliError> {
        self.wrap_at(data, Utc::now())
    }

    pub fn wrap_at<T: Serialize>(
        self,
        data: &T,
        generated_at: DateTime<Utc>,
    ) -> Result<SuccessEnvelope, CliError> {
        Ok(SuccessEnvelope {
            schema: self.name.to_string(),
            schema_version: self.version,
            data: serde_json::to_value(data)?,
            meta: EnvelopeMeta {
                generated_at: format_utc(generated_at),
                generator: ReportGenerator {
                    name: GENERATOR_NAME.to_string(),
                    version: GENERATOR_VERSION.to_string(),
                },
            },
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JsonStyle {
    Compact,
    Pretty,
}

impl JsonStyle {
    /// Pretty output is only for a person reading `--json` in a terminal; pipes and `--machine` stay one line.
    pub fn resolve(json: bool, machine: bool, stdout_is_terminal: bool) -> Self {
        if json && !machine && stdout_is_terminal {
            Self::Pretty
        } else {
            Self::Compact
        }
    }
}
