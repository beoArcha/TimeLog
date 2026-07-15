// Projects queries
pub const INSERT_PROJECT: &str = "
    INSERT INTO projects (id, name, color, created_at, archived, original_name, original_color, edit_history, description, icon, tags)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
";

pub const UPDATE_PROJECT: &str = "
    UPDATE projects SET 
        name = ?2, 
        color = ?3, 
        archived = ?4, 
        original_name = ?5, 
        original_color = ?6, 
        edit_history = ?7,
        description = ?8,
        icon = ?9,
        tags = ?10
    WHERE id = ?1
";

pub const ARCHIVE_PROJECT: &str = "
    UPDATE projects SET archived = 1 WHERE id = ?1
";

pub const SELECT_PROJECT_BY_ID: &str = "
    SELECT id, name, color, created_at, archived, original_name, original_color, edit_history, description, icon, tags 
    FROM projects 
    WHERE id = ?1
";

// Tasks queries
pub const INSERT_TASK: &str = "
    INSERT INTO tasks (id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived, status)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
";

pub const UPDATE_TASK: &str = "
    UPDATE tasks SET 
        project_id = ?2, 
        parent_task_id = ?3, 
        name = ?4, 
        completed = ?5, 
        original_name = ?6, 
        original_completed = ?7, 
        edit_history = ?8,
        archived = ?9,
        status = ?10
    WHERE id = ?1
";

pub const ARCHIVE_TASK: &str = "
    UPDATE tasks SET archived = 1 WHERE id = ?1
";

pub const SELECT_TASK_BY_ID: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived, status 
    FROM tasks 
    WHERE id = ?1
";

pub const SELECT_TASKS_BY_PROJECT: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived, status 
    FROM tasks 
    WHERE project_id = ?1 AND parent_task_id IS NULL
";

pub const SELECT_SUBTASKS_BY_PARENT: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived, status 
    FROM tasks 
    WHERE parent_task_id = ?1
";

// Time logs / timer queries
pub const SELECT_TIME_LOGS_BY_TASK: &str = "
    SELECT 
        tl.id, 
        tl.task_id, 
        t.project_id, 
        tl.start_time, 
        tl.end_time,
        tl.note,
        (
            SELECT json_group_array(
                json_object(
                    'editedAt', h.edited_at,
                    'prevStartTime', h.prev_start_time,
                    'prevEndTime', h.prev_end_time,
                    'prevNote', h.prev_note,
                    'reason', h.reason
                )
            )
            FROM time_logs_history h
            WHERE h.time_log_id = tl.id
            ORDER BY h.edited_at ASC
        ) AS edit_history
    FROM time_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.task_id = ?1
";

pub const SELECT_TIME_LOG_BY_ID: &str = "
    SELECT 
        tl.id, 
        tl.task_id, 
        t.project_id, 
        tl.start_time, 
        tl.end_time,
        tl.note,
        (
            SELECT json_group_array(
                json_object(
                    'editedAt', h.edited_at,
                    'prevStartTime', h.prev_start_time,
                    'prevEndTime', h.prev_end_time,
                    'prevNote', h.prev_note,
                    'reason', h.reason
                )
            )
            FROM time_logs_history h
            WHERE h.time_log_id = tl.id
            ORDER BY h.edited_at ASC
        ) AS edit_history
    FROM time_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.id = ?1
";

pub const UPDATE_TIME_LOG: &str = "
    UPDATE time_logs 
    SET task_id = ?2, start_time = ?3, end_time = ?4, note = ?5 
    WHERE id = ?1
";

pub const INSERT_TIME_LOG_HISTORY: &str = "
    INSERT INTO time_logs_history (id, time_log_id, edited_at, prev_start_time, prev_end_time, prev_note, reason)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
";

pub const SELECT_PROJECT_ID_BY_TASK_ID: &str = "
    SELECT project_id FROM tasks WHERE id = ? LIMIT 1
";

pub const CLOSE_ACTIVE_LOGS_BY_PROJECT: &str = "
    UPDATE time_logs 
    SET end_time = ? 
    WHERE end_time IS NULL 
    AND task_id IN (SELECT id FROM tasks WHERE project_id = ?)
";

pub const CLOSE_ALL_ACTIVE_LOGS: &str = "
    UPDATE time_logs 
    SET end_time = ? 
    WHERE end_time IS NULL
";

pub const INSERT_TIME_LOG: &str = "
    INSERT INTO time_logs (id, task_id, start_time, end_time)
    VALUES (?, ?, ?, NULL)
";

pub const SELECT_ACTIVE_TASK_IDS: &str = "
    SELECT task_id FROM time_logs WHERE end_time IS NULL
";

pub const SELECT_ALL_PROJECTS: &str = "
    SELECT id, name, color, created_at, archived, original_name, original_color, edit_history, description, icon, tags 
    FROM projects
";

pub const DELETE_ALL_PROJECTS: &str = "DELETE FROM projects";

pub const SELECT_ALL_TASKS: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived, status 
    FROM tasks
";

pub const DELETE_ALL_TASKS: &str = "DELETE FROM tasks";

pub const SELECT_ALL_TIME_LOGS: &str = "
    SELECT 
        tl.id, 
        tl.task_id, 
        t.project_id, 
        tl.start_time, 
        tl.end_time,
        tl.note,
        (
            SELECT json_group_array(
                json_object(
                    'editedAt', h.edited_at,
                    'prevStartTime', h.prev_start_time,
                    'prevEndTime', h.prev_end_time,
                    'prevNote', h.prev_note,
                    'reason', h.reason
                )
            )
            FROM time_logs_history h
            WHERE h.time_log_id = tl.id
            ORDER BY h.edited_at ASC
        ) AS edit_history
    FROM time_logs tl
    JOIN tasks t ON tl.task_id = t.id
";

pub const DELETE_ALL_TIME_LOGS: &str = "DELETE FROM time_logs";
