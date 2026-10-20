use crate::cli::shared::constants::FORMAT_SETTINGS_VIEW;
use crate::cli::shared::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;

pub fn view(persistence: &Persistence) -> Result<CliOutput, CliError> {
    let config = persistence
        .settings
        .get()
        .map_err(|e| CliError::Storage(e.to_string()))?;
    let formatted = format!("{:?}", config);
    Ok(CliOutput::Success(
        FORMAT_SETTINGS_VIEW.replace("{}", &formatted),
    ))
}
