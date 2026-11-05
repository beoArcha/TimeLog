use oxyflow_timelog::types::Locale;

#[test]
fn test_locale_from_sys_lang_resolves_all_locales_and_falls_back_to_en() {
    // Arrange
    let test_cases = [
        ("pl-PL", Locale::Pl),
        ("PL", Locale::Pl),
        ("de-DE", Locale::De),
        ("es-ES", Locale::Es),
        ("fr-FR", Locale::Fr),
        ("pt-BR", Locale::PtBr),
        ("pt-PT", Locale::PtBr),
        ("uk-UA", Locale::Uk),
        ("UK", Locale::Uk),
        ("uk", Locale::Uk),
        ("ja", Locale::Ja),
        ("ja-JP", Locale::Ja),
        ("JA", Locale::Ja),
        ("nl", Locale::Nl),
        ("nl-NL", Locale::Nl),
        ("NL", Locale::Nl),
        ("it", Locale::It),
        ("it-IT", Locale::It),
        ("IT", Locale::It),
        ("en-US", Locale::En),
        ("invalid", Locale::En),
    ];

    for (input, expected) in test_cases {
        // Act
        let resolved = Locale::from_sys_lang(input);

        // Assert
        assert_eq!(resolved, expected, "Failed resolving locale for: {}", input);
    }
}

#[test]
fn test_locale_to_sys_lang_converts_all_enum_variants_correctly() {
    // Arrange
    let test_cases = [
        (Locale::Pl, "pl"),
        (Locale::De, "de"),
        (Locale::Es, "es"),
        (Locale::Fr, "fr"),
        (Locale::PtBr, "pt"),
        (Locale::Uk, "uk"),
        (Locale::Ja, "ja"),
        (Locale::Nl, "nl"),
        (Locale::It, "it"),
        (Locale::En, "en"),
        (Locale::System, "en"),
        (Locale::Custom, "en"),
    ];

    for (locale, expected) in test_cases {
        // Act
        let code = locale.to_sys_lang();

        // Assert
        assert_eq!(code, expected, "Failed converting locale {:?}", locale);
    }
}

#[test]
fn test_locale_serialization_and_deserialization() {
    // Arrange
    let test_cases = [
        (Locale::Pl, "\"pl\""),
        (Locale::En, "\"en\""),
        (Locale::De, "\"de\""),
        (Locale::Es, "\"es\""),
        (Locale::PtBr, "\"pt-br\""),
        (Locale::Fr, "\"fr\""),
        (Locale::Uk, "\"uk\""),
        (Locale::Ja, "\"ja\""),
        (Locale::Nl, "\"nl\""),
        (Locale::It, "\"it\""),
        (Locale::Custom, "\"custom\""),
        (Locale::System, "\"system\""),
    ];

    for (locale, expected_json) in test_cases {
        // Act - serialize
        let serialized = serde_json::to_string(&locale).expect("Failed to serialize locale");
        assert_eq!(
            serialized, expected_json,
            "Serialization failed for {:?}",
            locale
        );

        // Act - deserialize
        let deserialized: Locale =
            serde_json::from_str(&serialized).expect("Failed to deserialize locale");
        assert_eq!(
            deserialized, locale,
            "Deserialization mismatch for {:?}",
            locale
        );
    }
}

#[test]
fn test_all_supported_translation_locales_are_valid_lowercase_strings() {
    // Arrange: 10 supported translation locales according to contract
    let supported_locales = [
        (Locale::Pl, "pl"),
        (Locale::En, "en"),
        (Locale::De, "de"),
        (Locale::Es, "es"),
        (Locale::PtBr, "pt-br"),
        (Locale::Fr, "fr"),
        (Locale::Uk, "uk"),
        (Locale::Ja, "ja"),
        (Locale::Nl, "nl"),
        (Locale::It, "it"),
    ];

    assert_eq!(
        supported_locales.len(),
        10,
        "Contract requires exactly 10 supported translation locales"
    );

    for (locale, expected_str) in supported_locales {
        // Act
        let serialized = serde_json::to_string(&locale).expect("Failed to serialize locale");
        let inner = serialized.trim_matches('"');

        // Assert: valid lowercase string with optional hyphens
        assert_eq!(
            inner, expected_str,
            "Unexpected serialization for {:?}",
            locale
        );
        assert_eq!(
            inner,
            inner.to_lowercase(),
            "Locale string must be strictly lowercase: {}",
            inner
        );
        assert!(!inner.is_empty(), "Locale string must not be empty");
        assert!(
            inner.chars().all(|c| c.is_ascii_lowercase() || c == '-'),
            "Locale string must contain only lowercase ASCII letters and hyphens: {}",
            inner
        );
    }
}

#[test]
fn test_locale_serde_rejects_invalid_or_uppercase_strings() {
    // Arrange: corrupted or invalid locale strings
    let invalid_cases = [
        "\"EN\"",
        "\"PL\"",
        "\"pt_br\"",
        "\"pt_BR\"",
        "\"PT-BR\"",
        "\"JA\"",
        "\"NL\"",
        "\"IT\"",
        "\"uk-UA\"",
        "\"unknown\"",
        "\"\"",
        "\"   \"",
        "\"123\"",
    ];

    for invalid in invalid_cases {
        // Act
        let result: Result<Locale, _> = serde_json::from_str(invalid);

        // Assert
        assert!(
            result.is_err(),
            "Expected deserialization error for invalid input: {}",
            invalid
        );
    }
}
