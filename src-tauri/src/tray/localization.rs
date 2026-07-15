use crate::types::Locale;

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayItem {
    ToggleVisibility,
    GuiCompact,
    GuiMedium,
    GuiFull,
    ToggleOnTop,
    StopAllTimers,
    QuitApp,
}

fn en(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Show / Hide Window",
        TrayItem::GuiCompact => "GUI: Compact",
        TrayItem::GuiMedium => "GUI: Medium",
        TrayItem::GuiFull => "GUI: Full",
        TrayItem::ToggleOnTop => "Always on Top",
        TrayItem::StopAllTimers => "Stop All Timers",
        TrayItem::QuitApp => "Quit Completely",
    }
}

fn pl(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Pokaż / Ukryj okno",
        TrayItem::GuiCompact => "GUI: Kompaktowy",
        TrayItem::GuiMedium => "GUI: Średni",
        TrayItem::GuiFull => "GUI: Pełny",
        TrayItem::ToggleOnTop => "Zawsze na wierzchu",
        TrayItem::StopAllTimers => "Zatrzymaj wszystkie timery",
        TrayItem::QuitApp => "Wyjdź całkowicie",
    }
}

fn de(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Fenster anzeigen / ausblenden",
        TrayItem::GuiCompact => "GUI: Kompakt",
        TrayItem::GuiMedium => "GUI: Mittel",
        TrayItem::GuiFull => "GUI: Voll",
        TrayItem::ToggleOnTop => "Immer im Vordergrund",
        TrayItem::StopAllTimers => "Alle Timer stoppen",
        TrayItem::QuitApp => "Vollständig beenden",
    }
}

fn fr(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Afficher / Masquer la fenêtre",
        TrayItem::GuiCompact => "GUI: Compact",
        TrayItem::GuiMedium => "GUI: Moyen",
        TrayItem::GuiFull => "GUI: Plein",
        TrayItem::ToggleOnTop => "Toujours au premier plan",
        TrayItem::StopAllTimers => "Arrêter tous les minuteurs",
        TrayItem::QuitApp => "Quitter complètement",
    }
}

fn es(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Mostrar / Ocultar ventana",
        TrayItem::GuiCompact => "GUI: Compacto",
        TrayItem::GuiMedium => "GUI: Mediano",
        TrayItem::GuiFull => "GUI: Completo",
        TrayItem::ToggleOnTop => "Siempre en primer plano",
        TrayItem::StopAllTimers => "Detener todos los temporizadores",
        TrayItem::QuitApp => "Salir completamente",
    }
}

fn pt_br(item: TrayItem) -> &'static str {
    match item {
        TrayItem::ToggleVisibility => "Mostrar / Ocultar janela",
        TrayItem::GuiCompact => "GUI: Compacto",
        TrayItem::GuiMedium => "GUI: Médio",
        TrayItem::GuiFull => "GUI: Completo",
        TrayItem::ToggleOnTop => "Sempre no topo",
        TrayItem::StopAllTimers => "Parar todos os cronômetros",
        TrayItem::QuitApp => "Sair completamente",
    }
}
