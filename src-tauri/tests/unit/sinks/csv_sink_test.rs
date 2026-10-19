use crate::shared::builders::{ProjectBuilder, TaskBuilder};
use oxy_flow::sinks::csv::CsvSink;
use oxy_flow::types::PersistenceEvent;
use std::fs::File;
use std::io::Read;

#[test]
fn test_csv_sink_emits_all_event_types() {
    // Arrange
    let temp_dir = std::env::current_dir()
        .unwrap()
        .join("test_csv_sink_events");
    if temp_dir.exists() {
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
    std::fs::create_dir_all(&temp_dir).unwrap();

    let sink = CsvSink::new(&temp_dir);

    let proj = ProjectBuilder::new()
        .with_id("p_csv")
        .with_name("CsvProj")
        .with_color("red")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();

    let task = TaskBuilder::new()
        .with_id("t_csv")
        .with_project_id("p_csv")
        .with_name("CsvTask")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();

    let subtask = TaskBuilder::new()
        .with_id("st_csv")
        .with_project_id("p_csv")
        .with_parent("t_csv")
        .with_name("CsvSubtask")
        .with_created_at("2025-01-01T00:00:00Z")
        .build();

    // Act
    sink.emit(&PersistenceEvent::CreateProject(proj.clone()));
    sink.emit(&PersistenceEvent::PatchProject(proj));
    sink.emit(&PersistenceEvent::ArchiveProject("p_csv".to_string()));

    sink.emit(&PersistenceEvent::CreateTask(task.clone()));
    sink.emit(&PersistenceEvent::PatchTask(task));
    sink.emit(&PersistenceEvent::ArchiveTask {
        project_id: "p_csv".to_string(),
        task_id: "t_csv".to_string(),
    });

    sink.emit(&PersistenceEvent::CreateSubtask(subtask.clone()));
    sink.emit(&PersistenceEvent::PatchSubtask(subtask));
    sink.emit(&PersistenceEvent::ArchiveSubtask {
        project_id: "p_csv".to_string(),
        subtask_id: "st_csv".to_string(),
    });

    // Assert
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
