# Findings - Subsystems and Security (SUB-xx)

Scope: `config`, `sink`, `mask`, `doctor`, `db`; secrets (`api_token`, webhook tokens); destructive operations without confirmation. Code references are against `main` b35731eb, paths relative to `src-tauri/src/` unless shown otherwise. Transcript line numbers refer to [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md).

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| SUB-01 | P0 | Verified in code | `config ls` and `config get` print the external API token in clear text |
| SUB-02 | P1 | Verified in code | Webhook token travels as a plain argument, is stored in clear text and is echoed into the in-app terminal history |
| SUB-03 | P1 | Verified in code, observed on the binary | `sink test` calls a webhook "healthy" after checking only the URL prefix |
| SUB-04 | P2 | Verified in code, observed on the binary | `doctor --fix` is accepted and never read |
| SUB-05 | P1 | Verified in code, observed on the binary | `db restore` overwrites the live database without confirmation or a pre-restore backup |
| SUB-06 | P2 | Verified in code, observed on the binary | `config set` accepts any key |
| SUB-07 | P2 | Verified in code | Mask expansion drops `--tz` and `--exact` and treats the `--tz` value as an alias or positional |
| SUB-08 | P2 | Verified in code | A mask named like a built-in command shadows it |
| SUB-09 | P3 | Verified in code | `$1` is replaced inside `$10` |
| SUB-10 | P3 | Verified in code | CSV `sink test` creates the directory as a side effect |

Related: `doctor`/`sink test` failure envelopes and `db restore` exit codes are MCH-05; the check-mark prefix on `config get` is MCH-03 (both in [findings-machine-contract.md](findings-machine-contract.md)).

---

## SUB-01 (P0) `config ls` and `config get` print the external API token in clear text

- **Evidence:** the desktop app stores `api_token` in the same `config` table (`repositories/config/external_api.rs:36`, `KEY_API_TOKEN`); `cli/handlers/config_handler.rs:29-55` lists every row from `get_all_config_entries` (`repositories/config/settings.rs:153-165`) and `:69-103` returns any key verbatim; `--json config ls` emits the token in the `oxy.config.list` envelope.
- **Not observed:** the scratch database held no API token. Any user who configured the external API in the GUI and runs `oxy config ls` in a shared terminal or a CI log exposes it.
- **Expected:** a secret-key set (`api_token`, keys ending in `_token`, `_secret`, `_password`): `ls` shows `hasValue: true` / `<redacted>`, `get` requires `--reveal`, machine output never contains the value.
- **Regression test:** integration (BDT) in `src-tauri/tests/integration/cli/subsystems/` with a seeded `api_token`: `config ls`, `config ls --json` and `config get api_token` do not contain the value.

## SUB-02 (P1) Webhook token travels as a plain argument, is stored in clear text and is echoed into the in-app terminal history

- **Evidence:** `cli/parser/tier3_subsystems.rs:134-137` (`-t <token>`), `handlers/sink_handler.rs:136` stores `{"token": ...}` in `cli_sinks.config`; `sink ls` already hides it (`hasToken`). In the desktop in-app CLI, `src/features/cli/utils/cliEngine.ts:104` echoes the raw line (`output.input(...)`) into the terminal and the line stays in the command history (`src/features/cli/context/CliSessionProvider.tsx`). Shell history on the OS side keeps it as well.
- **Expected:** `--token-stdin` and `OXY_WEBHOOK_TOKEN` as alternatives; the in-app echo and history redact the value after `-t`/`--token`. Encrypted storage is Phase 40 scope (old Phase 34, Secure Remote Delivery) and is not part of this fix.
- **Regression test:** Vitest unit for the terminal echo redaction in `tests/unit/features/cli/`; Rust integration for `--token-stdin`.

## SUB-03 (P1) `sink test` calls a webhook "healthy" after checking only the URL prefix

- **Evidence:** `sink_handler.rs:220-226` returns `(true, "URL endpoint syntax verified")` for any `http://` or `https://` target; `:182-183` prints `healthy` for every passed check. The parser help says "synthetic ping" and `CLI.md:161` says "Synthetic event verification".
- **Observed:** transcript 3312-3335: `set-webhook --url http://localhost:9/hook`, then `sink test` reports healthy; nothing was contacted.
- **Expected:** truthful label now (`syntax ok (not contacted)`, no green badge); a real HEAD/POST probe belongs to the sink reliability work (Phase 39, old 33).
- **Regression test:** `src-tauri/tests/integration/cli/subsystems/` sink test golden; `CLI.md` row updated (DOC-09).

