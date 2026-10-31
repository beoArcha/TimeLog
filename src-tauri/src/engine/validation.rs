use super::{Engine, EngineError};
use chrono::{DateTime, Utc};

pub const MAX_NAME_LENGTH: usize = 1000;
pub const MAX_TAG_LENGTH: usize = 100;
pub const MAX_DESCRIPTION_LENGTH: usize = 10000;

/// Strips non-printable ASCII control characters.
/// Keeps newlines/carriage returns and tabs when `allow_newlines_and_tabs` is true.
pub fn sanitize_text(val: &str, allow_newlines_and_tabs: bool) -> String {
    val.chars()
        .filter(|&c| {
            if c == '\n' || c == '\r' || c == '\t' {
                allow_newlines_and_tabs
            } else {
                !c.is_control()
            }
        })
        .collect()
}

/// Validates a single-line bounded text field (e.g. name, tag) ensuring it is non-empty,
/// control characters stripped, and within character bounds.
pub fn validate_bounded_text(
    raw: &str,
    field_name: &str,
    max_len: usize,
) -> Result<String, EngineError> {
    let sanitized = sanitize_text(raw, false);
    let trimmed = sanitized.trim();
    if trimmed.is_empty() {
        return Err(EngineError::Validation(format!(
            "{} cannot be empty",
            field_name
        )));
    }
    if trimmed.chars().count() > max_len {
        return Err(EngineError::Validation(format!(
            "{} exceeds maximum length of {} characters",
            field_name, max_len
        )));
    }
    Ok(trimmed.to_string())
}

/// Pure domain validator for task names.
pub fn validate_task_name(name: &str) -> Result<String, EngineError> {
    validate_bounded_text(name, "Task name", MAX_NAME_LENGTH)
}

/// Pure domain validator for individual tags.
pub fn validate_tag(tag: &str) -> Result<String, EngineError> {
    validate_bounded_text(tag, "Tag", MAX_TAG_LENGTH)
}

/// Pure domain validator for optional tag lists.
pub fn validate_tags(tags: Option<Vec<String>>) -> Result<Option<Vec<String>>, EngineError> {
    match tags {
        Some(list) => {
            let mut validated = Vec::with_capacity(list.len());
            for tag in list {
                validated.push(validate_tag(&tag)?);
            }
            Ok(Some(validated))
        }
        None => Ok(None),
    }
}

/// Pure domain validator for optional multi-line notes and descriptions.
pub fn validate_description(desc: Option<&str>) -> Result<Option<String>, EngineError> {
    match desc {
        Some(d) => {
            let sanitized = sanitize_text(d, true);
            let trimmed = sanitized.trim();
            if trimmed.is_empty() {
                Ok(None)
            } else if trimmed.chars().count() > MAX_DESCRIPTION_LENGTH {
                Err(EngineError::Validation(format!(
                    "Description exceeds maximum length of {} characters",
                    MAX_DESCRIPTION_LENGTH
                )))
            } else {
                Ok(Some(trimmed.to_string()))
            }
        }
        None => Ok(None),
    }
}

impl<'a> Engine<'a> {
    pub fn validate_project_name(
        &self,
        name: &str,
        exclude_project_id: Option<&str>,
    ) -> Result<String, EngineError> {
        let valid_name = validate_bounded_text(name, "Project name", MAX_NAME_LENGTH)?;
        self.check_project_name_unique(&valid_name, exclude_project_id)?;
        Ok(valid_name)
    }

    fn check_project_name_unique(
        &self,
        name: &str,
        exclude_project_id: Option<&str>,
    ) -> Result<(), EngineError> {
        let existing = self.persistence.projects.get_all()?;
        let duplicate = existing.into_iter().any(|p| {
            Some(p.id.as_str()) != exclude_project_id && p.name.trim().eq_ignore_ascii_case(name)
        });

        if duplicate {
            return Err(EngineError::Validation(format!(
                "Project with name \"{}\" already exists",
                name
            )));
        }
        Ok(())
    }

    pub fn validate_task_name(&self, name: &str) -> Result<String, EngineError> {
        validate_task_name(name)
    }

    pub fn validate_tag(&self, tag: &str) -> Result<String, EngineError> {
        validate_tag(tag)
    }

    pub fn validate_tags(
        &self,
        tags: Option<Vec<String>>,
    ) -> Result<Option<Vec<String>>, EngineError> {
        validate_tags(tags)
    }

