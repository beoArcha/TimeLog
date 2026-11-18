use crate::shared::builders::{PatchLogBuilder, ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxyflow_timelog::engine::Engine;
use oxyflow_timelog::persistence::Persistence;
use oxyflow_timelog::types::ElapsedRangeFilter;
use rusqlite::Connection;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::BTreeSet;

const FIXTURE: &str = include_str!("../../../tests/fixtures/range-metrics-parity-vectors.json");
const NATIVE_RUNTIME: &str = "native";
const CREATED_AT: &str = "2026-06-01T00:00:00Z";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TaskInput {
    id: String,
    project_id: String,
}

/// The native schema has no project column on time logs: it is derived from the task by a join,
/// so the fixture's stale per-log project only matters to the browser runtime.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogInput {
    id: String,
    task_id: String,
    start_time: String,
    end_time: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PatchInput {
    id: String,
    task_id: Option<String>,
    project_id: String,
    start_time: String,
    end_time: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RangeVector {
    description: String,
    runtimes: Option<Vec<String>>,
    tasks: Vec<TaskInput>,
    logs: Vec<LogInput>,
    patches: Vec<PatchInput>,
    filter: ElapsedRangeFilter,
    expected: Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ComputedVector {
    description: String,
    runtimes: Option<Vec<String>>,
    now: String,
    projects: Vec<String>,
    tasks: Vec<TaskInput>,
    logs: Vec<LogInput>,
    expected_project_totals: Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    range_vectors: Vec<RangeVector>,
    computed_vectors: Vec<ComputedVector>,
}

fn load_fixture() -> Fixture {
    serde_json::from_str(FIXTURE).expect("parse shared range metrics fixture")
}

fn runs_natively(runtimes: &Option<Vec<String>>) -> bool {
    runtimes
        .as_ref()
        .is_none_or(|list| list.iter().any(|runtime| runtime == NATIVE_RUNTIME))
}

fn seed_projects(persistence: &Persistence, project_ids: BTreeSet<&str>) {
    for id in project_ids {
        let project = ProjectBuilder::new()
            .with_id(id)
            .with_name(id)
            .with_created_at(CREATED_AT)
            .build();
        persistence.projects.create(project).unwrap();
    }
}

fn seed_tasks_and_logs(
    persistence: &Persistence,
    conn: &Connection,
    tasks: &[TaskInput],
    logs: &[LogInput],
) {
    for task in tasks {
        let built = TaskBuilder::new()
            .with_id(&task.id)
            .with_project_id(&task.project_id)
            .with_name(&task.id)
            .with_created_at(CREATED_AT)
            .build();
        persistence.tasks.create(built).unwrap();
    }
    for log in logs {
        conn.execute(
            "INSERT INTO time_logs (id, task_id, start_time, end_time) VALUES (?, ?, ?, ?)",
            [&log.id, &log.task_id, &log.start_time, &log.end_time],
        )
        .unwrap();
    }
}

fn seed_patches(persistence: &Persistence, patches: &[PatchInput]) {
    let built = patches
        .iter()
        .map(|patch| {
            let builder = PatchLogBuilder::new()
                .with_id(&patch.id)
                .with_project_id(&patch.project_id)
                .with_start_time(&patch.start_time)
                .with_end_time(&patch.end_time);
            match &patch.task_id {
                Some(task_id) => builder.with_task_id(task_id).build(),
                None => builder.build(),
            }
        })
        .collect();
    persistence.patches.save(built).unwrap();
}

#[test]
fn test_given_shared_range_metrics_vectors_when_calculating_then_rust_attributes_to_the_task_project(
) {
    // Given
    let fixture = load_fixture();

    for (idx, vector) in fixture
        .range_vectors
        .iter()
        .enumerate()
        .filter(|(_, vector)| runs_natively(&vector.runtimes))
    {
        let (conn, config, _temp_dir) = setup_persistence_test(&format!("range_parity_{idx}"));
        let persistence = Persistence::new(&config).unwrap();
        let engine = Engine::new(&persistence);

        let mut project_ids: BTreeSet<&str> =
            vector.tasks.iter().map(|t| t.project_id.as_str()).collect();
        project_ids.extend(vector.patches.iter().map(|p| p.project_id.as_str()));
        seed_projects(&persistence, project_ids);
        seed_tasks_and_logs(&persistence, &conn, &vector.tasks, &vector.logs);
        seed_patches(&persistence, &vector.patches);

        // When
        let result = engine
            .calculate_range_metrics(&vector.filter, None)
            .unwrap();

        // Then
        let mut intervals: Vec<_> = result.clamped_logs.iter().collect();
        intervals.sort_by(|a, b| a.id.cmp(&b.id));
        let actual = json!({
            "totalSeconds": result.total_seconds,
            "projectElapsed": result.project_elapsed,
            "taskElapsed": result.task_elapsed,
            "intervals": intervals
                .iter()
                .map(|interval| json!({
                    "id": interval.id,
                    "projectId": interval.project_id,
                    "taskId": interval.task_id,
                    "clampedDurationSeconds": interval.clamped_duration_seconds,
                }))
                .collect::<Vec<_>>(),
        });
        assert_eq!(
            actual, vector.expected,
            "range metrics parity failure: {}",
            vector.description
        );
    }
}

#[test]
fn test_given_shared_computed_vectors_when_computing_then_rust_attributes_to_the_task_project() {
    // Given
    let fixture = load_fixture();

    for (idx, vector) in fixture
        .computed_vectors
        .iter()
        .enumerate()
        .filter(|(_, vector)| runs_natively(&vector.runtimes))
    {
        let (conn, config, _temp_dir) = setup_persistence_test(&format!("computed_parity_{idx}"));
        let persistence = Persistence::new(&config).unwrap();
        let engine = Engine::new(&persistence);

        let mut project_ids: BTreeSet<&str> = vector.projects.iter().map(String::as_str).collect();
        project_ids.extend(vector.tasks.iter().map(|t| t.project_id.as_str()));
        seed_projects(&persistence, project_ids);
        seed_tasks_and_logs(&persistence, &conn, &vector.tasks, &vector.logs);

        // When
        let computed = engine.get_computed_metrics(Some(&vector.now)).unwrap();

        // Then
        let actual: serde_json::Map<String, Value> = vector
            .projects
            .iter()
            .map(|id| {
                (
                    id.clone(),
                    json!(computed.projects[id].total_elapsed_seconds),
                )
            })
            .collect();
        assert_eq!(
            Value::Object(actual),
            vector.expected_project_totals,
            "computed metrics parity failure: {}",
            vector.description
        );
    }
}
