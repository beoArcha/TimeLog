use crate::shared::builders::ProjectBuilder;
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_blocked_csv_path_when_creating_project_then_persistence_succeeds_and_saves_to_database(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_csv_sink_fail");
    let blocked_path = config.csv_directory.join("timelog_p-err.csv");
    std::fs::create_dir(&blocked_path).unwrap();
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new()
        .with_id("p-err")
        .with_name("ErrorProneProject")
        .with_color("yellow")
        .build();

    // When
    let result = persistence.projects.create(project);

    // Then
    assert!(
        result.is_ok(),
        "CsvSink failure should not break persistence execution"
    );
    let p_opt = persistence.projects.get("p-err").unwrap();
    assert!(p_opt.is_some(), "Project must still be saved to SQLite");
}
