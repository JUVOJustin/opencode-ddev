# DDEV Command Reference

Quick reference for the most commonly used DDEV commands. Full docs: https://docs.ddev.com/en/stable/users/usage/commands/

## Project Lifecycle

| Command | Description |
|---------|-------------|
| `ddev config` | Initialize/configure a DDEV project (creates `.ddev/config.yaml`) |
| `ddev config --update` | Auto-detect docroot, project type, and defaults |
| `ddev start` | Start a project's containers |
| `ddev stop` | Stop containers (preserves database) |
| `ddev restart` | Restart project containers |
| `ddev poweroff` | Stop all DDEV projects and resources |
| `ddev delete` | Remove project database and DDEV config (code untouched) |
| `ddev describe` | Show project info, URLs, database credentials |
| `ddev list` | List all DDEV projects and their status |

## Container Execution

| Command | Description |
|---------|-------------|
| `ddev exec <cmd>` | Run a command in the web container |
| `ddev exec --dir <path> <cmd>` | Run command in specific container directory |
| `ddev exec -s db <cmd>` | Run command in the database container |
| `ddev . <cmd>` | Shorthand alias for `ddev exec` |
| `ddev ssh` | Open interactive shell in web container |
| `ddev ssh -s db` | Open interactive shell in db container |

## CLI Tool Shortcuts (Syntactic Sugar)

DDEV wraps common CLI tools so they execute inside the container. No local installation required.

### Package Managers

| Shortcut | Equivalent | Project Type |
|----------|-----------|--------------|
| `ddev composer <args>` | `ddev exec composer <args>` | All PHP |
| `ddev npm <args>` | `ddev exec npm <args>` | All |
| `ddev npx <args>` | `ddev exec npx <args>` | All |
| `ddev yarn <args>` | `ddev exec yarn <args>` | All |

### CMS/Framework CLIs

| Shortcut | Equivalent | Project Type |
|----------|-----------|--------------|
| `ddev wp <args>` | `ddev exec wp <args>` | WordPress |
| `ddev drush <args>` | `ddev exec drush <args>` | Drupal |
| `ddev artisan <args>` | `ddev exec artisan <args>` | Laravel |
| `ddev console <args>` | `ddev exec bin/console <args>` | Symfony |
| `ddev craft <args>` | `ddev exec craft <args>` | Craft CMS |
| `ddev typo3 <args>` | `ddev exec typo3 <args>` | TYPO3 |
| `ddev magento <args>` | `ddev exec magento <args>` | Magento 2 |
| `ddev cake <args>` | `ddev exec cake <args>` | CakePHP |
| `ddev sake <args>` | `ddev exec sake <args>` | Silverstripe |
| `ddev spark <args>` | `ddev exec spark <args>` | CodeIgniter |

### Database Tools

| Shortcut | Description |
|----------|-------------|
| `ddev mysql` | Open MySQL client |
| `ddev psql` | Open PostgreSQL client |
| `ddev import-db --file=dump.sql.gz` | Import database dump |
| `ddev export-db --file=/tmp/db.sql.gz` | Export database dump |
| `ddev snapshot` | Create quick database snapshot |
| `ddev snapshot restore <name>` | Restore a snapshot |

### PHP

| Shortcut | Description |
|----------|-------------|
| `ddev php <args>` | Run PHP commands in the container |

## Debugging

| Command | Description |
|---------|-------------|
| `ddev xdebug on` | Enable Xdebug step debugging |
| `ddev xdebug off` | Disable Xdebug |
| `ddev xdebug toggle` | Toggle Xdebug on/off |
| `ddev logs` | View web server + PHP logs |
| `ddev logs -f` | Follow logs in real time |
| `ddev logs -s db` | View database logs |

## Misc

| Command | Description |
|---------|-------------|
| `ddev launch` | Open project URL in browser |
| `ddev launch --mailpit` | Open Mailpit (email capture) in browser |
| `ddev auth ssh` | Add SSH keys for use inside containers |
| `ddev share` | Share project via ngrok |
| `ddev add-on get <repo>` | Install a DDEV add-on |
