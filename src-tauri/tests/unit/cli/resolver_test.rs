use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::cli::resolver::{EntityResolver, ResolveError};
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_exact_id_when_resolving_task_then_returns_task() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_exact");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let task = TaskBuilder::new()
        .with_id("550e8400-e29b-41d4-a716-446655440000")
        .with_project_id("p1")
        .with_name("Authentication Service")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let resolved = resolver.resolve_task("550e8400-e29b-41d4-a716-446655440000");

    // Assert
    assert!(resolved.is_ok());
    assert_eq!(resolved.unwrap().name, "Authentication Service");
}

#[test]
fn test_given_prefix_with_hash_when_resolving_task_then_matches() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_prefix");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let task = TaskBuilder::new()
        .with_id("task-98765")
        .with_project_id("p1")
        .with_name("Deploy Pipeline")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let resolved = resolver.resolve_task("#98765");

    // Assert
    assert!(resolved.is_ok());
    assert_eq!(resolved.unwrap().id, "task-98765");
}

#[test]
fn test_given_name_substring_when_resolving_task_then_finds_unique_match() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_substring");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("OAuth2 Protocol Support")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t2")
        .with_project_id("p1")
        .with_name("Database Migration")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let resolved = resolver.resolve_task("oauth");

    // Assert
    assert!(resolved.is_ok());
    assert_eq!(resolved.unwrap().id, "t1");
}

#[test]
fn test_given_ambiguous_substring_when_resolving_task_then_returns_ambiguous_error() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_ambiguous");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let task1 = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Backend API Gateway")
        .build();
    let task2 = TaskBuilder::new()
        .with_id("t2")
        .with_project_id("p1")
        .with_name("Frontend API Client")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task1).unwrap();
    persistence.tasks.create(task2).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let result = resolver.resolve_task("API");

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
fn test_given_typo_within_distance_when_resolving_task_then_returns_did_you_mean() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_typo");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    let task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Billing")
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act ("bililng" has edit distance 1 from "billing")
    let result = resolver.resolve_task("bililng");

    // Assert
    assert!(result.is_err());
    match result.unwrap_err() {
        ResolveError::DidYouMean {
            suggestion,
            candidate_id,
            ..
        } => {
            assert_eq!(suggestion, "Billing");
            assert_eq!(candidate_id, "t1");
        }
        other => panic!("Expected DidYouMean, got: {:?}", other),
    }
}

#[test]
fn test_given_nonexistent_target_when_resolving_task_then_returns_not_found() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_task_not_found");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Core")
        .build();
    persistence.projects.create(project).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let result = resolver.resolve_task("completely_unknown_task_target");

    // Assert
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ResolveError::NotFound { .. }));
}

#[test]
fn test_given_substring_when_resolving_project_then_finds_project() {
    // Arrange
    let (_conn, config, _temp) = setup_persistence_test("test_resolve_project_substring");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p100")
        .with_name("Infrastructure & Ops")
        .with_color("blue")
        .build();
    persistence.projects.create(project).unwrap();
    let resolver = EntityResolver::new(&persistence);

    // Act
    let resolved = resolver.resolve_project("infra");

    // Assert
    assert!(resolved.is_ok());
    assert_eq!(resolved.unwrap().id, "p100");
}

#[test]
fn test_given_resolve_error_variants_when_formatted_then_outputs_expected_string() {
    // Arrange
    use oxy_flow::cli::resolver::EntityType;

    let not_found = ResolveError::NotFound {
        target: "my-task".into(),
        entity_type: EntityType::Task,
    };
    let ambiguous = ResolveError::AmbiguousMatch {
        target: "build".into(),
        entity_type: EntityType::Task,
        candidates: vec![
            "\"Build Frontend\" (t1)".into(),
            "\"Build Backend\" (t2)".into(),
        ],
    };
    let did_you_mean = ResolveError::DidYouMean {
        target: "biling".into(),
        entity_type: EntityType::Task,
        suggestion: "Billing".into(),
        candidate_id: "t1".into(),
    };
    let storage = ResolveError::StorageError("disk failure".into());

    // Act
    let str_not_found = not_found.to_string();
    let str_ambiguous = ambiguous.to_string();
    let str_did_you_mean = did_you_mean.to_string();
    let str_storage = storage.to_string();

    // Assert
    assert_eq!(str_not_found, "Task 'my-task' not found.");
    assert!(str_ambiguous.contains("Ambiguous Task target 'build'"));
    assert!(str_ambiguous.contains("Matched: \"Build Frontend\" (t1), \"Build Backend\" (t2)"));
    assert_eq!(
        str_did_you_mean,
        "Task 'biling' not found. Did you mean 'Billing'?"
    );
    assert_eq!(str_storage, "Storage error: disk failure");
}
