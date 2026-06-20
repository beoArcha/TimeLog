use crate::types::Locale;

/// Maps a tray menu entry identifier and locale to its localized display string.
pub fn get_text(item: TrayItem, locale: Locale) -> &'static str {
    match locale {
        Locale::Pl => pl(item),
        Locale::De => de(item),
        Locale::Fr => fr(item),
        Locale::Es => es(item),
        Locale::PtBr => pt_br(item),
        _ => en(item),
    }
}

/// All translatable tray menu items, mirroring `TrayMenuId` but decoupled from Tauri types.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayItem {
    ToggleVisibility,
    GuiSmall,
    GuiMedium,
    GuiLarge,
    ToggleOnTop,
    StopAllTimers,
    QuitApp,
}

fn en(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Show / Hide Window",
        TrayItem::GuiSmall => "GUI: Small",
        TrayItem::GuiMedium => "GUI: Medium",
        TrayItem::GuiLarge => "GUI: Large",
        TrayItem::ToggleOnTop => "Always on Top",
        TrayItem::StopAllTimers => "Stop All Timers",
        TrayItem::QuitApp => "Quit Completely",
    }
}

fn pl(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Pokaż / Ukryj okno",
        TrayItem::GuiSmall => "GUI: Mały",
        TrayItem::GuiMedium => "GUI: Średni",
        TrayItem::GuiLarge => "GUI: Duży",
        TrayItem::ToggleOnTop => "Zawsze na wierzchu",
        TrayItem::StopAllTimers => "Zatrzymaj wszystkie timery",
        TrayItem::QuitApp => "Wyjdź całkowicie",
    }
}

fn de(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Fenster anzeigen / ausblenden",
        TrayItem::GuiSmall => "GUI: Klein",
        TrayItem::GuiMedium => "GUI: Mittel",
        TrayItem::GuiLarge => "GUI: Groß",
        TrayItem::ToggleOnTop => "Immer im Vordergrund",
        TrayItem::StopAllTimers => "Alle Timer stoppen",
        TrayItem::QuitApp => "Vollständig beenden",
    }
}

fn fr(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Afficher / Masquer la fenêtre",
        TrayItem::GuiSmall => "GUI: Petit",
        TrayItem::GuiMedium => "GUI: Moyen",
        TrayItem::GuiLarge => "GUI: Grand",
        TrayItem::ToggleOnTop => "Toujours au premier plan",
        TrayItem::StopAllTimers => "Arrêter tous les minuteurs",
        TrayItem::QuitApp => "Quitter complètement",
    }
}

fn es(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Mostrar / Ocultar ventana",
        TrayItem::GuiSmall => "GUI: Pequeño",
        TrayItem::GuiMedium => "GUI: Mediano",
        TrayItem::GuiLarge => "GUI: Grande",
        TrayItem::ToggleOnTop => "Siempre en primer plano",
        TrayItem::StopAllTimers => "Detener todos los temporizadores",
        TrayItem::QuitApp => "Salir completamente",
    }
}

fn pt_br(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Mostrar / Ocultar janela",
        TrayItem::GuiSmall => "GUI: Pequeno",
        TrayItem::GuiMedium => "GUI: Médio",
        TrayItem::GuiLarge => "GUI: Grande",
        TrayItem::ToggleOnTop => "Sempre no topo",
        TrayItem::StopAllTimers => "Parar todos os cronômetros",
        TrayItem::QuitApp => "Sair completamente",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Locale;

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
            TrayItem::GuiSmall,
            TrayItem::GuiMedium,
            TrayItem::GuiLarge,
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
}
