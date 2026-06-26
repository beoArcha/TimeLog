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
