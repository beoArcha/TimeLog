use clap::Args;

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct StartArgs {
    #[arg(help = "Target task to start (by ID, prefix, or name substring)")]
    pub target: Option<String>,
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct StopArgs {
    #[arg(long, help = "Stop all active timers")]
    pub all: bool,
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct SwitchArgs {
    #[arg(help = "Target task to switch to (by ID, prefix, or name substring)")]
    pub target: String,
}
