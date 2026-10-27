import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DEV_BACKSTAGE_KEY, loadConfig } from './config.js';

describe('loadConfig', () => {
  const root = resolve('/srv/buffetya/backend');

  it('works out of the box in development', () => {
    const config = loadConfig({}, root);
    expect(config.port).toBe(3000);
    expect(config.backstageKey).toBe(DEV_BACKSTAGE_KEY);
    expect(config.pickupHoldMinutes).toBe(15);
    expect(config.dataFile).toBe(resolve(root, 'data', 'db.json'));
    expect(config.corsOrigins).toEqual([]);
  });

  it('keeps the backstage closed in production until a key is set', () => {
    expect(loadConfig({ NODE_ENV: 'production' }, root).backstageKey).toBeNull();
    expect(loadConfig({ NODE_ENV: 'production', BACKSTAGE_KEY: ' s3cret ' }, root).backstageKey).toBe('s3cret');
  });

  it('reads CORS origins as a comma-separated list', () => {
    expect(loadConfig({ CORS_ORIGIN: 'http://a.test, http://b.test,' }, root).corsOrigins).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });

  it('rejects malformed numbers instead of guessing', () => {
    expect(() => loadConfig({ PORT: 'abc' }, root)).toThrow(/PORT/);
    expect(() => loadConfig({ PICKUP_HOLD_MINUTES: '-5' }, root)).toThrow(/PICKUP_HOLD_MINUTES/);
  });

  it('serves the web app only when it has been built', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'buffetya-web-'));
    expect(loadConfig({ WEB_DIR: dir }, root).webDir).toBeNull();
    await writeFile(join(dir, 'index.html'), '<!doctype html>');
    expect(loadConfig({ WEB_DIR: dir }, root).webDir).toBe(dir);
    expect(loadConfig({ WEB_DIR: dir, SERVE_WEB: 'false' }, root).webDir).toBeNull();
    await rm(dir, { recursive: true, force: true });
  });
});
