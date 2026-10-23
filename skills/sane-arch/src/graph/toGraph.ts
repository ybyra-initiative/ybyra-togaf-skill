/**
 * spec JSON → @statelyai/graph IR (PLAN §4).
 * Plain JSON in, plain JSON out — the IR that `getElkLayout` consumes.
 */
import { createGraph } from '@statelyai/graph';
import type { ArchitectureSpec } from '../layout/index.ts';

/** Deterministic size estimate for components without an authored `size`. */
export function estimateSize(
  label: string,
  sublabel?: string,
): { width: number; height: number } {
  const width = Math.min(260, Math.max(140, label.length * 8 + 48));
  return { width, height: sublabel ? 78 : 64 };
}

export function toGraph(spec: ArchitectureSpec) {
  return createGraph({
    nodes: spec.components.map((c) => {
      const size = c.size
        ? { width: c.size[0], height: c.size[1] }
        : estimateSize(c.label, c.sublabel);
      return {
        id: c.id,
        label: c.label,
        width: size.width,
        height: size.height,
        data: c,
      };
    }),
    edges: (spec.connections ?? []).map((conn, i) => ({
      id: conn.id ?? `${conn.from}->${conn.to}#${i}`,
      sourceId: conn.from,
      targetId: conn.to,
      label: conn.label ?? null,
      data: conn,
    })),
  });
}
