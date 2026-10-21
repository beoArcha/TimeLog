use crate::architecture::rules::helpers::{
    is_comment_line, resolve_module_name, resolve_relative_path,
};
use std::path::Path;

#[test]
fn test_should_return_module_name_when_file_is_in_submodule_directory() {
    // Arrange
    let src_root = Path::new("src");
    let file_path = Path::new("src/cli/handlers/task.rs");

    // Act
    let module_name = resolve_module_name(src_root, file_path);

    // Assert
    assert_eq!(module_name, Some("cli".to_string()));
}

#[test]
fn test_should_return_module_name_when_file_is_deeply_nested_in_submodule() {
    // Arrange
    let src_root = Path::new("src");
    let file_path = Path::new("src/engine/timer/rules/evaluator.rs");

    // Act
    let module_name = resolve_module_name(src_root, file_path);

    // Assert
    assert_eq!(module_name, Some("engine".to_string()));
}

#[test]
fn test_should_return_none_when_file_is_at_source_root_level() {
    // Arrange
    let src_root = Path::new("src");
    let main_rs = Path::new("src/main.rs");
    let lib_rs = Path::new("src/lib.rs");

    // Act
    let main_mod = resolve_module_name(src_root, main_rs);
    let lib_mod = resolve_module_name(src_root, lib_rs);

    // Assert
    assert_eq!(main_mod, None);
    assert_eq!(lib_mod, None);
}

#[test]
fn test_should_return_none_when_file_path_does_not_belong_to_source_root() {
    // Arrange
    let src_root = Path::new("src");
    let external_path = Path::new("other_dir/external.rs");

    // Act
    let module_name = resolve_module_name(src_root, external_path);

    // Assert
    assert_eq!(module_name, None);
}

#[test]
fn test_should_return_forward_slash_relative_path_when_path_is_valid() {
    // Arrange
    let root_dir = Path::new("src");
    #[cfg(windows)]
    let file_path = Path::new(r"src\persistence\sqlite\repo.rs");
    #[cfg(not(windows))]
    let file_path = Path::new("src/persistence/sqlite/repo.rs");

    // Act
    let relative = resolve_relative_path(root_dir, file_path);

    // Assert
    assert_eq!(relative, "persistence/sqlite/repo.rs");
}

#[test]
fn test_should_return_empty_string_when_path_does_not_have_root_prefix() {
    // Arrange
    let root_dir = Path::new("src");
    let outside_path = Path::new("tests/outside.rs");

    // Act
    let relative = resolve_relative_path(root_dir, outside_path);

    // Assert
    assert_eq!(relative, "");
}

#[test]
fn test_should_return_true_when_line_starts_with_comment_markers() {
    // Arrange
    let line_comment = "// This is an explanatory comment";
    let block_comment_start = "/* Block comment header";
    let block_comment_body = "* continuation of documentation";

    // Act
    let is_line = is_comment_line(line_comment);
    let is_block_start = is_comment_line(block_comment_start);
    let is_block_body = is_comment_line(block_comment_body);

    // Assert
    assert!(is_line);
    assert!(is_block_start);
    assert!(is_block_body);
}

#[test]
fn test_should_return_false_when_line_is_valid_code_or_empty() {
    // Arrange
    let code_line = "let active_timer = true;";
    let empty_line = "";
    let struct_definition = "pub struct TimerState;";

    // Act
    let is_code = is_comment_line(code_line);
    let is_empty = is_comment_line(empty_line);
    let is_struct = is_comment_line(struct_definition);

    // Assert
    assert!(!is_code);
    assert!(!is_empty);
    assert!(!is_struct);
}
