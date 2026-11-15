# Findings - Reports and Exporters (RPT-xx)

Scope: `oxy report` pipeline, every format (table, html, csv, json, jsonl, xml, ods, xlsx), `--variant`, billing fields, determinism and the legacy adapter (`formatters/report_tree_adapter.rs` + `exporters/rows.rs`). Code references are against `main` b35731eb, paths relative to `src-tauri/src/`. Transcript line numbers refer to [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md).

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| RPT-01 | P1 | Verified in code | HTML and ODS fail on task trees of depth 3 or more because the legacy rows double-count nested subtasks |
| RPT-02 | P1 | Verified in code, observed on the binary | `--variant summary` is ignored by table, HTML and ODS |
| RPT-03 | P1 | Verified in code | ODS drops task-less project time, so its rows do not sum to the Total row |
| RPT-04 | P1 | Verified in code | XLSX task amount is cumulative while CSV, JSON and XML carry the direct amount |
| RPT-05 | P1 | Verified in code | An amount is printed without a currency when a rate resolves but no currency does |
| RPT-06 | P2 | Verified in code | A currency bucket with amount 0 appears for currencies that hold only unconfigured time |
| RPT-07 | P2 | Verified in code | XLSX mixes a local `Date` with unlabelled UTC `Start`/`End` |
| RPT-08 | P2 | Helper-reported (dependency source) | XLSX bytes differ between runs |
| RPT-09 | P2 | Observed on the binary | The default table shows no money although the document carries billing |
| RPT-10 | P2 | Helper-reported | Table flattens nested subtasks to one level and loses the parent name |
| RPT-11 | P3 | Verified in code | Table and HTML round shares as `f64`, every other format as half-even basis points |
| RPT-12 | P3 | Helper-reported | Duration and task-count conventions differ by format and are undocumented |
| RPT-13 | P3 | Verified in code | `report --json --csv-delimiter` fails although `--format` is ignored in machine mode |
| RPT-14 | P2 | Verified in code | `report schema -o -` writes a file named `-` |
| RPT-15 | P2 | Verified in code | A malformed stored default rate silently turns billable time into "unconfigured"; the settings read error is swallowed |
| RPT-16 | P3 | Helper-reported | Legacy adapter computes `ReportTreeDto.entries` that nothing reads |

Checked and dropped: ordering is explicit at every level (helper verified `BTreeMap`/`BTreeSet` use and sort keys), `-o -` is byte-exact and allows binary formats, `-q` prints the totals line and the path as documented, CSV is byte-stable within a run.

---

## RPT-01 (P1) HTML and ODS fail on task trees of depth 3 or more because the legacy rows double-count nested subtasks

- **Evidence:** `ReportTask.subtasks` is the flattened list of all descendants (`types/report.rs:212-213`) and each `ReportSubtask.seconds` is cumulative ("Direct time plus all of its own descendants", `types/report.rs:229-230`). `formatters/report_tree_adapter.rs:85-89` copies that flattened list into `ReportTaskDto.subtasks`. `exporters/rows.rs:98-105` sums `duration_seconds` over that list and `rows.rs:107-113` returns `SubtaskDurationExceedsParent` when the sum exceeds the root. For root R (2 h direct) -> A (3 h direct) -> G (5 h): R = 10 h, sum = 8 h + 5 h = 13 h, so the export fails with `SNK_SERIALIZATION`, exit 1. HTML (`exporters/html.rs:48`) and ODS (`exporters/ods.rs:21`) both call `flatten_project`/`flatten_report`.
- **Not observed:** the hands-on session used depth 2 only. No test covers depth 3 on the legacy path.
- **Expected:** HTML and ODS render from `ReportDocument` directly (parent chain from `parent_task_id`, direct seconds from `direct_seconds`), and `rows.rs` plus the adapter are deleted. This is the Phase 22 Group B ODS port plus the adapter removal from the orchestration follow-ups, so both land in the fix program (README, CLIX-13).
- **Regression test:** unit in `src-tauri/tests/unit/cli/exporter_html_test.rs` and `exporter_ods_test.rs` with a depth-4 fixture (the engine parity vector "subtasks nest to depth four" can be reused through `tests/shared/exporter_fixtures.rs`).

## RPT-02 (P1) `--variant summary` is ignored by table, HTML and ODS

