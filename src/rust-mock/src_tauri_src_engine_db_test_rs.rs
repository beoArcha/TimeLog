#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_data_manager_creation() {
        let manager = DataManager::new();
        assert!(manager.is_ok(), "Data manager should initialize sqlite connection");
    }

    #[test]
    fn test_data_manager_insert_project() {
        let manager = DataManager::new().unwrap();
        let res = manager.insert_project("1", "TestProj", "red", "2026-06-15T12:00:00Z");
        assert!(res.is_ok());
    }
}
