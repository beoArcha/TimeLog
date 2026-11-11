use super::constants::{DURATION_SUFFIX_HOUR, DURATION_SUFFIX_MINUTE, DURATION_SUFFIX_SECOND};

pub fn format_human_duration(seconds: u64) -> String {
    let hours = seconds / 3600;
    let mins = (seconds % 3600) / 60;
    let secs = seconds % 60;

    if hours >= 1 {
        format!("{hours}{DURATION_SUFFIX_HOUR} {mins:02}{DURATION_SUFFIX_MINUTE}")
    } else if mins >= 1 {
        format!("{mins}{DURATION_SUFFIX_MINUTE}")
    } else {
        format!("{secs}{DURATION_SUFFIX_SECOND}")
    }
}
