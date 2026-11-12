use super::constants::BASIS_POINTS_FULL;
use crate::types::ReportEntry;
use std::cmp::Ordering;

/// Projects, root tasks and sibling subtasks share one rule: most time first, `id` breaks ties.
pub(super) fn seconds_desc_then_id(a: (u64, &str), b: (u64, &str)) -> Ordering {
    b.0.cmp(&a.0).then_with(|| a.1.cmp(b.1))
}

/// `start` is normalized to fixed-width RFC3339 UTC, so string order equals chronological order.
pub(super) fn sort_entries(entries: &mut [ReportEntry]) {
    entries.sort_by(|a, b| a.start.cmp(&b.start).then_with(|| a.id.cmp(&b.id)));
}

/// Round-half-to-even keeps repeated rounding unbiased; integer math keeps output identical across runtimes.
pub(super) fn share_basis_points(seconds: u64, total_seconds: u64) -> u32 {
    if total_seconds == 0 {
        return 0;
    }
    let numerator = u128::from(seconds) * BASIS_POINTS_FULL;
    let total = u128::from(total_seconds);
    let quotient = numerator / total;
    let doubled_remainder = (numerator % total) * 2;

    let rounded_up = match doubled_remainder.cmp(&total) {
        Ordering::Greater => true,
        Ordering::Less => false,
        Ordering::Equal => quotient % 2 == 1,
    };
    let rounded = quotient + u128::from(rounded_up);
    u32::try_from(rounded).unwrap_or(u32::MAX)
}
