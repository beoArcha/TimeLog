use super::helpers::{
    build, june_15, log_lasting, project, request, root_task, snapshot, subtask, utc_range,
    ThreeLevels,
};
use oxyflow_timelog::types::ReportVariant;

fn three_level_logs(levels: &ThreeLevels) -> Vec<oxyflow_timelog::types::TimeLog> {
    vec![
        log_lasting(&levels.root, "l_r", 600),
        log_lasting(&levels.child, "l_c", 1200),
        log_lasting(&levels.grandchild, "l_g", 1800),
    ]
}

#[test]
fn test_given_time_at_three_levels_when_building_then_seconds_roll_up_to_every_ancestor() {
    // Arrange
    let levels = ThreeLevels::new();
    let logs = three_level_logs(&levels);
    let data = snapshot(vec![levels.project.clone()], levels.tasks(), logs, vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let root = &doc.projects[0].tasks[0];
    assert_eq!(root.seconds, 3600);
    assert_eq!(root.subtasks[0].seconds, 3000);
    assert_eq!(root.subtasks[1].seconds, 1800);
    assert_eq!(doc.projects[0].seconds, 3600);
    assert_eq!(doc.totals.seconds, 3600);
}

#[test]
fn test_given_time_at_three_levels_when_building_then_direct_seconds_exclude_descendants() {
    // Arrange
    let levels = ThreeLevels::new();
    let logs = three_level_logs(&levels);
    let data = snapshot(vec![levels.project.clone()], levels.tasks(), logs, vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let root = &doc.projects[0].tasks[0];
    assert_eq!(root.direct_seconds, 600);
    assert_eq!(root.subtasks[0].direct_seconds, 1200);
    assert_eq!(root.subtasks[1].direct_seconds, 1800);
}

#[test]
fn test_given_time_only_on_a_grandchild_when_building_then_its_ancestors_have_zero_direct_seconds()
{
    // Arrange
    let levels = ThreeLevels::new();
    let logs = vec![log_lasting(&levels.grandchild, "l_g", 900)];
    let data = snapshot(vec![levels.project.clone()], levels.tasks(), logs, vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let root = &doc.projects[0].tasks[0];
    assert_eq!(root.direct_seconds, 0);
    assert_eq!(root.seconds, 900);
    assert_eq!(root.subtasks[0].direct_seconds, 0);
    assert_eq!(root.subtasks[0].seconds, 900);
}

#[test]
fn test_given_a_three_level_hierarchy_when_building_then_each_subtask_names_its_immediate_parent() {
    // Arrange
    let levels = ThreeLevels::new();
    let logs = vec![log_lasting(&levels.grandchild, "l_g", 900)];
    let data = snapshot(vec![levels.project.clone()], levels.tasks(), logs, vec![]);

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let subtasks = &doc.projects[0].tasks[0].subtasks;
    assert_eq!(subtasks[0].parent_task_id, "r");
    assert_eq!(subtasks[1].parent_task_id, "c");
}

#[test]
fn test_given_idle_tasks_and_projects_when_building_then_they_are_omitted() {
    // Arrange
    let levels = ThreeLevels::new();
    let mut tasks = levels.tasks();
    tasks.push(root_task("t_idle", "p_idle"));
    let logs = vec![log_lasting(&levels.root, "l_r", 600)];
    let data = snapshot(
        vec![levels.project.clone(), project("p_idle")],
        tasks,
        logs,
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.projects.len(), 1);
    assert!(doc.projects[0].tasks[0].subtasks.is_empty());
}

#[test]
fn test_given_a_project_filter_when_building_then_only_that_project_is_reported() {
    // Arrange
    let task_a = root_task("t_a", "p_a");
    let task_b = root_task("t_b", "p_b");
    let data = snapshot(
        vec![project("p_a"), project("p_b")],
        vec![task_a.clone(), task_b.clone()],
        vec![
            log_lasting(&task_a, "l_a", 600),
            log_lasting(&task_b, "l_b", 900),
        ],
        vec![],
    );
    let mut req = request(ReportVariant::Summary);
    req.project_id = Some("p_b".to_string());

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.projects.len(), 1);
    assert_eq!(doc.projects[0].id, "p_b");
    assert_eq!(doc.totals.seconds, 900);
    assert_eq!(doc.filters.project_id.as_deref(), Some("p_b"));
}

#[test]
fn test_given_a_root_task_filter_when_building_then_its_descendants_are_included() {
    // Arrange
    let levels = ThreeLevels::new();
    let other = root_task("r_other", "p1");
    let mut tasks = levels.tasks();
    tasks.push(other.clone());
    let logs = vec![
        log_lasting(&levels.root, "l_r", 600),
        log_lasting(&levels.child, "l_c", 1200),
        log_lasting(&other, "l_o", 5000),
    ];
    let data = snapshot(vec![levels.project.clone()], tasks, logs, vec![]);
    let mut req = request(ReportVariant::Summary);
    req.task_id = Some("r".to_string());

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    assert_eq!(doc.totals.seconds, 1800);
    assert_eq!(doc.projects[0].tasks.len(), 1);
    assert_eq!(doc.projects[0].tasks[0].subtasks.len(), 1);
}

#[test]
fn test_given_a_subtask_filter_when_building_then_siblings_and_ancestor_time_are_excluded() {
    // Arrange
    let levels = ThreeLevels::new();
    let sibling = subtask("c_sibling", &levels.root);
    let mut tasks = levels.tasks();
    tasks.push(sibling.clone());
    let logs = vec![
        log_lasting(&levels.root, "l_r", 600),
        log_lasting(&levels.grandchild, "l_g", 1800),
        log_lasting(&sibling, "l_s", 4000),
    ];
    let data = snapshot(vec![levels.project.clone()], tasks, logs, vec![]);
    let mut req = request(ReportVariant::Summary);
    req.task_id = Some("c".to_string());

    // Act
    let doc = build(&data, &req, &june_15());

    // Assert
    let root = &doc.projects[0].tasks[0];
    assert_eq!(doc.totals.seconds, 1800);
    assert_eq!(root.direct_seconds, 0);
    assert_eq!(root.subtasks.len(), 2);
}

#[test]
fn test_given_a_range_without_time_when_building_then_totals_are_zero_and_arrays_empty() {
    // Arrange
    let levels = ThreeLevels::new();
    let data = snapshot(
        vec![levels.project.clone()],
        levels.tasks(),
        vec![log_lasting(&levels.root, "l_r", 600)],
        vec![],
    );
    let other_day = utc_range("2026-07-01T00:00:00Z", "2026-07-02T00:00:00Z");

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &other_day);

    // Assert
    assert_eq!(doc.totals.seconds, 0);
    assert_eq!(doc.totals.entry_count, 0);
    assert!(doc.projects.is_empty());
}
