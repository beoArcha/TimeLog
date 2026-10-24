use super::constants::{
    ERR_MASK_EMPTY_NAME, ERR_MASK_EMPTY_TEMPLATE, ERR_MASK_SELF_REFERENCE, FORMAT_MASK_LIST_ITEM,
    HEADER_MASKS, MSG_MASK_CONFIGURED, MSG_MASK_REMOVED, MSG_NO_MASKS_CONFIGURED,
};
use crate::cli::error::{CliError, CliSyntaxError};
use crate::cli::parser::{MaskArgs, MaskSubcommand};
use crate::cli::shared::output::CliOutput;
use crate::cli::shared::utils::current_timestamp;
use crate::engine::Engine;
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
    let aliases = persistence.cli.get_all_aliases()?;

    if is_machine {
        let json_str = serde_json::to_string_pretty(&aliases)?;
        return Ok(CliOutput::Json(json_str));
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
        return Err(CliError::Syntax(CliSyntaxError::InvalidArgs(
            ERR_MASK_EMPTY_NAME.to_string(),
        )));
    }

    let trimmed_template = template.trim();
    if trimmed_template.is_empty() {
        return Err(CliError::Syntax(CliSyntaxError::MaskSyntax(
            ERR_MASK_EMPTY_TEMPLATE.to_string(),
        )));
    }

    if trimmed_template.split_whitespace().next() == Some(trimmed_name) {
        return Err(CliError::Syntax(CliSyntaxError::MaskSyntax(
            ERR_MASK_SELF_REFERENCE.to_string(),
        )));
    }

    let alias = CliAlias {
        name: trimmed_name.to_string(),
        template: trimmed_template.to_string(),
        created_at: current_timestamp(),
    };

    persistence.cli.save_alias(&alias)?;

    if is_machine {
        return Ok(CliOutput::Json(
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
    let deleted = persistence.cli.delete_alias(&name)?;

    if !deleted {
        return Err(CliError::Entity(
            crate::cli::resolver::ResolveError::NotFound {
                target: name,
                entity_type: crate::cli::resolver::EntityType::MaskAlias,
            },
        ));
    }

    if is_machine {
        return Ok(CliOutput::Json(
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
        let quoted_token = format!("\"${}\"", idx + 1);
        let single_quoted_token = format!("'${}'", idx + 1);

        if expanded.contains(&quoted_token) || expanded.contains(&single_quoted_token) {
            expanded = expanded.replace(&token, arg);
        } else if arg.contains(char::is_whitespace) {
            let quoted_arg = format!("\"{}\"", arg);
            expanded = expanded.replace(&token, &quoted_arg);
        } else {
            expanded = expanded.replace(&token, arg);
        }
    }

    expanded
}

/// Resolves the most recently active task ID across active timers and time logs.
pub fn resolve_last_task_id(persistence: &Persistence, engine: &Engine) -> Option<String> {
    if let Ok(active) = engine.get_active_logs() {
        if let Some(first_id) = active.first() {
            return Some(first_id.clone());
        }
    }

    if let Ok(mut logs) = persistence.time_logs.get_all() {
        logs.sort_by(|a, b| b.start_time.cmp(&a.start_time));
        if let Some(recent_log) = logs.first() {
            return Some(recent_log.task_id.clone());
        }
    }

    None
}

/// Expands registered alias shortcuts before command line parsing.
pub fn preprocess_alias_invocation(
    raw_args: &[String],
    persistence: &Persistence,
    engine: &Engine,
) -> Result<Vec<String>, CliError> {
    let mut current_args = raw_args.to_vec();
    let mut depth = 0;
    const MAX_RECURSION_DEPTH: usize = 5;

    while depth < MAX_RECURSION_DEPTH {
        let (alias_idx, alias_name) = match find_alias_candidate(&current_args) {
            Some(res) => res,
            None => return Ok(current_args),
        };

        let alias = match persistence.cli.get_alias(&alias_name)? {
            Some(a) => a,
            None => return Ok(current_args),
        };

        let positional_args = extract_positional_args(&current_args, alias_idx);
        let global_flags = extract_global_flags(&current_args);

        let last_task_id = resolve_last_task_id(persistence, engine);
        let expanded =
            expand_mask_template(&alias.template, &positional_args, last_task_id.as_deref());
        let tokens = crate::cli::shared::utils::split_shell_args(&expanded);

        let mut next_args = Vec::new();
        if let Some(binary) = current_args.first() {
            next_args.push(binary.clone());
        }

        next_args.extend(global_flags);
        next_args.extend(tokens);
        current_args = next_args;
        depth += 1;
    }

    Err(CliError::syntax_invalid_args(
        "Circular macro/alias expansion limit exceeded",
    ))
}

fn extract_global_flags(args: &[String]) -> Vec<String> {
    let mut flags = Vec::new();
    let mut iter = args.iter().skip(1);
    while let Some(arg) = iter.next() {
        if arg == "--db" {
            flags.push(arg.clone());
            if let Some(val) = iter.next() {
                flags.push(val.clone());
            }
        } else if is_global_flag(arg) {
            flags.push(arg.clone());
        }
    }
    flags
}

fn extract_positional_args(args: &[String], alias_idx: usize) -> Vec<String> {
    let mut positional = Vec::new();
    let mut iter = args.iter().enumerate().skip(alias_idx + 1);
    while let Some((_, arg)) = iter.next() {
        if arg == "--db" {
            let _ = iter.next();
        } else if !is_global_flag(arg) {
            positional.push(arg.clone());
        }
    }
    positional
}

fn is_global_flag(arg: &str) -> bool {
    arg == "-m"
        || arg == "--machine"
        || arg == "-j"
        || arg == "--json"
        || arg == "-q"
        || arg == "--quiet"
        || arg.starts_with("--db")
}

fn find_alias_candidate(args: &[String]) -> Option<(usize, String)> {
    let mut skip_next = false;
    for (i, arg) in args.iter().enumerate().skip(1) {
        if skip_next {
            skip_next = false;
            continue;
        }
        if arg == "--db" {
            skip_next = true;
            continue;
        }
        if arg.starts_with('-') {
            continue;
        }
        return Some((i, arg.clone()));
    }
    None
}
