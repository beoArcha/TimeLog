use crate::cli::shared::output::CliOutput;
use crate::persistence::PersistenceLayer;

pub fn view(persistence: &PersistenceLayer) -> Result<CliOutput, String> {
    let config = persistence.get_config().map_err(|e| e.to_string())?;
    let formatted = format!("Settings: {:?}", config);
    Ok(CliOutput::Success(formatted))
}
