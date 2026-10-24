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
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.busy_timeout(Duration::from_secs(5))?;
    Ok(conn)
}

pub(crate) fn parse_json_column<T: serde::de::DeserializeOwned>(
    col_idx: usize,
    raw_opt: Option<String>,
) -> rusqlite::Result<Option<T>> {
    match raw_opt {
        None => Ok(None),
        Some(s) if s.trim().is_empty() || s.trim() == "null" => Ok(None),
        Some(s) => match serde_json::from_str::<T>(&s) {
            Ok(val) => Ok(Some(val)),
            Err(err) => Err(rusqlite::Error::FromSqlConversionFailure(
                col_idx,
                rusqlite::types::Type::Text,
                Box::new(err),
            )),
        },
    }
}

fn has_column(conn: &Connection, table: &str, column: &str) -> Result<bool> {
    let pragma_sql = format!("PRAGMA table_info({table})");
    let mut stmt = conn.prepare(&pragma_sql)?;
    let mut rows = stmt.query([])?;
    while let Some(row) = rows.next()? {
        let name: String = row.get(1)?;
        if name.eq_ignore_ascii_case(column) {
            return Ok(true);
        }
    }
    Ok(false)
}

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    alter_sql: &str,
) -> Result<()> {
    if !has_column(conn, table, column)? {
        conn.execute(alter_sql, [])?;
    }
    Ok(())
}

fn is_migration_applied(conn: &Connection, version: i32) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT 1 FROM schema_migrations WHERE version = ?1")?;
    let exists = stmt.exists([version])?;
    Ok(exists)
}

fn record_migration(conn: &Connection, version: i32) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
        rusqlite::params![version, now],
    )?;
    Ok(())
}

struct Migration {
    version: i32,
    apply: fn(&Connection) -> Result<()>,
}

fn apply_migration_1(conn: &Connection) -> Result<()> {
    conn.execute(constants::CREATE_PROJECTS_TABLE, [])?;
    conn.execute(constants::CREATE_TASKS_TABLE, [])?;
    conn.execute(constants::CREATE_TIME_LOGS_TABLE, [])?;
    conn.execute(constants::CREATE_CONFIG_TABLE, [])?;
    Ok(())
}

fn apply_migration_2(conn: &Connection) -> Result<()> {
    add_column_if_missing(
        conn,
        "projects",
        "archived",
        constants::ALTER_PROJECTS_ADD_ARCHIVED,
    )?;
    add_column_if_missing(
        conn,
        "projects",
        "original_name",
        constants::ALTER_PROJECTS_ADD_ORIGINAL_NAME,
    )?;
    add_column_if_missing(
        conn,
        "projects",
        "original_color",
        constants::ALTER_PROJECTS_ADD_ORIGINAL_COLOR,
    )?;
    add_column_if_missing(
        conn,
        "projects",
        "edit_history",
        constants::ALTER_PROJECTS_ADD_EDIT_HISTORY,
    )?;
    Ok(())
}

fn apply_migration_3(conn: &Connection) -> Result<()> {
    add_column_if_missing(
        conn,
        "tasks",
        "original_name",
        constants::ALTER_TASKS_ADD_ORIGINAL_NAME,
    )?;
    add_column_if_missing(
        conn,
        "tasks",
        "original_completed",
        constants::ALTER_TASKS_ADD_ORIGINAL_COMPLETED,
    )?;
    add_column_if_missing(
        conn,
        "tasks",
        "edit_history",
        constants::ALTER_TASKS_ADD_EDIT_HISTORY,
    )?;
    add_column_if_missing(
        conn,
        "tasks",
        "archived",
        constants::ALTER_TASKS_ADD_ARCHIVED,
    )?;
    Ok(())
}

fn apply_migration_4(conn: &Connection) -> Result<()> {
    add_column_if_missing(
        conn,
        "time_logs",
        "note",
        constants::ALTER_TIME_LOGS_ADD_NOTE,
    )?;
    conn.execute(constants::CREATE_TIME_LOGS_HISTORY_TABLE, [])?;
    Ok(())
}

fn apply_migration_5(conn: &Connection) -> Result<()> {
    add_column_if_missing(
        conn,
        "projects",
        "description",
        constants::ALTER_PROJECTS_ADD_DESCRIPTION,
    )?;
    add_column_if_missing(conn, "projects", "icon", constants::ALTER_PROJECTS_ADD_ICON)?;
    add_column_if_missing(conn, "projects", "tags", constants::ALTER_PROJECTS_ADD_TAGS)?;
    add_column_if_missing(
        conn,
        "projects",
        "allow_concurrency",
        constants::ALTER_PROJECTS_ADD_ALLOW_CONCURRENCY,
    )?;
    add_column_if_missing(conn, "tasks", "status", constants::ALTER_TASKS_ADD_STATUS)?;
    Ok(())
}

fn apply_migration_6(conn: &Connection) -> Result<()> {
    conn.execute(constants::CREATE_RUNTIME_CONFIGS_TABLE, [])?;
    conn.execute(constants::CREATE_HOLIDAYS_TABLE, [])?;
    conn.execute(constants::CREATE_PATCHES_TABLE, [])?;
    conn.execute(constants::CREATE_WEBHOOK_QUEUE_TABLE, [])?;
    conn.execute(constants::CREATE_CLI_ALIASES_TABLE, [])?;
    conn.execute(constants::CREATE_CLI_SINKS_TABLE, [])?;
    Ok(())
}

pub fn initialize_database(conn: &Connection) -> Result<()> {
    conn.execute(constants::CREATE_SCHEMA_MIGRATIONS_TABLE, [])?;

    let migrations: [Migration; 6] = [
        Migration {
            version: 1,
            apply: apply_migration_1,
        },
        Migration {
            version: 2,
            apply: apply_migration_2,
        },
        Migration {
            version: 3,
            apply: apply_migration_3,
        },
        Migration {
            version: 4,
            apply: apply_migration_4,
        },
        Migration {
            version: 5,
            apply: apply_migration_5,
        },
        Migration {
            version: 6,
            apply: apply_migration_6,
        },
    ];

    for migration in migrations {
        if !is_migration_applied(conn, migration.version)? {
            let tx = conn.unchecked_transaction()?;
            (migration.apply)(&tx)?;
            record_migration(&tx, migration.version)?;
            tx.commit()?;
        }
    }

    Ok(())
}
