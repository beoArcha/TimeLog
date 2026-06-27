use oxy_flow::types::*;
use ts_rs::TS;

#[test]
fn export_bindings() {
    GuiSize::export().unwrap();
    TextAndIconSize::export().unwrap();
    AlwaysOnTopConfig::export().unwrap();
    ProjectEditHistory::export().unwrap();
    Project::export().unwrap();
    TaskEditHistory::export().unwrap();
    Task::export().unwrap();
    TimeLogEditHistory::export().unwrap();
    TimeLog::export().unwrap();
    TimerRepositoryState::export().unwrap();
    PatchLog::export().unwrap();
    Settings::export().unwrap();
    HolidayType::export().unwrap();
    HolidayLeaveEditHistory::export().unwrap();
    HolidayLeave::export().unwrap();
    FrontendEvent::export().unwrap();
    Locale::export().unwrap();
    SinkType::export().unwrap();
    WindowDimensions::export().unwrap();
}
