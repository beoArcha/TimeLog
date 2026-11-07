use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::{
    ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Checks if a Unicode scalar value is allowed in XML 1.0 (Fifth Edition).
/// Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
pub fn is_xml_1_0_char(c: char) -> bool {
    let cp = c as u32;
    cp == 0x9
        || cp == 0xA
        || cp == 0xD
        || (0x20..=0xD7FF).contains(&cp)
        || (0xE000..=0xFFFD).contains(&cp)
        || (0x10000..=0x10FFFF).contains(&cp)
}

/// Sanitizes a string for XML 1.0 output by removing disallowed control characters
/// (e.g., U+0000, U+0007, U+FFFE, U+FFFF) while preserving TAB (\t), LF (\n), CR (\r)
/// and all valid Unicode characters (including Polish diacritics and emoji).
pub fn sanitize_xml_text(input: &str) -> String {
    input.chars().filter(|&c| is_xml_1_0_char(c)).collect()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename = "report")]
pub struct XmlReportDto {
    #[serde(rename = "@schemaVersion")]
    pub schema_version: String,
    pub metadata: XmlMetadataDto,
    pub summary: XmlSummaryDto,
    pub projects: XmlProjectsDto,
    pub entries: XmlEntriesDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlMetadataDto {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub period: String,
    #[serde(rename = "generatedAt", skip_serializing_if = "Option::is_none")]
    pub generated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlSummaryDto {
    #[serde(rename = "totalSeconds")]
    pub total_seconds: u64,
    #[serde(rename = "formattedTotalDuration")]
    pub formatted_total_duration: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct XmlProjectsDto {
    #[serde(rename = "project", default)]
    pub projects: Vec<XmlProjectDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct XmlTasksDto {
    #[serde(rename = "task", default)]
    pub tasks: Vec<XmlTaskDto>,
}

impl XmlTasksDto {
    pub fn is_empty(&self) -> bool {
        self.tasks.is_empty()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct XmlSubtasksDto {
    #[serde(rename = "subtask", default)]
    pub subtasks: Vec<XmlSubtaskDto>,
}

impl XmlSubtasksDto {
    pub fn is_empty(&self) -> bool {
        self.subtasks.is_empty()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlProjectDto {
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub id: String,
    pub name: String,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(
        rename = "formattedDuration",
        default,
        skip_serializing_if = "String::is_empty"
    )]
    pub formatted_duration: String,
    pub percentage: f64,
    #[serde(default, skip_serializing_if = "XmlTasksDto::is_empty")]
    pub tasks: XmlTasksDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlTaskDto {
    pub id: String,
    pub name: String,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(rename = "formattedDuration")]
    pub formatted_duration: String,
    pub percentage: f64,
    #[serde(default, skip_serializing_if = "XmlSubtasksDto::is_empty")]
    pub subtasks: XmlSubtasksDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlSubtaskDto {
    pub id: String,
    pub name: String,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(rename = "formattedDuration")]
    pub formatted_duration: String,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct XmlEntriesDto {
    #[serde(rename = "entry", default)]
    pub entries: Vec<XmlEntryDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct XmlEntryDto {
    pub id: String,
    pub date: String,
    #[serde(rename = "projectName")]
    pub project_name: String,
    #[serde(rename = "taskName")]
    pub task_name: String,
    #[serde(rename = "subtaskName", skip_serializing_if = "Option::is_none")]
    pub subtask_name: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: String,
    #[serde(rename = "endTime", skip_serializing_if = "Option::is_none")]
    pub end_time: Option<String>,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(rename = "formattedDuration")]
    pub formatted_duration: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

impl From<&ReportEntryDto> for XmlEntryDto {
    fn from(entry: &ReportEntryDto) -> Self {
        Self {
            id: sanitize_xml_text(&entry.id),
            date: sanitize_xml_text(&entry.date),
            project_name: sanitize_xml_text(&entry.project_name),
            task_name: sanitize_xml_text(&entry.task_name),
            subtask_name: entry.subtask_name.as_deref().map(sanitize_xml_text),
            start_time: sanitize_xml_text(&entry.start_time),
            end_time: entry.end_time.as_deref().map(sanitize_xml_text),
            duration_seconds: entry.duration_seconds,
            formatted_duration: sanitize_xml_text(&entry.duration_formatted),
            note: entry.note.as_deref().map(sanitize_xml_text),
        }
    }
}

impl From<&ReportSubtaskDto> for XmlSubtaskDto {
    fn from(subtask: &ReportSubtaskDto) -> Self {
        Self {
            id: sanitize_xml_text(&subtask.id),
            name: sanitize_xml_text(&subtask.name),
            duration_seconds: subtask.duration_seconds,
            formatted_duration: sanitize_xml_text(&subtask.duration_formatted),
            percentage: subtask.percentage,
        }
    }
}

impl From<&ReportTaskDto> for XmlTaskDto {
    fn from(task: &ReportTaskDto) -> Self {
        Self {
            id: sanitize_xml_text(&task.id),
            name: sanitize_xml_text(&task.name),
            duration_seconds: task.duration_seconds,
            formatted_duration: sanitize_xml_text(&task.duration_formatted),
            percentage: task.percentage,
            subtasks: XmlSubtasksDto {
                subtasks: task.subtasks.iter().map(XmlSubtaskDto::from).collect(),
            },
        }
    }
}

impl From<&ReportProjectDto> for XmlProjectDto {
    fn from(project: &ReportProjectDto) -> Self {
        Self {
            id: sanitize_xml_text(&project.id),
            name: sanitize_xml_text(&project.name),
            duration_seconds: project.duration_seconds,
            formatted_duration: sanitize_xml_text(&project.duration_formatted),
            percentage: project.percentage,
            tasks: XmlTasksDto {
                tasks: project.tasks.iter().map(XmlTaskDto::from).collect(),
            },
        }
    }
}

impl From<&ReportTreeDto> for XmlReportDto {
    fn from(tree: &ReportTreeDto) -> Self {
        Self {
            schema_version: "1".to_string(),
            metadata: XmlMetadataDto {
                title: Some("TimeLog Report".to_string()),
                period: sanitize_xml_text(&tree.period),
                generated_at: None,
            },
            summary: XmlSummaryDto {
                total_seconds: tree.total_seconds,
                formatted_total_duration: sanitize_xml_text(&tree.total_formatted),
            },
            projects: XmlProjectsDto {
                projects: tree.projects.iter().map(XmlProjectDto::from).collect(),
            },
            entries: XmlEntriesDto {
                entries: tree.entries.iter().map(XmlEntryDto::from).collect(),
            },
        }
    }
}

pub fn export_xml(tree: &ReportTreeDto) -> Result<String, CliError> {
    let report_dto = XmlReportDto::from(tree);
    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    let content = quick_xml::se::to_string(&report_dto)
        .map_err(|e| CliError::Sink(SinkError::Serialization(e.to_string())))?;
    xml.push_str(&content);
    Ok(xml)
}

#[derive(Debug, PartialEq, Eq, Clone, Error)]
pub enum XmlValidationError {
    #[error("Missing XML declaration prolog")]
    MissingProlog,
    #[error("Missing root element <report schemaVersion=\"1\">")]
    MissingRootElement,
    #[error("Missing section: {0}")]
    MissingSection(&'static str),
    #[error("Sections out of canonical order: expected metadata < summary < projects < entries")]
    InvalidSectionOrder,
    #[error("XML schema deserialization failed: {0}")]
    Deserialization(String),
    #[error("Invalid schemaVersion: expected '1', got '{0}'")]
    InvalidSchemaVersion(String),
}

impl From<XmlValidationError> for CliError {
    fn from(err: XmlValidationError) -> Self {
        CliError::Sink(SinkError::Serialization(err.to_string()))
    }
}

/// Validates an XML document string against the canonical Report XML Schema v1 structural rules:
/// 1. XML prolog presence: starts with `<?xml version="1.0" encoding="UTF-8"?>`.
/// 2. Root element `<report>` with required attribute `schemaVersion="1"`.
/// 3. Canonical 4 sections in exact order: `<metadata>`, `<summary>`, `<projects>`, `<entries>`.
/// 4. Mandatory child elements and valid numeric representations (nonNegativeInteger, decimal).
/// 5. Validates complete roundtrip deserialization via quick_xml.
pub fn validate_report_xml_structure(xml: &str) -> Result<XmlReportDto, XmlValidationError> {
    if !xml.starts_with("<?xml version=\"1.0\" encoding=\"UTF-8\"?>") {
        return Err(XmlValidationError::MissingProlog);
    }

    if !xml.contains("<report schemaVersion=\"1\">") {
        return Err(XmlValidationError::MissingRootElement);
    }

    let meta_idx = xml
        .find("<metadata>")
        .ok_or(XmlValidationError::MissingSection("<metadata>"))?;
    let sum_idx = xml
        .find("<summary>")
        .ok_or(XmlValidationError::MissingSection("<summary>"))?;
    let proj_idx = xml
        .find("<projects")
        .ok_or(XmlValidationError::MissingSection("<projects>"))?;
    let ent_idx = xml
        .find("<entries")
        .ok_or(XmlValidationError::MissingSection("<entries>"))?;

    if !(meta_idx < sum_idx && sum_idx < proj_idx && proj_idx < ent_idx) {
        return Err(XmlValidationError::InvalidSectionOrder);
    }

    let body = xml
        .strip_prefix("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
        .unwrap_or(xml);

    let dto: XmlReportDto = quick_xml::de::from_str(body)
        .map_err(|e| XmlValidationError::Deserialization(e.to_string()))?;

    if dto.schema_version != "1" {
        return Err(XmlValidationError::InvalidSchemaVersion(dto.schema_version));
    }

    Ok(dto)
}
