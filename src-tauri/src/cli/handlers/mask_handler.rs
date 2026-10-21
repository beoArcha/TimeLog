use super::constants::{
    ERR_MASK_EMPTY_NAME, ERR_MASK_EMPTY_TEMPLATE, ERR_MASK_NOT_FOUND, ERR_MASK_SELF_REFERENCE,
    FORMAT_MASK_LIST_ITEM, HEADER_MASKS, MSG_MASK_CONFIGURED, MSG_MASK_REMOVED,
    MSG_NO_MASKS_CONFIGURED,
};
use crate::cli::error::CliError;
use crate::cli::parser::{MaskArgs, MaskSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::current_timestamp;
use crate::persistence::Persistence;
use crate::types::CliAlias;
use serde_json::json;

pub fn handle(
    args: MaskArgs,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    match args.command {
        MaskSubcommand::List => list_masks(is_machine, persistence),
        MaskSubcommand::Set { name, template } => set_mask(name, template, is_machine, persistence),
        MaskSubcommand::Remove { name } => remove_mask(name, is_machine, persistence),
    }
}

fn list_masks(is_machine: bool, persistence: &Persistence) -> Result<CliOutput, CliError> {
    let aliases = persistence
        .cli
        .get_all_aliases()
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if is_machine {
        let json_str = serde_json::to_string_pretty(&aliases).unwrap_or_else(|_| "[]".to_string());
        return Ok(CliOutput::Success(json_str));
    }

    if aliases.is_empty() {
        return Ok(CliOutput::Success(MSG_NO_MASKS_CONFIGURED.to_string()));
    }

    let mut out = String::from(HEADER_MASKS);
    for alias in &aliases {
        out.push_str(
            &FORMAT_MASK_LIST_ITEM
                .replacen("{}", &alias.name, 1)
                .replacen("{}", &alias.template, 1),
        );
    }

    Ok(CliOutput::Success(out))
}

fn set_mask(
    name: String,
    template: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err(CliError::Syntax(ERR_MASK_EMPTY_NAME.to_string()));
    }

    let trimmed_template = template.trim();
    if trimmed_template.is_empty() {
        return Err(CliError::Syntax(ERR_MASK_EMPTY_TEMPLATE.to_string()));
    }

    if trimmed_template.split_whitespace().next() == Some(trimmed_name) {
        return Err(CliError::Syntax(ERR_MASK_SELF_REFERENCE.to_string()));
    }

    let alias = CliAlias {
        name: trimmed_name.to_string(),
        template: trimmed_template.to_string(),
        created_at: current_timestamp(),
    };

    persistence
        .cli
        .save_alias(&alias)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if is_machine {
        return Ok(CliOutput::Success(
            json!({ "status": "ok", "name": trimmed_name, "template": trimmed_template })
                .to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_MASK_CONFIGURED
            .replacen("{}", trimmed_name, 1)
            .replacen("{}", trimmed_template, 1),
    ))
}

fn remove_mask(
    name: String,
    is_machine: bool,
    persistence: &Persistence,
) -> Result<CliOutput, CliError> {
    let deleted = persistence
        .cli
        .delete_alias(&name)
        .map_err(|e| CliError::Storage(e.to_string()))?;

    if !deleted {
        return Err(CliError::Syntax(
            ERR_MASK_NOT_FOUND.replacen("{}", &name, 1),
        ));
    }

    if is_machine {
        return Ok(CliOutput::Success(
            json!({ "status": "ok", "removed": name }).to_string(),
        ));
    }

    Ok(CliOutput::Success(
        MSG_MASK_REMOVED.replacen("{}", &name, 1),
    ))
}

/// Expands positional tokens ($1, $2, ...) and contextual variables ($LAST_TASK) in macro templates.
pub fn expand_mask_template(template: &str, args: &[String], last_task_id: Option<&str>) -> String {
    let mut expanded = template.to_string();

    if let Some(task_id) = last_task_id {
        expanded = expanded.replace("$LAST_TASK", task_id);
        expanded = expanded.replace("$LAST", task_id);
    }

    for (idx, arg) in args.iter().enumerate() {
        let token = format!("${}", idx + 1);
        expanded = expanded.replace(&token, arg);
    }

    expanded
}
