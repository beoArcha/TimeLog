use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum Locale {
    Pl,
    En,
    De,
    Es,
    #[serde(rename = "pt-br")]
    #[ts(rename = "pt-br")]
    PtBr,
    Fr,
    Custom,
    System,
}

impl Locale {
    pub fn from_sys_lang(sys_lang: &str) -> Self {
        let code = sys_lang.split('-').next().unwrap_or("en").to_lowercase();
        match code.as_str() {
            "pl" => Locale::Pl,
            "de" => Locale::De,
            "es" => Locale::Es,
            "fr" => Locale::Fr,
            "pt" => Locale::PtBr,
            _ => Locale::En,
        }
    }

    pub fn to_sys_lang(self) -> &'static str {
        match self {
            Locale::Pl => "pl",
            Locale::De => "de",
            Locale::Es => "es",
            Locale::Fr => "fr",
            Locale::PtBr => "pt",
            _ => "en",
        }
    }
}
