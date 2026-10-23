import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const pkgRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const fixturesDir = path.join(pkgRoot, 'fixtures');

type DiagramType = 'architecture' | 'workflow' | 'lifecycle' | 'dataflow' | 'sequence';

interface Case {
  file: string;
  type: DiagramType;
  /** top-level array that holds the "one node per rendered entity" items */
  itemsKey: 'components' | 'nodes' | 'states' | 'participants';
}

const CASES: Case[] = [
  { file: 'web-app.architecture.json', type: 'architecture', itemsKey: 'components' },
  { file: 'agent-tool-call.workflow.json', type: 'workflow', itemsKey: 'nodes' },
  { file: 'agent-run.lifecycle.json', type: 'lifecycle', itemsKey: 'states' },
  { file: 'event-stream.dataflow.json', type: 'dataflow', itemsKey: 'nodes' },
  { file: 'cache-miss-request.sequence.json', type: 'sequence', itemsKey: 'participants' },
];

let portCursor = 5400 + Math.floor(Math.random() * 200);

interface Viewer {
  url: string;
  close: () => Promise<void>;
}

/** Boot `cli.js open <spec>` and wait for it to print its URL (PLAN §7). */
async function startViewer(specPath: string): Promise<Viewer> {
  portCursor += 1;
  const child: ChildProcess = spawn(
    process.execPath,
    ['cli.js', 'open', specPath, '--port', String(portCursor)],
    { cwd: pkgRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const url = await new Promise<string>((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`viewer did not start:\n${output}`)), 60_000);
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/localhost:\d+\/?/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`cli.js open exited with ${code}:\n${output}`));
    });
  });
  return {
    url,
    close: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve();
        const done = setTimeout(resolve, 3_000);
        child.once('exit', () => {
          clearTimeout(done);
          resolve();
        });
        child.kill('SIGTERM');
      }),
  };
}

async function loadFixture(file: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(path.join(fixturesDir, file), 'utf8'));
}

/** Every entity must sit inside the viewport once fitView has run. */
async function entitiesInViewport(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-testid="entity-node"]')];
    if (els.length === 0) return false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return els.every((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left >= -2 && r.top >= -2 && r.right <= vw + 2 && r.bottom <= vh + 2;
    });
  });
}

async function firstOverlappingPair(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-testid="entity-node"]')];
    const rects = els.map((el) => ({
      id: el.getAttribute('data-entity-id') ?? '?',
      r: el.getBoundingClientRect(),
    }));
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i].r;
        const b = rects[j].r;
        if (a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5) {
          return `${rects[i].id} x ${rects[j].id}`;
        }
      }
    }
    return null;
  });
}

async function entityTransform(page: Page, index: number): Promise<string> {
  return page
    .locator('[data-testid="entity-node"]')
    .nth(index)
    .evaluate((el) => {
      // React Flow puts the position transform on the wrapper, not our div.
      const wrapper = el.closest('.react-flow__node') as HTMLElement | null;
      return wrapper?.style.transform ?? '';
    });
}

/* ------------------------- behavioral suite (always on) ------------------- */

for (const c of CASES) {
  test(`renders every node, in viewport: ${c.file}`, async ({ page }) => {
    const spec = await loadFixture(c.file);
    const expected = (spec[c.itemsKey] as unknown[]).length;
    const viewer = await startViewer(path.join(fixturesDir, c.file));
    try {
      await page.goto(viewer.url);
      await expect(page.getByTestId('type-badge')).toHaveText(c.type);
      await expect(page.locator('[data-testid="entity-node"]')).toHaveCount(expected);
      await expect.poll(() => entitiesInViewport(page), { timeout: 20_000 }).toBe(true);

      if (c.type === 'architecture') {
        // The old archify rectsOverlap bar, asserted once instead of looped (§8).
        expect(await firstOverlappingPair(page)).toBeNull();
      }
    } finally {
      await viewer.close();
    }
  });
}

test('workflow nodes are view-only and Re-run is disabled (Q17)', async ({ page }) => {
  const file = 'agent-tool-call.workflow.json';
  const viewer = await startViewer(path.join(fixturesDir, file));
  try {
    await page.goto(viewer.url);
    await expect(page.locator('[data-testid="entity-node"]')).toHaveCount(12);
    await expect(page.getByTestId('rerun-button')).toBeDisabled();

    const node = page.locator('[data-testid="entity-node"]').first();
    const before = await entityTransform(page, 0);
    const box = await node.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 120, box!.y + box!.height / 2 + 60, { steps: 8 });
    await page.mouse.up();
    expect(await entityTransform(page, 0)).toBe(before);
  } finally {
    await viewer.close();
  }
});

