use std::io::{stdout, IsTerminal};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DecorationMode {
    Rich,
    Plain,
}

pub fn decide_decoration(is_terminal: bool, no_color_env: Option<&str>) -> DecorationMode {
    let is_no_color_active = match no_color_env {
        Some(val) => !val.is_empty(),
        None => false,
    };

    if is_terminal && !is_no_color_active {
        DecorationMode::Rich
    } else {
        DecorationMode::Plain
    }
}

pub fn detect_decoration() -> DecorationMode {
    let is_terminal = stdout().is_terminal();
    let no_color = std::env::var("NO_COLOR").ok();
    decide_decoration(is_terminal, no_color.as_deref())
}
