use crate::shared::test_db::setup_persistence_test;
use oxy_flow::engine::billing::{
    calculate_bankers_amount, format_cents, parse_rate_or_cents, parse_rate_to_cents,
};
use oxy_flow::engine::Engine;
use oxy_flow::persistence::Persistence;
use oxy_flow::types::{Project, RateStatus, RuntimeConfig, Task};

#[test]
fn test_given_shared_billing_fixture_when_run_in_rust_integration_then_satisfies_cross_runtime_parity(
) {
    let fixture_str = include_str!("../../../tests/fixtures/billing-parity-vectors.json");
    let fixture: serde_json::Value =
        serde_json::from_str(fixture_str).expect("parse shared billing fixture");

    // 1. Rounding vectors parity
    for vec in fixture["roundingVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let duration = vec["durationSeconds"].as_u64().unwrap();
        let rate_str = vec["rate"].as_str().unwrap();
        let expected_amount = vec["expectedAmount"].as_str().unwrap();
        let rate_cents = parse_rate_to_cents(rate_str).expect("valid rate");
        let calculated = calculate_bankers_amount(duration, rate_cents);
        assert_eq!(
            format_cents(calculated),
            expected_amount,
            "Rounding parity failure for: {desc}"
        );
    }

    // 2. Strict decimal rate parsing vectors parity
    for vec in fixture["rateParsingVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let input = vec["input"].as_str().unwrap();
        let expected_cents = vec["expectedCents"].as_u64();
        let valid = vec["valid"].as_bool().unwrap();

        let parsed = parse_rate_to_cents(input);
        if valid {
            assert_eq!(parsed, expected_cents, "Parsed cents mismatch for {desc}");
        } else {
            assert_eq!(parsed, None, "Expected invalid for {desc}");
        }
    }

    // 3. Rate or cents parsing vectors parity (major units, decimals, and 'c' suffix)
    for vec in fixture["rateOrCentsParsingVectors"].as_array().unwrap() {
        let desc = vec["description"].as_str().unwrap();
        let input = vec["input"].as_str().unwrap();
        let expected_cents = vec["expectedCents"].as_u64();
        let valid = vec["valid"].as_bool().unwrap();

        let parsed = parse_rate_or_cents(input);
        if valid {
            assert_eq!(
                parsed, expected_cents,
                "Parsed rate_or_cents mismatch for {desc}"
            );
        } else {
            assert_eq!(parsed, None, "Expected invalid for {desc}");
        }
    }

    // 4. Rate resolution integration vectors through SQLite Persistence & Engine
    for (idx, vec) in fixture["rateResolutionVectors"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
    {
        let db_name = format!("int_billing_parity_{idx}");
        let (_conn, config, _temp_dir) = setup_persistence_test(&db_name);
        let persistence = Persistence::new(&config).expect("initialize persistence");
        let engine = Engine::new(&persistence);

        let desc = vec["description"].as_str().unwrap();
        let proj_id = format!("p_{idx}");
        let task_id = format!("t_{idx}");

        let mut project = Project::new(
            proj_id.clone(),
            format!("Proj {idx}"),
            "#4338ca".to_string(),
            None,
            None,
            None,
            None,
        );
        project.hourly_rate = vec["projectRate"].as_str().map(|s| s.to_string());
        project.billing_rate_cents = vec["projectBillingRateCents"].as_i64();
        project.currency = vec["projectCurrency"].as_str().map(|s| s.to_string());
        project.billing_currency = vec["projectBillingCurrency"]
            .as_str()
            .map(|s| s.to_string());
        persistence
            .projects
            .create(project)
            .expect("create test project");

        let mut task = Task::new(
            task_id.clone(),
            proj_id.clone(),
            None,
            format!("Task {idx}"),
        );
        task.hourly_rate = vec["taskRate"].as_str().map(|s| s.to_string());
        task.billing_rate_cents = vec["taskBillingRateCents"].as_i64();
        task.currency = vec["taskCurrency"].as_str().map(|s| s.to_string());
        task.billing_currency = vec["taskBillingCurrency"].as_str().map(|s| s.to_string());
        persistence.tasks.create(task).expect("create test task");

        if let Some(default_rate) = vec["runtimeDefaultRate"].as_str() {
            let default_config = RuntimeConfig {
                id: "default_billing_rate".to_string(),
                runtime: "billing_default".to_string(),
                config: default_rate.to_string(),
                created_at: "2026-10-31T00:00:00Z".to_string(),
            };
            persistence
                .settings
                .save_runtime_config(default_config)
                .expect("save default rate");
        }

        let res = engine
            .resolve_effective_task_rate(&task_id)
            .unwrap_or_else(|e| panic!("failed to resolve rate for {desc}: {e:?}"));

        let expected_status = vec["expectedStatus"].as_str().unwrap();
        let expected_rate = vec["expectedRate"].as_str();
        let expected_currency = vec["expectedCurrency"].as_str();
        let expected_source = vec["expectedSource"].as_str().unwrap();

        let actual_status_str = match res.status {
            RateStatus::Custom => "custom",
            RateStatus::Inherited => "inherited",
            RateStatus::NonBillable => "non_billable",
            RateStatus::Unconfigured => "unconfigured",
        };

        assert_eq!(
            actual_status_str, expected_status,
            "Status mismatch for {desc}"
        );
        assert_eq!(
            res.rate.as_deref(),
            expected_rate,
            "Rate mismatch for {desc}"
        );
        assert_eq!(
            res.currency.as_deref(),
            expected_currency,
            "Currency mismatch for {desc}"
        );
        assert_eq!(res.source, expected_source, "Source mismatch for {desc}");
    }
}
