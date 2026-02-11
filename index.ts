import type { Plugin } from "@opencode-ai/plugin";

/**
 * DDEV Plugin for OpenCode
 * 
 * Detects DDEV availability and notifies the AI about the DDEV environment.
 * The AI can then decide to adjust bash commands accordingly.
 */
export const DDEVPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  const CACHE_DURATION_MS = 120000; // 2 minutes

  /**
   * Raw DDEV project data from `ddev describe -j`
   */
  type DdevRawData = {
    shortroot?: string;
    approot?: string;
    status?: string;
    name?: string;
    type?: string;
    primary_url?: string;
    urls?: string[];
    [key: string]: unknown;
  };

  /**
   * Cached DDEV state with timestamp for cache invalidation
   */
  type DdevCache = {
    timestamp: number;
    raw: DdevRawData;
  };

  let ddevCache: DdevCache | null = null;
  let currentSessionId: string | null = null;
  let hasNotifiedSession = false;
  let hasAskedToStart = false;

  /**
   * Checks if DDEV is currently running based on cached data
   */
  const isRunning = (): boolean => {
    return ddevCache?.raw?.status === 'running';
  };

  /**
   * Checks if DDEV project is available (installed and configured)
   */
  const isAvailable = (): boolean => {
    return ddevCache !== null;
  };

  /**
   * Resolves the container working directory using the bundled script.
   * Returns the container path for the current working directory.
   */
  const getContainerWorkingDir = async (): Promise<string> => {
    try {
      // Resolve script path relative to the plugin directory (go up one level from dist/)
      const scriptPath = new URL('../scripts/resolve-ddev-root.sh', import.meta.url).pathname;
      const result = await $`bash ${scriptPath} ${directory || '.'}`.quiet().nothrow();

      if (result.exitCode === 0) {
        const data = JSON.parse(result.stdout.toString());
        return data.container_path || '/var/www/html';
      }
    } catch (error) {
      // Silent fail - return default
    }
    return '/var/www/html';
  };

  /**
   * Prompts user to start DDEV when it's stopped
   */
  const askToStartDdev = async (): Promise<void> => {
    if (hasAskedToStart || !currentSessionId) {
      return;
    }

    await client.session.prompt({
      path: { id: currentSessionId },
      body: {
        parts: [
          {
            type: 'text',
            text: '⚠️  DDEV environment is stopped. Start it using `ddev start`?',
          },
        ],
        noReply: true,
      },
    });
    hasAskedToStart = true;
  };

  /**
   * Notifies LLM about DDEV environment on first command execution
   */
  const notifyDdevInSession = async (): Promise<void> => {
    if (hasNotifiedSession || !currentSessionId || !ddevCache?.raw) {
      return;
    }

    const raw = ddevCache.raw;
    const projectName = raw.name || 'unknown';
    const projectType = raw.type || 'unknown';
    const containerWorkingDir = await getContainerWorkingDir();

    let notificationText = `➡️  DDEV environment detected: **${projectName}** (${projectType})`;
    notificationText += `\n\nTo execute commands inside the DDEV container, use \`ddev exec --dir="${containerWorkingDir}" <command>\`. For further details use the "ddev" skill.`;

    await client.session.prompt({
      path: { id: currentSessionId },
      body: {
        parts: [
          {
            type: 'text',
            text: notificationText,
          },
        ],
        noReply: true,
      },
    });
    hasNotifiedSession = true;
  };

  /**
   * Fetches and caches DDEV project data.
   * Uses caching to avoid repeated checks (cache expires after 2 minutes).
   * Only caches when DDEV is running; stopped/unavailable states are not cached.
   */
  async function refreshDdevCache(): Promise<void> {
    const now = Date.now();

    // Return if cache is still valid
    if (ddevCache && now - ddevCache.timestamp < CACHE_DURATION_MS) {
      return;
    }

    try {
      const result = await $`ddev describe -j`.quiet().nothrow();

      // DDEV not available (not installed or no project)
      if (result.exitCode !== 0) {
        ddevCache = null;
        return;
      }

      const output = result.stdout.toString();

      let data;
      try {
        data = JSON.parse(output);
      } catch (parseError) {
        ddevCache = null;
        return;
      }

      const raw = data?.raw as DdevRawData | undefined;

      if (!raw) {
        ddevCache = null;
        return;
      }

      // Only cache when running; stopped state should be re-checked
      if (raw.status !== 'running') {
        // Do not cache stopped state; force re-check next time
        ddevCache = { timestamp: 0, raw };
        return;
      }

      ddevCache = { timestamp: now, raw };
    } catch (error) {
      ddevCache = null;
    }
  }

  // Initialize DDEV detection
  await refreshDdevCache();

  // Capture availability at initialization for tool registration
  const hasProject = isAvailable();

  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        currentSessionId = event.properties.info.id;
        hasNotifiedSession = false;
        hasAskedToStart = false;
      }
    },

    'tool.execute.before': async (input, output) => {
      // Only process bash commands
      if (input.tool !== 'bash') {
        return;
      }

      const originalCommand = output.args.command as string;

      // Skip ddev commands - let them run normally (case-insensitive)
      if (originalCommand.toLowerCase().startsWith('ddev ')) {
        return;
      }

      // Refresh DDEV cache (with caching)
      await refreshDdevCache();

      // DDEV not available - exit early
      if (!isAvailable()) {
        return;
      }

      // DDEV available but stopped - ask user to start it
      if (!isRunning() && !hasAskedToStart) {
        await askToStartDdev();
        return;
      }

      // DDEV not running - don't notify
      if (!isRunning()) {
        return;
      }

      // DDEV is running - notify about the environment (AI can then adjust commands)
      if (!hasNotifiedSession) {
        await notifyDdevInSession();
      }
    },
  };
};

export default DDEVPlugin;
