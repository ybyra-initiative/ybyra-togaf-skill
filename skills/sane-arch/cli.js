#!/usr/bin/env node
// sane-arch CLI — plain ESM so `node .agents/skills/sane-arch/cli.js open f.json` works
// with no build step (PLAN §7, Q15).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.resolve(PKG_ROOT, '../archify/schemas');
const DIAGRAM_TYPES = new Set(['architecture', 'workflow', 'lifecycle', 'dataflow', 'sequence']);

// top-level array holding "one node per rendered entity" per diagram type
// (mirrors tests/e2e/viewer.spec.ts CASES).
const ITEMS_KEY = {
  architecture: 'components',
  workflow: 'nodes',
  lifecycle: 'states',
  dataflow: 'nodes',
  sequence: 'participants',
};

function usage() {
  console.error(`usage:
  node .agents/skills/sane-arch/cli.js open <spec.json> [--port <n>]   boot the viewer, print the URL
  node .agents/skills/sane-arch/cli.js validate <spec.json>            ajv-validate against archify schemas (exit 1 on failure)
  node .agents/skills/sane-arch/cli.js export <spec.json> [--out <f.png>] [--port <n>] [--scale <n>]
                                                                       headless render → PNG (default: <spec>.png next to the spec, scale 2)`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function flagValue(rest, name) {
  const index = rest.indexOf(name);
  return index === -1 ? undefined : rest[index + 1];
}

function resolveSpec(arg) {
  if (!arg) fail('missing <spec.json> argument');
  const specPath = path.resolve(arg);
  if (!fs.existsSync(specPath)) fail(`spec not found: ${specPath}`);
  return specPath;
}

const [command, ...rest] = process.argv.slice(2);

if (command === 'open') {
  const specPath = resolveSpec(rest.find((arg) => !arg.startsWith('--')));
  const port = flagValue(rest, '--port');

  process.env.SANE_ARCH_ROOT = PKG_ROOT;
  process.env.SANE_ARCH_SCHEMAS = SCHEMAS_DIR;
  process.env.SANE_ARCH_SPEC = specPath;

  const { createServer } = await import('vite');
  const server = await createServer({
    root: PKG_ROOT,
    configFile: path.join(PKG_ROOT, 'vite.config.ts'),
    server: port ? { port: Number(port) } : {},
  });
  await server.listen();
  const url = server.resolvedUrls?.local?.[0];
  if (!url) fail('vite started but did not resolve a local URL');
  console.log(url);
  console.log(`spec: ${specPath}`);
} else if (command === 'validate') {
  const specPath = resolveSpec(rest.find((arg) => !arg.startsWith('--')));

  process.env.SANE_ARCH_SCHEMAS = SCHEMAS_DIR;

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (err) {
    fail(`${specPath} is not valid JSON: ${err.message}`);
  }

  const type = spec?.diagram_type;
  if (!DIAGRAM_TYPES.has(type)) {
    fail(
      `${specPath}: unknown diagram_type ${JSON.stringify(type)} ` +
        `(expected one of ${[...DIAGRAM_TYPES].join(', ')})`,
    );
  }

  // Load the single TS validate module through Vite's SSR loader (no HTTP
  // server is opened — middlewareMode never listens on a port).
  const { createServer } = await import('vite');
  const server = await createServer({
    root: PKG_ROOT,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false },
  });
  try {
    const { validateSpec } = await server.ssrLoadModule('/src/schema/validate.ts');
    const errors = validateSpec(spec);
    if (errors.length > 0) {
      console.error(`${specPath}: ${errors.length} error(s)`);
      for (const error of errors) console.error(`  - ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`${specPath}: OK (${type})`);
    }
  } finally {
    await server.close();
  }
} else if (command === 'export') {
  const specPath = resolveSpec(rest.find((arg) => !arg.startsWith('--')));
  const out = path.resolve(
    flagValue(rest, '--out') ?? specPath.replace(/\.jsonc?$/, '') + '.png',
  );
  const port = flagValue(rest, '--port') ?? '5321';
  const scale = Number(flagValue(rest, '--scale') ?? '2');

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (err) {
    fail(`${specPath} is not valid JSON: ${err.message}`);
  }
  const type = spec?.diagram_type;
  if (!DIAGRAM_TYPES.has(type)) fail(`${specPath}: unknown diagram_type ${JSON.stringify(type)}`);
  const expected = Array.isArray(spec[ITEMS_KEY[type]]) ? spec[ITEMS_KEY[type]].length : 0;
  if (expected === 0) fail(`${specPath}: no entities under "${ITEMS_KEY[type]}"`);

  process.env.SANE_ARCH_ROOT = PKG_ROOT;
  process.env.SANE_ARCH_SCHEMAS = SCHEMAS_DIR;
  process.env.SANE_ARCH_SPEC = specPath;

  const [{ createServer }, { chromium }] = await Promise.all([
    import('vite'),
    import('@playwright/test'),
  ]);
  const server = await createServer({
    root: PKG_ROOT,
    configFile: path.join(PKG_ROOT, 'vite.config.ts'),
    logLevel: 'silent',
    server: { port: Number(port) },
  });
  await server.listen();
  const url = server.resolvedUrls?.local?.[0];
  if (!url) {
    await server.close();
    fail('vite started but did not resolve a local URL');
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
      deviceScaleFactor: scale,
    });
    await page.goto(url);
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-testid="entity-node"]').length === n,
      expected,
      { timeout: 60_000 },
    );
    // fitView runs after React Flow measures the nodes; poll until every
    // entity is inside the viewport (same bar as the e2e suite).
    await page.waitForFunction(
      () => {
        const els = [...document.querySelectorAll('[data-testid="entity-node"]')];
        if (els.length === 0) return false;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return els.every((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.left >= -2 && r.top >= -2 && r.right <= vw + 2 && r.bottom <= vh + 2;
        });
      },
      undefined,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(600); // labels/edge paths settle

    // Tight clip: union of every node and edge rect, plus padding.
    const clip = await page.evaluate(() => {
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const el of document.querySelectorAll('.react-flow__node, .react-flow__edge')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
      if (!Number.isFinite(left)) throw new Error('nothing to clip');
      const pad = 18;
      return {
        x: Math.max(0, left - pad),
        y: Math.max(0, top - pad),
        width: Math.min(window.innerWidth, right + pad) - Math.max(0, left - pad),
        height: Math.min(window.innerHeight, bottom + pad) - Math.max(0, top - pad),
      };
    });
    await page.screenshot({ path: out, clip });
    console.log(`${out}`);
  } finally {
    await browser.close();
    await server.close();
  }
} else {
  usage();
  process.exit(command ? 1 : 0);
}
