use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use clap::Parser;
use oxy_flow::cli::{handle_cli, CliArgs};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;

#[test]
fn test_given_project_when_task_add_invoked_then_persists_task_under_project() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-01")
        .with_name("Main App")
        .build();
    persistence.projects.create(proj).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "task", "add", "Build API", "-p", "Main App"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let tasks = persistence.tasks.get_all().unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0].name, "Build API");
    assert_eq!(tasks[0].project_id, "p-t-01");
}

#[test]
fn test_given_parent_task_when_subtask_added_via_cli_then_persisted_under_parent() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_subtask_add");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-02")
        .with_name("Mobile App")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-parent-01")
        .with_project_id("p-t-02")
        .with_name("Authentication Screen")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "t",
        "add",
        "Biometric FaceID",
        "-p",
        "Mobile App",
        "--parent",
        "Authentication Screen",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let subtasks = persistence.tasks.get_subtasks("t-parent-01").unwrap();
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].name, "Biometric FaceID");
}

#[test]
fn test_given_incomplete_task_when_done_invoked_then_marks_task_completed() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_done");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-03")
        .with_name("Done Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-done-01")
        .with_project_id("p-t-03")
        .with_name("Finish Migration")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "t", "done", "Finish Migration"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-done-01").unwrap().unwrap();
    assert!(task_in_db.completed);
}

#[test]
fn test_given_existing_task_when_renaming_via_cli_then_database_reflects_new_name() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_ren");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-04")
        .with_name("Ren Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-ren-01")
        .with_project_id("p-t-04")
        .with_name("Old Task Name")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "t", "ren", "Old Task Name", "Refactored Task Name"])
            .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-ren-01").unwrap().unwrap();
    assert_eq!(task_in_db.name, "Refactored Task Name");
}

#[test]
fn test_given_projects_and_tasks_when_task_list_invoked_then_displays_hierarchy_with_subtasks() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_hierarchy_ls");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-t-05")
        .with_name("List Proj")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-list-parent")
        .with_project_id("p-t-05")
        .with_name("Parent Container")
        .build();
    let subtask = TaskBuilder::new()
        .with_id("t-list-child")
        .with_project_id("p-t-05")
        .with_parent("t-list-parent")
        .with_name("Nested Child Task")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(subtask).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "t", "ls", "--all"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let output_str = format!("{}", result.unwrap());
    assert!(output_str.contains("Parent Container"));
    assert!(output_str.contains("Nested Child Task"));
}

#[test]
fn test_given_configured_persistence_when_adding_task_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_add_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-task-mach")
        .with_name("Mach Project")
        .build();
    persistence.projects.create(proj).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "task",
        "add",
        "Mach Task",
        "-p",
        "Mach Project",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "created");
    assert!(parsed["id"].is_string());
}

#[test]
fn test_given_existing_tasks_when_listing_in_machine_mode_then_returns_clean_json_array() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_ls_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-task-ls")
        .with_name("List Task Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-mach-01")
        .with_project_id("p-task-ls")
        .with_name("Machine Listed Task")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "--machine", "task", "ls", "--all"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON array");
    assert!(parsed.is_array());
    assert_eq!(parsed[0]["name"], "Machine Listed Task");
}

#[test]
fn test_given_existing_task_when_marking_done_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_done_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-task-done")
        .with_name("Done Task Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-done-mach")
        .with_project_id("p-task-done")
        .with_name("Task To Complete")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "--machine", "task", "done", "Task To Complete"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "completed");
    assert_eq!(parsed["id"], "t-done-mach");
}

#[test]
fn test_given_existing_task_when_renaming_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_ren_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-task-ren")
        .with_name("Ren Task Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-ren-mach")
        .with_project_id("p-task-ren")
        .with_name("Before Rename")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--machine",
        "task",
        "ren",
        "Before Rename",
        "After Rename",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "renamed");
    assert_eq!(parsed["id"], "t-ren-mach");
}

#[test]
fn test_given_existing_task_when_archiving_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_rm_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-task-rm")
        .with_name("Rm Task Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-rm-mach")
        .with_project_id("p-task-rm")
        .with_name("Task To Archive")
        .build();
    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(task).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "--machine", "task", "rm", "Task To Archive"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "archived");
    assert_eq!(parsed["id"], "t-rm-mach");
}

#[test]
fn test_given_task_and_new_parent_when_reparent_invoked_then_hierarchy_is_updated() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_reparent");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-rep-1")
        .with_name("Reparent Proj")
        .build();
    let parent1 = TaskBuilder::new()
        .with_id("t-p1")
        .with_project_id("p-rep-1")
        .with_name("Parent 1")
        .build();
    let parent2 = TaskBuilder::new()
        .with_id("t-p2")
        .with_project_id("p-rep-1")
        .with_name("Parent 2")
        .build();
    let child = TaskBuilder::new()
        .with_id("t-c1")
        .with_project_id("p-rep-1")
        .with_parent("t-p1")
        .with_name("Child Task")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent1).unwrap();
    persistence.tasks.create(parent2).unwrap();
    persistence.tasks.create(child).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "task", "reparent", "Child Task", "Parent 2"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-c1").unwrap().unwrap();
    assert_eq!(task_in_db.parent_task_id.as_deref(), Some("t-p2"));
}

