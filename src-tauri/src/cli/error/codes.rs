use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CliErrorCode {
    CliSyntaxInvalidArgs,
    CliSyntaxMissingTarget,
    CliSyntaxInvalidDuration,
    CliSyntaxEmptyId,
    CliSyntaxUnknownCommand,

    DomEntityNotFound,
    DomEntityAmbiguous,
    DomEntityDidYouMean,

    StoSqliteInit,
    StoSqliteQuery,
    StoSqliteConstraint,

    EngTimerActive,
    EngTimerInactive,
    EngTimerConflict,

    DomBusinessViolation,
    DomBusinessNoProjects,

    SnkExternalIo,

    MskAliasNotFound,
    MskAliasSyntax,
}

impl CliErrorCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::CliSyntaxInvalidArgs => "CLI_SYNTAX_INVALID_ARGS",
            Self::CliSyntaxMissingTarget => "CLI_SYNTAX_MISSING_TARGET",
            Self::CliSyntaxInvalidDuration => "CLI_SYNTAX_INVALID_DURATION",
            Self::CliSyntaxEmptyId => "CLI_SYNTAX_EMPTY_ID",
            Self::CliSyntaxUnknownCommand => "CLI_SYNTAX_UNKNOWN_COMMAND",

            Self::DomEntityNotFound => "DOM_ENTITY_NOT_FOUND",
            Self::DomEntityAmbiguous => "DOM_ENTITY_AMBIGUOUS",
            Self::DomEntityDidYouMean => "DOM_ENTITY_DID_YOU_MEAN",

            Self::StoSqliteInit => "STO_SQLITE_INIT",
            Self::StoSqliteQuery => "STO_SQLITE_QUERY",
            Self::StoSqliteConstraint => "STO_SQLITE_CONSTRAINT",

            Self::EngTimerActive => "ENG_TIMER_ACTIVE",
            Self::EngTimerInactive => "ENG_TIMER_INACTIVE",
            Self::EngTimerConflict => "ENG_TIMER_CONFLICT",

            Self::DomBusinessViolation => "DOM_BUSINESS_VIOLATION",
            Self::DomBusinessNoProjects => "DOM_BUSINESS_NO_PROJECTS",

            Self::SnkExternalIo => "SNK_EXTERNAL_IO",

            Self::MskAliasNotFound => "MSK_ALIAS_NOT_FOUND",
            Self::MskAliasSyntax => "MSK_ALIAS_SYNTAX",
        }
    }

    pub fn category(&self) -> &'static str {
        match self {
            Self::CliSyntaxInvalidArgs
            | Self::CliSyntaxMissingTarget
            | Self::CliSyntaxInvalidDuration
            | Self::CliSyntaxEmptyId
            | Self::CliSyntaxUnknownCommand => "syntax",

            Self::DomEntityNotFound
            | Self::DomEntityAmbiguous
            | Self::DomEntityDidYouMean => "entity",

            Self::StoSqliteInit
            | Self::StoSqliteQuery
            | Self::StoSqliteConstraint => "storage",

            Self::EngTimerActive
            | Self::EngTimerInactive
            | Self::EngTimerConflict => "engine",

            Self::DomBusinessViolation
            | Self::DomBusinessNoProjects => "business",

            Self::SnkExternalIo => "sink",

            Self::MskAliasNotFound
            | Self::MskAliasSyntax => "mask",
        }
    }
}

impl fmt::Display for CliErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}
