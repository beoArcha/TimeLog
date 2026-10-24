use super::constants::{
    ERR_RESOLVE_AMBIGUOUS, ERR_RESOLVE_DID_YOU_MEAN, ERR_RESOLVE_NOT_FOUND, ERR_RESOLVE_STORAGE,
    FORMAT_CANDIDATE_MATCH, LABEL_ENTITY_CONFIG_KEY, LABEL_ENTITY_MASK_ALIAS, LABEL_ENTITY_PROJECT,
    LABEL_ENTITY_TASK, LABEL_ENTITY_TIME_LOG, PROMPT_AMBIGUOUS_MATCHES, PROMPT_CHOOSE_INPUT,
    PROMPT_OPTION_ROW,
};
use super::levenshtein::levenshtein_distance;
use super::prompter::{Prompter, TerminalPrompter};
use crate::persistence::Persistence;
use crate::types::{Project, Task};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntityType {
    Project,
    Task,
    TimeLog,
    ConfigKey,
    MaskAlias,
}

impl fmt::Display for EntityType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EntityType::Project => write!(f, "{}", LABEL_ENTITY_PROJECT),
            EntityType::Task => write!(f, "{}", LABEL_ENTITY_TASK),
            EntityType::TimeLog => write!(f, "{}", LABEL_ENTITY_TIME_LOG),
            EntityType::ConfigKey => write!(f, "{}", LABEL_ENTITY_CONFIG_KEY),
            EntityType::MaskAlias => write!(f, "{}", LABEL_ENTITY_MASK_ALIAS),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum ResolveError {
    NotFound {
        target: String,
        entity_type: EntityType,
    },
    AmbiguousMatch {
        target: String,
        entity_type: EntityType,
        candidates: Vec<String>,
    },
    DidYouMean {
        target: String,
        entity_type: EntityType,
        suggestion: String,
        candidate_id: String,
    },
    StorageError(String),
}

impl fmt::Display for ResolveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ResolveError::NotFound {
                target,
                entity_type,
            } => {
                let msg = ERR_RESOLVE_NOT_FOUND
                    .replacen("{}", &entity_type.to_string(), 1)
                    .replacen("{}", target, 1);
                write!(f, "{}", msg)
            }
            ResolveError::AmbiguousMatch {
                target,
                entity_type,
                candidates,
            } => {
                let msg = ERR_RESOLVE_AMBIGUOUS
                    .replacen("{}", &entity_type.to_string(), 1)
                    .replacen("{}", target, 1)
                    .replacen("{}", &candidates.join(", "), 1);
                write!(f, "{}", msg)
            }
            ResolveError::DidYouMean {
                target,
                entity_type,
                suggestion,
                ..
            } => {
                let msg = ERR_RESOLVE_DID_YOU_MEAN
                    .replacen("{}", &entity_type.to_string(), 1)
                    .replacen("{}", target, 1)
                    .replacen("{}", suggestion, 1);
                write!(f, "{}", msg)
            }
            ResolveError::StorageError(msg) => {
                write!(f, "{}", ERR_RESOLVE_STORAGE.replace("{}", msg))
            }
        }
    }
}

pub struct EntityResolver<'a> {
    persistence: &'a Persistence,
    is_machine: bool,
}

impl<'a> EntityResolver<'a> {
    pub fn new(persistence: &'a Persistence) -> Self {
        Self {
            persistence,
            is_machine: false,
        }
    }

    pub fn with_mode(persistence: &'a Persistence, is_machine: bool) -> Self {
        Self {
            persistence,
            is_machine,
        }
    }

    pub fn resolve_task(&self, target: &str) -> Result<Task, ResolveError> {
        self.resolve_task_interactive(target, &TerminalPrompter::new(self.is_machine))
    }

    pub fn resolve_task_interactive(
        &self,
        target: &str,
        prompter: &dyn Prompter,
    ) -> Result<Task, ResolveError> {
        let tasks = self
            .persistence
            .tasks
            .get_all()
            .map_err(|e| ResolveError::StorageError(e.to_string()))?;

        resolve_from_slice(
            &tasks,
            target,
            EntityType::Task,
            prompter,
            |t| &t.id,
            |t| &t.name,
        )
    }

    pub fn resolve_project(&self, target: &str) -> Result<Project, ResolveError> {
        self.resolve_project_interactive(target, &TerminalPrompter::new(self.is_machine))
    }

    pub fn resolve_project_interactive(
        &self,
        target: &str,
        prompter: &dyn Prompter,
    ) -> Result<Project, ResolveError> {
        let projects = self
            .persistence
            .projects
            .get_all()
            .map_err(|e| ResolveError::StorageError(e.to_string()))?;

        resolve_from_slice(
            &projects,
            target,
            EntityType::Project,
            prompter,
            |p| &p.id,
            |p| &p.name,
        )
    }
}

enum MatchOutcome<T> {
    Unique(T),
    Ambiguous(Vec<T>),
    None,
}

