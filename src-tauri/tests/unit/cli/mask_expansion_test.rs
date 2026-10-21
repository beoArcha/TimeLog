use oxy_flow::cli::handlers::mask_handler::expand_mask_template;

#[test]
fn test_given_positional_arguments_when_expanding_template_then_replaces_dollar_tokens() {
    // Arrange
    let template = "log add $1 $2 \"$3\"";
    let args = vec![
        "docs".to_string(),
        "30m".to_string(),
        "Writing specs".to_string(),
    ];

    // Act
    let expanded = expand_mask_template(template, &args, None);

    // Assert
    assert_eq!(expanded, "log add docs 30m \"Writing specs\"");
}

#[test]
fn test_given_last_task_id_when_expanding_template_then_replaces_last_task_token() {
    // Arrange
    let template = "start $LAST_TASK";
    let last_task_id = Some("task-auth-01");

    // Act
    let expanded = expand_mask_template(template, &[], last_task_id);

    // Assert
    assert_eq!(expanded, "start task-auth-01");
}

#[test]
fn test_given_last_token_alias_when_expanding_template_then_replaces_last() {
    // Arrange
    let template = "switch $LAST";
    let last_task_id = Some("task-docs-02");

    // Act
    let expanded = expand_mask_template(template, &[], last_task_id);

    // Assert
    assert_eq!(expanded, "switch task-docs-02");
}

#[test]
fn test_given_both_last_task_and_positional_args_when_expanding_then_replaces_both() {
    // Arrange
    let template = "log add $LAST_TASK $1 \"$2\"";
    let args = vec!["15m".to_string(), "Quick call".to_string()];
    let last_task_id = Some("task-api-99");

    // Act
    let expanded = expand_mask_template(template, &args, last_task_id);

    // Assert
    assert_eq!(expanded, "log add task-api-99 15m \"Quick call\"");
}

#[test]
fn test_given_extra_positional_tokens_without_args_when_expanding_then_leaves_unmatched_tokens() {
    // Arrange
    let template = "log add $1 $2";
    let args = vec!["only_one".to_string()];

    // Act
    let expanded = expand_mask_template(template, &args, None);

    // Assert
    assert_eq!(expanded, "log add only_one $2");
}