## SUB-04 (P2) `doctor --fix` is accepted and never read

- **Evidence:** `cli/parser/tier3_subsystems.rs:198-201` declares `--fix` ("Attempt automatic remediation"); `handlers/doctor_handler.rs:22` binds `_args` and nothing reads `fix`.
- **Observed:** transcript 3439-3456: `doctor --fix` prints the normal report.
- **Expected:** owner decision OD-6: remove the flag until the Recovery Manager (Phase 43, old 37) implements it, or hide it. Not documented in `CLI.md` (DOC-17).
- **Regression test:** unit in `src-tauri/tests/unit/cli/parser_test.rs` that `--fix` is rejected (if removed).

## SUB-05 (P1) `db restore` overwrites the live database without confirmation or a pre-restore backup

- **Evidence:** `handlers/db_handler.rs:66-99`: after the existence check the handler calls `restore_database` directly; no prompt, no `--yes`, no copy of the current file. `CLI.md:155` promises "schema integrity verification", which the path does not perform (helper-reported, `persistence/core.rs:48-52`).
- **Observed:** transcript 3477-3486 (restore succeeds immediately).
- **Expected:** the same prompt pattern as `log rm` (TTY prompt, `--yes`, machine mode skips), plus an automatic `<db>.pre-restore-<timestamp>.bak` written next to the database and reported in the output; `PRAGMA integrity_check` on the source before overwriting.
- **Regression test:** integration in `src-tauri/tests/integration/cli/subsystems/` with a fake prompter: refusal leaves the database unchanged; acceptance creates the `.bak` file; a corrupt source fails with exit 3.

## SUB-06 (P2) `config set` accepts any key

- **Evidence:** `config_handler.rs:119-123` validates `cli_machine_locale` only; every other key is stored. `CLI.md:156` says "Validates supported keys and values".
- **Observed:** transcript 3128-3147 (`config set no_such_key 1` succeeds and appears in `config ls`).
- **Expected:** owner decision OD-8: a key registry shared with the app settings (known keys with a validator each) and `CLI_SYNTAX_INVALID_ARGS` listing the known keys for anything else, or a warning. The registry also drives SUB-01 masking.
- **Regression test:** integration: unknown key -> exit 2; known key with invalid value -> exit 2.

## SUB-07 (P2) Mask expansion drops `--tz` and `--exact` and treats the `--tz` value as an alias or positional

- **Evidence:** `handlers/mask_handler.rs:230-242` (`extract_global_flags`) keeps only `--db`, `-m`, `-j`, `-q`, `--quiet`; `:244-257` (`extract_positional_args`) pushes `--tz` and its value as positionals because `is_global_flag` (`:259-267`) does not list them; `find_alias_candidate` (`:269-286`) skips only the `--db` value, so `oxy --tz UTC today` looks up `UTC` as an alias.
- **Expected:** one list of global flags shared with the clap definition (`parser/mod.rs:19-74`), with value-taking flags handled uniformly.
- **Regression test:** unit in `src-tauri/tests/unit/cli/mask_expansion_test.rs`: `--tz Europe/Warsaw ps foo` expands to `--tz Europe/Warsaw start foo`.

## SUB-08 (P2) A mask named like a built-in command shadows it

- **Evidence:** `preprocess_alias_invocation` (`mask_handler.rs:186-203`) runs before clap and replaces the first non-flag token when an alias with that name exists; `mask set` checks only that the template does not start with the alias name (helper-reported `:84-88`).
- **Expected:** `mask set` rejects every top-level command name and alias (`start`, `s`, `today`, `summary`, ...), with `MSK_ALIAS_SYNTAX`.
- **Regression test:** integration in `subsystems/`: `mask set today "start x"` fails with exit 2.

## SUB-09 (P3) `$1` is replaced inside `$10`

- **Evidence:** `mask_handler.rs:149-161` replaces the token `$1` with `str::replace`, which also rewrites the prefix of `$10`..`$19`.
- **Expected:** token matching on a word boundary, or replacement from the highest index down.
- **Regression test:** unit in `mask_expansion_test.rs` with eleven arguments.

## SUB-10 (P3) CSV `sink test` creates the directory as a side effect

- **Evidence:** `sink_handler.rs:233-238` calls `create_dir_all` inside the test.
- **Expected:** a test reports "directory missing" and does not create it; `set-csv` already creates it.
- **Regression test:** integration: `sink test` with a removed directory fails and leaves the file system unchanged.