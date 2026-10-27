import { basename, extname, join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { ApiExceptionFilter } from './adapters/http/api-exception.filter.js';
import type { AppConfig } from './config.js';

/** Files the browser must revalidate on every load, or a new deploy never shows up. */
const ALWAYS_REVALIDATE = new Set([
  'index.html',
  'ngsw.json',
  'ngsw-worker.js',
  'safety-worker.js',
  'worker-basic.min.js',
  'manifest.webmanifest',
]);

/** Angular emits content-hashed bundles such as main-SN72G5PR.js or chunk-zjjK-Ofc.js. */
const HASHED_BUNDLE = /^(main|chunk|styles|polyfills)-[A-Za-z0-9_-]{8}\.(js|css)$/;

const isApiPath = (path: string) => path === '/api' || path.startsWith('/api/');

/**
 * Single deployable: the same Node process serves the API under /api and the
 * built Angular PWA for everything else, with an SPA fallback to index.html
 * for client routes such as /carrito or /pedido.
 */
function serveWebApp(app: NestExpressApplication, webDir: string): void {
  app.useStaticAssets(webDir, {
    index: false,
    setHeaders: (response, filePath) => {
      const name = basename(filePath);
      if (ALWAYS_REVALIDATE.has(name)) {
        response.setHeader('Cache-Control', 'no-cache');
      } else if (HASHED_BUNDLE.test(name)) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  const indexFile = join(webDir, 'index.html');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const isPageRequest =
      (request.method === 'GET' || request.method === 'HEAD') &&
      !isApiPath(request.path) &&
      extname(request.path) === '';
    if (!isPageRequest) return next();
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(indexFile);
  });
}

/** Shared by main.ts and the HTTP specs, so tests exercise the real setup. */
export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  // Leading slash on purpose: Nest 12 hands the prefix verbatim to Express for
  // its route-not-found handler, and Express only matches "/api".
  app.setGlobalPrefix('/api');
  app.disable('x-powered-by');
  // Registered on the app (not as APP_FILTER) so it also shapes Nest's own
  // route-not-found and body-parser errors.
  app.useGlobalFilters(new ApiExceptionFilter());
  if (config.corsOrigins.length > 0) {
    app.enableCors({ origin: config.corsOrigins });
  }
  if (config.webDir) {
    serveWebApp(app, config.webDir);
  }
}
