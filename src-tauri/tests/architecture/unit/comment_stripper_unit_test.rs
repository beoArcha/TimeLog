use crate::architecture::rules::max_nested_ifs::strip_comments_and_strings;

#[test]
fn test_should_strip_single_line_comments_while_preserving_newlines() {
    // Arrange
    let code = "let a = 1; // if true { if false { } }\nlet b = 2;";

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert!(!stripped.contains("if true"));
    assert!(stripped.contains("let a = 1;"));
    assert!(stripped.contains("let b = 2;"));
    assert_eq!(stripped.lines().count(), 2);
}

#[test]
fn test_should_strip_multi_line_block_comments_including_nested_blocks() {
    // Arrange
    let code = "let a = 1; /* outer /* inner if nesting */ still outer */ let b = 2;";

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert!(!stripped.contains("outer"));
    assert!(!stripped.contains("inner"));
    assert!(!stripped.contains("if nesting"));
    assert!(stripped.contains("let a = 1;"));
    assert!(stripped.contains("let b = 2;"));
}

#[test]
fn test_should_strip_regular_string_literals_with_escaped_quotes() {
    // Arrange
    let code = r#"let msg = "Hello \" if cond { \" world"; let x = 42;"#;

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert!(!stripped.contains("if cond"));
    assert!(stripped.contains("let msg = "));
    assert!(stripped.contains("let x = 42;"));
}

#[test]
fn test_should_strip_raw_string_literals_with_various_hash_counts() {
    // Arrange
    let code = r####"
        let r1 = r"if alpha { if beta { } }";
        let r2 = r#"if gamma { "quotes" if delta { } } "#;
        let r3 = r##"if epsilon { #"more hashes"# if zeta { } } "##;
        let final_code = true;
    "####;

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert!(!stripped.contains("if alpha"));
    assert!(!stripped.contains("if beta"));
    assert!(!stripped.contains("if gamma"));
    assert!(!stripped.contains("if delta"));
    assert!(!stripped.contains("if epsilon"));
    assert!(!stripped.contains("if zeta"));
    assert!(stripped.contains("let final_code = true;"));
}

#[test]
fn test_should_strip_character_literals_without_stripping_lifetime_annotations() {
    // Arrange
    let code = "fn parse<'a>(ch: char, s: &'a str) -> &'a str { if ch == 'x' { s } else { s } }";

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert!(stripped.contains("'a"));
    assert!(stripped.contains("if ch =="));
    assert!(!stripped.contains("'x'"));
}

#[test]
fn test_should_preserve_exact_line_count_and_positions_after_stripping() {
    // Arrange
    let code = "line 1\n// line 2 comment\nline 3\n/* multi\nline\ncomment */\nline 7";

    // Act
    let stripped = strip_comments_and_strings(code);

    // Assert
    assert_eq!(stripped.lines().count(), 7);
}
