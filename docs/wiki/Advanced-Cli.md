# 📟 Advanced Headless CLI Reference

> *Audience: Developers, DevOps engineers, and power users who automate workflows via scripts, CI/CD pipelines, and terminal macros.*

The native headless binary `oxy` (and the dual-mode desktop binary `oxy-flow`) provides deterministic, script-friendly command-line integration backed directly by the Rust micro-engine and SQLite persistence layer.

---

## 1. Machine Mode & Deterministic JSON (`--machine`, `--json`)

All commands support the `--machine` or `--json` flags to output deterministic JSON payloads on `stdout` instead of human-formatted terminal tables.

### Outputting JSON Status

```bash
oxy status --machine
```

Response format:

```json
{
  "active": true,
  "sessions": [
    {
      "logId": "019460a8-b51c-7f52-823a-f111e3b62450",
      "taskId": "t-front-01",
      "taskName": "Homepage Redesign",
      "projectId": "p-client-01",
      "projectName": "Client Website",
      "startTime": "2026-10-21T08:00:00Z",
      "elapsedSeconds": 3720
    }
  ],
  "totalElapsedSeconds": 3720
}
```

### Scripting with `jq`

```bash
# Extract currently active project name
ACTIVE_PROJECT=$(oxy status --machine | jq -r '.sessions[0].projectName // "None"')

# Stop tracking if elapsed time exceeds 8 hours (28800 seconds)
ELAPSED=$(oxy status --machine | jq '.totalElapsedSeconds')
if [ "$ELAPSED" -gt 28800 ]; then
  oxy stop
fi
```

---

## 2. Structured Error Envelopes on `stderr`

When a command fails (e.g. invalid arguments, missing target entity, or business rule violation), `oxy` emits a structured, machine-parsable JSON envelope on `stderr`:

```json
{
  "code": "DOM_ENTITY_NOT_FOUND",
  "category": "domain",
  "exitCode": 4,
  "technical": "Task 'Backend Auth' not found.",
  "user": {
    "locale": "en",
    "message": "Task 'Backend Auth' not found.",
    "suggestion": null,
    "remediation": "Check task spelling or use 'oxy task ls' to list all tasks."
  }
}
```

### Standardized Exit Codes

The CLI strictly respects the POSIX/Windows semantic exit codes defined in `src-tauri/src/cli/shared/constants.rs`:

| Exit Code | Constant | Meaning |
| :--- | :--- | :--- |
| `0` | `EXIT_CODE_SUCCESS` | Command completed successfully |
| `1` | `EXIT_CODE_GENERIC_FAILURE` | Business rule or validation violation |
| `2` | `EXIT_CODE_CLI_SYNTAX` | Command syntax error or missing arguments |
| `3` | `EXIT_CODE_STORAGE_ERROR` | SQLite database I/O or constraint failure |
| `4` | `EXIT_CODE_ENTITY_ERROR` | Entity not found, ambiguous match, or did-you-mean |
| `5` | `EXIT_CODE_ENGINE_ERROR` | Engine timer lifecycle conflict |

---

## 3. Action Masks & Command Macros (`oxy mask`)

Action masks allow defining parameterized, reusable terminal workflow macros saved directly in SQLite:

```bash
# Register a macro to quickly start code review tasks
oxy mask set cr "oxy start 'Code Review: {1}'"

# Execute the expanded macro
oxy cr "PR #42 - Payment Gateway"
```

Managing masks:

```bash
# List all registered masks
oxy mask ls

# Delete a mask
oxy mask rm cr
```

---

## 4. Hierarchical Unicode Report Tree (`--tree`)

Generate deep structural terminal summaries:

```bash
oxy report --tree --from "2026-10-01" --to "2026-10-21"
```

Sample terminal output:

```text
📦 Client Website (Total: 42h 15m)
├── 📝 Homepage Redesign (28h 00m)
│   ├── ↳ Desktop Wireframes (12h 00m)
│   └── ↳ Responsive CSS (16h 00m)
└── 📝 Checkout Flow (14h 15m)
    └── ↳ Stripe Integration (14h 15m)
```

---

## 5. Further Reading

For full subcommand syntax, argument permutations, and parity test fixtures, refer to [`docs/CLI.md`](file:///c:/Users/Krzysiu/Source/TimeLog/docs/CLI.md).
