use crate::cli::error::CliError;
use crate::cli::shared::output::CliOutput;
use crate::persistence::Persistence;

const FORMAT_SETTINGS_VIEW: &str = "Current Settings:\n{}";

pub fn view(persistence: &Persistence) -> Result<CliOutput, CliError> {
    let config = persistence.settings.get()?;
    let formatted = format!("{:?}", config);
    Ok(CliOutput::Success(
        FORMAT_SETTINGS_VIEW.replace("{}", &formatted),
    ))
}
