use oxy_flow::sinks::csv::CsvSink;
use oxy_flow::types::{PersistenceEvent, Project, Task};
use std::fs::File;
use std::io::Read;

#[test]
fn test_csv_sink_emits_all_event_types() {
    let temp_dir = std::env::current_dir()
        .unwrap()
        .join("test_csv_sink_events");
    if temp_dir.exists() {
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
    std::fs::create_dir_all(&temp_dir).unwrap();

    let sink = CsvSink::new(&temp_dir);

    let proj = Project {
        id: "p_csv".to_string(),
        name: "CsvProj".to_string(),
        color: "red".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        archived: Some(false),
        original_name: None,
        original_color: None,
        edit_history: None,
        description: None,
        icon: None,
        tags: None,
    };
    sink.emit(&PersistenceEvent::CreateProject(proj.clone()));
    sink.emit(&PersistenceEvent::PatchProject(proj));
    sink.emit(&PersistenceEvent::ArchiveProject("p_csv".to_string()));

    let task = Task {
        id: "t_csv".to_string(),
        project_id: "p_csv".to_string(),
        parent_task_id: None,
        name: "CsvTask".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    sink.emit(&PersistenceEvent::CreateTask(task.clone()));
    sink.emit(&PersistenceEvent::PatchTask(task));
    sink.emit(&PersistenceEvent::ArchiveTask {
        project_id: "p_csv".to_string(),
        task_id: "t_csv".to_string(),
    });

    let subtask = Task {
        id: "st_csv".to_string(),
        project_id: "p_csv".to_string(),
        parent_task_id: Some("t_csv".to_string()),
        name: "CsvSubtask".to_string(),
        created_at: "2025-01-01T00:00:00Z".to_string(),
        completed: false,
        status: None,
        original_name: None,
        original_completed: None,
        edit_history: None,
        archived: Some(false),
    };
    sink.emit(&PersistenceEvent::CreateSubtask(subtask.clone()));
    sink.emit(&PersistenceEvent::PatchSubtask(subtask));
    sink.emit(&PersistenceEvent::ArchiveSubtask {
        project_id: "p_csv".to_string(),
        subtask_id: "st_csv".to_string(),
    });

    let csv_file_path = temp_dir.join("timelog_p_csv.csv");
    assert!(csv_file_path.exists());

    let mut content = String::new();
    let mut file = File::open(&csv_file_path).unwrap();
    file.read_to_string(&mut content).unwrap();

    assert!(content
        .contains("timestamp,event,entity,entity_id,parent_id,name,sha,source,correlation_id"));
    assert!(content.contains("create,project,p_csv,,CsvProj"));
    assert!(content.contains("patch,project,p_csv,,CsvProj"));
    assert!(content.contains("archive,project,p_csv"));
    assert!(content.contains("create,task,t_csv,,CsvTask"));
    assert!(content.contains("create,subtask,st_csv,t_csv,CsvSubtask"));

    let _ = std::fs::remove_dir_all(&temp_dir);
}
