use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::TaskStatus;

#[test]
fn test_given_configured_persistence_when_creating_project_and_task_then_entities_and_csv_sink_are_created(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_crud_create");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p-int-1")
        .with_name("IntProject")
        .with_color("indigo")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-int-1")
        .with_project_id("p-int-1")
        .with_name("IntTask")
        .with_status(TaskStatus::Todo)
        .build();

    // When
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();

    // Then
    let p_opt = persistence.projects.get("p-int-1").unwrap();
    assert!(p_opt.is_some());
    assert_eq!(p_opt.unwrap().name, "IntProject");

    let t_opt = persistence.tasks.get("t-int-1").unwrap();
    assert!(t_opt.is_some());
    assert_eq!(t_opt.unwrap().name, "IntTask");

    let expected_csv_file = config.csv_directory.join("timelog_p-int-1.csv");
    assert!(
        expected_csv_file.exists(),
        "CSV audit file should be created"
    );
}

#[test]
fn test_given_populated_database_when_clearing_all_data_then_all_entities_are_purged() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_crud_clear");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p-all-1")
        .with_name("AllProject")
        .with_color("green")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-all-1")
        .with_project_id("p-all-1")
        .with_name("AllTask")
        .with_status(TaskStatus::Todo)
        .build();
    persistence.projects.create(project).unwrap();
    persistence.tasks.create(task).unwrap();
    assert_eq!(persistence.projects.get_all().unwrap().len(), 1);
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 1);

    // When
    persistence.core.clear_all_data().unwrap();

    // Then
    assert_eq!(persistence.projects.get_all().unwrap().len(), 0);
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 0);
}
