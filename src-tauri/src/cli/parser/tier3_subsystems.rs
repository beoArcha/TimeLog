use clap::{Args, Subcommand};

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct ReportArgs {
    #[command(subcommand)]
    pub command: Option<ReportSubcommand>,
    #[arg(long, help = "Render hierarchical Unicode tree of projects and tasks")]
    pub tree: bool,
    #[arg(long, help = "Scope report to today")]
    pub today: bool,
    #[arg(long, help = "Scope report to current week")]
    pub week: bool,
    #[arg(long, help = "Scope report to current month")]
    pub month: bool,
    #[arg(short = 'p', long, help = "Filter report by project (ID or name)")]
    pub project: Option<String>,
    #[arg(short = 't', long, help = "Filter report by task (ID or name)")]
    pub task: Option<String>,
    #[arg(long, help = "Filter by start date (YYYY-MM-DD or RFC3339)")]
    pub from: Option<String>,
    #[arg(long, help = "Filter by end date (YYYY-MM-DD or RFC3339)")]
    pub to: Option<String>,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum ReportSubcommand {
    #[command(about = "Render hierarchical Unicode report tree")]
    Tree {
        #[arg(long, help = "Scope to today")]
        today: bool,
        #[arg(long, help = "Scope to current week")]
        week: bool,
        #[arg(long, help = "Scope to current month")]
        month: bool,
        #[arg(short = 'p', long, help = "Filter report by project (ID or name)")]
        project: Option<String>,
        #[arg(short = 't', long, help = "Filter report by task (ID or name)")]
        task: Option<String>,
        #[arg(long, help = "Filter by start date (YYYY-MM-DD or RFC3339)")]
        from: Option<String>,
        #[arg(long, help = "Filter by end date (YYYY-MM-DD or RFC3339)")]
        to: Option<String>,
    },
    #[command(about = "Export report to HTML, CSV, or JSON file")]
    Export {
        #[arg(short, long, help = "Export format: html, csv, json, xml, ods, xlsx")]
        format: ExportFormat,
        #[arg(short, long, help = "Output destination file path")]
        output: String,
        #[arg(long, help = "Scope to today")]
        today: bool,
        #[arg(long, help = "Scope to current week")]
        week: bool,
        #[arg(long, help = "Scope to current month")]
        month: bool,
        #[arg(short = 'p', long, help = "Filter report by project (ID or name)")]
        project: Option<String>,
        #[arg(short = 't', long, help = "Filter report by task (ID or name)")]
        task: Option<String>,
        #[arg(long, help = "Filter by start date (YYYY-MM-DD or RFC3339)")]
        from: Option<String>,
        #[arg(long, help = "Filter by end date (YYYY-MM-DD or RFC3339)")]
        to: Option<String>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
pub enum ExportFormat {
    Html,
    Csv,
    Json,
    Xml,
    Ods,
    Xlsx,
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct SinkArgs {
    #[command(subcommand)]
    pub command: SinkSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum SinkSubcommand {
    #[command(alias = "ls", about = "List configured sinks and their health status")]
    List,
    #[command(about = "Configure local CSV audit trail sink")]
    SetCsv {
        #[arg(short, long, help = "Target directory for CSV files")]
        dir: String,
    },
    #[command(about = "Configure outbound webhook sink")]
    SetWebhook {
        #[arg(short, long, help = "Destination HTTP/HTTPS webhook URL")]
        url: String,
        #[arg(short, long, help = "Optional bearer token for authorization header")]
        token: Option<String>,
    },
    #[command(about = "Trigger a synthetic ping test to all configured sinks")]
    Test,
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct MaskArgs {
    #[command(subcommand)]
    pub command: MaskSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum MaskSubcommand {
    #[command(alias = "ls", about = "List registered action masks and macros")]
    List,
    #[command(about = "Register or configure an action mask macro")]
    Set {
        #[arg(help = "Mask name (e.g. 'standup')")]
        name: String,
        #[arg(help = "Command template (e.g. 'log add meetings 15m \"Daily standup\"')")]
        template: String,
    },
    #[command(alias = "rm", about = "Delete a registered action mask")]
    Remove {
        #[arg(help = "Mask name to delete")]
        name: String,
    },
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct ConfigArgs {
    #[command(subcommand)]
    pub command: ConfigSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum ConfigSubcommand {
    #[command(alias = "ls", about = "List all SQLite configuration keys")]
    List,
    #[command(about = "Get configuration value by key")]
    Get {
        #[arg(help = "Configuration key")]
        key: String,
    },
    #[command(about = "Set configuration key to value")]
    Set {
        #[arg(help = "Configuration key")]
        key: String,
        #[arg(help = "Configuration value")]
        value: String,
    },
}

#[derive(Args, Debug, Clone, PartialEq, Eq, Default)]
pub struct DoctorArgs {
    #[arg(long, help = "Attempt automatic remediation of detected anomalies")]
    pub fix: bool,
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct DbArgs {
    #[command(subcommand)]
    pub command: DbSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum DbSubcommand {
    #[command(about = "Safely backup SQLite database to target destination file")]
    Backup {
        #[arg(help = "Destination file path for the backup (e.g. backup.sqlite)")]
        path: String,
    },
    #[command(about = "Safely restore SQLite database from backup file")]
    Restore {
        #[arg(help = "Source backup file path to restore from")]
        path: String,
    },
}
