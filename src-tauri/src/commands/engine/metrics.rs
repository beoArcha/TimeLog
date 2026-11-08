use crate::common::AppError;
use crate::engine::Engine;
use crate::types::{
    ElapsedRangeFilter, EngineComputedMetrics, ProjectStatistics, RangeMetricsResult,
};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_range_metrics(
    range: ElapsedRangeFilter,
    now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<RangeMetricsResult, AppError> {
    let engine = Engine::new(&state.persistence);
    let metrics = engine.calculate_range_metrics(&range, now_iso.as_deref())?;
    Ok(metrics)
}

#[tauri::command]
pub fn get_project_statistics(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<ProjectStatistics, AppError> {
    let engine = Engine::new(&state.persistence);
    let stats = engine.get_project_statistics(&project_id)?;
    Ok(stats)
}

#[tauri::command]
pub fn get_computed_metrics(
    now_iso: Option<String>,
    state: State<'_, AppState>,
) -> Result<EngineComputedMetrics, AppError> {
    let engine = Engine::new(&state.persistence);
    let metrics = engine.get_computed_metrics(now_iso.as_deref())?;
    Ok(metrics)
}