- **Evidence:** `exporters/ods.rs:15-37` and `exporters/html.rs:10-66` never read `document.variant`; the table renderer works on `ReportTreeDto`, which has no variant. `CLI.md:329` claims `full` carries per-entry rows for every format.
- **Observed:** transcript 2107 vs 2067 (table byte-identical), 2185-2195 (HTML full and summary both 6371 bytes), 2285-2295 (ODS one sheet, six rows, both variants). CSV, JSON, JSONL, XML and XLSX honour the variant.
- **Expected:** `summary` = totals and aggregates, `full` = aggregates plus an entries section, in every format; the registry declares which formats carry entries.
- **Regression test:** the cross-format consistency test (CLIX-16) asserts that `full` output of every format contains the entry count of the fixture and `summary` does not.

## RPT-03 (P1) ODS drops task-less project time, so its rows do not sum to the Total row

- **Evidence:** `rows.rs:70-77` (`flatten_project`) iterates tasks only, so `ReportProject.direct_seconds` (project-level patches) never becomes a row, while `ods.rs:31-37` writes `tree.total_seconds` including it. CSV summary includes that time (helper-reported, `csv_records.rs:288-327`).
- **Expected:** closed by the ODS port (RPT-01).
- **Regression test:** `exporter_ods_test.rs` with a project-level patch: sum of rows equals the Total row.

## RPT-04 (P1) XLSX task amount is cumulative while CSV, JSON and XML carry the direct amount

- **Evidence:** `exporters/sheets.rs:244-265` (`task_amount`) adds the own amount and every subtask amount of the root; `types/report.rs:206-208` defines `amount_minor` as the amount for `direct_seconds` only, which CSV and XML print as-is (helper-reported `csv_records.rs:340-343`, `xml.rs:251-256`). XLSX summary has no subtask rows (helper-reported `sheets.rs:144-149`), so its total per task includes amounts the reader cannot see.
- **Expected:** owner decision OD-4 (README): either XLSX shows direct amounts with subtask rows, or every format shows a cumulative amount plus a labelled direct column. The column dictionary (Phase 31) states the rule.
- **Regression test:** cross-format consistency test (CLIX-16) comparing the per-task amount across csv, json, xml, xlsx.

## RPT-05 (P1) An amount is printed without a currency when a rate resolves but no currency does

- **Evidence:** `engine/billing.rs:79-100` resolves the currency and the rate independently, so a task can have `amount_minor: Some` and `currency: None`. `engine/reports/billing.rs:128-134` keeps such time out of the per-currency buckets (vector "a rate without currency stays out of the buckets"), so the sum of task amounts differs from `totals.billing`. CSV, JSON and XML print the amount with an empty currency (helper-reported); XLSX drops it (`sheets.rs:284-288`).
- **Expected:** owner decision OD-3: treat a rate without a currency as `unconfigured` (no amount), or apply a configured default currency. Both engines and the parity vectors change together.
- **Regression test:** parity vector update in `tests/fixtures/report-parity-vectors.json` plus `exporter_csv_test.rs` asserting no amount without a currency.

## RPT-06 (P2) A currency bucket with amount 0 appears for currencies that hold only unconfigured time

- **Evidence:** `engine/reports/billing.rs:128-134` creates the bucket for any task with a currency and adds `amount_minor.unwrap_or(0)`; `types/report.rs:139` documents `billing` as "empty when nothing is billable". XLSX then prints an amount column of zeros (helper-reported `sheets.rs:121-137`).
- **Expected:** a bucket only when it has billable seconds; the doc comment and the schema stay true.
- **Regression test:** engine unit test in `src-tauri/tests/unit/engine/` for a currency with unconfigured time only; parity vector.

## RPT-07 (P2) XLSX mixes a local `Date` with unlabelled UTC `Start`/`End`

- **Evidence:** `sheets.rs:297-299` writes `entry.date` (local calendar date) next to `entry.start` and `entry.end` (UTC instants) as naive datetimes (`xlsx.rs:165-170`). Near local midnight the date and the start differ by a day with no visible reason. CSV labels the same columns `startUtc`/`endUtc`.
- **Expected:** headers `Start (UTC)` and `End (UTC)`, or conversion to the document timezone with the zone in the sheet header.
- **Regression test:** `exporter_sheets_test.rs` asserting the header labels.

## RPT-08 (P2) XLSX bytes differ between runs

- **Evidence (helper-reported, dependency source):** `rust_xlsxwriter` writes the system clock into `docProps/core.xml` unless document properties are set; `xlsx.rs` never calls `set_properties`. No test compares XLSX bytes.
- **Expected:** set the creation time from `generatedAt` (or a fixed epoch) so that two exports of the same data are byte-identical; Phase 31 `contentHash` depends on it.
- **Regression test:** `exporter_xlsx_test.rs`: two exports of one fixture are byte-equal.

