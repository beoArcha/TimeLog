pub const GENERATOR_NAME: &str = "oxy";
pub const GENERATOR_VERSION: &str = env!("CARGO_PKG_VERSION");

pub const ENTITY_PROJECT: &str = "Project";
pub const ENTITY_TASK: &str = "Task";

pub const LOCAL_DATE_FORMAT: &str = "%Y-%m-%d";
pub const BASIS_POINTS_FULL: u128 = 10_000;

pub const MSG_TASK_HIERARCHY_CYCLE: &str = "task hierarchy contains a cycle at task";

/// Largest integer a JavaScript number represents exactly; money is emitted as a JSON number.
pub const MAX_SAFE_AMOUNT_MINOR: u64 = 9_007_199_254_740_991;
pub const SECONDS_PER_HOUR: u128 = 3_600;

pub const MSG_UNPARSEABLE_RATE: &str = "effective rate is not a valid amount:";
