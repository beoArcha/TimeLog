#![allow(dead_code)]
// Structs and enums in this module are used for exporting TypeScript bindings to the frontend via ts-rs.
#![allow(unused_imports)]

pub mod commands;
pub mod external_api;
pub mod frontend_event;
pub mod gui;
pub mod holiday;
pub mod locale;
pub mod persistence_event;
pub mod project;
pub mod settings;
pub mod sinks;
pub mod timelog;
pub mod webhook_queue;
pub mod workflow;

pub use commands::{
    AppCommand, CorePersistenceCommand, EngineCommand, ProjectsPersistenceCommand,
    SettingsPersistenceCommand, TasksPersistenceCommand, WindowCommand,
};
pub use external_api::ExternalApiSettings;
pub use frontend_event::FrontendEvent;
pub use gui::{AlwaysOnTopConfig, LayoutVariant, TextAndIconSize, WindowDimensions};
pub use holiday::{HolidayLeave, HolidayLeaveEditHistory, HolidayType};
pub use locale::Locale;
pub use persistence_event::PersistenceEvent;
pub use project::{Project, ProjectEditHistory, ProjectStatistics};
pub use settings::{RuntimeConfig, Settings};
pub use sinks::SinkType;
pub use timelog::{
    AuditSource, ClampedTimeLog, ElapsedRangeFilter, EngineComputedMetrics, NewTimeLog, PatchLog,
    ProjectComputedMetrics, RangeMetricsResult, Task, TaskComputedMetrics, TaskEditHistory,
    TaskStatus, TimeLog, TimeLogEditHistory, TimeLogUpdateHistory, TimerRepositoryState,
    AUDIT_SOURCE_CLI_EDIT, AUDIT_SOURCE_GUI_EDIT, AUDIT_SOURCE_MANUAL_ADJUSTMENT,
    AUDIT_SOURCE_SYSTEM_PATCH,
};
pub use webhook_queue::{WebhookQueueItem, WebhookQueueStats};
pub use workflow::{
    WorkflowCheckResult, WorkflowConfig, WorkflowStatus, DEFAULT_AUTO_STOP_DAILY_BOUNDARY_ENABLED,
    DEFAULT_AUTO_STOP_DAILY_BOUNDARY_TIME, DEFAULT_AUTO_STOP_HOURS_LIMIT,
    DEFAULT_AUTO_STOP_HOURS_LIMIT_ENABLED, DEFAULT_AUTO_STOP_ON_TASK_COMPLETE,
    DEFAULT_WARNING_NOTIFICATION_ENABLED, REASON_DAILY_BOUNDARY, REASON_HOURS_LIMIT,
    REASON_TASK_COMPLETE, REASON_TASK_COMPLETED, TIME_FORMAT_HM, WARNING_LEAD_SECONDS,
    WARNING_LEAD_SECONDS_U32,
};
