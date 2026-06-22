// Projects queries
pub const INSERT_PROJECT: &str = "
    INSERT INTO projects (id, name, color, created_at, archived, original_name, original_color, edit_history)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
";

pub const UPDATE_PROJECT: &str = "
    UPDATE projects SET 
        name = ?2, 
        color = ?3, 
        archived = ?4, 
        original_name = ?5, 
        original_color = ?6, 
        edit_history = ?7
    WHERE id = ?1
";

pub const ARCHIVE_PROJECT: &str = "
    UPDATE projects SET archived = 1 WHERE id = ?1
";

pub const SELECT_PROJECT_BY_ID: &str = "
    SELECT id, name, color, created_at, archived, original_name, original_color, edit_history 
    FROM projects 
    WHERE id = ?1
";

// Tasks queries
pub const INSERT_TASK: &str = "
    INSERT INTO tasks (id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
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
        archived = ?9
    WHERE id = ?1
";

pub const ARCHIVE_TASK: &str = "
    UPDATE tasks SET archived = 1 WHERE id = ?1
";

pub const SELECT_TASK_BY_ID: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived 
    FROM tasks 
    WHERE id = ?1
";

pub const SELECT_TASKS_BY_PROJECT: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived 
    FROM tasks 
    WHERE project_id = ?1 AND parent_task_id IS NULL
";

pub const SELECT_SUBTASKS_BY_PARENT: &str = "
    SELECT id, project_id, parent_task_id, name, completed, created_at, original_name, original_completed, edit_history, archived 
    FROM tasks 
    WHERE parent_task_id = ?1
";

// Time logs / timer queries
pub const SELECT_TIME_LOGS_BY_TASK: &str = "
    SELECT tl.id, tl.task_id, t.project_id, tl.start_time, tl.end_time 
    FROM time_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.task_id = ?1
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
