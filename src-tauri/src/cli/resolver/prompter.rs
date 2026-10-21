use std::io::{self, IsTerminal, Write};
use std::sync::Mutex;

pub trait Prompter: Send + Sync {
    fn is_terminal(&self) -> bool;
    fn prompt_selection(&self, prompt_text: &str, options_count: usize) -> Option<usize>;
    fn prompt_input(&self, query: &str) -> Option<String>;
}

pub struct TerminalPrompter;

impl Prompter for TerminalPrompter {
    fn is_terminal(&self) -> bool {
        io::stdin().is_terminal()
    }

    fn prompt_selection(&self, prompt_text: &str, options_count: usize) -> Option<usize> {
        if !self.is_terminal() {
            return None;
        }

        print!("{}", prompt_text);
        let _ = io::stdout().flush();

        let mut line = String::new();
        if io::stdin().read_line(&mut line).is_err() {
            return None;
        }

        let trimmed = line.trim();
        if trimmed.eq_ignore_ascii_case("q") || trimmed.is_empty() {
            return None;
        }

        if let Ok(idx) = trimmed.parse::<usize>() {
            if idx >= 1 && idx <= options_count {
                return Some(idx - 1);
            }
        }

        None
    }

    fn prompt_input(&self, query: &str) -> Option<String> {
        if !self.is_terminal() {
            return None;
        }

        print!("{}", query);
        let _ = io::stdout().flush();

        let mut line = String::new();
        if io::stdin().read_line(&mut line).is_err() {
            return None;
        }

        let trimmed = line.trim();
        if trimmed.eq_ignore_ascii_case("q") || trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    }
}

pub struct MockPrompter {
    terminal: bool,
    selections: Mutex<Vec<Option<usize>>>,
    inputs: Mutex<Vec<Option<String>>>,
}

impl MockPrompter {
    pub fn new_terminal(selections: Vec<Option<usize>>, inputs: Vec<Option<String>>) -> Self {
        Self {
            terminal: true,
            selections: Mutex::new(selections),
            inputs: Mutex::new(inputs),
        }
    }

    pub fn new_non_terminal() -> Self {
        Self {
            terminal: false,
            selections: Mutex::new(Vec::new()),
            inputs: Mutex::new(Vec::new()),
        }
    }
}

impl Prompter for MockPrompter {
    fn is_terminal(&self) -> bool {
        self.terminal
    }

    fn prompt_selection(&self, _prompt_text: &str, _options_count: usize) -> Option<usize> {
        if !self.terminal {
            return None;
        }
        let mut guard = self.selections.lock().unwrap();
        if guard.is_empty() {
            None
        } else {
            guard.remove(0)
        }
    }

    fn prompt_input(&self, _query: &str) -> Option<String> {
        if !self.terminal {
            return None;
        }
        let mut guard = self.inputs.lock().unwrap();
        if guard.is_empty() {
            None
        } else {
            guard.remove(0)
        }
    }
}
