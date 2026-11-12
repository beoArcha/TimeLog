use super::constants::MIN_MACHINE_PREFIX_LEN;
use super::entity_resolver::{format_ambiguous_candidates, EntityType, ResolveError};

fn ambiguous<T>(
    matches: &[T],
    target: &str,
    entity_type: EntityType,
    id_fn: impl Fn(&T) -> &str,
    name_fn: impl Fn(&T) -> &str,
) -> ResolveError {
    let candidates = format_ambiguous_candidates(matches, &id_fn, &name_fn);
    ResolveError::AmbiguousMatch {
        target: target.to_string(),
        entity_type,
        candidates,
    }
}

/// Resolves an entity from a slice strictly for machine (--json / --machine) mode.
///
/// In machine mode, targets are resolved exclusively via:
/// 1. Exact ID match (with optional leading '#' stripped).
/// 2. Unique ID prefix of at least 8 characters (with optional leading '#' stripped; no suffix match).
/// 3. Exact full name match, compared case-insensitively.
///
/// Ambiguous 8+ char ID prefixes or ambiguous exact names return `AmbiguousMatch`.
/// Any other input (including name fragments, prefixes < 8 chars, suffixes, and typos)
/// returns `ResolveError::NotFound`.
pub fn strict_resolve_from_slice<T: Clone>(
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

    let clean = trimmed.strip_prefix('#').unwrap_or(trimmed);

    // Exact ID matching: check both literal input and input with '#' prefix stripped.
    if let Some(matched) = entities
        .iter()
        .find(|e| id_fn(e) == trimmed || id_fn(e) == clean)
    {
        return Ok(matched.clone());
    }

    // Unique prefix matching: only prefixes of at least MIN_MACHINE_PREFIX_LEN chars are allowed.
    if clean.len() >= MIN_MACHINE_PREFIX_LEN {
        let prefix_matches: Vec<_> = entities
            .iter()
            .filter(|e| id_fn(e).starts_with(clean))
            .cloned()
            .collect();

        match prefix_matches.as_slice() {
            [single] => return Ok(single.clone()),
            [] => {}
            multiple => return Err(ambiguous(multiple, target, entity_type, &id_fn, &name_fn)),
        }
    }

    // Exact full name matching (case-insensitive).
    let target_lower = trimmed.to_lowercase();
    let name_matches: Vec<_> = entities
        .iter()
        .filter(|e| name_fn(e).to_lowercase() == target_lower)
        .cloned()
        .collect();

    match name_matches.as_slice() {
        [single] => Ok(single.clone()),
        [] => Err(ResolveError::NotFound {
            target: target.to_string(),
            entity_type,
        }),
        multiple => Err(ambiguous(multiple, target, entity_type, &id_fn, &name_fn)),
    }
}
