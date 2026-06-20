use crate::common::AppError;
use crate::engine::counting;
use rusqlite::Connection;

pub fn start(conn: &Connection, task_id: &str) -> Result<(), AppError> {
    counting::start_project_timer(conn, task_id)?;
    Ok(())
}

pub fn stop(conn: &Connection, project_id: Option<&str>) -> Result<(), AppError> {
    counting::stop_project_timer(conn, project_id)?;
    Ok(())
}

pub fn get_active(conn: &Connection) -> Result<Vec<String>, AppError> {
    let ids = counting::query_active_logs(conn)?;
    Ok(ids)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::test_helpers::TestDb;

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
        let active = get_active(&conn).expect("get_active failed");
        assert_eq!(active.len(), 0, "No active logs expected on fresh DB");
    }

    #[test]
    fn test_start_timer() {
        let conn = setup();
        start(&conn, "t1").expect("start failed");
        let active = get_active(&conn).expect("get_active failed");
        assert_eq!(active.len(), 1);
        assert_eq!(active[0], "t1");
    }

    #[test]
    fn test_start_timer_nonexistent_task_fails() {
        let conn = setup();
        let result = start(&conn, "nonexistent");
        assert!(result.is_err(), "Starting nonexistent task should fail");
    }

    #[test]
    fn test_stop_timer_by_project() {
        let conn = setup();
        start(&conn, "t1").expect("start failed");
        stop(&conn, Some("p1")).expect("stop by project failed");
        let active = get_active(&conn).expect("get_active failed");
        assert_eq!(active.len(), 0, "No active logs after stop by project");
    }

    #[test]
    fn test_stop_all_timers() {
        let conn = TestDb { conn: setup() }
            .with_project("p2", "Proj2", "blue")
            .with_task("t3", "p2", "Task3")
            .conn;

        start(&conn, "t1").expect("start t1 failed");
        start(&conn, "t3").expect("start t3 failed");
        let active = get_active(&conn).expect("get_active failed");
        assert_eq!(active.len(), 2, "Two timers should be running");

        stop(&conn, None).expect("stop all failed");
        let active_after = get_active(&conn).expect("get_active after stop failed");
        assert_eq!(active_after.len(), 0, "All timers stopped");
    }

    #[test]
    fn test_stop_when_no_active_logs_is_ok() {
        let conn = setup();
        let result = stop(&conn, None);
        assert!(result.is_ok(), "Stopping with nothing active should be Ok");
    }

    #[test]
    fn test_get_active_logs_with_running_timer() {
        let conn = setup();
        start(&conn, "t1").expect("start failed");
        let active = get_active(&conn).expect("get_active failed");
        assert!(active.contains(&"t1".to_string()), "t1 should be active");
    }
}
