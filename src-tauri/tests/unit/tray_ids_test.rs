use oxy_flow::tray::ids::TrayMenuId;
use oxy_flow::types::Locale;

#[test]
fn test_from_str_round_trip() {
    let ids = [
        TrayMenuId::ToggleVisibility,
        TrayMenuId::GuiCompact,
        TrayMenuId::GuiMedium,
        TrayMenuId::GuiFull,
        TrayMenuId::ToggleOnTop,
        TrayMenuId::StopAllTimers,
        TrayMenuId::QuitApp,
    ];
    for id in ids {
        let s = id.as_str();
        assert_eq!(
            TrayMenuId::from_str(s),
            Some(id),
            "from_str({s}) should round-trip"
        );
    }
}

#[test]
fn test_from_str_unknown_returns_none() {
    assert_eq!(TrayMenuId::from_str("unknown_id"), None);
    assert_eq!(TrayMenuId::from_str(""), None);
}

#[test]
fn test_get_text_delegates_to_localization() {
    assert_eq!(TrayMenuId::QuitApp.get_text(Locale::En), "Quit Completely");
    assert_eq!(TrayMenuId::QuitApp.get_text(Locale::Pl), "Wyjdź całkowicie");
}
