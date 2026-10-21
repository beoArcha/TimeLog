import fs from 'node:fs';
import path from 'node:path';

export interface DevServerConfig {
  protocol: 'http';
  host: string;
  port: number;
  url: string;
}

export const DEFAULT_DEV_CONFIG: DevServerConfig = {
  protocol: 'http',
  host: '127.0.0.1',
  port: 3000,
  url: 'http://127.0.0.1:3000/',
};

export function resolveDevServerConfig(rootDir: string = process.cwd()): DevServerConfig {
  let fileConfig: Record<string, unknown> = {};
  const configPath = path.resolve(rootDir, 'dev.config.json');

  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);
    }
  } catch {
    fileConfig = {};
  }

  const host = (process.env.DEV_HOST || fileConfig.host || DEFAULT_DEV_CONFIG.host) as string;
  const rawPort = process.env.DEV_PORT || fileConfig.port;
  const parsedPort = Number(rawPort);
  const port = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_DEV_CONFIG.port;
  const sanitizedHost = typeof host === 'string' && host.trim() ? host.trim() : DEFAULT_DEV_CONFIG.host;

  const protocol = 'http' as const;
  const url = `${protocol}://${sanitizedHost}:${port}/`;

  return { protocol, host: sanitizedHost, port, url };
}
