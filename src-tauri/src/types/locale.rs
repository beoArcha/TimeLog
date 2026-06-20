use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export_to = "../../src/bindings/Locale.ts")]
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

#[cfg(test)]
mod tests {
    use super::*;

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
}
