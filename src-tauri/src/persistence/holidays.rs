use super::error::PersistenceResult;
use super::shared::PersistenceShared;
use crate::types::HolidayLeave;
use std::sync::Arc;

pub struct HolidaysPersistence {
    shared: Arc<PersistenceShared>,
}

impl HolidaysPersistence {
    pub fn new(shared: Arc<PersistenceShared>) -> Self {
        Self { shared }
    }

    pub fn get_all(&self) -> PersistenceResult<Vec<HolidayLeave>> {
        Ok(self.shared.business_repo.get_all_holidays()?)
    }

    pub fn save(&self, holidays: Vec<HolidayLeave>) -> PersistenceResult<()> {
        self.shared.business_repo.save_holidays(&holidays)?;
        self.shared.cache.clear();
        Ok(())
    }
}
