use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{EffectiveRateResult, ElapsedRangeFilter, RangeBillingResult};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn billing_resolve_effective_rate(
    task_id: String,
    state: State<'_, AppState>,
) -> Result<EffectiveRateResult, AppError> {
    let engine = Engine::new(&state.persistence);
    let result = engine.resolve_effective_task_rate(&task_id)?;
    Ok(result)
}

#[tauri::command]
pub fn billing_calculate_range(
    range: ElapsedRangeFilter,
    now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<RangeBillingResult, AppError> {
    let engine = Engine::new(&state.persistence);
    let result = engine.calculate_range_billing(&range, now_iso.as_deref())?;
    Ok(result)
}
