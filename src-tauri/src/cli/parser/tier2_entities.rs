use clap::{Args, Subcommand};

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct ProjectArgs {
    #[command(subcommand)]
    pub command: ProjectSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum ProjectSubcommand {
    #[command(alias = "ls", about = "List projects with summary metrics")]
    List {
        #[arg(short, long, help = "Include archived projects")]
        all: bool,
    },
    #[command(alias = "create", about = "Create a new project")]
    Add {
        #[arg(help = "Project name")]
        name: String,
        #[arg(
            short,
            long,
            help = "Hex or semantic color (e.g. '#3b82f6' or 'indigo')"
        )]
        color: Option<String>,
    },
    #[command(alias = "ren", about = "Rename an existing project")]
    Rename {
        #[arg(help = "Target project (by ID, prefix, or name)")]
        target: String,
        #[arg(help = "New project name")]
        new_name: String,
    },
    #[command(alias = "rm", about = "Archive a project")]
    Archive {
        #[arg(help = "Target project (by ID, prefix, or name)")]
        target: String,
    },
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct TaskArgs {
    #[command(subcommand)]
    pub command: TaskSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum TaskSubcommand {
    #[command(alias = "ls", about = "List tasks and subtasks hierarchically")]
    List {
        #[arg(short, long, help = "Filter by project (by ID, prefix, or name)")]
        project: Option<String>,
        #[arg(short, long, help = "Include completed and archived tasks")]
        all: bool,
    },
    #[command(alias = "create", about = "Add a new task (or subtask)")]
    Add {
        #[arg(help = "Task title / name")]
        name: String,
        #[arg(
            short,
            long,
            help = "Project to attach task to (optional if default exists)"
        )]
        project: Option<String>,
        #[arg(short = 'P', long, help = "Parent task to make this a subtask")]
        parent: Option<String>,
    },
    #[command(alias = "complete", about = "Mark task as done / completed")]
    Done {
        #[arg(help = "Target task (by ID, prefix, or name)")]
        target: String,
    },
    #[command(alias = "ren", about = "Rename an existing task")]
    Rename {
        #[arg(help = "Target task (by ID, prefix, or name)")]
        target: String,
        #[arg(help = "New task title")]
        new_name: String,
    },
    #[command(alias = "rm", about = "Archive a task")]
    Archive {
        #[arg(help = "Target task (by ID, prefix, or name)")]
        target: String,
    },
}

#[derive(Args, Debug, Clone, PartialEq, Eq)]
pub struct LogArgs {
    #[command(subcommand)]
    pub command: LogSubcommand,
}

#[derive(Subcommand, Debug, Clone, PartialEq, Eq)]
pub enum LogSubcommand {
    #[command(alias = "ls", about = "List recent time log entries")]
    List {
        #[arg(short, long, help = "Filter by task (by ID, prefix, or name)")]
        task: Option<String>,
        #[arg(long, help = "Filter to logs from today")]
        today: bool,
        #[arg(long, help = "Filter to logs from the current week")]
        week: bool,
        #[arg(short, long, help = "Limit number of entries returned")]
        limit: Option<usize>,
    },
    #[command(alias = "create", about = "Add a retroactive time log entry")]
    Add {
        #[arg(help = "Target task (by ID, prefix, or name)")]
        target: String,
        #[arg(help = "Duration (e.g. '45m', '1h30m', '90')")]
        duration: String,
        #[arg(help = "Optional log note/description")]
        note: Option<String>,
    },
    #[command(alias = "update", about = "Edit an existing log entry")]
    Edit {
        #[arg(help = "Log ID")]
        id: String,
        #[arg(short, long, help = "New duration (e.g. '30m', '1h')")]
        duration: Option<String>,
        #[arg(short, long, help = "New note")]
        note: Option<String>,
    },
    #[command(alias = "rm", alias = "delete", about = "Delete a log entry")]
    Remove {
        #[arg(help = "Log ID")]
        id: String,
    },
}
