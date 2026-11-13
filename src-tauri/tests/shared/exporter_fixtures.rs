#![allow(dead_code)]

use super::report_document_builders::a_document;
use oxyflow_timelog::cli::formatters::{
    ReportEntryDto, ReportProjectDto, ReportSubtaskDto, ReportTaskDto, ReportTreeDto,
};
use oxyflow_timelog::types::{ReportDocument, ReportVariant};

/// The document counterpart of `create_sample_tree`: one quoted project with one task.
pub fn create_sample_document(variant: ReportVariant) -> ReportDocument {
    let mut document = a_document(variant);
    document.projects[0].name = "API \"Service\"".to_string();
    document.projects[0].tasks[0].name = "Database Setup".to_string();
    document
}

pub fn create_sample_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "API \"Service\"".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Database Setup".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    }
}

pub fn create_tree_with_subtasks_and_direct_time() -> ReportTreeDto {
    ReportTreeDto {
        period: "This Week".to_string(),
        total_seconds: 3600,
        total_formatted: "01h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "p1".to_string(),
            name: "Alpha Project".to_string(),
            duration_seconds: 3600,
            duration_formatted: "01h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t1".to_string(),
                name: "Main Feature".to_string(),
                duration_seconds: 3600,
                duration_formatted: "01h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![
                    ReportSubtaskDto {
                        id: "s1".to_string(),
                        name: "Subtask A".to_string(),
                        duration_seconds: 1200,
                        duration_formatted: "20m 00s".to_string(),
                        percentage: 33.3,
                    },
                    ReportSubtaskDto {
                        id: "s2".to_string(),
                        name: "Subtask B".to_string(),
                        duration_seconds: 600,
                        duration_formatted: "10m 00s".to_string(),
                        percentage: 16.7,
                    },
                ],
            }],
        }],
        entries: vec![],
    }
}

pub fn create_empty_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Today".to_string(),
        total_seconds: 0,
        total_formatted: "00m 00s".to_string(),
        projects: vec![],
        entries: vec![],
    }
}

pub fn create_empty_report_tree() -> ReportTreeDto {
    create_empty_tree()
}

pub fn create_tree_with_special_characters() -> ReportTreeDto {
    ReportTreeDto {
        period: "Period <2026> & 'Q1'".to_string(),
        total_seconds: 1800,
        total_formatted: "30m 00s".to_string(),
        projects: vec![ReportProjectDto {
            id: "p_spec".to_string(),
            name: "Projekt \"Zażółć\" <gęślą> & jaźń".to_string(),
            duration_seconds: 1800,
            duration_formatted: "30m 00s".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "t_spec".to_string(),
                name: "Zadanie: 'Księgowość' & VAT 23%".to_string(),
                duration_seconds: 1800,
                duration_formatted: "30m 00s".to_string(),
                percentage: 100.0,
                subtasks: vec![],
            }],
        }],
        entries: vec![],
    }
}

pub fn create_full_hierarchy_tree() -> ReportTreeDto {
    ReportTreeDto {
        period: "Current Sprint".to_string(),
        total_seconds: 7200,
        total_formatted: "02h 00m".to_string(),
        projects: vec![ReportProjectDto {
            id: "prj-alpha".to_string(),
            name: "Alpha \"Platform\" & Engine".to_string(),
            duration_seconds: 7200,
            duration_formatted: "02h 00m".to_string(),
            percentage: 100.0,
            tasks: vec![ReportTaskDto {
                id: "tsk-core".to_string(),
                name: "Core Infrastructure <v2>".to_string(),
                duration_seconds: 7200,
                duration_formatted: "02h 00m".to_string(),
                percentage: 100.0,
                subtasks: vec![
                    ReportSubtaskDto {
                        id: "sub-1".to_string(),
                        name: "Schema Design 'XML'".to_string(),
                        duration_seconds: 4800,
                        duration_formatted: "01h 20m".to_string(),
                        percentage: 66.7,
                    },
                    ReportSubtaskDto {
                        id: "sub-2".to_string(),
                        name: "Serialization & Tests".to_string(),
                        duration_seconds: 2400,
                        duration_formatted: "40m 00s".to_string(),
                        percentage: 33.3,
                    },
                ],
            }],
        }],
        entries: vec![
            ReportEntryDto {
                id: "entry-1".to_string(),
                date: "2026-11-07".to_string(),
                project_name: "Alpha \"Platform\" & Engine".to_string(),
                task_name: "Core Infrastructure <v2>".to_string(),
                subtask_name: Some("Schema Design 'XML'".to_string()),
                start_time: "2026-11-07T10:00:00Z".to_string(),
                end_time: Some("2026-11-07T11:20:00Z".to_string()),
                duration_seconds: 4800,
                duration_formatted: "01h 20m".to_string(),
                note: Some("Implementation & tests <v1>".to_string()),
            },
            ReportEntryDto {
                id: "entry-2".to_string(),
                date: "2026-11-07".to_string(),
                project_name: "Alpha \"Platform\" & Engine".to_string(),
                task_name: "Core Infrastructure <v2>".to_string(),
                subtask_name: Some("Serialization & Tests".to_string()),
                start_time: "2026-11-07T11:20:00Z".to_string(),
                end_time: Some("2026-11-07T12:00:00Z".to_string()),
                duration_seconds: 2400,
                duration_formatted: "40m 00s".to_string(),
                note: None,
            },
        ],
    }
}
