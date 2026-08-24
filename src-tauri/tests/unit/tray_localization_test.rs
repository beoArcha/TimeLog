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
fn test_all_items_across_all_locales() {
    let items = [
        TrayItem::ToggleVisibility,
        TrayItem::GuiCompact,
        TrayItem::GuiMedium,
        TrayItem::GuiFull,
        TrayItem::ToggleOnTop,
        TrayItem::ToggleMinimizeToTray,
        TrayItem::StopAllTimers,
        TrayItem::QuitApp,
    ];

    let locales = [
        Locale::En,
        Locale::Pl,
        Locale::De,
        Locale::Fr,
        Locale::Es,
        Locale::PtBr,
        Locale::System,
        Locale::Custom,
    ];

    for locale in locales {
        for item in items {
            let text = get_text(item, locale);
            assert!(
                !text.is_empty(),
                "Translation for {:?} in {:?} should not be empty",
                item,
                locale
            );
        }
    }
}

#[test]
fn test_specific_locale_translations() {
    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Pl),
        "Pokaż / Ukryj okno"
    );
    assert_eq!(
        get_text(TrayItem::ToggleMinimizeToTray, Locale::Pl),
        "Minimalizuj do zasobnika"
    );
    assert_eq!(
        get_text(TrayItem::StopAllTimers, Locale::Pl),
        "Zatrzymaj wszystkie timery"
    );
    assert_eq!(get_text(TrayItem::QuitApp, Locale::Pl), "Wyjdź całkowicie");

    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::De),
        "Fenster anzeigen / ausblenden"
    );
    assert_eq!(get_text(TrayItem::GuiCompact, Locale::De), "GUI: Kompakt");
    assert_eq!(
        get_text(TrayItem::ToggleMinimizeToTray, Locale::De),
        "In die Taskleiste minimieren"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::De),
        "Vollständig beenden"
    );

    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Fr),
        "Afficher / Masquer la fenêtre"
    );
    assert_eq!(get_text(TrayItem::GuiMedium, Locale::Fr), "GUI: Moyen");
    assert_eq!(
        get_text(TrayItem::ToggleMinimizeToTray, Locale::Fr),
        "Réduire dans la zone de notification"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::Fr),
        "Quitter complètement"
    );

    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::Es),
        "Mostrar / Ocultar ventana"
    );
    assert_eq!(get_text(TrayItem::GuiFull, Locale::Es), "GUI: Completo");
    assert_eq!(
        get_text(TrayItem::ToggleMinimizeToTray, Locale::Es),
        "Minimizar a la bandeja"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::Es),
        "Salir completamente"
    );

    assert_eq!(
        get_text(TrayItem::ToggleVisibility, Locale::PtBr),
        "Mostrar / Ocultar janela"
    );
    assert_eq!(
        get_text(TrayItem::ToggleOnTop, Locale::PtBr),
        "Sempre no topo"
    );
    assert_eq!(
        get_text(TrayItem::ToggleMinimizeToTray, Locale::PtBr),
        "Minimizar para a bandeja"
    );
    assert_eq!(
        get_text(TrayItem::QuitApp, Locale::PtBr),
        "Sair completamente"
    );
}
