use crate::shared::builders::{PatchLogBuilder, ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::{NewTimeLog, RangeRequest, ReportRequest, ReportVariant};

fn full_day_request() -> ReportRequest {
    ReportRequest {
        range: RangeRequest {
            preset: None,
            from: Some("2026-06-15".to_string()),
            to: Some("2026-06-15".to_string()),
            timezone: Some("UTC".to_string()),
        },
        project_id: None,
        task_id: None,
        variant: ReportVariant::Full,
        include_patches: Some(true),
    }
}

fn new_log(id: &str, task_id: &str, start: &str, end: &str) -> NewTimeLog {
    NewTimeLog {
        id: id.to_string(),
        task_id: task_id.to_string(),
        start_time: start.to_string(),
        end_time: Some(end.to_string()),
        note: None,
    }
}

#[test]
fn test_given_persisted_logs_and_a_patch_when_building_a_report_then_the_document_reflects_the_database(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_report_build");
    let persistence = Persistence::new(&config).unwrap();
    let engine = Engine::new(&persistence);

    let project = ProjectBuilder::new()
        .with_id("p_rep")
        .with_name("Report Project")
        .build();
    persistence.projects.create(project).unwrap();
    let root = TaskBuilder::new()
        .with_id("t_root")
        .with_project_id("p_rep")
        .with_name("Root")
        .build();
    persistence.tasks.create(root).unwrap();
    let child = TaskBuilder::new()
        .with_id("t_child")
        .with_project_id("p_rep")
        .with_parent("t_root")
        .with_name("Child")
        .build();
    persistence.tasks.create_subtask(child).unwrap();

    persistence
        .time_logs
        .insert_full(&new_log(
            "l_root",
            "t_root",
            "2026-06-15T09:00:00Z",
            "2026-06-15T10:00:00Z",
        ))
        .unwrap();
    persistence
        .time_logs
        .insert_full(&new_log(
            "l_child",
            "t_child",
            "2026-06-15T11:00:00Z",
            "2026-06-15T11:30:00Z",
        ))
        .unwrap();
    let patch = PatchLogBuilder::new()
        .with_id("pl_rep")
        .with_project_id("p_rep")
        .with_start_time("2026-06-15T12:00:00Z")
        .with_end_time("2026-06-15T12:15:00Z")
        .build();
    persistence.patches.save(vec![patch]).unwrap();

    // When
    let doc = engine.build_report(&full_day_request()).unwrap();

    // Then
    assert_eq!(doc.range.from.as_deref(), Some("2026-06-15T00:00:00Z"));
    assert_eq!(doc.range.to.as_deref(), Some("2026-06-16T00:00:00Z"));
    assert_eq!(doc.totals.seconds, 3600 + 1800 + 900);
    assert_eq!(doc.totals.entry_count, 3);

    let project = &doc.projects[0];
    assert_eq!(project.id, "p_rep");
    assert_eq!(project.direct_seconds, 900);
    assert_eq!(project.tasks[0].seconds, 5400);
    assert_eq!(project.tasks[0].subtasks[0].id, "t_child");
    assert_eq!(project.tasks[0].subtasks[0].parent_task_id, "t_root");

    let entry_ids: Vec<&str> = doc
        .entries
        .as_ref()
        .unwrap()
        .iter()
        .map(|entry| entry.id.as_str())
        .collect();
    assert_eq!(entry_ids, ["l_root", "l_child", "pl_rep"]);
}
