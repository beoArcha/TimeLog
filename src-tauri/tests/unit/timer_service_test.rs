use crate::shared::test_db::TestDb;
use oxy_flow::services::timer_service;
use rusqlite::Connection;

fn setup() -> Connection {
    TestDb::new()
        .with_project("p1", "Proj1", "red")
        .with_task("t1", "p1", "Task1")
        .with_task("t2", "p1", "Task2")
        .conn
}

#[test]
fn test_get_active_logs_empty() {
    let conn = setup();
    let active = timer_service::get_active(&conn).expect("get_active failed");
    assert_eq!(active.len(), 0, "No active logs expected on fresh DB");
}

#[test]
fn test_start_timer() {
    let conn = setup();
    timer_service::start(&conn, "t1").expect("start failed");
    let active = timer_service::get_active(&conn).expect("get_active failed");
    assert_eq!(active.len(), 1);
    assert_eq!(active[0], "t1");
}

#[test]
fn test_start_timer_nonexistent_task_fails() {
    let conn = setup();
    let result = timer_service::start(&conn, "nonexistent");
    assert!(result.is_err(), "Starting nonexistent task should fail");
}

#[test]
fn test_stop_timer_by_project() {
    let conn = setup();
    timer_service::start(&conn, "t1").expect("start failed");
    timer_service::stop(&conn, Some("p1")).expect("stop by project failed");
    let active = timer_service::get_active(&conn).expect("get_active failed");
    assert_eq!(active.len(), 0, "No active logs after stop by project");
}

#[test]
fn test_stop_all_timers() {
    let conn = TestDb { conn: setup() }
        .with_project("p2", "Proj2", "blue")
        .with_task("t3", "p2", "Task3")
        .conn;

    timer_service::start(&conn, "t1").expect("start t1 failed");
    timer_service::start(&conn, "t3").expect("start t3 failed");
    let active = timer_service::get_active(&conn).expect("get_active failed");
    assert_eq!(active.len(), 2, "Two timers should be running");

    timer_service::stop(&conn, None).expect("stop all failed");
    let active_after = timer_service::get_active(&conn).expect("get_active after stop failed");
    assert_eq!(active_after.len(), 0, "All timers stopped");
}

#[test]
fn test_stop_when_no_active_logs_is_ok() {
    let conn = setup();
    let result = timer_service::stop(&conn, None);
    assert!(result.is_ok(), "Stopping with nothing active should be Ok");
}

#[test]
fn test_get_active_logs_with_running_timer() {
    let conn = setup();
    timer_service::start(&conn, "t1").expect("start failed");
    let active = timer_service::get_active(&conn).expect("get_active failed");
    assert!(active.contains(&"t1".to_string()), "t1 should be active");
}
