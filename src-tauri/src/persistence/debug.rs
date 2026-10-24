use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::repositories::business::debug::TableRowsResponse;
use std::sync::Arc;

pub struct DebugPersistence {
    shared: Arc<PersistenceShared>,
}

impl DebugPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_tables(&self) -> PersistenceResult<Vec<String>> {
        Ok(self.shared.business_repo.debug_get_tables()?)
    }

    pub fn get_table_rows(
        &self,
        table: &str,
        limit: u32,
        offset: u32,
    ) -> PersistenceResult<TableRowsResponse> {
        Ok(self
            .shared
            .business_repo
            .debug_get_table_rows(table, limit, offset)?)
    }

    pub fn update_cell(
        &self,
        table: &str,
        id_column: &str,
        id_value: &str,
        column: &str,
        new_value: &str,
    ) -> PersistenceResult<()> {
        Ok(self
            .shared
            .business_repo
            .debug_update_cell(table, id_column, id_value, column, new_value)?)
    }
}
