import { readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { validateSpec } from './src/schema/validate.ts';

/**
 * Session = one spec file, fixed at boot by cli.js (env: SANE_ARCH_SPEC).
 * The middleware exposes only GET/PUT /api/spec — no arbitrary-path endpoint,
 * so there is no path-traversal surface (PLAN §7).
 */
function specApiPlugin(): Plugin {
  const pkgRoot = process.env.SANE_ARCH_ROOT ?? process.cwd();
  const specPath = path.resolve(
    process.env.SANE_ARCH_SPEC ?? path.join(pkgRoot, 'fixtures/web-app.architecture.json'),
  );

  return {
    name: 'sane-arch:spec-api',
    configureServer(server) {
      server.middlewares.use('/api/spec', (req, res) => {
        handle(req, res).catch((err: unknown) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        });
      });
    },
  };

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'GET') {
      const body = readFileSync(specPath, 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
      return;
    }
    if (req.method === 'PUT') {
      const raw = await readBody(req);
      let spec: unknown;
      try {
        spec = JSON.parse(raw);
      } catch (err) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ errors: [`body is not valid JSON: ${(err as Error).message}`] }));
        return;
      }
      const errors = validateSpec(spec);
      if (errors.length > 0) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ errors }));
        return;
      }
      writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
      res.statusCode = 204;
      res.end();
      return;
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'method not allowed' }));
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default defineConfig({
  // JSX runtime without @vitejs/plugin-react: esbuild handles .tsx directly.
  esbuild: { jsx: 'automatic' },
  plugins: [specApiPlugin()],
  server: { port: 5173, strictPort: false },
  // Golden tests only — Playwright owns tests/e2e/*.spec.ts.
  test: { include: ['tests/**/*.test.ts'] },
});