## RPT-09 (P2) The default table shows no money although the document carries billing

- **Observed:** transcript 2067-2127: the table prints hours only; 937.71 PLN for Acme appears only in CSV, JSON and XLSX. This is the open MASTERMAP Phase 22 Group C item "CLI Billing View" and moves into the fix program as part of the table rewrite (CLIX-14).
- **Expected:** project rows and the totals line show the per-currency amount in the summary and full variants, from the document, without a second calculation.
- **Regression test:** `src-tauri/tests/unit/cli/tree_renderer_test.rs` golden with billing.

## RPT-10 (P2) Table flattens nested subtasks to one level and loses the parent name

- **Evidence (helper-reported):** `formatters/tree_renderer.rs:294-315` renders every descendant as a direct child of the root with equal indentation; `report_tree_adapter.rs:85-90` drops `parent_task_id`.
- **Expected:** closed by the table rewrite on `ReportDocument` (CLIX-14).
- **Regression test:** `tree_renderer_test.rs` golden for a depth-3 fixture.

## RPT-11 (P3) Table and HTML round shares as `f64`, every other format as half-even basis points

- **Evidence:** `report_tree_adapter.rs:80-83` computes `seconds / total * 100.0`; data formats use `share_basis_points` (`types/report.rs:231-233`).
- **Expected:** every output derives its percentage from `share_basis_points`.
- **Regression test:** covered by the table rewrite goldens.

## RPT-12 (P3) Duration and task-count conventions differ by format and are undocumented

- **Evidence (helper-reported):** table drops seconds above one hour, CSV prints decimal hours rounded half up, XLSX uses `[h]:mm`, JSON uses seconds; "N active tasks" counts root tasks with time in range, HTML "Tasks Recorded" the same.
- **Expected:** each convention is intentional but must be in the column dictionary (Phase 31) and the task-count label must say what it counts.
- **Regression test:** none beyond the documentation check.

## RPT-13 (P3) `report --json --csv-delimiter` fails although `--format` is ignored in machine mode

- **Evidence:** `cli/handlers/report_delivery.rs:52` resolves `ExportOptions` before the `(None, true) => Envelope` branch at `:54`.
- **Expected:** either ignore CSV options in envelope mode (consistent with `CLI.md:247-248`) or reject `--format` there too; pick one and document it.
- **Regression test:** unit in `src-tauri/tests/unit/cli/report_args_test.rs`.

## RPT-14 (P2) `report schema -o -` writes a file named `-`

- **Evidence:** `cli/handlers/report_schema_handler.rs:25-29` passes `output` straight to `export_schema_to_file`; `report -o -` means stdout (`report_delivery.rs:62`, helper-reported).
- **Expected:** `-` means stdout for every `-o`.
- **Regression test:** e2e `cli_report_schema_test.rs`: `report schema -o -` prints the schema and creates no file.

## RPT-15 (P2) A malformed stored default rate silently turns billable time into "unconfigured"; the settings read error is swallowed

- **Evidence:** `engine/billing.rs:293-298` (`default_rate_cents_from_configs`) returns `None` when `parse_rate_to_cents` fails; `engine/billing.rs:301-307` (`get_default_rate_cents`) converts a settings read error into `None`. The report path reads settings with `?` (`engine/reports/mod.rs:56`) but still parses the rate leniently (`:62`). The browser mirror `src/plugins/engine/services/BrowserBillingEngine.ts:36-46` catches every error and returns `null` (orchestration follow-up from PR-14). Both violate the zero-silent-fallback rule in `backend_rust_engineering_standards.md` section 4.4.
- **Expected:** a read failure propagates; a malformed stored rate is an `EngineError::Validation` naming the key.
- **Regression test:** Rust unit in `src-tauri/tests/unit/engine/` with a malformed config row; Vitest unit for `BrowserBillingEngine` with a rejecting `runtimeConfigs.getAll`.

## RPT-16 (P3) Legacy adapter computes `ReportTreeDto.entries` that nothing reads

- **Evidence (helper-reported):** `report_tree_adapter.rs:42-46` and `:116-164` build the entries with clamping and offsets; `tree_renderer.rs`, `html.rs` and `ods.rs` never read `.entries`.
- **Expected:** removed with the adapter (CLIX-13).