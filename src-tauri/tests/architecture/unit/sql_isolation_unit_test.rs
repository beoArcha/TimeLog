use crate::architecture::rules::sql_isolation::extract_raw_sql_keyword;

#[test]
fn test_should_detect_select_keyword_when_inside_string_literal() {
    // Arrange
    let line = r#"let sql = "SELECT id, name FROM tasks";"#;
    let trimmed = line.trim();

    // Act
    let detected = extract_raw_sql_keyword(line, trimmed);

    // Assert
    assert_eq!(detected, Some("SELECT "));
}

#[test]
fn test_should_detect_insert_update_delete_keywords_regardless_of_casing() {
    // Arrange
    let insert_line = r#"let query = "insert into projects (name) values ('oXyFlow')";"#;
    let update_line = r#"let query = "update tasks set status = 'done'";"#;
    let delete_line = r#"let query = "delete from time_logs where id = 1";"#;

    // Act
    let detected_insert = extract_raw_sql_keyword(insert_line, insert_line.trim());
    let detected_update = extract_raw_sql_keyword(update_line, update_line.trim());
    let detected_delete = extract_raw_sql_keyword(delete_line, delete_line.trim());

    // Assert
    assert_eq!(detected_insert, Some("INSERT INTO "));
    assert_eq!(detected_update, Some("UPDATE "));
    assert_eq!(detected_delete, Some("DELETE FROM "));
}

#[test]
fn test_should_detect_keyword_when_inside_backticks() {
    // Arrange
    let line = "let query = `DELETE FROM logs WHERE expired = 1`;";
    let trimmed = line.trim();

    // Act
    let detected = extract_raw_sql_keyword(line, trimmed);

    // Assert
    assert_eq!(detected, Some("DELETE FROM "));
}

#[test]
fn test_should_return_none_when_code_has_no_quotes_or_backticks() {
    // Arrange
    let line = "fn select_user_by_id(id: &str) -> Option<User> {";
    let trimmed = line.trim();

    // Act
    let detected = extract_raw_sql_keyword(line, trimmed);

    // Assert
    assert_eq!(detected, None);
}

#[test]
fn test_should_return_none_when_string_literal_does_not_contain_sql_query_keyword() {
    // Arrange
    let line = r#"let message = "Selected task successfully";"#;
    let trimmed = line.trim();

    // Act
    let detected = extract_raw_sql_keyword(line, trimmed);

    // Assert
    assert_eq!(detected, None);
}
