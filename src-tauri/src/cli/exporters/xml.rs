use crate::cli::error::{CliError, SinkError};
use crate::cli::formatters::{ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto};
use serde::{Deserialize, Serialize};

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
    pub id: String,
    pub name: String,
    #[serde(rename = "durationSeconds")]
    pub duration_seconds: u64,
    #[serde(rename = "formattedDuration")]
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
pub struct XmlEntriesDto {}

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
            entries: XmlEntriesDto::default(),
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
