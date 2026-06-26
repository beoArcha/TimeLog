use crate::cli::shared::output::CliOutput;
use crate::engine::Engine;

pub fn start(task_id: String, engine: &Engine) -> Result<CliOutput, String> {
    engine.start_timer(&task_id).map_err(|e| e.to_string())?;
    Ok(CliOutput::Started(task_id))
}

pub fn stop(engine: &Engine) -> Result<CliOutput, String> {
    engine.stop_timer(None).map_err(|e| e.to_string())?;
    Ok(CliOutput::Stopped)
}

pub fn status(engine: &Engine) -> Result<CliOutput, String> {
    let active = engine.get_active_logs().map_err(|e| e.to_string())?;
    Ok(CliOutput::Status(active))
}
