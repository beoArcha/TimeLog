use oxyflow_timelog::cli::formatters::{render_table, Align, Column, DecorationMode, TableError};

#[test]
fn test_given_columns_with_alignments_when_render_table_then_formats_left_and_right_correctly() {
    // Arrange
    let columns = vec![
        Column {
            header: "TASK".to_string(),
            align: Align::Left,
            max_width: None,
        },
        Column {
            header: "DURATION".to_string(),
            align: Align::Right,
            max_width: None,
        },
    ];
    let rows = vec![
        vec!["Dev".to_string(), "5m".to_string()],
        vec!["Writing tests".to_string(), "1h 30m".to_string()],
    ];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    let lines: Vec<&str> = output.lines().collect();
    assert_eq!(lines.len(), 4);
    assert_eq!(lines[0], "TASK           DURATION");
    assert_eq!(lines[1], "-----------------------");
    assert_eq!(lines[2], "Dev                  5m");
    assert_eq!(lines[3], "Writing tests    1h 30m");
}

#[test]
fn test_given_polish_diacritics_when_render_table_then_measures_single_column_per_character() {
    // Arrange
    let columns = vec![Column {
        header: "Kategoria".to_string(),
        align: Align::Left,
        max_width: None,
    }];
    let rows = vec![vec!["Wewnętrzne".to_string()]];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    let lines: Vec<&str> = output.lines().collect();
    assert_eq!(lines[0], "Kategoria");
    assert_eq!(lines[1], "----------");
    assert_eq!(lines[2], "Wewnętrzne");
}

#[test]
fn test_given_japanese_text_when_render_table_then_measures_two_columns_per_character() {
    // Arrange
    let columns = vec![Column {
        header: "Col".to_string(),
        align: Align::Left,
        max_width: None,
    }];
    let rows = vec![vec!["会議".to_string()]];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    let lines: Vec<&str> = output.lines().collect();
    assert_eq!(lines[0], "Col");
    assert_eq!(lines[1], "----");
    assert_eq!(lines[2], "会議");
}

#[test]
fn test_given_long_cells_and_wide_chars_when_render_table_then_truncates_without_splitting_wide_chars(
) {
    // Arrange
    let columns = vec![
        Column {
            header: "En".to_string(),
            align: Align::Left,
            max_width: Some(5),
        },
        Column {
            header: "Jp".to_string(),
            align: Align::Left,
            max_width: Some(3),
        },
        Column {
            header: "Wide".to_string(),
            align: Align::Left,
            max_width: Some(4),
        },
    ];
    let rows = vec![vec![
        "VeryLongText".to_string(),
        "会議室".to_string(),
        "会議室".to_string(),
    ]];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    let lines: Vec<&str> = output.lines().collect();
    assert_eq!(lines[0], "En     Jp   Wide");
    assert_eq!(lines[1], "----------------");
    assert_eq!(lines[2], "Very…  会…  会…");
}

#[test]
fn test_given_rich_and_plain_modes_when_render_table_then_uses_appropriate_separator_character() {
    // Arrange
    let columns = vec![Column {
        header: "A".to_string(),
        align: Align::Left,
        max_width: None,
    }];
    let rows = vec![vec!["B".to_string()]];

    // Act
    let rich_rendered = render_table(&columns, &rows, DecorationMode::Rich);
    let plain_rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rich_rendered.is_ok());
    assert!(plain_rendered.is_ok());
    let rich_out = rich_rendered.unwrap();
    let plain_out = plain_rendered.unwrap();
    assert!(rich_out.contains('─'));
    assert!(!rich_out.contains('-'));
    assert!(plain_out.contains('-'));
    assert!(!plain_out.contains('─'));
}

#[test]
fn test_given_short_rows_when_render_table_then_pads_missing_cells_with_empty_strings() {
    // Arrange
    let columns = vec![
        Column {
            header: "First".to_string(),
            align: Align::Left,
            max_width: None,
        },
        Column {
            header: "Second".to_string(),
            align: Align::Left,
            max_width: None,
        },
    ];
    let rows = vec![vec!["A".to_string()]];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    let lines: Vec<&str> = output.lines().collect();
    assert_eq!(lines[2], "A");
}

#[test]
fn test_given_too_many_cells_in_row_when_render_table_then_returns_typed_table_error() {
    // Arrange
    let columns = vec![Column {
        header: "OnlyOne".to_string(),
        align: Align::Left,
        max_width: None,
    }];
    let rows = vec![vec!["CellOne".to_string(), "CellTwo".to_string()]];

    // Act
    let result = render_table(&columns, &rows, DecorationMode::Plain);

    // Assert
    assert_eq!(
        result,
        Err(TableError::TooManyCells {
            expected: 1,
            actual: 2
        })
    );
}

#[test]
fn test_given_rendered_table_when_checking_lines_then_no_trailing_spaces_exist_on_any_line() {
    // Arrange
    let columns = vec![
        Column {
            header: "Header One".to_string(),
            align: Align::Left,
            max_width: None,
        },
        Column {
            header: "Header Two".to_string(),
            align: Align::Left,
            max_width: None,
        },
    ];
    let rows = vec![
        vec!["Short".to_string(), "End".to_string()],
        vec!["Longer Text".to_string()],
    ];

    // Act
    let rendered = render_table(&columns, &rows, DecorationMode::Rich);

    // Assert
    assert!(rendered.is_ok());
    let output = rendered.unwrap();
    for line in output.lines() {
        assert!(
            !line.ends_with(' '),
            "Line should not have trailing spaces: {:?}",
            line
        );
    }
}
