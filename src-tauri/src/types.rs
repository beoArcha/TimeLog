#![allow(dead_code)] // Structs and enums in this module are used for exporting TypeScript bindings to the frontend via ts-rs.

use ts_rs::TS;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/GuiVariant.ts")]
pub enum GuiVariant {
    Small,
    Medium,
    Large,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/AlwaysOnTopConfig.ts")]
pub struct AlwaysOnTopConfig {
    pub small: bool,
    pub main: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/ProjectEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct ProjectEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_color: Option<String>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/Project.ts")]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
    #[ts(optional)]
    pub archived: Option<bool>,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_color: Option<String>,
    #[ts(optional)]
    pub edit_history: Option<Vec<ProjectEditHistory>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/TaskEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct TaskEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_completed: Option<bool>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/Task.ts")]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub project_id: String,
    #[ts(optional)]
    pub parent_task_id: Option<String>,
    pub name: String,
    pub created_at: String,
    pub completed: bool,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_completed: Option<bool>,
    #[ts(optional)]
    pub edit_history: Option<Vec<TaskEditHistory>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/TimeLogEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct TimeLogEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_start_time: Option<String>,
    #[ts(optional)]
    pub prev_end_time: Option<String>,
    #[ts(optional)]
    pub prev_note: Option<String>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/TimeLog.ts")]
#[serde(rename_all = "camelCase")]
pub struct TimeLog {
    pub id: String,
    pub task_id: String,
    pub project_id: String,
    pub start_time: String,
    #[ts(optional)]
    pub end_time: Option<String>,
    #[ts(optional)]
    pub note: Option<String>,
    #[ts(optional)]
    pub original_start_time: Option<String>,
    #[ts(optional)]
    pub original_end_time: Option<String>,
    #[ts(optional)]
    pub original_note: Option<String>,
    #[ts(optional)]
    pub edit_history: Option<Vec<TimeLogEditHistory>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/PatchLog.ts")]
#[serde(rename_all = "camelCase")]
pub struct PatchLog {
    pub id: String,
    pub project_id: String,
    #[ts(optional)]
    pub task_id: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub patch_note: String,
    #[ts(optional)]
    pub is_system_event: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/Settings.ts")]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub auto_start: bool,
    pub auto_pause_on_sleep: bool,
    pub include_patches_in_reports: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/HolidayType.ts")]
pub enum HolidayType {
    Holiday,
    Leave,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/HolidayLeaveEditHistory.ts")]
#[serde(rename_all = "camelCase")]
pub struct HolidayLeaveEditHistory {
    pub edited_at: String,
    #[ts(optional)]
    pub prev_name: Option<String>,
    #[ts(optional)]
    pub prev_date: Option<String>,
    #[ts(optional)]
    pub prev_type: Option<HolidayType>,
    #[ts(optional)]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export_to = "../../src/bindings/HolidayLeave.ts")]
#[serde(rename_all = "camelCase")]
pub struct HolidayLeave {
    pub id: String,
    pub date: String,
    pub r#type: HolidayType,
    pub name: String,
    #[ts(optional)]
    pub note: Option<String>,
    #[ts(optional)]
    pub original_name: Option<String>,
    #[ts(optional)]
    pub original_date: Option<String>,
    #[ts(optional)]
    pub original_type: Option<HolidayType>,
    #[ts(optional)]
    pub edit_history: Option<Vec<HolidayLeaveEditHistory>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/Locale.ts")]
pub enum Locale {
    Pl,
    En,
    De,
    Es,
    #[serde(rename = "pt-br")]
    #[ts(rename = "pt-br")]
    PtBr,
    Fr,
    Custom,
    System,
}

impl Locale {
    pub fn from_sys_lang(sys_lang: &str) -> Self {
        let code = sys_lang.split('-').next().unwrap_or("en").to_lowercase();
        match code.as_str() {
            "pl" => Locale::Pl,
            "de" => Locale::De,
            "es" => Locale::Es,
            "fr" => Locale::Fr,
            "pt" => Locale::PtBr,
            _ => Locale::En,
        }
    }

    pub fn to_sys_lang(self) -> &'static str {
        match self {
            Locale::Pl => "pl",
            Locale::De => "de",
            Locale::Es => "es",
            Locale::Fr => "fr",
            Locale::PtBr => "pt",
            _ => "en",
        }
    }
}


#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export_to = "../../src/bindings/FrontendEvent.ts")]
pub enum FrontendEvent {
    TraySetGuiVariant,
    TrayToggleOnTop,
    TrayStopAllTimers,
    NativeCloseRequested,
    NativeWindowMaximized,
    NativeWindowRestored,
    NativeWindowMinimized,
    NativeWindowResized,
}

impl FrontendEvent {
    pub fn as_str(self) -> &'static str {
        match self {
            FrontendEvent::TraySetGuiVariant => "tray-set-gui-variant",
            FrontendEvent::TrayToggleOnTop => "tray-toggle-on-top",
            FrontendEvent::TrayStopAllTimers => "tray-stop-all-timers",
            FrontendEvent::NativeCloseRequested => "native-close-requested",
            FrontendEvent::NativeWindowMaximized => "native-window-maximized",
            FrontendEvent::NativeWindowRestored => "native-window-restored",
            FrontendEvent::NativeWindowMinimized => "native-window-minimized",
            FrontendEvent::NativeWindowResized => "native-window-resized",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        GuiVariant::export().unwrap();
        AlwaysOnTopConfig::export().unwrap();
        ProjectEditHistory::export().unwrap();
        Project::export().unwrap();
        TaskEditHistory::export().unwrap();
        Task::export().unwrap();
        TimeLogEditHistory::export().unwrap();
        TimeLog::export().unwrap();
        PatchLog::export().unwrap();
        Settings::export().unwrap();
        HolidayType::export().unwrap();
        HolidayLeaveEditHistory::export().unwrap();
        HolidayLeave::export().unwrap();
        FrontendEvent::export().unwrap();
        Locale::export().unwrap();
    }

    #[test]
    fn test_locale_from_to_sys_lang() {
        assert_eq!(Locale::from_sys_lang("pl-PL"), Locale::Pl);
        assert_eq!(Locale::from_sys_lang("PL"), Locale::Pl);
        assert_eq!(Locale::from_sys_lang("de-DE"), Locale::De);
        assert_eq!(Locale::from_sys_lang("es-ES"), Locale::Es);
        assert_eq!(Locale::from_sys_lang("fr-FR"), Locale::Fr);
        assert_eq!(Locale::from_sys_lang("pt-BR"), Locale::PtBr);
        assert_eq!(Locale::from_sys_lang("pt-PT"), Locale::PtBr);
        assert_eq!(Locale::from_sys_lang("en-US"), Locale::En);
        assert_eq!(Locale::from_sys_lang("invalid"), Locale::En);

        assert_eq!(Locale::Pl.to_sys_lang(), "pl");
        assert_eq!(Locale::De.to_sys_lang(), "de");
        assert_eq!(Locale::Es.to_sys_lang(), "es");
        assert_eq!(Locale::Fr.to_sys_lang(), "fr");
        assert_eq!(Locale::PtBr.to_sys_lang(), "pt");
        assert_eq!(Locale::En.to_sys_lang(), "en");
        assert_eq!(Locale::System.to_sys_lang(), "en");
        assert_eq!(Locale::Custom.to_sys_lang(), "en");
    }
}
