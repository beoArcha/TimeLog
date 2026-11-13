#![allow(dead_code)]

use oxyflow_timelog::types::*;

pub fn a_range() -> ResolvedRange {
    ResolvedRange {
        from: Some("2026-01-01T00:00:00Z".to_string()),
        to: None,
        timezone: "Europe/Warsaw".to_string(),
        preset: None,
    }
}

pub fn a_billing_total() -> ReportBillingTotal {
    ReportBillingTotal {
        currency: "PLN".to_string(),
        amount_minor: 15_000,
        billable_seconds: 3600,
        non_billable_seconds: 0,
        unconfigured_seconds: 0,
    }
}

pub fn an_entry() -> ReportEntry {
    ReportEntry {
        id: "log-1".to_string(),
        project_id: "p1".to_string(),
        project_name: "Project".to_string(),
        task_id: Some("t2".to_string()),
        task_name: Some("Subtask".to_string()),
        root_task_id: Some("t1".to_string()),
        parent_task_id: Some("t1".to_string()),
        parent_task_name: Some("Task".to_string()),
        start: "2025-12-31T23:00:00Z".to_string(),
        end: Some("2026-01-01T01:00:00Z".to_string()),
        date: "2026-01-01".to_string(),
        seconds: 3600,
        original_seconds: 7200,
        clamped: true,
        is_patch: false,
        note: Some("note".to_string()),
        rate_minor: Some(15_000),
        currency: Some("PLN".to_string()),
        amount_minor: Some(15_000),
    }
}

pub fn a_project_patch_entry() -> ReportEntry {
    ReportEntry {
        task_id: None,
        task_name: None,
        root_task_id: None,
        parent_task_id: None,
        parent_task_name: None,
        is_patch: true,
        ..an_entry()
    }
}

pub fn a_subtask() -> ReportSubtask {
    ReportSubtask {
        id: "t2".to_string(),
        name: "Subtask".to_string(),
        parent_task_id: "t1".to_string(),
        direct_seconds: 3600,
        seconds: 3600,
        share_basis_points: 10_000,
        rate_minor: Some(15_000),
        currency: Some("PLN".to_string()),
        rate_status: ReportRateStatus::Custom,
        amount_minor: Some(15_000),
    }
}

pub fn a_task() -> ReportTask {
    ReportTask {
        id: "t1".to_string(),
        name: "Task".to_string(),
        direct_seconds: 0,
        seconds: 3600,
        share_basis_points: 10_000,
        rate_minor: None,
        currency: None,
        rate_status: ReportRateStatus::Unconfigured,
        amount_minor: None,
        subtasks: vec![a_subtask()],
    }
}

pub fn a_project() -> ReportProject {
    ReportProject {
        id: "p1".to_string(),
        name: "Project".to_string(),
        direct_seconds: 0,
        seconds: 3600,
        share_basis_points: 10_000,
        billing: vec![a_billing_total()],
        tasks: vec![a_task()],
    }
}

pub fn a_document(variant: ReportVariant) -> ReportDocument {
    let entries = match variant {
        ReportVariant::Full => Some(vec![an_entry()]),
        ReportVariant::Summary => None,
    };
    ReportDocument {
        schema: REPORT_SCHEMA_NAME.to_string(),
        schema_version: REPORT_SCHEMA_VERSION,
        variant,
        generated_at: "2026-01-05T10:00:00Z".to_string(),
        generator: ReportGenerator {
            name: "oxy".to_string(),
            version: "1.0.0".to_string(),
        },
        range: a_range(),
        filters: ReportFilters {
            project_id: None,
            task_id: None,
            include_patches: true,
        },
        totals: ReportTotals {
            seconds: 3600,
            entry_count: 1,
            billable_seconds: 3600,
            non_billable_seconds: 0,
            unconfigured_seconds: 0,
            billing: vec![a_billing_total()],
        },
        projects: vec![a_project()],
        days: vec![ReportDay {
            date: "2026-01-01".to_string(),
            seconds: 3600,
        }],
        entries,
    }
}