#[test]
fn test_given_task_when_reparent_to_self_or_descendant_then_fails_with_business_constraint() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_reparent_cycle");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-rep-cycle")
        .with_name("Reparent Cycle Proj")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-cycle-p")
        .with_project_id("p-rep-cycle")
        .with_name("Top Parent")
        .build();
    let child = TaskBuilder::new()
        .with_id("t-cycle-c")
        .with_project_id("p-rep-cycle")
        .with_parent("t-cycle-p")
        .with_name("Nested Child")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(child).unwrap();

    // Attempt to reparent task to itself
    let self_args =
        CliArgs::try_parse_from(["oxy", "task", "reparent", "Top Parent", "Top Parent"]).unwrap();
    let self_res = handle_cli(self_args, &persistence, &engine);
    assert!(self_res.is_err());
    assert_eq!(self_res.unwrap_err().exit_code(), 1);

    // Attempt to reparent parent under its own child (cycle)
    let cycle_args =
        CliArgs::try_parse_from(["oxy", "task", "reparent", "Top Parent", "Nested Child"]).unwrap();
    let cycle_res = handle_cli(cycle_args, &persistence, &engine);
    assert!(cycle_res.is_err());
    assert_eq!(cycle_res.unwrap_err().exit_code(), 1);
}

#[test]
fn test_given_subtask_when_reparented_to_none_then_promoted_to_root() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_reparent_detach");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-detach")
        .with_name("Detach Proj")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-detach-p")
        .with_project_id("p-detach")
        .with_name("Parent Node")
        .build();
    let child = TaskBuilder::new()
        .with_id("t-detach-c")
        .with_project_id("p-detach")
        .with_parent("t-detach-p")
        .with_name("To Detach")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(child).unwrap();

    let args = CliArgs::try_parse_from(["oxy", "task", "reparent", "To Detach", "none"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let task_in_db = persistence.tasks.get("t-detach-c").unwrap().unwrap();
    assert_eq!(task_in_db.parent_task_id, None);
}

#[test]
fn test_given_task_with_subtasks_when_move_to_new_project_then_cascades_project_id() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_move");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let p1 = ProjectBuilder::new()
        .with_id("p-move-1")
        .with_name("Source Project")
        .build();
    let p2 = ProjectBuilder::new()
        .with_id("p-move-2")
        .with_name("Target Project")
        .build();
    let root = TaskBuilder::new()
        .with_id("t-move-root")
        .with_project_id("p-move-1")
        .with_name("Feature Epic")
        .build();
    let subtask = TaskBuilder::new()
        .with_id("t-move-sub")
        .with_project_id("p-move-1")
        .with_parent("t-move-root")
        .with_name("Feature Implementation")
        .build();

    persistence.projects.create(p1).unwrap();
    persistence.projects.create(p2).unwrap();
    persistence.tasks.create(root).unwrap();
    persistence.tasks.create(subtask).unwrap();

    let args =
        CliArgs::try_parse_from(["oxy", "task", "move", "Feature Epic", "Target Project"]).unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let root_in_db = persistence.tasks.get("t-move-root").unwrap().unwrap();
    let sub_in_db = persistence.tasks.get("t-move-sub").unwrap().unwrap();
    assert_eq!(root_in_db.project_id, "p-move-2");
    assert_eq!(sub_in_db.project_id, "p-move-2");
    assert_eq!(sub_in_db.parent_task_id.as_deref(), Some("t-move-root"));
}

#[test]
fn test_given_task_when_reparent_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_reparent_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let proj = ProjectBuilder::new()
        .with_id("p-mach-rep")
        .with_name("Machine Reparent")
        .build();
    let parent = TaskBuilder::new()
        .with_id("t-mach-p")
        .with_project_id("p-mach-rep")
        .with_name("Parent Node")
        .build();
    let child = TaskBuilder::new()
        .with_id("t-mach-c")
        .with_project_id("p-mach-rep")
        .with_name("Child Node")
        .build();

    persistence.projects.create(proj).unwrap();
    persistence.tasks.create(parent).unwrap();
    persistence.tasks.create(child).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--machine",
        "task",
        "reparent",
        "Child Node",
        "Parent Node",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "reparented");
    assert_eq!(parsed["id"], "t-mach-c");
    assert_eq!(parsed["parent_id"], "t-mach-p");
}

#[test]
fn test_given_task_when_move_in_machine_mode_then_returns_json_envelope() {
    // Given
    let (_conn, config, _temp) = setup_persistence_test("test_entity_task_move_machine");
    let persistence = Persistence::new(&config).expect("failed to create persistence");
    let engine = Engine::new(&persistence);

    let p1 = ProjectBuilder::new()
        .with_id("p-src")
        .with_name("Source Proj")
        .build();
    let p2 = ProjectBuilder::new()
        .with_id("p-dst")
        .with_name("Destination Proj")
        .build();
    let task = TaskBuilder::new()
        .with_id("t-to-move")
        .with_project_id("p-src")
        .with_name("Task To Move")
        .build();

    persistence.projects.create(p1).unwrap();
    persistence.projects.create(p2).unwrap();
    persistence.tasks.create(task).unwrap();

    let args = CliArgs::try_parse_from([
        "oxy",
        "--json",
        "task",
        "move",
        "Task To Move",
        "Destination Proj",
    ])
    .unwrap();

    // When
    let result = handle_cli(args, &persistence, &engine);

    // Then
    assert!(result.is_ok());
    let rendered = format!("{}", result.unwrap());
    assert!(!rendered.contains('✅'));
    let parsed: serde_json::Value = serde_json::from_str(&rendered).expect("valid JSON envelope");
    assert_eq!(parsed["status"], "ok");
    assert_eq!(parsed["action"], "moved");
    assert_eq!(parsed["id"], "t-to-move");
    assert_eq!(parsed["project_id"], "p-dst");
}
