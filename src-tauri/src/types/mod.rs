#![allow(dead_code)]
// Structs and enums in this module are used for exporting TypeScript bindings to the frontend via ts-rs.
#![allow(unused_imports)]

pub mod frontend_event;
pub mod gui;
pub mod holiday;
pub mod locale;
pub mod persistence_event;
pub mod project;
pub mod settings;
pub mod sinks;
pub mod timelog;

#[cfg(test)]
mod tests;

pub use frontend_event::FrontendEvent;
pub use gui::{AlwaysOnTopConfig, GuiSize, TextAndIconSize};
pub use holiday::{HolidayLeave, HolidayLeaveEditHistory, HolidayType};
pub use locale::Locale;
pub use persistence_event::PersistenceEvent;
pub use project::{Project, ProjectEditHistory};
pub use settings::Settings;
pub use sinks::SinkType;
pub use timelog::{PatchLog, Task, TaskEditHistory, TimeLog, TimeLogEditHistory};