fn resolve_from_slice<T: Clone>(
    entities: &[T],
    target: &str,
    entity_type: EntityType,
    prompter: &dyn Prompter,
    id_fn: impl Fn(&T) -> &str,
    name_fn: impl Fn(&T) -> &str,
) -> Result<T, ResolveError> {
    let trimmed = target.trim();
    if trimmed.is_empty() {
        return Err(ResolveError::NotFound {
            target: target.to_string(),
            entity_type,
        });
    }

    if let Some(matched) = find_exact_id(entities, trimmed, &id_fn) {
        return Ok(matched);
    }

    if let Some(matched) = find_prefix_id(entities, trimmed, &id_fn) {
        return Ok(matched);
    }

    match find_substring_matches(entities, trimmed, &name_fn, &id_fn) {
        MatchOutcome::Unique(entity) => return Ok(entity),
        MatchOutcome::Ambiguous(matched_items) => {
            if let Some(selected) = prompt_ambiguous_selection(
                &matched_items,
                trimmed,
                entity_type,
                prompter,
                &id_fn,
                &name_fn,
            ) {
                return Ok(selected);
            }
            let candidates = format_ambiguous_candidates(&matched_items, &id_fn, &name_fn);
            return Err(ResolveError::AmbiguousMatch {
                target: target.to_string(),
                entity_type,
                candidates,
            });
        }
        MatchOutcome::None => {}
    }

    if let Some((suggestion, candidate_id)) = find_nearest_typo(entities, trimmed, &name_fn, &id_fn)
    {
        return Err(ResolveError::DidYouMean {
            target: target.to_string(),
            entity_type,
            suggestion,
            candidate_id,
        });
    }

    Err(ResolveError::NotFound {
        target: target.to_string(),
        entity_type,
    })
}

fn prompt_ambiguous_selection<T: Clone>(
    matched_items: &[T],
    trimmed: &str,
    entity_type: EntityType,
    prompter: &dyn Prompter,
    id_fn: &impl Fn(&T) -> &str,
    name_fn: &impl Fn(&T) -> &str,
) -> Option<T> {
    if !prompter.is_terminal() {
        return None;
    }

    let header = PROMPT_AMBIGUOUS_MATCHES
        .replacen("{}", &entity_type.to_string(), 1)
        .replacen("{}", trimmed, 1);

    let rows: String = matched_items
        .iter()
        .enumerate()
        .map(|(idx, item)| {
            PROMPT_OPTION_ROW
                .replacen("{}", &(idx + 1).to_string(), 1)
                .replacen("{}", name_fn(item), 1)
                .replacen("{}", id_fn(item), 1)
        })
        .collect();

    let query = PROMPT_CHOOSE_INPUT
        .replacen("{}", &entity_type.to_string(), 1)
        .replacen("{}", &matched_items.len().to_string(), 1);

    let prompt_text = format!("{}{}{}", header, rows, query);
    let selected_idx = prompter.prompt_selection(&prompt_text, matched_items.len())?;
    matched_items.get(selected_idx).cloned()
}

fn format_ambiguous_candidates<T>(
    matched_items: &[T],
    id_fn: &impl Fn(&T) -> &str,
    name_fn: &impl Fn(&T) -> &str,
) -> Vec<String> {
    matched_items
        .iter()
        .map(|e| {
            FORMAT_CANDIDATE_MATCH
                .replacen("{}", name_fn(e), 1)
                .replacen("{}", id_fn(e), 1)
        })
        .collect()
}

fn find_exact_id<T: Clone>(entities: &[T], target: &str, id_fn: &impl Fn(&T) -> &str) -> Option<T> {
    entities.iter().find(|e| id_fn(e) == target).cloned()
}

fn find_prefix_id<T: Clone>(
    entities: &[T],
    target: &str,
    id_fn: &impl Fn(&T) -> &str,
) -> Option<T> {
    let clean = target.trim_start_matches('#');
    let mut matches = entities.iter().filter(|e| {
        let id = id_fn(e);
        id.starts_with(clean) || id.ends_with(clean)
    });

    let first = matches.next()?.clone();
    match matches.next() {
        Some(_) => None,
        None => Some(first),
    }
}

fn find_substring_matches<T: Clone>(
    entities: &[T],
    target: &str,
    name_fn: &impl Fn(&T) -> &str,
    id_fn: &impl Fn(&T) -> &str,
) -> MatchOutcome<T> {
    let lower = target.to_lowercase();
    let matches: Vec<_> = entities
        .iter()
        .filter(|e| {
            name_fn(e).to_lowercase().contains(&lower) || id_fn(e).to_lowercase().contains(&lower)
        })
        .cloned()
        .collect();

    match matches.len() {
        0 => MatchOutcome::None,
        1 => MatchOutcome::Unique(matches.into_iter().next().unwrap()),
        _ => MatchOutcome::Ambiguous(matches),
    }
}

fn find_nearest_typo<T>(
    entities: &[T],
    target: &str,
    name_fn: &impl Fn(&T) -> &str,
    id_fn: &impl Fn(&T) -> &str,
) -> Option<(String, String)> {
    let lower = target.to_lowercase();
    let mut best: Option<(&T, usize)> = None;

    for entity in entities {
        let dist = levenshtein_distance(&lower, name_fn(entity));
        if dist > 2 {
            continue;
        }

        match best {
            Some((_, best_dist)) if dist < best_dist => {
                best = Some((entity, dist));
            }
            None => {
                best = Some((entity, dist));
            }
            _ => {}
        }
    }

    let (entity, _) = best?;
    let suggestion = name_fn(entity).to_string();
    let id = id_fn(entity).to_string();
    Some((suggestion, id))
}
