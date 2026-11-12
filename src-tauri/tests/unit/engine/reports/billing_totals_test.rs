use super::helpers::{
    billed_project, build, currency_only_project, june_15, log, log_lasting, project,
    project_patch, rated_subtask, rated_task, request, request_with_patches, root_task, snapshot,
    DAY_START,
};
use oxyflow_timelog::types::{ReportDocument, ReportVariant};

fn amounts_in(doc: &ReportDocument, currency: &str) -> u64 {
    doc.projects
        .iter()
        .flat_map(|project| &project.tasks)
        .flat_map(|task| {
            let subtasks = task.subtasks.iter().map(|s| (&s.currency, s.amount_minor));
            std::iter::once((&task.currency, task.amount_minor)).chain(subtasks)
        })
        .filter(|(task_currency, _)| task_currency.as_deref() == Some(currency))
        .map(|(_, amount)| amount.unwrap_or_default())
        .sum()
}

#[test]
fn test_given_projects_in_two_currencies_when_building_then_billing_has_one_item_per_currency() {
    // Arrange
    let usd_task = root_task("t_usd", "p1");
    let eur_task = root_task("t_eur", "p2");
    let data = snapshot(
        vec![
            billed_project("p1", "100.00", "USD"),
            billed_project("p2", "50.00", "EUR"),
        ],
        vec![usd_task.clone(), eur_task.clone()],
        vec![
            log_lasting(&usd_task, "l1", 3600),
            log_lasting(&eur_task, "l2", 1800),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let billing = &doc.totals.billing;
    assert_eq!(billing.len(), 2);
    assert_eq!(billing[0].currency, "EUR");
    assert_eq!(billing[0].amount_minor, 2_500);
    assert_eq!(billing[1].currency, "USD");
    assert_eq!(billing[1].amount_minor, 10_000);
}

#[test]
fn test_given_projects_in_two_currencies_when_building_then_each_project_bills_only_its_currency() {
    // Arrange
    let usd_task = root_task("t_usd", "p1");
    let eur_task = root_task("t_eur", "p2");
    let data = snapshot(
        vec![
            billed_project("p1", "100.00", "USD"),
            billed_project("p2", "50.00", "EUR"),
        ],
        vec![usd_task.clone(), eur_task.clone()],
        vec![
            log_lasting(&usd_task, "l1", 3600),
            log_lasting(&eur_task, "l2", 1800),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let usd_project = doc.projects.iter().find(|p| p.id == "p1").unwrap();
    assert_eq!(usd_project.billing.len(), 1);
    assert_eq!(usd_project.billing[0].currency, "USD");
    assert_eq!(usd_project.billing[0].amount_minor, 10_000);
    assert_eq!(usd_project.billing[0].billable_seconds, 3600);
}

#[test]
fn test_given_an_unconfigured_task_with_a_known_currency_when_building_then_the_bucket_counts_its_seconds(
) {
    // Arrange
    let task = root_task("t1", "p1");
    let data = snapshot(
        vec![currency_only_project("p1", "USD")],
        vec![task.clone()],
        vec![log_lasting(&task, "l1", 900)],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let bucket = &doc.totals.billing[0];
    assert_eq!(bucket.currency, "USD");
    assert_eq!(bucket.unconfigured_seconds, 900);
    assert_eq!(bucket.amount_minor, 0);
}

#[test]
fn test_given_mixed_rate_statuses_when_building_then_the_document_split_covers_all_time() {
    // Arrange
    let billable = rated_task("t_b", "p1", "60.00");
    let free = rated_task("t_f", "p1", "0.00");
    let unset = root_task("t_u", "p2");
    let data = snapshot(
        vec![billed_project("p1", "10.00", "USD"), project("p2")],
        vec![billable.clone(), free.clone(), unset.clone()],
        vec![
            log_lasting(&billable, "l1", 3600),
            log_lasting(&free, "l2", 1200),
            log_lasting(&unset, "l3", 600),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    let totals = &doc.totals;
    assert_eq!(totals.billable_seconds, 3600);
    assert_eq!(totals.non_billable_seconds, 1200);
    assert_eq!(totals.unconfigured_seconds, 600);
    assert_eq!(
        totals.billable_seconds + totals.non_billable_seconds + totals.unconfigured_seconds,
        totals.seconds
    );
}

#[test]
fn test_given_a_project_level_patch_when_building_then_its_time_is_unconfigured_without_a_currency()
{
    // Arrange
    let owner = billed_project("p1", "100.00", "USD");
    let data = snapshot(
        vec![owner.clone()],
        vec![],
        vec![],
        vec![project_patch(
            &owner,
            "pl1",
            "2026-06-15T10:00:00Z",
            "2026-06-15T11:00:00Z",
        )],
    );

    // Act
    let doc = build(
        &data,
        &request_with_patches(ReportVariant::Summary),
        &june_15(),
    );

    // Assert
    assert_eq!(doc.totals.unconfigured_seconds, 3600);
    assert!(doc.totals.billing.is_empty());
    assert!(doc.projects[0].billing.is_empty());
}

#[test]
fn test_given_tasks_and_subtasks_in_one_currency_when_building_then_billing_sums_every_task_amount()
{
    // Arrange
    let root = rated_task("r", "p1", "33.33");
    let first = rated_subtask("c1", &root, "17.77");
    let second = rated_subtask("c2", &root, "9.99");
    let data = snapshot(
        vec![billed_project("p1", "1.00", "USD")],
        vec![root.clone(), first.clone(), second.clone()],
        vec![
            log_lasting(&root, "l1", 1234),
            log_lasting(&first, "l2", 4321),
            log_lasting(&second, "l3", 777),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    assert_eq!(doc.totals.billing[0].amount_minor, amounts_in(&doc, "USD"));
    assert_eq!(
        doc.projects[0].billing[0].amount_minor,
        amounts_in(&doc, "USD")
    );
}

#[test]
fn test_given_several_currencies_when_building_then_each_currency_total_equals_its_task_amounts() {
    // Arrange
    let usd = rated_task("t_usd", "p1", "41.17");
    let eur = rated_task("t_eur", "p2", "29.03");
    let eur_sub = rated_subtask("t_eur_sub", &eur, "12.34");
    let data = snapshot(
        vec![
            billed_project("p1", "1.00", "USD"),
            billed_project("p2", "1.00", "EUR"),
        ],
        vec![usd.clone(), eur.clone(), eur_sub.clone()],
        vec![
            log_lasting(&usd, "l1", 2711),
            log_lasting(&eur, "l2", 1999),
            log_lasting(&eur_sub, "l3", 3601),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Summary), &june_15());

    // Assert
    for total in &doc.totals.billing {
        assert_eq!(total.amount_minor, amounts_in(&doc, &total.currency));
    }
}

#[test]
fn test_given_two_entries_that_each_round_down_when_building_full_then_entry_amounts_do_not_sum_to_the_task_amount(
) {
    // Arrange
    let task = rated_task("t1", "p1", "0.01");
    let data = snapshot(
        vec![billed_project("p1", "1.00", "USD")],
        vec![task.clone()],
        vec![
            log(&task, "l1", DAY_START, "2026-06-15T10:30:00Z"),
            log(&task, "l2", "2026-06-15T11:00:00Z", "2026-06-15T11:30:00Z"),
        ],
        vec![],
    );

    // Act
    let doc = build(&data, &request(ReportVariant::Full), &june_15());

    // Assert
    let entry_sum: u64 = doc
        .entries
        .unwrap()
        .iter()
        .map(|entry| entry.amount_minor.unwrap())
        .sum();
    assert_eq!(entry_sum, 0);
    assert_eq!(doc.projects[0].tasks[0].amount_minor, Some(1));
}
