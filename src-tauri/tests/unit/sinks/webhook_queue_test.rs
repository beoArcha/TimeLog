use oxy_flow::repositories::config::ConfigRepository;
use oxy_flow::types::WebhookQueueItem;
use std::path::PathBuf;

fn setup_test_repo(test_name: &str) -> (ConfigRepository, PathBuf) {
    let db_path = std::env::temp_dir().join(format!("{}.db", test_name));
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let repo = ConfigRepository::new(&db_path).unwrap();
    (repo, db_path)
}

fn create_sample_item(id: &str, status: &str, created_at: &str) -> WebhookQueueItem {
    WebhookQueueItem {
        id: id.to_string(),
        url: "https://api.example.com/sync".to_string(),
        method: "POST".to_string(),
        headers: Some("{\"Content-Type\":\"application/json\"}".to_string()),
        payload: "{\"event\":\"timelog.created\"}".to_string(),
        status: status.to_string(),
        retry_count: 0,
        next_retry_at: None,
        last_error: None,
        created_at: created_at.to_string(),
    }
}

#[test]
fn test_enqueue_webhook_persists_item_and_updates_pending_count() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_enqueue_webhook");
    let item = create_sample_item("hook_1", "pending", "2026-10-19T10:00:00Z");

    // Act
    repo.enqueue_webhook(&item).unwrap();

    // Assert
    let pending = repo.get_pending_webhooks().unwrap();
    assert_eq!(pending.len(), 1);
    assert_eq!(pending[0].id, "hook_1");
    assert_eq!(pending[0].url, "https://api.example.com/sync");
    assert_eq!(pending[0].status, "pending");

    let stats = repo.get_webhook_queue_stats().unwrap();
    assert_eq!(stats.pending, 1);
    assert_eq!(stats.failed, 0);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_get_pending_webhooks_returns_items_in_chronological_order() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_get_pending_order");
    let item_earlier = create_sample_item("hook_earlier", "pending", "2026-10-19T08:00:00Z");
    let item_later = create_sample_item("hook_later", "pending", "2026-10-19T12:00:00Z");
    repo.enqueue_webhook(&item_later).unwrap();
    repo.enqueue_webhook(&item_earlier).unwrap();

    // Act
    let pending = repo.get_pending_webhooks().unwrap();

    // Assert
    assert_eq!(pending.len(), 2);
    assert_eq!(pending[0].id, "hook_earlier");
    assert_eq!(pending[1].id, "hook_later");

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_update_webhook_status_modifies_status_retries_and_errors() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_update_status");
    let item = create_sample_item("hook_fail", "pending", "2026-10-19T10:00:00Z");
    repo.enqueue_webhook(&item).unwrap();

    // Act
    repo.update_webhook_status(
        "hook_fail",
        "failed",
        3,
        Some("2026-10-19T10:05:00Z"),
        Some("503 Service Unavailable"),
    )
    .unwrap();

    // Assert
    let pending = repo.get_pending_webhooks().unwrap();
    assert_eq!(pending.len(), 0);

    let stats = repo.get_webhook_queue_stats().unwrap();
    assert_eq!(stats.pending, 0);
    assert_eq!(stats.failed, 1);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_delete_webhook_removes_target_item() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_delete_webhook");
    let item1 = create_sample_item("hook_keep", "pending", "2026-10-19T10:00:00Z");
    let item2 = create_sample_item("hook_remove", "pending", "2026-10-19T10:01:00Z");
    repo.enqueue_webhook(&item1).unwrap();
    repo.enqueue_webhook(&item2).unwrap();

    // Act
    repo.delete_webhook("hook_remove").unwrap();

    // Assert
    let pending = repo.get_pending_webhooks().unwrap();
    assert_eq!(pending.len(), 1);
    assert_eq!(pending[0].id, "hook_keep");

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_clear_webhook_queue_purges_all_items() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_clear_queue");
    let item1 = create_sample_item("hook_1", "pending", "2026-10-19T10:00:00Z");
    let item2 = create_sample_item("hook_2", "pending", "2026-10-19T10:01:00Z");
    repo.enqueue_webhook(&item1).unwrap();
    repo.enqueue_webhook(&item2).unwrap();

    // Act
    repo.clear_webhook_queue().unwrap();

    // Assert
    let pending = repo.get_pending_webhooks().unwrap();
    assert_eq!(pending.len(), 0);

    let stats = repo.get_webhook_queue_stats().unwrap();
    assert_eq!(stats.pending, 0);
    assert_eq!(stats.failed, 0);
    assert_eq!(stats.delivered, 0);

    let _ = std::fs::remove_file(&db_path);
}

#[test]
fn test_get_webhook_queue_stats_aggregates_counts_correctly() {
    // Arrange
    let (repo, db_path) = setup_test_repo("test_queue_stats");
    let item_pending = create_sample_item("hook_p", "pending", "2026-10-19T10:00:00Z");
    let item_failed = create_sample_item("hook_f", "failed", "2026-10-19T10:01:00Z");
    let item_delivered = create_sample_item("hook_d", "delivered", "2026-10-19T10:02:00Z");
    repo.enqueue_webhook(&item_pending).unwrap();
    repo.enqueue_webhook(&item_failed).unwrap();
    repo.enqueue_webhook(&item_delivered).unwrap();

    // Act
    let stats = repo.get_webhook_queue_stats().unwrap();

    // Assert
    assert_eq!(stats.pending, 1);
    assert_eq!(stats.failed, 1);
    assert_eq!(stats.delivered, 1);

    let _ = std::fs::remove_file(&db_path);
}
