use crate::cli::shared::constants::MSG_ID_EMPTY;

pub fn validate_id(id: &str) -> Result<String, String> {
    if id.trim().is_empty() {
        Err(MSG_ID_EMPTY.to_string())
    } else {
        Ok(id.trim().to_string())
    }
}
