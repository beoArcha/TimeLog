use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::PatchLog;
use rusqlite::params;

impl BusinessRepository {
    fn map_patch_row(row: &rusqlite::Row) -> rusqlite::Result<PatchLog> {
        let is_sys_int: Option<i64> = row.get(6)?;
        let is_system_event = is_sys_int.map(|v| v != 0);

        Ok(PatchLog {
            id: row.get(0)?,
            project_id: row.get(1)?,
            task_id: row.get(2)?,
            start_time: row.get(3)?,
            end_time: row.get(4)?,
            patch_note: row.get(5)?,
            is_system_event,
        })
    }

    pub fn get_all_patches(&self) -> Result<Vec<PatchLog>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_PATCHES)?;
        let rows = stmt.query_map([], Self::map_patch_row)?;
        let mut patches = Vec::new();
        for r in rows {
            patches.push(r?);
        }
        Ok(patches)
    }

    pub fn save_patches(&self, patches: &[PatchLog]) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction()?;

        tx.execute(constants::DELETE_ALL_PATCHES, [])?;

        for p in patches {
            let is_sys_int = p.is_system_event.map(|v| if v { 1 } else { 0 });
            tx.execute(
                constants::INSERT_OR_REPLACE_PATCH,
                params![
                    p.id,
                    p.project_id,
                    p.task_id,
                    p.start_time,
                    p.end_time,
                    p.patch_note,
                    is_sys_int,
                ],
            )?;
        }

        tx.commit()?;
        Ok(())
    }
}
