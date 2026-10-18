use oxy_flow::types::*;
use ts_rs::TS;

const BINDINGS_DIR: &str = "../src/bindings/";

#[test]
fn export_bindings() {
    AppCommand::export_all_to(BINDINGS_DIR).unwrap();
    WindowCommand::export_all_to(BINDINGS_DIR).unwrap();
    EngineCommand::export_all_to(BINDINGS_DIR).unwrap();
    CorePersistenceCommand::export_all_to(BINDINGS_DIR).unwrap();
    ProjectsPersistenceCommand::export_all_to(BINDINGS_DIR).unwrap();
    TasksPersistenceCommand::export_all_to(BINDINGS_DIR).unwrap();
    SettingsPersistenceCommand::export_all_to(BINDINGS_DIR).unwrap();
    LayoutVariant::export_all_to(BINDINGS_DIR).unwrap();
    TextAndIconSize::export_all_to(BINDINGS_DIR).unwrap();
    AlwaysOnTopConfig::export_all_to(BINDINGS_DIR).unwrap();
    ProjectEditHistory::export_all_to(BINDINGS_DIR).unwrap();
    Project::export_all_to(BINDINGS_DIR).unwrap();
    TaskEditHistory::export_all_to(BINDINGS_DIR).unwrap();
    Task::export_all_to(BINDINGS_DIR).unwrap();
    TimeLogEditHistory::export_all_to(BINDINGS_DIR).unwrap();
    TimeLog::export_all_to(BINDINGS_DIR).unwrap();
    TimerRepositoryState::export_all_to(BINDINGS_DIR).unwrap();
    PatchLog::export_all_to(BINDINGS_DIR).unwrap();
    Settings::export_all_to(BINDINGS_DIR).unwrap();
    HolidayType::export_all_to(BINDINGS_DIR).unwrap();
    HolidayLeaveEditHistory::export_all_to(BINDINGS_DIR).unwrap();
    HolidayLeave::export_all_to(BINDINGS_DIR).unwrap();
    FrontendEvent::export_all_to(BINDINGS_DIR).unwrap();
    Locale::export_all_to(BINDINGS_DIR).unwrap();
    SinkType::export_all_to(BINDINGS_DIR).unwrap();
    WindowDimensions::export_all_to(BINDINGS_DIR).unwrap();
    ProjectStatistics::export_all_to(BINDINGS_DIR).unwrap();
    RuntimeConfig::export_all_to(BINDINGS_DIR).unwrap();
    TaskStatus::export_all_to(BINDINGS_DIR).unwrap();
    ElapsedRangeFilter::export_all_to(BINDINGS_DIR).unwrap();
    ClampedTimeLog::export_all_to(BINDINGS_DIR).unwrap();
    RangeMetricsResult::export_all_to(BINDINGS_DIR).unwrap();
    TaskComputedMetrics::export_all_to(BINDINGS_DIR).unwrap();
    ProjectComputedMetrics::export_all_to(BINDINGS_DIR).unwrap();
    EngineComputedMetrics::export_all_to(BINDINGS_DIR).unwrap();
    ExternalApiSettings::export_all_to(BINDINGS_DIR).unwrap();
}
