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

## Executing CLI Commands (Step-by-Step)

Always follow these steps before running any CLI tool (composer, npm, wp, drush, yarn, phpunit, etc.) in a DDEV project:

### Step 1: Resolve the correct container path

Determine whether the working directory is the DDEV project root or a subdirectory. Run the bundled resolve script:

```bash
scripts/resolve-ddev-root.sh "$(pwd)"
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

- `relative_path` **empty** -- working directory is the DDEV root, shortcuts work directly.
- `relative_path` **non-empty** -- working directory is a subdirectory, use `--dir` with the `container_path` value in all commands.

### Step 2: Execute command

If DDEV is not running, start it first with `ddev start`.

**At the project root** (relative_path is empty) -- use DDEV shortcuts:

```bash
ddev composer install
ddev npm run build
ddev wp plugin list
ddev yarn add <pkg>
```

**From a subdirectory** (relative_path is non-empty) -- use `ddev exec --dir`:

```bash
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "composer install"
ddev exec --dir="/var/www/html/wp-content/plugins/my-plugin" bash -c "wp plugin activate my-plugin"
```

The `--dir` flag is required whenever the target directory differs from the container docroot (`/var/www/html`). Without it, commands run at the docroot and may operate on the wrong `composer.json`, `package.json`, or project context.

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
scripts/resolve-ddev-root.sh /path/to/wp-content/plugins/my-plugin
```

The script walks up the directory tree looking for `.ddev/config.yaml`. If no argument is provided, it uses the current working directory.

### Manual Path Computation

If the script is unavailable, compute the path manually:

1. Find the directory containing `.ddev/config.yaml` (the DDEV project root)
2. Compute the relative path from that root to the current working directory
3. Prepend `/var/www/html/` to get the container path

## Project Information

Use `ddev describe` to get detailed information about the current DDEV project. Add the `-j` flag to get structured JSON output:

```bash
ddev describe -j
```

This provides useful details such as:
- **Project type** (wordpress, drupal, laravel, etc.)
- **Primary URL** and all project URLs
- **PHP version** and **Node.js version**
- **Database type and version** (mariadb, mysql, postgres)
- **Web server type** (nginx-fpm, apache-fpm)
- **Service status** for web, db, and additional services
- **Published ports** for host-to-container mapping

Example JSON output fields:
- `type` - Project type (wordpress, drupal, etc.)
- `primary_url` - Main project URL
- `urls` - Array of all project URLs (HTTP and HTTPS)
- `php_version` - PHP version in use
- `nodejs_version` - Node.js version in use
- `database_type` - Database type (mariadb, mysql, postgres)
- `webserver_type` - Web server (nginx-fpm, apache-fpm)
- `services` - Status and details for each service

## Resources

### scripts/
- **resolve-ddev-root.sh** - Walks up the directory tree to find the DDEV project root from any subdirectory. Returns JSON with project root, container path, relative path, and project name.

### references/
- **commands.md** - Quick-reference table of all DDEV CLI shortcuts, lifecycle commands, database tools, and debugging commands.
