#![allow(dead_code)]
// Structs and enums in this module are used for exporting TypeScript bindings to the frontend via ts-rs.
#![allow(unused_imports)]

pub mod commands;
pub mod frontend_event;
pub mod gui;
pub mod holiday;
pub mod locale;
pub mod persistence_event;
pub mod project;
pub mod settings;
pub mod sinks;
pub mod timelog;

pub use commands::{
    AppCommand, CorePersistenceCommand, EngineCommand, ProjectsPersistenceCommand,
    SettingsPersistenceCommand, TasksPersistenceCommand, WindowCommand,
};
pub use frontend_event::FrontendEvent;
pub use gui::{AlwaysOnTopConfig, LayoutVariant, TextAndIconSize, WindowDimensions};
pub use holiday::{HolidayLeave, HolidayLeaveEditHistory, HolidayType};
pub use locale::Locale;
pub use persistence_event::PersistenceEvent;
pub use project::{Project, ProjectEditHistory, ProjectStatistics};
pub use settings::{RuntimeConfig, Settings};
pub use sinks::SinkType;
pub use timelog::{
    ElapsedRangeFilter, EngineComputedMetrics, PatchLog, ProjectComputedMetrics, Task,
    TaskComputedMetrics, TaskEditHistory, TaskStatus, TimeLog, TimeLogEditHistory,
    TimerRepositoryState,
};
