use super::helpers::{
    build, june_15, log, log_lasting, project, request, root_task, snapshot, subtask,
};
use oxyflow_timelog::types::ReportVariant;

#[test]
fn test_given_projects_with_different_time_when_building_then_the_busiest_comes_first() {
    // Arrange
    let task_a = root_task("t_a", "p_a");
    let task_b = root_task("t_b", "p_b");
    let data = snapshot(
        vec![project("p_a"), project("p_b")],
        vec![task_a.clone(), task_b.clone()],
        vec![
            log_lasting(&task_a, "l_a", 600),
            log_lasting(&task_b, "l_b", 1200),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let ids: Vec<&str> = doc.projects.iter().map(|p| p.id.as_str()).collect();
    assert_eq!(ids, ["p_b", "p_a"]);
}

#[test]
fn test_given_projects_with_equal_time_when_building_then_ids_break_the_tie_ascending() {
    // Arrange
    let task_a = root_task("t_a", "p_a");
    let task_b = root_task("t_b", "p_b");
    let data = snapshot(
        vec![project("p_b"), project("p_a")],
        vec![task_b.clone(), task_a.clone()],
        vec![
            log_lasting(&task_b, "l_b", 600),
            log_lasting(&task_a, "l_a", 600),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let ids: Vec<&str> = doc.projects.iter().map(|p| p.id.as_str()).collect();
    assert_eq!(ids, ["p_a", "p_b"]);
}

#[test]
fn test_given_root_tasks_with_equal_time_when_building_then_ids_break_the_tie_ascending() {
    // Arrange
    let task_a = root_task("t_a", "p1");
    let task_b = root_task("t_b", "p1");
    let task_c = root_task("t_c", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task_c.clone(), task_b.clone(), task_a.clone()],
        vec![
            log_lasting(&task_c, "l_c", 600),
            log_lasting(&task_a, "l_a", 600),
            log_lasting(&task_b, "l_b", 1200),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let ids: Vec<&str> = doc.projects[0]
        .tasks
        .iter()
        .map(|t| t.id.as_str())
        .collect();
    assert_eq!(ids, ["t_b", "t_a", "t_c"]);
}

#[test]
fn test_given_a_nested_hierarchy_when_building_then_subtasks_are_depth_first_pre_order() {
    // Arrange
    let root = root_task("r", "p1");
    let small = subtask("c_small", &root);
    let big = subtask("c_big", &root);
    let small_child = subtask("c_small_child", &small);
    let data = snapshot(
        vec![project("p1")],
        vec![
            root.clone(),
            small.clone(),
            big.clone(),
            small_child.clone(),
        ],
        vec![
            log_lasting(&small, "l_s", 100),
            log_lasting(&big, "l_b", 300),
            log_lasting(&small_child, "l_sc", 50),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let ids: Vec<&str> = doc.projects[0].tasks[0]
        .subtasks
        .iter()
        .map(|t| t.id.as_str())
        .collect();
    assert_eq!(ids, ["c_big", "c_small", "c_small_child"]);
}

#[test]
fn test_given_sibling_subtasks_with_equal_time_when_building_then_ids_break_the_tie_ascending() {
    // Arrange
    let root = root_task("r", "p1");
    let first = subtask("c_a", &root);
    let second = subtask("c_b", &root);
    let data = snapshot(
        vec![project("p1")],
        vec![root.clone(), second.clone(), first.clone()],
        vec![
            log_lasting(&second, "l_b", 600),
            log_lasting(&first, "l_a", 600),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let ids: Vec<&str> = doc.projects[0].tasks[0]
        .subtasks
        .iter()
        .map(|t| t.id.as_str())
        .collect();
    assert_eq!(ids, ["c_a", "c_b"]);
}

#[test]
fn test_given_unordered_logs_when_building_full_then_entries_are_sorted_by_start_then_id() {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![project("p1")],
        vec![task.clone()],
        vec![
            log(&task, "l_b", "2026-06-15T10:00:00Z", "2026-06-15T10:10:00Z"),
            log(
                &task,
                "l_late",
                "2026-06-15T12:00:00Z",
                "2026-06-15T12:10:00Z",
            ),
            log(&task, "l_a", "2026-06-15T10:00:00Z", "2026-06-15T10:10:00Z"),
            log(
                &task,
                "l_early",
                "2026-06-15T08:00:00Z",
                "2026-06-15T08:10:00Z",
            ),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let ids: Vec<&str> = doc
        .entries
        .as_ref()
        .unwrap()
        .iter()
        .map(|e| e.id.as_str())
        .collect();
    assert_eq!(ids, ["l_early", "l_a", "l_b", "l_late"]);
}

#[test]
fn test_given_the_same_snapshot_in_a_different_input_order_when_building_then_documents_are_identical(
) {
    // Arrange
    let task_a = root_task("t_a", "p1");
    let task_b = root_task("t_b", "p1");
    let logs = vec![
        log_lasting(&task_a, "l_a", 600),
        log_lasting(&task_b, "l_b", 600),
    ];
    let forward = snapshot(
        vec![project("p1")],
        vec![task_a.clone(), task_b.clone()],
        logs.clone(),
        vec![],
    );
    let reversed = snapshot(
        vec![project("p1")],
        vec![task_b, task_a],
        logs.into_iter().rev().collect(),
        vec![],
    );

    // Act
    let first = build(&forward, &request(ReportVariant::Full), &june_15());
    let second = build(&reversed, &request(ReportVariant::Full), &june_15());

    // Assert
    assert_eq!(first, second);
}
