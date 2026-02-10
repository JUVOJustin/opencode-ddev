# opencode-ddev-plugin

DDEV Plugin for [OpenCode](https://opencode.ai) - Detects DDEV availability and provides optional container execution guidance.

## Features

- **Automatic DDEV Detection**: Checks if DDEV is available using `ddev describe -j` for structured JSON output
- **Status-Aware Context Message**: Announces running/stopped status with a clear `ddev exec` example
- **Optional Container Execution**: Commands run on the host by default; use `ddev exec` when you need container context
- **Session and Compaction Prompts**: Sends the context message on session creation and after compaction
- **Custom DDEV Logs Tool**: Provides a `ddev_logs` tool for retrieving logs from DDEV services

## Installation
Add to your opencode.json or ~/.config/opencode/opencode.json:

```json
{
  "plugin": ["opencode-ddev"]
}
```

OpenCode auto-installs plugins on startup.

### Update
Force update to latest:

`rm -rf ~/.cache/opencode`
Then restart OpenCode.

## Usage

Once installed, the plugin will:

1. Detect DDEV availability and status on session creation and compaction
2. Add a context message with a clear example for optional container execution
3. Keep commands on the host by default (no automatic wrapping)
4. Register `ddev_logs` when a DDEV project is detected

### Manual Container Execution

If you need a command to run inside the container, execute it manually:

- `ddev exec --dir="/var/www/html" bash -c "composer install"`

The `--dir` value in the context message reflects your current working directory mapped into the container.

## DDEV Availability Check

The plugin checks DDEV status using `ddev describe -j` to determine if a project exists and whether it's running. Results are cached for 2 minutes when DDEV is running to avoid repeated checks. Stopped or unavailable states are not cached and will be re-checked on every bash command to detect when DDEV starts.

## Agent Skill

The plugin ships with a bundled DDEV agent skill in `skills/ddev/`. It teaches the AI agent how to work with DDEV projects, including:

- **CLI syntactic sugar** -- shortcut commands like `ddev composer`, `ddev npm`, `ddev wp`, `ddev drush`, `ddev artisan`, `ddev console`, etc.
- **Container execution** -- when and how to use `ddev exec --dir` for targeting specific container paths
- **Subpath mapping** -- resolving the correct container path when the agent runs from a subdirectory of a DDEV project (e.g., `wp-content/plugins/my-plugin` inside a WordPress site)

The skill includes a `resolve-ddev-root.sh` script that walks up the directory tree to find the DDEV project root and computes the matching container path. It is excluded from the npm package via `.npmignore`.

## Custom Tools

The plugin provides custom tools that are registered when a DDEV project is detected:

### `ddev_logs` Tool

Retrieve logs from DDEV services for debugging and monitoring.

**Arguments:**
- `service` (optional): Service to get logs from (e.g., 'web', 'db'). Defaults to 'web'.
- `follow` (optional): Follow logs in real-time (stream as they appear). Cannot be used with `tail`.
- `tail` (optional): Number of lines to show from the end of logs. Defaults to 50 lines if not specified. Mutually exclusive with `follow`.
- `time` (optional): Add timestamps to log output.

**Default Behavior:**
- When neither `follow` nor `tail` is specified, returns the last 50 lines to prevent context pollution.
- The 50-line default is conservative to keep responses concise while providing sufficient debugging context.

**Examples:**
```javascript
// Get last 50 lines from web service (default)
ddev_logs()

// Get last 100 lines from database service
ddev_logs({ service: "db", tail: 100 })

// Follow web service logs in real-time with timestamps
ddev_logs({ follow: true, time: true })
```
