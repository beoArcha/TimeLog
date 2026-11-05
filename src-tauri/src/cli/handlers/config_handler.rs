use super::constants::{
    CONFIG_KEY_CLI_MACHINE_LOCALE, DEFAULT_CLI_MACHINE_LOCALE, ERR_CONFIG_EMPTY_KEY,
    FORMAT_CONFIG_LIST_ITEM, HEADER_CONFIG, MSG_CONFIG_SET, MSG_NO_CONFIG_ENTRIES,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::{ConfigArgs, ConfigSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::validation::validate_cli_machine_locale;
use crate::persistence::Persistence;
use serde_json::json;
use std::collections::BTreeMap;

pub fn handle(
    args: ConfigArgs,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        ConfigSubcommand::List => list_config(is_machine, persistence),
        ConfigSubcommand::Get { key } => get_config(key, is_machine, persistence),
        ConfigSubcommand::Set { key, value } => set_config(key, value, is_machine, persistence),
    }
}

fn list_config(is_machine: bool, persistence: &Persistence) -> Result<CliOutput, CliError> {
    let entries = persistence.cli.get_all_config_entries()?;

    if is_machine {
        let map: BTreeMap<String, String> = entries.into_iter().collect();
        let json_str = serde_json::to_string_pretty(&map)?;
        return Ok(CliOutput::Json(json_str));
    }

    if entries.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_CONFIG_ENTRIES.to_string()));
    }

    let mut out = String::from(HEADER_CONFIG);
    for (k, v) in &entries {
        out.push_str(
            &FORMAT_CONFIG_LIST_ITEM
                .replacen("{}", k, 1)
                .replacen("{}", v, 1),
        );
    }

    Ok(CliOutput::Success(out))
}

fn get_config(
    key: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let trimmed_key = key.trim();
    if trimmed_key.is_empty() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_CONFIG_EMPTY_KEY.to_string(),
        )));
    }

    let val = persistence.cli.get_config_value(trimmed_key)?;

    let value = match val {
        Some(v) => {
            if trimmed_key == CONFIG_KEY_CLI_MACHINE_LOCALE {
                validate_cli_machine_locale(&v)?.to_string()
            } else {
                v
            }
        }
        None if trimmed_key == CONFIG_KEY_CLI_MACHINE_LOCALE => {
            DEFAULT_CLI_MACHINE_LOCALE.to_string()
        }
        None => {
            return Err(CliError::Entity(
                crate::cli::resolver::ResolveError::NotFound {
                    target: trimmed_key.to_string(),
                    entity_type: crate::cli::resolver::EntityType::ConfigKey,
                },
            ));
        }
    };

    if is_machine {
        return Ok(CliOutput::Json(
            json!({ "key": trimmed_key, "value": value }).to_string(),
        ));
    }

    Ok(CliOutput::Success(value))
}

fn set_config(
    key: String,
    value: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let trimmed_key = key.trim();
    if trimmed_key.is_empty() {
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_CONFIG_EMPTY_KEY.to_string(),
        )));
    }

    let normalized_value = if trimmed_key == CONFIG_KEY_CLI_MACHINE_LOCALE {
        validate_cli_machine_locale(&value)?.to_string()
    } else {
        value
    };

    persistence
        .cli
        .set_config_value(trimmed_key, &normalized_value)?;

    if is_machine {
        return Ok(CliOutput::Json(
            json!({ "status": "ok", "key": trimmed_key, "value": normalized_value }).to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_CONFIG_SET
            .replacen("{}", trimmed_key, 1)
            .replacen("{}", &normalized_value, 1),
    ))
}
