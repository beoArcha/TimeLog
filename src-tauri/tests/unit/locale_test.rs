use oxy_flow::types::Locale;

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
