use oxy_flow::tray::localization::{get_text, TrayItem};
use oxy_flow::types::Locale;

#[test]
fn test_en_fallback_for_system_locale() {
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::System),
        "Quit Completely"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::Custom),
        "Quit Completely"
    );
    assert_eq!(get_text(TrayItem::QuitApp, Locale::En), "Quit Completely");
}

#[test]
fn test_pl_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Pl),
        "Pokaż / Ukryj okno"
    );
    assert_eq!(
        get_text(TrayItem::StopAllTimers, Locale::Pl),
        "Zatrzymaj wszystkie timery"
    );
    assert_eq!(get_text(TrayItem::QuitApp, Locale::Pl), "Wyjdź całkowicie");
}

#[test]
fn test_de_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::De),
        "Fenster anzeigen / ausblenden"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::De),
        "Vollständig beenden"
    );
}

#[test]
fn test_fr_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Fr),
        "Afficher / Masquer la fenêtre"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::Fr),
        "Quitter complètement"
    );
}

#[test]
fn test_es_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Es),
        "Mostrar / Ocultar ventana"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::Es),
        "Salir completamente"
    );
}

#[test]
fn test_pt_br_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::PtBr),
        "Mostrar / Ocultar janela"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::PtBr),
        "Sair completamente"
    );
}

#[test]
fn test_all_items_covered_for_pl() {
    let items = [
        TrayItem::ToggleVisibility,
        TrayItem::GuiCompact,
        TrayItem::GuiMedium,
        TrayItem::GuiFull,
        TrayItem::ToggleOnTop,
        TrayItem::StopAllTimers,
        TrayItem::QuitApp,
    ];
    for item in items {
        let text = get_text(item, Locale::Pl);
        assert!(
            !text.is_empty(),
            "Translation for {:?} in PL should not be empty",
            item
        );
    }
}
