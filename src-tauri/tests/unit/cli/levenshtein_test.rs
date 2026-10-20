use oxy_flow::cli::resolver::levenshtein_distance;

#[test]
fn test_given_identical_strings_when_calculating_distance_then_returns_zero() {
    // Arrange
    let a = "project";
    let b = "project";
    let mixed_case = "Project";

    // Act
    let exact_dist = levenshtein_distance(a, b);
    let case_dist = levenshtein_distance(mixed_case, b);

    // Assert
    assert_eq!(exact_dist, 0);
    assert_eq!(case_dist, 0);
}

#[test]
fn test_given_strings_with_typos_when_calculating_distance_then_returns_edit_count() {
    // Arrange
    let typo1 = "projct";
    let target1 = "project";
    let typo2 = "auth";
    let target2 = "oaut";

    // Act
    let dist1 = levenshtein_distance(typo1, target1);
    let dist2 = levenshtein_distance(typo2, target2);

    // Assert
    assert_eq!(dist1, 1);
    assert_eq!(dist2, 2);
}

#[test]
fn test_given_empty_strings_when_calculating_distance_then_returns_length_of_other() {
    // Arrange
    let empty = "";
    let non_empty = "test";

    // Act
    let dist_a = levenshtein_distance(empty, non_empty);
    let dist_b = levenshtein_distance(non_empty, empty);
    let dist_both_empty = levenshtein_distance(empty, empty);

    // Assert
    assert_eq!(dist_a, 4);
    assert_eq!(dist_b, 4);
    assert_eq!(dist_both_empty, 0);
}
