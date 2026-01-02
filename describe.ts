import { tool } from "@opencode-ai/plugin/tool";

/**
 * Raw DDEV describe output from `ddev describe -j`
 */
export type DdevDescribeRaw = {
  shortroot?: string;
  approot?: string;
  status?: string;
  name?: string;
  type?: string;
  php_version?: string;
  webserver_type?: string;
  database_type?: string;
  database_version?: string;
  router_status?: string;
  docroot?: string;
  mutagen_enabled?: boolean;
  hostnames?: string[];
  httpurl?: string;
  httpsurl?: string;
  services?: {
    web?: {
      host_ports_mapping?: Array<{
        exposed_port: string;
        host_port: string;
      }>;
    };
    db?: {
      host_ports_mapping?: Array<{
        exposed_port: string;
        host_port: string;
      }>;
    };
  };
  [key: string]: unknown;
};

/**
 * Simplified DDEV project information for LLM consumption
 */
export type DdevProjectInfo = {
  name: string;
  status: string;
  type: string | null;
  domain: string;
  httpsUrl: string;
  httpUrl: string;
  webPort: string | null;
  dbPort: string | null;
  phpVersion: string | null;
  webserverType: string | null;
  dbType: string | null;
  dbVersion: string | null;
};

/**
 * Default fields to expose in the describe tool
 */
const DEFAULT_FIELDS = [
  'name',
  'status',
  'type',
  'domain',
  'httpsUrl',
  'httpUrl',
  'webPort',
  'dbPort',
] as const;

/**
 * Fetches and parses DDEV project data from `ddev describe -j`
 * 
 * @param $ - Exec function for running shell commands
 * @returns Parsed DDEV describe data or null if unavailable
 */
export async function getDdevDescribeData($: any): Promise<DdevDescribeRaw | null> {
  try {
    const result = await $`ddev describe -j`.quiet().nothrow();

    if (result.exitCode !== 0) {
      return null;
    }

    const output = result.stdout.toString();

    try {
      const data = JSON.parse(output);
      return (data?.raw as DdevDescribeRaw) ?? null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Extracts meaningful project information from raw DDEV describe data
 * 
 * @param raw - Raw DDEV describe data
 * @returns Simplified project information
 */
export function extractProjectInfo(raw: DdevDescribeRaw): DdevProjectInfo {
  const name = raw.name ?? 'unknown';
  const status = raw.status ?? 'unknown';
  const type = raw.type ?? null;
  const httpsUrl = raw.httpsurl ?? '';
  const httpUrl = raw.httpurl ?? '';
  const domain = (raw.hostnames?.[0] ?? httpsUrl.replace(/^https?:\/\//, '')) || 'localhost';

  let webPort: string | null = null;
  let dbPort: string | null = null;

  if (raw.services) {
    const webMapping = raw.services.web?.host_ports_mapping?.[0];
    if (webMapping) {
      webPort = webMapping.host_port;
    }

    const dbMapping = raw.services.db?.host_ports_mapping?.[0];
    if (dbMapping) {
      dbPort = dbMapping.host_port;
    }
  }

  return {
    name,
    status,
    type,
    domain,
    httpsUrl,
    httpUrl,
    webPort,
    dbPort,
    phpVersion: raw.php_version ?? null,
    webserverType: raw.webserver_type ?? null,
    dbType: raw.database_type ?? null,
    dbVersion: raw.database_version ?? null,
  };
}

/**
 * Creates a DDEV describe tool for viewing project information
 * 
 * Provides access to core DDEV project data like domain, ports, and status.
 * Uses configurable field selection to expose relevant information without overwhelming context.
 */
export const createDdevDescribeTool = ($: any) => {
  return tool({
    description: "Get DDEV project information including domain, ports, and status. Use this to understand the current DDEV environment configuration.",
    args: {
      fields: tool.schema.array(tool.schema.string()).optional().describe(`Fields to include in the response. Available options: ${[...DEFAULT_FIELDS, 'phpVersion', 'webserverType', 'dbType', 'dbVersion'].join(', ')}. Defaults to core fields: ${DEFAULT_FIELDS.join(', ')}.`),
    },
    async execute(args) {
      const raw = await getDdevDescribeData($);

      if (!raw) {
        throw new Error('Failed to get DDEV project data. Make sure DDEV is running.');
      }

      const info = extractProjectInfo(raw);
      const requestedFields = args.fields ?? [...DEFAULT_FIELDS];

      const result: Partial<DdevProjectInfo> = {};

      for (const field of requestedFields) {
        if (field in info) {
          const value = info[field as keyof DdevProjectInfo];
          result[field as keyof DdevProjectInfo] = value as any;
        }
      }

      return JSON.stringify(result, null, 2);
    },
  });
};
