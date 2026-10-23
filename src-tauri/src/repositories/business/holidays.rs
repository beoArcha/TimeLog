use super::constants;
use super::BusinessRepository;
use crate::repositories::shared::errors::Result;
use crate::types::{HolidayLeave, HolidayLeaveEditHistory, HolidayType};
use rusqlite::params;

impl BusinessRepository {
    fn map_holiday_row(row: &rusqlite::Row) -> rusqlite::Result<HolidayLeave> {
        let type_str: String = row.get(2)?;
        let holiday_type = match type_str.to_lowercase().as_str() {
            "leave" => HolidayType::Leave,
            _ => HolidayType::Holiday,
        };

        let orig_type_str: Option<String> = row.get(7)?;
        let original_type = orig_type_str.map(|s| match s.to_lowercase().as_str() {
            "leave" => HolidayType::Leave,
            _ => HolidayType::Holiday,
        });

        let edit_history_str: Option<String> = row.get(8)?;
        let edit_history: Option<Vec<HolidayLeaveEditHistory>> =
            crate::repositories::shared::parse_json_column(8, edit_history_str)?
                .filter(|v: &Vec<HolidayLeaveEditHistory>| !v.is_empty());

        Ok(HolidayLeave {
            id: row.get(0)?,
            date: row.get(1)?,
            r#type: holiday_type,
            name: row.get(3)?,
            note: row.get(4)?,
            original_name: row.get(5)?,
            original_date: row.get(6)?,
            original_type,
            edit_history,
        })
    }

    pub fn get_all_holidays(&self) -> Result<Vec<HolidayLeave>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(constants::SELECT_ALL_HOLIDAYS)?;
        let rows = stmt.query_map([], Self::map_holiday_row)?;
        let mut holidays = Vec::new();
        for r in rows {
            holidays.push(r?);
        }
        Ok(holidays)
    }

    pub fn save_holidays(&self, holidays: &[HolidayLeave]) -> Result<()> {
        let mut conn = self.connect()?;
        let tx = conn.transaction()?;

        tx.execute(constants::DELETE_ALL_HOLIDAYS, [])?;

        for h in holidays {
            let type_str = match h.r#type {
                HolidayType::Holiday => "holiday",
                HolidayType::Leave => "leave",
            };
            let orig_type_str = h.original_type.map(|t| match t {
                HolidayType::Holiday => "holiday",
                HolidayType::Leave => "leave",
            });
            let edit_history_str = h
                .edit_history
                .as_ref()
                .map(serde_json::to_string)
                .transpose()?;

            tx.execute(
                constants::INSERT_OR_REPLACE_HOLIDAY,
                params![
                    h.id,
                    h.date,
                    type_str,
                    h.name,
                    h.note,
                    h.original_name,
                    h.original_date,
                    orig_type_str,
                    edit_history_str,
                ],
            )?;
        }

        tx.commit()?;
        Ok(())
    }
}
