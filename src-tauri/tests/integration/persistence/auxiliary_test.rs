use crate::shared::builders::{ProjectBuilder, TaskBuilder, TimeLogBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{ExternalApiSettings, HolidayLeave, HolidayType, PatchLog, TaskStatus};

#[test]
fn test_given_empty_auxiliary_when_saving_current_project_and_variant_then_retrieves_matching_state(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_project_variant");
    let persistence = Persistence::new(&config).unwrap();
    assert_eq!(persistence.ui_state.get_current_project_id().unwrap(), None);
    assert_eq!(
        persistence.ui_state.get_last_non_compact_variant().unwrap(),
        "full"
    );

    // When
    persistence
        .ui_state
        .save_current_project_id(Some("proj-123".to_string()))
        .unwrap();
    persistence
        .ui_state
        .save_last_non_compact_variant("compact".to_string())
        .unwrap();

    // Then
    assert_eq!(
        persistence.ui_state.get_current_project_id().unwrap(),
        Some("proj-123".to_string())
    );
    assert_eq!(
        persistence.ui_state.get_last_non_compact_variant().unwrap(),
        "compact"
    );
}

#[test]
fn test_given_auxiliary_persistence_when_saving_project_order_then_retrieves_matching_order() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_project_order");
    let persistence = Persistence::new(&config).unwrap();
    assert_eq!(
        persistence.ui_state.get_project_order().unwrap(),
        Vec::<String>::new()
    );

    // When
    let custom_order = vec!["proj-b".to_string(), "proj-a".to_string()];
    persistence
        .ui_state
        .save_project_order(custom_order.clone())
        .unwrap();

    // Then
    assert_eq!(
        persistence.ui_state.get_project_order().unwrap(),
        custom_order
    );
}

#[test]
fn test_given_default_api_settings_when_updating_custom_webhook_then_persists_settings_integrity() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_api_settings");
    let persistence = Persistence::new(&config).unwrap();
    let default_api = persistence
        .external_api
        .get_external_api_settings()
        .unwrap();
    assert!(!default_api.log_to_api);

    // When
    let custom_api = ExternalApiSettings {
        log_to_api: true,
        api_token: "tok_abc".to_string(),
        api_url: "https://api.test/webhook".to_string(),
        api_method: "POST".to_string(),
        api_headers: "X-Auth: tok".to_string(),
    };
    persistence
        .external_api
        .save_external_api_settings(custom_api.clone())
        .unwrap();

    // Then
    let retrieved = persistence
        .external_api
        .get_external_api_settings()
        .unwrap();
    assert_eq!(retrieved, custom_api);
}

#[test]
fn test_given_new_holiday_leaves_when_saving_holidays_then_retrieves_all_scheduled_entries() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_holidays");
    let persistence = Persistence::new(&config).unwrap();
    let holidays = vec![HolidayLeave {
        id: "hol_1".to_string(),
        date: "2026-07-04".to_string(),
        r#type: HolidayType::Holiday,
        name: "Independence Day".to_string(),
        note: None,
        original_name: None,
        original_date: None,
        original_type: None,
        edit_history: None,
    }];

    // When
    persistence.holidays.save(holidays).unwrap();

    // Then
    let retrieved = persistence.holidays.get_all().unwrap();
    assert_eq!(retrieved.len(), 1);
    assert_eq!(retrieved[0].name, "Independence Day");
}

#[test]
fn test_given_existing_project_when_saving_patch_logs_then_retrieves_associated_patches() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_patches");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_patch_int").build();
    persistence.projects.create(project).unwrap();

    // When
    let patches = vec![PatchLog {
        id: "patch_int_1".to_string(),
        project_id: "proj_patch_int".to_string(),
        task_id: None,
        start_time: "2026-06-22T08:00:00Z".to_string(),
        end_time: "2026-06-22T08:30:00Z".to_string(),
        patch_note: "Integration patch".to_string(),
        is_system_event: Some(false),
    }];
    persistence.patches.save(patches).unwrap();

    // Then
    let retrieved = persistence.patches.get_all().unwrap();
    assert_eq!(retrieved.len(), 1);
    assert_eq!(retrieved[0].id, "patch_int_1");
    assert_eq!(retrieved[0].patch_note, "Integration patch");
}

#[test]
fn test_given_active_task_when_inserting_and_deleting_time_log_then_log_is_purged() {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_log_delete");
    let persistence = Persistence::new(&config).unwrap();
    let project = ProjectBuilder::new().with_id("proj_int").build();
    persistence.projects.create(project).unwrap();
    let task = TaskBuilder::new()
        .with_id("task_log_del")
        .with_project_id("proj_int")
        .with_status(TaskStatus::Todo)
        .build();
    persistence.tasks.create(task).unwrap();

    // When
    persistence
        .time_logs
        .insert("log_to_del", "task_log_del", "2026-06-22T08:00:00Z")
        .unwrap();
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 1);
    persistence.time_logs.delete("log_to_del").unwrap();

    // Then
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 0);
}

#[test]
fn test_given_populated_persistence_when_override_state_called_then_atomically_replaces_all_entities(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_aux_override_state");
    let persistence = Persistence::new(&config).unwrap();
    let initial_proj = ProjectBuilder::new().with_id("p_initial").build();
    persistence.projects.create(initial_proj).unwrap();

    let override_projs = vec![ProjectBuilder::new()
        .with_id("p_over")
        .with_name("Overridden Project")
        .with_color("purple")
        .build()];
    let override_tasks = vec![TaskBuilder::new()
        .with_id("t_over")
        .with_project_id("p_over")
        .with_name("Overridden Task")
        .completed(true)
        .build()];
    let override_logs = vec![TimeLogBuilder::new()
        .with_id("l_over")
        .with_project_id("p_over")
        .with_task_id("t_over")
        .with_start_time("2026-06-23T01:00:00Z")
        .with_end_time(Some("2026-06-23T02:00:00Z".to_string()))
        .with_note("Override note")
        .build()];

    // When
    persistence
        .core
        .override_state(
            Some(override_projs),
            Some(override_tasks),
            Some(override_logs),
        )
        .unwrap();

    // Then
    assert_eq!(persistence.projects.get_all().unwrap().len(), 1);
    assert_eq!(persistence.projects.get_all().unwrap()[0].id, "p_over");
    assert_eq!(persistence.tasks.get_all().unwrap().len(), 1);
    assert_eq!(persistence.tasks.get_all().unwrap()[0].id, "t_over");
    assert_eq!(persistence.time_logs.get_all().unwrap().len(), 1);
    assert_eq!(persistence.time_logs.get_all().unwrap()[0].id, "l_over");
}
