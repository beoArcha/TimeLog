use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use std::sync::Arc;
use std::thread;

#[test]
fn test_given_non_concurrent_projects_when_timers_started_concurrently_then_at_most_one_timer_remains_active(
) {
    // Given
    let (_conn, config, _temp_dir) = setup_persistence_test("int_concurrency_race");
    let persistence = Persistence::new(&config).unwrap();

    let proj_a = ProjectBuilder::new()
        .with_id("p_race_a")
        .with_name("Race Project A")
        .with_color("blue")
        .with_allow_concurrency(false)
        .build();
    let proj_b = ProjectBuilder::new()
        .with_id("p_race_b")
        .with_name("Race Project B")
        .with_color("red")
        .with_allow_concurrency(false)
        .build();
    persistence.projects.create(proj_a).unwrap();
    persistence.projects.create(proj_b).unwrap();

    let task_a = TaskBuilder::new()
        .with_id("t_race_a")
        .with_project_id("p_race_a")
        .with_name("Race Task A")
        .build();
    let task_b = TaskBuilder::new()
        .with_id("t_race_b")
        .with_project_id("p_race_b")
        .with_name("Race Task B")
        .build();
    persistence.tasks.create(task_a).unwrap();
    persistence.tasks.create(task_b).unwrap();

    let config_arc = Arc::new(config);

    // When: spawn two threads calling start_timer concurrently on non-concurrent projects
    let config_1 = Arc::clone(&config_arc);
    let handle_1 = thread::spawn(move || {
        let p = Persistence::new(&config_1).unwrap();
        let e = Engine::new(&p);
        e.start_timer("t_race_a")
    });

    let config_2 = Arc::clone(&config_arc);
    let handle_2 = thread::spawn(move || {
        let p = Persistence::new(&config_2).unwrap();
        let e = Engine::new(&p);
        e.start_timer("t_race_b")
    });

    let res_1 = handle_1.join().expect("Thread 1 should not panic");
    let res_2 = handle_2.join().expect("Thread 2 should not panic");

    // Then: at least one thread must succeed, and the database must NEVER have multiple active non-concurrent timers
    assert!(
        res_1.is_ok() || res_2.is_ok(),
        "At least one concurrent start_timer operation must succeed"
    );

    let final_engine = Engine::new(&persistence);
    let active_logs = final_engine.get_active_logs().unwrap();
    assert_eq!(
        active_logs.len(),
        1,
        "Exactly one active timer must remain active across non-concurrent projects"
    );
}
