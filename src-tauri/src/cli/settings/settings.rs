use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;

pub fn view(persistence: &Persistence) -> Result<CliOutput, String> {
    let config = persistence.settings.get().map_err(|e| e.to_string())?;
    let formatted = format!("Settings: {:?}", config);
    Ok(CliOutput::Success(formatted))
}
