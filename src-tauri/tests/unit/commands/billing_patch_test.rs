use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::commands::persistence::project::{update_project_details, ProjectUpdateInput};
use oxy_flow::commands::persistence::task::{update_task_details, TaskUpdateInput};
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{TaskStatus, TriState};

#[test]
fn test_task_update_preserves_custom_rate_on_status_or_name_change() {
    let (_conn, config, _temp_dir) = setup_persistence_test("task_patch_preserve_rate");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("p1").build();
    persistence.projects.create(project).unwrap();

    let mut task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Original Task")
        .build();
    task.hourly_rate = Some("150.00".to_string());
    task.billing_rate_cents = Some(15000);
    persistence.tasks.create(task).unwrap();

    // Act: update only name and status; omit hourly_rate (TriState::Absent)
    let state = update_task_details(
        &persistence,
        "t1",
        TaskUpdateInput {
            name: "Updated Name".to_string(),
            parent_task_id: None,
            status: Some(TaskStatus::Done),
            completed: Some(true),
            hourly_rate: TriState::Absent,
        },
    )
    .unwrap();

    // Assert: rate and cents remain intact
    let updated = state.tasks.iter().find(|t| t.id == "t1").unwrap();
    assert_eq!(updated.name, "Updated Name");
    assert_eq!(updated.status, Some(TaskStatus::Done));
    assert!(updated.completed);
    assert_eq!(updated.hourly_rate.as_deref(), Some("150.00"));
    assert_eq!(updated.billing_rate_cents, Some(15000));
}

#[test]
fn test_task_update_clears_rate_when_explicitly_set_to_none() {
    let (_conn, config, _temp_dir) = setup_persistence_test("task_patch_clear_rate");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("p1").build();
    persistence.projects.create(project).unwrap();

    let mut task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Task to clear")
        .build();
    task.hourly_rate = Some("150.00".to_string());
    task.billing_rate_cents = Some(15000);
    persistence.tasks.create(task).unwrap();

    // Act: explicitly clear hourly_rate (TriState::Set(None))
    let state = update_task_details(
        &persistence,
        "t1",
        TaskUpdateInput {
            name: "Task to clear".to_string(),
            parent_task_id: None,
            status: None,
            completed: None,
            hourly_rate: TriState::Set(None),
        },
    )
    .unwrap();

    // Assert: rate and cents are cleared atomically
    let updated = state.tasks.iter().find(|t| t.id == "t1").unwrap();
    assert_eq!(updated.hourly_rate, None);
    assert_eq!(updated.billing_rate_cents, None);
}

#[test]
fn test_task_update_updates_rate_and_cents_atomically() {
    let (_conn, config, _temp_dir) = setup_persistence_test("task_patch_update_rate");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("p1").build();
    persistence.projects.create(project).unwrap();

    let mut task = TaskBuilder::new()
        .with_id("t1")
        .with_project_id("p1")
        .with_name("Task to update rate")
        .build();
    task.hourly_rate = Some("100.00".to_string());
    task.billing_rate_cents = Some(10000);
    persistence.tasks.create(task).unwrap();

    // Act: update rate to 250.00
    let state = update_task_details(
        &persistence,
        "t1",
        TaskUpdateInput {
            name: "Task to update rate".to_string(),
            parent_task_id: None,
            status: None,
            completed: None,
            hourly_rate: TriState::Set(Some("250.00".to_string())),
        },
    )
    .unwrap();

    // Assert: rate and cents updated atomically
    let updated = state.tasks.iter().find(|t| t.id == "t1").unwrap();
    assert_eq!(updated.hourly_rate.as_deref(), Some("250.00"));
    assert_eq!(updated.billing_rate_cents, Some(25000));
}

#[test]
fn test_project_update_preserves_billing_fields_on_metadata_change() {
    let (_conn, config, _temp_dir) = setup_persistence_test("proj_patch_preserve_rate");
    let persistence = Persistence::new(&config).unwrap();

    let mut project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Original Proj")
        .with_color("blue")
        .build();
    project.hourly_rate = Some("120.00".to_string());
    project.currency = Some("USD".to_string());
    project.billing_rate_cents = Some(12000);
    project.billing_currency = Some("USD".to_string());
    persistence.projects.create(project).unwrap();

    // Act: update color and description only, omit hourly_rate and currency
    let state = update_project_details(
        &persistence,
        "p1",
        ProjectUpdateInput {
            name: "Original Proj".to_string(),
            color: "emerald".to_string(),
            description: Some("New desc".to_string()),
            icon: None,
            tags: None,
            allow_concurrency: None,
            hourly_rate: TriState::Absent,
            currency: TriState::Absent,
        },
    )
    .unwrap();

    // Assert: billing rate and currency are preserved
    let updated = state.projects.iter().find(|p| p.id == "p1").unwrap();
    assert_eq!(updated.color, "emerald");
    assert_eq!(updated.description.as_deref(), Some("New desc"));
    assert_eq!(updated.hourly_rate.as_deref(), Some("120.00"));
    assert_eq!(updated.currency.as_deref(), Some("USD"));
    assert_eq!(updated.billing_rate_cents, Some(12000));
    assert_eq!(updated.billing_currency.as_deref(), Some("USD"));
}

#[test]
fn test_project_update_clears_billing_fields_when_explicitly_set_to_none() {
    let (_conn, config, _temp_dir) = setup_persistence_test("proj_patch_clear_rate");
    let persistence = Persistence::new(&config).unwrap();

    let mut project = ProjectBuilder::new()
        .with_id("p1")
        .with_name("Original Proj")
        .with_color("blue")
        .build();
    project.hourly_rate = Some("120.00".to_string());
    project.currency = Some("USD".to_string());
    project.billing_rate_cents = Some(12000);
    project.billing_currency = Some("USD".to_string());
    persistence.projects.create(project).unwrap();

    // Act: explicitly clear both
    let state = update_project_details(
        &persistence,
        "p1",
        ProjectUpdateInput {
            name: "Original Proj".to_string(),
            color: "blue".to_string(),
            description: None,
            icon: None,
            tags: None,
            allow_concurrency: None,
            hourly_rate: TriState::Set(None),
            currency: TriState::Set(None),
        },
    )
    .unwrap();

    // Assert: all billing fields cleared
    let updated = state.projects.iter().find(|p| p.id == "p1").unwrap();
    assert_eq!(updated.hourly_rate, None);
    assert_eq!(updated.currency, None);
    assert_eq!(updated.billing_rate_cents, None);
    assert_eq!(updated.billing_currency, None);
}
