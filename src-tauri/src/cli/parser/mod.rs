pub mod tier1_flow;
pub mod tier2_entities;
pub mod tier3_subsystems;

use clap::{Parser, Subcommand};

pub use tier1_flow::{StartArgs, StopArgs, SwitchArgs};
pub use tier2_entities::{
    LogArgs, LogSubcommand, ProjectArgs, ProjectSubcommand, TaskArgs, TaskSubcommand,
};
pub use tier3_subsystems::{
    ConfigArgs, ConfigSubcommand, DbArgs, DbSubcommand, DoctorArgs, ExportFormat, MaskArgs,
    MaskSubcommand, ReportArgs, ReportSubcommand, SinkArgs, SinkSubcommand,
};

#[derive(Parser, Debug, Clone, Default)]
#[command(
    name = "oxy",
    bin_name = "oxy",
    version,
    about = "High-velocity native time tracking CLI"
)]
pub struct CliArgs {
    #[arg(
        short = 'm',
        long = "machine",
        global = true,
        help = "Deterministic silent machine JSON output"
    )]
    pub machine: bool,

    #[arg(
        short = 'j',
        long = "json",
        global = true,
        help = "Output clean JSON to stdout"
    )]
    pub json: bool,

    #[arg(
        short = 'q',
        long = "quiet",
        global = true,
        help = "Suppress non-essential output"
    )]
    pub quiet: bool,

    #[arg(
        long = "db",
        global = true,
        help = "Explicit path to SQLite database file"
    )]
    pub db: Option<String>,

    #[command(subcommand)]
    pub command: Option<CliCommand>,
}

pub type CliCommands = CliCommand;

#[derive(Subcommand, Debug, Clone)]
pub enum CliCommand {
    #[command(alias = "s", about = "Start timer on task (by ID, prefix, or name)")]
    Start(StartArgs),

    #[command(alias = "sp", about = "Stop active timer session")]
    Stop(StopArgs),

    #[command(alias = "sw", about = "Atomically switch active timer to new task")]
    Switch(SwitchArgs),

    #[command(alias = "st", about = "Display current running timer status")]
    Status,

    #[command(alias = "summary", about = "Display today's work summary")]
    Today,

    #[command(
        alias = "p",
        alias = "proj",
        about = "Manage projects (ls, add, ren, rm)"
    )]
    Project(ProjectArgs),

    #[command(
        alias = "t",
        about = "Manage tasks and subtasks (ls, add, ren, done, rm)"
    )]
    Task(TaskArgs),

    #[command(alias = "l", about = "Manage time logs and retroactive adjustments")]
    Log(LogArgs),

    #[command(alias = "rep", about = "Generate reports or export to HTML/CSV/JSON")]
    Report(ReportArgs),

    #[command(about = "Configure and test audit CSV and webhook sinks")]
    Sink(SinkArgs),

    #[command(alias = "alias", about = "Manage custom action macros and shortcuts")]
    Mask(MaskArgs),

    #[command(about = "Inspect and modify SQLite configuration settings")]
    Config(ConfigArgs),

    #[command(about = "Perform system and database health diagnostics")]
    Doctor(DoctorArgs),

    #[command(about = "Manage database backup and recovery operations")]
    Db(DbArgs),
}
