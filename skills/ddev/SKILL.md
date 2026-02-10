---
name: ddev
description: "DDEV local development environment guidance for Docker-based PHP/Node projects. Use when: (1) running CLI tools (composer, npm, wp, drush, artisan, console, etc.) in a DDEV project, (2) executing commands inside DDEV containers, (3) working in a subdirectory of a DDEV project (e.g., wp-content/plugins/my-plugin), (4) managing databases, snapshots, or project lifecycle with DDEV, (5) any task involving ddev exec, ddev ssh, or ddev start/stop."
---

# DDEV

DDEV is a Docker-based local development tool for PHP/Node projects. It wraps common CLI tools (composer, npm, wp, drush, etc.) so they run inside containers without requiring local installation. Full docs: https://docs.ddev.com

## CLI Syntactic Sugar

DDEV provides shortcut commands that proxy to container-internal tools. Use these instead of `ddev exec`:

```
ddev composer install          # runs composer inside the container
ddev npm run build             # runs npm inside the container
ddev wp plugin list            # runs wp-cli (WordPress only)
ddev drush cr                  # runs drush (Drupal only)
ddev artisan migrate           # runs artisan (Laravel only)
ddev console cache:clear       # runs bin/console (Symfony only)
ddev yarn add <pkg>            # runs yarn inside the container
ddev php -v                    # runs PHP inside the container
```

For the full list of shortcuts and their mappings, see [references/commands.md](references/commands.md).

## Running Commands in Containers

Use `ddev exec` when a shortcut does not exist or when targeting a specific directory:

```bash
# Default: runs in web container at docroot
ddev exec ls -la

# Specify a working directory inside the container
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "composer install"

# Run in the database container
ddev exec -s db mysql -e "SHOW DATABASES"

# Shorthand alias
ddev . ls -la
```

Use `ddev ssh` for an interactive shell session.

## Subpath Mapping (Working from a Subdirectory)

A common scenario: the DDEV project is configured for a full application (e.g., a WordPress site at `~/Projects/mysite/`) but the agent runs from a subdirectory (e.g., `~/Projects/mysite/wp-content/plugins/my-plugin/`).

### The Problem

DDEV commands must reference container paths relative to `/var/www/html` (the container docroot). When the working directory is a subdirectory of the DDEV project, the container path must be computed.

### Resolving the DDEV Root

Use the bundled resolve script to find the DDEV project root and compute the container path:

```bash
# From any subdirectory within a DDEV project
./scripts/resolve-ddev-root.sh /path/to/wp-content/plugins/my-plugin
```

Output (JSON):
```json
{
  "project_root": "/Users/you/Projects/mysite",
  "container_path": "/var/www/html/wp-content/plugins/my-plugin",
  "relative_path": "wp-content/plugins/my-plugin",
  "project_name": "mysite"
}
```

### Using the Resolved Path

Once the container path is resolved, pass it via `--dir` to run commands in the correct location:

```bash
# Install composer deps for the plugin, not the WP root
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "composer install"

# Run plugin-specific npm build
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "npm run build"

# Run plugin PHPUnit tests
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "vendor/bin/phpunit"
```

## Resources

### scripts/
- **resolve-ddev-root.sh** - Walks up the directory tree to find the DDEV project root from any subdirectory. Returns JSON with project root, container path, relative path, and project name.

### references/
- **commands.md** - Quick-reference table of all DDEV CLI shortcuts, lifecycle commands, database tools, and debugging commands.