    pub fn validate_description(&self, desc: Option<&str>) -> Result<Option<String>, EngineError> {
        validate_description(desc)
    }

    pub fn validate_task_hierarchy(
        &self,
        task_id: Option<&str>,
        parent_task_id: Option<&str>,
    ) -> Result<(), EngineError> {
        let Some(p_id) = parent_task_id else {
            return Ok(());
        };

        if let Some(t_id) = task_id {
            if t_id == p_id {
                return Err(EngineError::Validation(
                    "Task cannot be its own parent".to_string(),
                ));
            }
        }
        if let Some(parent) = self.persistence.tasks.get(p_id)? {
            if parent.parent_task_id.is_some() {
                return Err(EngineError::Validation(
                    "Cannot nest tasks more than one level deep".to_string(),
                ));
            }
        }
        if let Some(t_id) = task_id {
            let subtasks = self.persistence.tasks.get_subtasks(t_id)?;
            if !subtasks.is_empty() {
                return Err(EngineError::Validation(
                    "Cannot set a parent for a task that already has subtasks".to_string(),
                ));
            }
        }
        Ok(())
    }

    pub fn validate_time_log(
        &self,
        log_id: &str,
        _task_id: &str,
        start_time: &str,
        end_time: Option<&str>,
    ) -> Result<(), EngineError> {
        let start = parse_utc_timestamp(start_time)?;
        let end = match end_time {
            Some(e_str) => {
                let e = parse_utc_timestamp(e_str)?;
                if e < start {
                    return Err(EngineError::Validation(
                        "End time cannot be before start time".to_string(),
                    ));
                }
                e
            }
            None => Utc::now(),
        };

        if start > Utc::now() {
            return Err(EngineError::Validation(
                "Start time cannot be in the future".to_string(),
            ));
        }

        let all_logs = self.persistence.time_logs.get_all()?;
        for log in all_logs {
            if log.id == log_id {
                continue;
            }

            let log_start = parse_utc_timestamp(&log.start_time)?;
            let log_end = match log.end_time {
                Some(ref e_str) => parse_utc_timestamp(e_str)?,
                None => Utc::now(),
            };

            if start < log_end && log_start < end {
                return Err(EngineError::Validation(format!(
                    "Time log overlaps with an existing log (ID: {})",
                    log.id
                )));
            }
        }

        Ok(())
    }

    pub fn validate_project_deletion(&self, project_id: &str) -> Result<(), EngineError> {
        let project = self.persistence.projects.get(project_id)?;
        if project.is_none() {
            return Err(EngineError::EntityNotFound {
                entity: "Project",
                id: project_id.to_string(),
            });
        }

        let all_tasks = self.persistence.tasks.get_all()?;
        let project_task_ids: std::collections::HashSet<String> = all_tasks
            .into_iter()
            .filter(|t| t.project_id == project_id)
            .map(|t| t.id)
            .collect();

        let active_task_ids = self.persistence.time_logs.query_active()?;
        let has_active_timer_by_id = active_task_ids
            .iter()
            .any(|t_id| project_task_ids.contains(t_id));

        let all_logs = self.persistence.time_logs.get_all()?;
        let has_active_log = all_logs.iter().any(|log| {
            (log.project_id == project_id || project_task_ids.contains(&log.task_id))
                && (log.end_time.is_none() || active_task_ids.contains(&log.task_id))
        });

        if has_active_timer_by_id || has_active_log {
            return Err(EngineError::Validation(
                "Cannot delete project with active timer. Stop timer first".to_string(),
            ));
        }

        let has_logs = all_logs
            .iter()
            .any(|log| log.project_id == project_id || project_task_ids.contains(&log.task_id));

        if has_logs {
            return Err(EngineError::Validation(
                "Cannot delete project with logged time".to_string(),
            ));
        }

        let elapsed = self.calculate_project_elapsed(project_id)?;
        if !elapsed.is_zero() {
            return Err(EngineError::Validation(
                "Cannot delete project with logged time".to_string(),
            ));
        }

        Ok(())
    }
}

fn parse_utc_timestamp(val: &str) -> Result<DateTime<Utc>, EngineError> {
    DateTime::parse_from_rfc3339(val)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| EngineError::ParseTime(e.to_string()))
}
