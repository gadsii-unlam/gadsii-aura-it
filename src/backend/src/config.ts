import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export interface AppConfig {
  port: number;
  production: boolean;
  /** Allowed origins for CORS. Empty: CORS stays off (same-origin deploy). */
  corsOrigins: string[];
  /** Key for the team-only backstage. Null disables the backstage. */
  backstageKey: string | null;
  /** The JSON data file (runtime state, gitignored). */
  dataFile: string;
  /** The committed demo menu. */
  seedFile: string;
  /** Built Angular app to serve, or null to serve the API only. */
  webDir: string | null;
  /** "Te esperamos hasta las HH:MM": minutes the counter keeps a ready order. */
  pickupHoldMinutes: number;
  /** Time zone of the buffet, for the daily pickup code sequence. */
  timeZone: string;
}

/** Only used outside production, so a fresh clone works without a .env file. */
export const DEV_BACKSTAGE_KEY = 'buffetya-dev';

const DEFAULT_PICKUP_HOLD_MINUTES = 15;

function positiveInteger(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  }
  return value;
}

/**
 * Reads the environment. `backendRoot` is the backend package folder; every
 * default path is resolved from it, so the server works from any cwd.
 */
export function loadConfig(env: NodeJS.ProcessEnv, backendRoot: string): AppConfig {
  const production = env['NODE_ENV'] === 'production';
  const fromRoot = (path: string) => (isAbsolute(path) ? path : resolve(backendRoot, path));

  const webDir = fromRoot(env['WEB_DIR'] ?? '../frontend/dist/frontend/browser');
  const serveWeb = env['SERVE_WEB'] !== 'false' && existsSync(resolve(webDir, 'index.html'));

  const backstageKey = env['BACKSTAGE_KEY']?.trim() || (production ? null : DEV_BACKSTAGE_KEY);

  return {
    port: positiveInteger(env['PORT'], 3000, 'PORT'),
    production,
    corsOrigins: (env['CORS_ORIGIN'] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    backstageKey,
    dataFile: resolve(fromRoot(env['DATA_DIR'] ?? 'data'), 'db.json'),
    seedFile: fromRoot(env['SEED_FILE'] ?? 'data/seed/products.json'),
    webDir: serveWeb ? webDir : null,
    pickupHoldMinutes: positiveInteger(
      env['PICKUP_HOLD_MINUTES'],
      DEFAULT_PICKUP_HOLD_MINUTES,
      'PICKUP_HOLD_MINUTES',
    ),
    timeZone: env['BUFFET_TIMEZONE']?.trim() || 'America/Argentina/Buenos_Aires',
  };
}
