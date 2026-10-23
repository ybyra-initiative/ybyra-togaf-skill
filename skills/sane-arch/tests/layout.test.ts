import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { pickLayout, type LayoutNode, type Spec } from '../src/layout/index.ts';
import { validateSpec } from '../src/schema/validate.ts';

const pkgRoot = fileURLToPath(new URL('../', import.meta.url));
const fixturesDir = path.join(pkgRoot, 'fixtures');

beforeAll(() => {
  process.env.SANE_ARCH_SCHEMAS = path.resolve(pkgRoot, '../archify/schemas');
});

const FIXTURES = [
  'web-app.architecture.json',
  'agent-tool-call.workflow.json',
  'agent-run.lifecycle.json',
  'event-stream.dataflow.json',
  'cache-miss-request.sequence.json',
] as const;

function load(name: string): Spec {
  return JSON.parse(readFileSync(path.join(fixturesDir, name), 'utf8')) as Spec;
}

function overlaps(a: LayoutNode, b: LayoutNode): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function assertNoNodeOverlap(nodes: LayoutNode[]): void {
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (overlaps(nodes[i], nodes[j])) {
        throw new Error(`nodes overlap: ${nodes[i].id} and ${nodes[j].id}`);
      }
    }
  }
}

describe('golden geometry snapshots', () => {
  for (const fixture of FIXTURES) {
    it(`pickLayout(${fixture})`, async () => {
      const layout = await pickLayout(load(fixture));
      expect(layout).toMatchSnapshot();
    });
  }

  it('architecture with missing pos falls back to a full ELK layout (Q7)', async () => {
    const spec = load('web-app.architecture.json') as Extract<Spec, { diagram_type: 'architecture' }>;
    // Strip geometry from one component → forces the solver.
    const stripped: typeof spec = {
      ...spec,
      components: spec.components.map((c, i) => (i === 0 ? { ...c, pos: undefined } : c)),
    };
    const layout = await pickLayout(stripped);
    expect(layout.mode).toBe('elk');
    expect(layout.nodes).toHaveLength(spec.components.length);
    for (const node of layout.nodes) {
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }
    expect(layout).toMatchSnapshot();
  });

  it('forced ELK re-run ignores authored positions (Q7)', async () => {
    const spec = load('web-app.architecture.json');
    const authored = await pickLayout(spec);
    const forced = await pickLayout(spec, { force: true });
    expect(authored.mode).toBe('authored');
    expect(forced.mode).toBe('elk');
    expect(forced).toMatchSnapshot();
  });
});

describe('solver guarantees', () => {
  it('architecture components never overlap (the old rectsOverlap bar)', async () => {
    const layout = await pickLayout(load('web-app.architecture.json'));
    assertNoNodeOverlap(layout.nodes);
  });

  it('ELK-placed architecture components never overlap', async () => {
    const spec = load('web-app.architecture.json') as Extract<Spec, { diagram_type: 'architecture' }>;
    const stripped: typeof spec = { ...spec, components: spec.components.map(({ pos: _pos, ...c }) => c) };
    const layout = await pickLayout(stripped);
    assertNoNodeOverlap(layout.nodes);
  });

  for (const fixture of FIXTURES.slice(1)) {
    it(`grid/sequence layout has no node overlaps: ${fixture}`, async () => {
      const layout = await pickLayout(load(fixture));
      assertNoNodeOverlap(layout.nodes);
    });
  }

  it('every edge route is axis-aligned (orthogonal by construction)', async () => {
    for (const fixture of FIXTURES) {
      const layout = await pickLayout(load(fixture));
      for (const edge of layout.edges) {
        for (let i = 1; i < edge.points.length; i += 1) {
          const [ax, ay] = edge.points[i - 1];
          const [bx, by] = edge.points[i];
          const aligned = Math.abs(bx - ax) < 0.01 || Math.abs(by - ay) < 0.01;
          expect(aligned, `${fixture} ${edge.id} segment ${i - 1}->${i} not axis-aligned`).toBe(true);
        }
      }
    }
  });
});

describe('determinism', () => {
  for (const fixture of FIXTURES) {
    it(`pickLayout(${fixture}) is a pure function of the JSON`, async () => {
      const spec = load(fixture);
      const first = await pickLayout(spec);
      const second = await pickLayout(spec);
      expect(second).toEqual(first);
    });
  }
});

describe('ajv validation gate (Q2)', () => {
  for (const fixture of FIXTURES) {
    it(`fixture passes: ${fixture}`, () => {
      expect(validateSpec(load(fixture))).toEqual([]);
    });
  }

  it('rejects an unknown diagram_type', () => {
    const errors = validateSpec({ schema_version: 1, diagram_type: 'bogus', meta: {}, components: [] });
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('diagram_type');
  });

  it('rejects a spec missing required fields', () => {
    const errors = validateSpec({ schema_version: 1, diagram_type: 'architecture', meta: {} });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join('\n')).toContain('components');
  });

  it('rejects non-objects', () => {
    expect(validateSpec(null).length).toBe(1);
    expect(validateSpec('nope').length).toBe(1);
  });
});
