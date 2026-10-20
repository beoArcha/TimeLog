use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;

const FORMAT_SETTINGS_VIEW: &str = "Current Settings:\n{}";

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
