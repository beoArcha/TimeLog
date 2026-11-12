use oxyflow_timelog::cli::resolver::{
    strict_resolve_from_slice, EntityResolver, EntityType, ResolveError,
};

#[derive(Debug, Clone, PartialEq, Eq)]
struct MockEntity {
    id: String,
    name: String,
}

impl MockEntity {
    fn new(id: &str, name: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
        }
    }
}

#[test]
fn test_given_exact_id_when_strictly_resolving_then_returns_entity() {
    // Arrange
    let entities = vec![
        MockEntity::new("proj-12345678", "Alpha Project"),
        MockEntity::new("proj-87654321", "Beta Project"),
    ];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "proj-12345678",
        EntityType::Project,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap().id, "proj-12345678");
}

#[test]
fn test_given_eight_plus_char_unique_prefix_when_strictly_resolving_then_returns_entity() {
    // Arrange
    let entities = vec![
        MockEntity::new("task-abcdef123", "Data Pipeline"),
        MockEntity::new("task-999999999", "Web Server"),
    ];

    // Act (8 characters: "task-abc")
    let result = strict_resolve_from_slice(
        &entities,
        "task-abc",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap().id, "task-abcdef123");
}

#[test]
fn test_given_hash_prefixed_id_when_strictly_resolving_then_returns_entity() {
    // Arrange
    let entities = vec![MockEntity::new("task-550e8400", "Worker Thread")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "#task-550e8400",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap().id, "task-550e8400");
}

#[test]
fn test_given_seven_char_prefix_when_strictly_resolving_then_returns_not_found() {
    // Arrange (7 characters: "task-12" < 8)
    let entities = vec![MockEntity::new("task-12345678", "Deploy App")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "task-12",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ResolveError::NotFound { .. }));
}

#[test]
fn test_given_id_suffix_when_strictly_resolving_then_returns_not_found() {
    // Arrange ("345678" is a suffix, not a prefix)
    let entities = vec![MockEntity::new("task-12345678", "Deploy App")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "345678",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ResolveError::NotFound { .. }));
}

#[test]
fn test_given_exact_name_in_different_case_when_strictly_resolving_then_returns_entity() {
    // Arrange
    let entities = vec![MockEntity::new("p1", "Klient ACME")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "klient acme",
        EntityType::Project,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap().name, "Klient ACME");
}

#[test]
fn test_given_name_fragment_when_strictly_resolving_then_returns_not_found() {
    // Arrange ("ACME" is only a substring of "Klient ACME")
    let entities = vec![MockEntity::new("p1", "Klient ACME")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "ACME",
        EntityType::Project,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ResolveError::NotFound { .. }));
}

#[test]
fn test_given_name_typo_when_strictly_resolving_then_returns_not_found_without_did_you_mean() {
    // Arrange ("bililng" has edit distance 1 from "Billing")
    let entities = vec![MockEntity::new("t1", "Billing")];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "bililng",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert (strictly NotFound, never DidYouMean)
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ResolveError::NotFound { .. }));
}

#[test]
fn test_given_two_entities_with_same_name_case_insensitively_when_strictly_resolving_then_returns_ambiguous_match(
) {
    // Arrange
    let entities = vec![
        MockEntity::new("p1", "Project Matrix"),
        MockEntity::new("p2", "project matrix"),
    ];

    // Act
    let result = strict_resolve_from_slice(
        &entities,
        "PROJECT MATRIX",
        EntityType::Project,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        ResolveError::AmbiguousMatch { candidates, .. } => {
            assert_eq!(candidates.len(), 2);
        }
        other => panic!("Expected AmbiguousMatch, got: {:?}", other),
    }
}

#[test]
fn test_given_ambiguous_eight_plus_char_prefix_when_strictly_resolving_then_returns_ambiguous_match(
) {
    // Arrange
    let entities = vec![
        MockEntity::new("550e8400-e29b-41d4-a716-111111111111", "Task 1"),
        MockEntity::new("550e8400-e29b-41d4-a716-222222222222", "Task 2"),
    ];

    // Act (8 characters: "550e8400")
    let result = strict_resolve_from_slice(
        &entities,
        "550e8400",
        EntityType::Task,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        ResolveError::AmbiguousMatch { candidates, .. } => {
            assert_eq!(candidates.len(), 2);
        }
        other => panic!("Expected AmbiguousMatch, got: {:?}", other),
    }
}

#[test]
fn test_given_empty_or_whitespace_target_when_strictly_resolving_then_returns_not_found() {
    // Arrange
    let entities = vec![MockEntity::new("p1", "Core")];

    // Act
    let result_empty =
        strict_resolve_from_slice(&entities, "", EntityType::Project, |e| &e.id, |e| &e.name);
    let result_spaces = strict_resolve_from_slice(
        &entities,
        "   ",
        EntityType::Project,
        |e| &e.id,
        |e| &e.name,
    );

    // Assert
    assert!(matches!(
        result_empty.unwrap_err(),
        ResolveError::NotFound { .. }
    ));
    assert!(matches!(
        result_spaces.unwrap_err(),
        ResolveError::NotFound { .. }
    ));
}

#[test]
fn test_given_entity_resolver_in_machine_mode_when_resolving_fragment_then_fails_strictly() {
    // Arrange
    use crate::shared::builders::ProjectBuilder;
    use crate::shared::test_db::setup_persistence_test;
    use oxyflow_timelog::persistence::Persistence;

    let (_conn, config, _temp) = setup_persistence_test("test_resolver_mode_strict");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p100")
        .with_name("Klient ACME")
        .build();
    persistence.projects.create(project).unwrap();

    let strict_resolver = EntityResolver::with_mode(&persistence, true);
    let human_resolver = EntityResolver::with_mode(&persistence, false);

    // Act
    let strict_res = strict_resolver.resolve_project("ACME");
    let human_res = human_resolver.resolve_project("ACME");

    // Assert
    assert!(matches!(
        strict_res.unwrap_err(),
        ResolveError::NotFound { .. }
    ));
    assert!(human_res.is_ok());
    assert_eq!(human_res.unwrap().id, "p100");
}
