use super::shared::PersistenceShared;
use crate::repositories::business::debug::TableRowsResponse;
use crate::repositories::shared::errors::Result;
use std::sync::Arc;

pub struct DebugPersistence {
    shared: Arc<PersistenceShared>,
}

impl DebugPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_tables(&self) -> Result<Vec<String>> {
        self.shared.business_repo.debug_get_tables()
    }

    pub fn get_table_rows(
        &self,
        table: &str,
        limit: u32,
        offset: u32,
    ) -> Result<TableRowsResponse> {
        self.shared
            .business_repo
            .debug_get_table_rows(table, limit, offset)
    }

    pub fn update_cell(
        &self,
        table: &str,
        id_column: &str,
        id_value: &str,
        column: &str,
        new_value: &str,
    ) -> Result<()> {
        self.shared
            .business_repo
            .debug_update_cell(table, id_column, id_value, column, new_value)
    }
}
