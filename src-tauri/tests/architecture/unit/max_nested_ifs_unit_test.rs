use crate::architecture::rules::scan_nested_ifs;

#[test]
fn test_should_pass_when_if_depth_is_flat_or_two_levels_deep() {
    // Arrange
    let code = r#"
        fn example() {
            if cond1 {
                if cond2 {
                    do_something();
                }
            } else if cond3 {
                do_other();
            } else {
                do_default();
            }
        }
    "#;

    // Act
    let violations = scan_nested_ifs(code, "test.rs", 2);

    // Assert
    assert!(
        violations.is_empty(),
        "Expected no violations, found: {:?}",
        violations
    );
}

#[test]
fn test_should_fail_when_if_is_nested_three_levels_deep() {
    // Arrange
    let code = r#"
        fn example() {
            if cond1 {
                if cond2 {
                    if cond3 {
                        panic!("depth 3");
                    }
                }
            }
        }
    "#;

    // Act
    let violations = scan_nested_ifs(code, "test.rs", 2);

    // Assert
    assert_eq!(violations.len(), 1);
    assert!(violations[0].contains("depth 3"));
}

#[test]
fn test_should_ignore_if_tokens_inside_comments_and_string_literals() {
    // Arrange
    let code = r##"
        fn example() {
            // if nested // if comment
            let s = "if a { if b { if c { } } }";
            if real_if {
                let r = r#"if inside raw"#;
            }
        }
    "##;

    // Act
    let violations = scan_nested_ifs(code, "test.rs", 2);

    // Assert
    assert!(
        violations.is_empty(),
        "Comments and strings must not trigger if depth violations: {:?}",
        violations
    );
}
