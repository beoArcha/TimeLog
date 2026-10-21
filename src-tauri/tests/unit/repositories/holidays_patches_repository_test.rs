use crate::shared::builders::ProjectBuilder;
use oxy_flow::repositories::business::BusinessRepository;
use oxy_flow::types::{HolidayLeave, HolidayType, PatchLog};

#[test]
fn test_holidays_repository_crud() {
    let db_path = std::env::temp_dir().join("test_holidays_repo.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let initial = repo.get_all_holidays().unwrap();
    assert_eq!(initial.len(), 0);

    let holidays = vec![
        HolidayLeave {
            id: "h1".to_string(),
            date: "2026-12-25".to_string(),
            r#type: HolidayType::Holiday,
            name: "Christmas".to_string(),
            note: Some("Family time".to_string()),
            original_name: None,
            original_date: None,
            original_type: None,
            edit_history: None,
        },
        HolidayLeave {
            id: "h2".to_string(),
            date: "2026-01-01".to_string(),
            r#type: HolidayType::Holiday,
            name: "New Year".to_string(),
            note: None,
            original_name: None,
            original_date: None,
            original_type: None,
            edit_history: None,
        },
    ];

    repo.save_holidays(&holidays).unwrap();

    let saved = repo.get_all_holidays().unwrap();
    assert_eq!(saved.len(), 2);
    assert_eq!(saved[0].id, "h2");
    assert_eq!(saved[0].name, "New Year");
    assert_eq!(saved[1].id, "h1");
    assert_eq!(saved[1].name, "Christmas");

    // Test replace
    let replacement = vec![HolidayLeave {
        id: "h3".to_string(),
        date: "2026-05-01".to_string(),
        r#type: HolidayType::Leave,
        name: "Labor Day".to_string(),
        note: None,
        original_name: None,
        original_date: None,
        original_type: None,
        edit_history: None,
    }];
    repo.save_holidays(&replacement).unwrap();

    let updated = repo.get_all_holidays().unwrap();
    assert_eq!(updated.len(), 1);
    assert_eq!(updated[0].id, "h3");

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_patches_repository_crud() {
    let db_path = std::env::temp_dir().join("test_patches_repo.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    let repo = BusinessRepository::new(&db_path).unwrap();

    let project = ProjectBuilder::new()
        .with_id("p_patch")
        .with_name("Patch Project")
        .with_color("green")
        .with_created_at("2026-06-22T20:00:00Z")
        .build();
    repo.create_project(&project).unwrap();

    let initial = repo.get_all_patches().unwrap();
    assert_eq!(initial.len(), 0);

    let patches = vec![PatchLog {
        id: "pt1".to_string(),
        project_id: "p_patch".to_string(),
        task_id: None,
        start_time: "2026-06-22T08:00:00Z".to_string(),
        end_time: "2026-06-22T09:00:00Z".to_string(),
        patch_note: "Manual correction".to_string(),
        is_system_event: Some(false),
    }];

    repo.save_patches(&patches).unwrap();

    let saved = repo.get_all_patches().unwrap();
    assert_eq!(saved.len(), 1);
    assert_eq!(saved[0].id, "pt1");
    assert_eq!(saved[0].patch_note, "Manual correction");
    assert_eq!(saved[0].is_system_event, Some(false));

    let _ = std::fs::remove_file(&db_path);
}
