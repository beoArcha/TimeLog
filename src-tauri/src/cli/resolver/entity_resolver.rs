use super::levenshtein::levenshtein_distance;
use crate::persistence::Persistence;
use crate::types::{Project, Task};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntityType {
    Project,
    Task,
}

use crate::cli::shared::constants::{
    ERR_RESOLVE_AMBIGUOUS, ERR_RESOLVE_DID_YOU_MEAN, ERR_RESOLVE_NOT_FOUND, ERR_RESOLVE_STORAGE,
    FORMAT_CANDIDATE_MATCH, LABEL_ENTITY_PROJECT, LABEL_ENTITY_TASK,
};

impl fmt::Display for EntityType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EntityType::Project => write!(f, "{}", LABEL_ENTITY_PROJECT),
            EntityType::Task => write!(f, "{}", LABEL_ENTITY_TASK),
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
                write!(
                    f,
                    "{}",
                    ERR_RESOLVE_NOT_FOUND
                        .replacen("{}", &entity_type.to_string(), 1)
                        .replacen("{}", target, 1)
                )
            }
            ResolveError::AmbiguousMatch {
                target,
                entity_type,
                candidates,
            } => {
                write!(
                    f,
                    "{}",
                    ERR_RESOLVE_AMBIGUOUS
                        .replacen("{}", &entity_type.to_string(), 1)
                        .replacen("{}", target, 1)
                        .replacen("{}", &candidates.join(", "), 1)
                )
            }
            ResolveError::DidYouMean {
                target,
                entity_type,
                suggestion,
                ..
            } => {
                write!(
                    f,
                    "{}",
                    ERR_RESOLVE_DID_YOU_MEAN
                        .replacen("{}", &entity_type.to_string(), 1)
                        .replacen("{}", target, 1)
                        .replacen("{}", suggestion, 1)
                )
            }
            ResolveError::StorageError(msg) => {
                write!(f, "{}", ERR_RESOLVE_STORAGE.replace("{}", msg))
            }
        }
    }
}

pub struct EntityResolver<'a> {
    persistence: &'a Persistence,
}

impl<'a> EntityResolver<'a> {
    pub fn new(persistence: &'a Persistence) -> Self {
        Self { persistence }
    }

    pub fn resolve_task(&self, target: &str) -> Result<Task, ResolveError> {
        let tasks = self
            .persistence
            .tasks
            .get_all()
            .map_err(|e| ResolveError::StorageError(e.to_string()))?;

        resolve_from_slice(&tasks, target, EntityType::Task, |t| &t.id, |t| &t.name)
    }

    pub fn resolve_project(&self, target: &str) -> Result<Project, ResolveError> {
        let projects = self
            .persistence
            .projects
            .get_all()
            .map_err(|e| ResolveError::StorageError(e.to_string()))?;

        resolve_from_slice(
            &projects,
            target,
            EntityType::Project,
            |p| &p.id,
            |p| &p.name,
        )
    }
}

enum MatchOutcome<T> {
    Unique(T),
    Ambiguous(Vec<String>),
    None,
}

fn resolve_from_slice<T: Clone>(
    entities: &[T],
    target: &str,
    entity_type: EntityType,
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
        MatchOutcome::Ambiguous(candidates) => {
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

fn find_exact_id<T: Clone>(entities: &[T], target: &str, id_fn: &impl Fn(&T) -> &str) -> Option<T> {
    entities.iter().find(|e| id_fn(e) == target).cloned()
}

fn find_prefix_id<T: Clone>(
    entities: &[T],
    target: &str,
    id_fn: &impl Fn(&T) -> &str,
) -> Option<T> {
    let clean = target.trim_start_matches('#');
    let matches: Vec<_> = entities
        .iter()
        .filter(|e| {
            let id = id_fn(e);
            id.starts_with(clean) || id.ends_with(clean)
        })
        .collect();

    if matches.len() == 1 {
        Some(matches[0].clone())
    } else {
        None
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
        .collect();

    match matches.len() {
        1 => MatchOutcome::Unique(matches[0].clone()),
        n if n > 1 => {
            let candidates = matches
                .into_iter()
                .map(|e| {
                    FORMAT_CANDIDATE_MATCH
                        .replacen("{}", name_fn(e), 1)
                        .replacen("{}", id_fn(e), 1)
                })
                .collect();
            MatchOutcome::Ambiguous(candidates)
        }
        _ => MatchOutcome::None,
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
        if dist <= 2 {
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
    }

    best.map(|(e, _)| (name_fn(e).to_string(), id_fn(e).to_string()))
}
