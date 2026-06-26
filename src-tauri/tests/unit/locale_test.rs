use oxy_flow::types::Locale;

#[test]
fn test_locale_from_to_sys_lang() {
    assert_eq!(Locale::from_sys_lang("pl-PL"), Locale::Pl);
    assert_eq!(Locale::from_sys_lang("PL"), Locale::Pl);
    assert_eq!(Locale::from_sys_lang("de-DE"), Locale::De);
    assert_eq!(Locale::from_sys_lang("es-ES"), Locale::Es);
    assert_eq!(Locale::from_sys_lang("fr-FR"), Locale::Fr);
    assert_eq!(Locale::from_sys_lang("pt-BR"), Locale::PtBr);
    assert_eq!(Locale::from_sys_lang("pt-PT"), Locale::PtBr);
    assert_eq!(Locale::from_sys_lang("en-US"), Locale::En);
    assert_eq!(Locale::from_sys_lang("invalid"), Locale::En);

    assert_eq!(Locale::Pl.to_sys_lang(), "pl");
    assert_eq!(Locale::De.to_sys_lang(), "de");
    assert_eq!(Locale::Es.to_sys_lang(), "es");
    assert_eq!(Locale::Fr.to_sys_lang(), "fr");
    assert_eq!(Locale::PtBr.to_sys_lang(), "pt");
    assert_eq!(Locale::En.to_sys_lang(), "en");
    assert_eq!(Locale::System.to_sys_lang(), "en");
    assert_eq!(Locale::Custom.to_sys_lang(), "en");
}
