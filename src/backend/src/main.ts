import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import { loadConfig } from './config.js';

// dist/main.js (or src/main.ts) → the backend package folder.
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Real environment variables win over .env files (src/.env, then backend/.env).
for (const envFile of [resolve(backendRoot, '../.env'), resolve(backendRoot, '.env')]) {
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}

const config = loadConfig(process.env, backendRoot);
const logger = new Logger('BuffetYa');

const app = await NestFactory.create<NestExpressApplication>(AppModule.register(config));
configureApp(app, config);
app.enableShutdownHooks();
await app.listen(config.port);

logger.log(`API listening on http://localhost:${config.port}/api`);
if (config.webDir) {
  logger.log(`Serving the web app from ${config.webDir}`);
} else {
  logger.log('Web app not built (or SERVE_WEB=false): serving the API only');
}
if (!config.backstageKey) {
  logger.warn('Backstage disabled: set BACKSTAGE_KEY to enable it');
}