test('architecture drag + Ctrl+S persists to the spec file (Q13)', async ({ page }) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sane-arch-'));
  const specPath = path.join(dir, 'web-app.architecture.json');
  interface ArchSpec {
    components: { id: string; pos?: [number, number] }[];
  }
  const original = (await loadFixture('web-app.architecture.json')) as ArchSpec;
  await writeFile(specPath, JSON.stringify(original, null, 2));
  const viewer = await startViewer(specPath);
  try {
    await page.goto(viewer.url);
    await expect(page.locator('[data-testid="entity-node"]')).toHaveCount(10);
    await expect.poll(() => entitiesInViewport(page), { timeout: 20_000 }).toBe(true);
    await expect(page.getByTestId('rerun-button')).toBeEnabled();

    const node = page.locator('[data-testid="entity-node"]').first();
    const before = await entityTransform(page, 0);
    const box = (await node.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 90, { steps: 10 });
    await page.mouse.up();
    expect(await entityTransform(page, 0)).not.toBe(before);
    await expect(page.getByTestId('save-button')).toBeEnabled();

    await page.keyboard.press('Control+s');
    await expect(page.getByTestId('save-status')).toHaveText('Saved ✓', { timeout: 10_000 });

    const saved = JSON.parse(await readFile(specPath, 'utf8')) as ArchSpec;
    const movedId = await node.getAttribute('data-entity-id');
    const beforePos = original.components.find((c) => c.id === movedId)!.pos!;
    const afterPos = saved.components.find((c) => c.id === movedId)!.pos!;
    expect(afterPos).not.toEqual(beforePos);
    // Dragged down-right: both coordinates must have grown noticeably.
    expect(afterPos[0]).toBeGreaterThan(beforePos[0] + 40);
    expect(afterPos[1]).toBeGreaterThan(beforePos[1] + 40);
    // Unrelated components stay untouched.
    const untouched = saved.components.filter(
      (c) => c.id !== movedId && c.id !== undefined,
    );
    expect(untouched.length).toBe(9);
  } finally {
    await viewer.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('PUT /api/spec rejects invalid specs with 422 (ajv gate)', async ({ page }) => {
  const file = 'web-app.architecture.json';
  const viewer = await startViewer(path.join(fixturesDir, file));
  try {
    await page.goto(viewer.url);

    const bogus = await page.request.put(`${viewer.url}api/spec`, {
      data: { schema_version: 1, diagram_type: 'bogus' },
    });
    expect(bogus.status()).toBe(422);
    const bogusBody = (await bogus.json()) as { errors: string[] };
    expect(bogusBody.errors.length).toBeGreaterThan(0);

    const incomplete = await page.request.put(`${viewer.url}api/spec`, {
      data: { schema_version: 1, diagram_type: 'architecture', meta: {} },
    });
    expect(incomplete.status()).toBe(422);
    const incompleteBody = (await incomplete.json()) as { errors: string[] };
    expect(incompleteBody.errors.join('\n')).toContain('components');

    // The session file is untouched by rejected writes.
    const current = await page.request.get(`${viewer.url}api/spec`);
    const spec = (await current.json()) as { diagram_type: string };
    expect(spec.diagram_type).toBe('architecture');
  } finally {
    await viewer.close();
  }
});

/* ---------------------------- pixel diffs (opt-in) ------------------------ */

test.describe('pixel diffs (opt-in, Q20)', () => {
  test.skip(!process.env.SANE_ARCH_PIXELS, 'set SANE_ARCH_PIXELS=1 on the pinned platform');

  test('architecture baseline', async ({ page }) => {
    const viewer = await startViewer(path.join(fixturesDir, 'web-app.architecture.json'));
    try {
      await page.goto(viewer.url);
      await expect(page.locator('[data-testid="entity-node"]')).toHaveCount(10);
      await expect.poll(() => entitiesInViewport(page), { timeout: 20_000 }).toBe(true);
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot('architecture.png', {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      });
    } finally {
      await viewer.close();
    }
  });
});
