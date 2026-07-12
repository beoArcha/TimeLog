pub mod constants;
pub mod errors;

use self::errors::Result;
use rusqlite::Connection;
use std::path::Path;
use std::time::Duration;

pub fn establish_connection(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
            | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
            | rusqlite::OpenFlags::SQLITE_OPEN_URI,
    )?;
    let _ = conn.pragma_update(None, "journal_mode", "WAL");
    let _ = conn.pragma_update(None, "foreign_keys", "ON");
    let _ = conn.busy_timeout(Duration::from_secs(5));
    Ok(conn)
}

pub fn initialize_database(conn: &Connection) -> Result<()> {
    conn.execute(constants::CREATE_PROJECTS_TABLE, [])?;
    conn.execute(constants::CREATE_TASKS_TABLE, [])?;
    conn.execute(constants::CREATE_TIME_LOGS_TABLE, [])?;
    conn.execute(constants::CREATE_CONFIG_TABLE, [])?;

    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_ARCHIVED, []);
    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_ORIGINAL_NAME, []);
    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_ORIGINAL_COLOR, []);
    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_EDIT_HISTORY, []);

    let _ = conn.execute(constants::ALTER_TASKS_ADD_ORIGINAL_NAME, []);
    let _ = conn.execute(constants::ALTER_TASKS_ADD_ORIGINAL_COMPLETED, []);
    let _ = conn.execute(constants::ALTER_TASKS_ADD_EDIT_HISTORY, []);
    let _ = conn.execute(constants::ALTER_TASKS_ADD_ARCHIVED, []);

    let _ = conn.execute(constants::ALTER_TIME_LOGS_ADD_NOTE, []);
    conn.execute(constants::CREATE_TIME_LOGS_HISTORY_TABLE, [])?;

    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_DESCRIPTION, []);
    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_ICON, []);
    let _ = conn.execute(constants::ALTER_PROJECTS_ADD_TAGS, []);
    let _ = conn.execute(constants::ALTER_TASKS_ADD_STATUS, []);
    conn.execute(constants::CREATE_RUNTIME_CONFIGS_TABLE, [])?;

    Ok(())
}
