use crate::repositories::shared::errors::{RepositoryError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_pk: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableRowsResponse {
    pub columns: Vec<TableColumnInfo>,
    pub rows: Vec<HashMap<String, serde_json::Value>>,
    pub total_count: u32,
}

fn validate_identifier(name: &str) -> Result<()> {
    if name.is_empty() {
        return Err(RepositoryError::Validation(
            "Identifier cannot be empty".to_string(),
        ));
    }
    let is_valid = name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_');
    if !is_valid {
        return Err(RepositoryError::Validation(format!(
            "Invalid identifier: {name}"
        )));
    }
    Ok(())
}

pub fn get_tables(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC",
    )?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    let mut tables = Vec::new();
    for table_res in rows {
        tables.push(table_res?);
    }
    Ok(tables)
}

pub fn get_table_rows(
    conn: &Connection,
    table: &str,
    limit: u32,
    offset: u32,
) -> Result<TableRowsResponse> {
    validate_identifier(table)?;

    let pragma_sql = format!("PRAGMA table_info(\"{table}\")");
    let mut pragma_stmt = conn.prepare(&pragma_sql)?;
    let mut columns = Vec::new();
    let mut col_rows = pragma_stmt.query([])?;
    while let Some(row) = col_rows.next()? {
        let name: String = row.get(1)?;
        let data_type: String = row.get(2)?;
        let pk: i64 = row.get(5)?;
        columns.push(TableColumnInfo {
            name,
            data_type,
            is_pk: pk > 0,
        });
    }

    let count_sql = format!("SELECT COUNT(*) FROM \"{table}\"");
    let total_count: u32 = conn
        .query_row(&count_sql, [], |row| row.get(0))
        .unwrap_or(0);

    let select_sql = format!("SELECT * FROM \"{table}\" LIMIT ? OFFSET ?");
    let mut stmt = conn.prepare(&select_sql)?;
    let col_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let mut rows = Vec::new();
    let mut data_rows = stmt.query([limit, offset])?;
    while let Some(row) = data_rows.next()? {
        let mut row_map = HashMap::new();
        for (i, col_name) in col_names.iter().enumerate() {
            let val_ref = row.get_ref(i)?;
            let json_val = match val_ref {
                rusqlite::types::ValueRef::Null => serde_json::Value::Null,
                rusqlite::types::ValueRef::Integer(v) => serde_json::json!(v),
                rusqlite::types::ValueRef::Real(v) => serde_json::json!(v),
                rusqlite::types::ValueRef::Text(v) => {
                    let s = String::from_utf8_lossy(v).to_string();
                    serde_json::Value::String(s)
                }
                rusqlite::types::ValueRef::Blob(v) => {
                    serde_json::Value::String(format!("<Blob {} bytes>", v.len()))
                }
            };
            row_map.insert(col_name.clone(), json_val);
        }
        rows.push(row_map);
    }

    Ok(TableRowsResponse {
        columns,
        rows,
        total_count,
    })
}

pub fn update_cell(
    conn: &Connection,
    table: &str,
    id_column: &str,
    id_value: &str,
    column: &str,
    new_value: &str,
) -> Result<()> {
    validate_identifier(table)?;
    validate_identifier(id_column)?;
    validate_identifier(column)?;

    let update_sql = format!("UPDATE \"{table}\" SET \"{column}\" = ? WHERE \"{id_column}\" = ?");
    conn.execute(&update_sql, [new_value, id_value])?;
    Ok(())
}
