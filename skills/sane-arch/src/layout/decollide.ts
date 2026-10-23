/**
 * Post-layout edge-label de-collision.
 *
 * The solver owns node and polyline geometry, but edge labels are dumb
 * midpoints that can land on nodes or on each other. This pass nudges
 * unauthored labels off obstacles with a deterministic candidate scan;
 * authored `labelAt` / `labelOffset` are respected as-is.
 */
import type { LayoutEdge, LayoutNode } from './index.ts';

const LABEL_H = 22;
const LABEL_CHAR_W = 6.8;
const LABEL_PAD_X = 14;
const GAP = 3;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w + GAP &&
    b.x < a.x + a.w + GAP &&
    a.y < b.y + b.h + GAP &&
    b.y < a.y + a.h + GAP
  );
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Mirrors the renderer's anchor rule (App.tsx `labelAnchor`). */
function anchor(edge: LayoutEdge): [number, number] {
  if (edge.labelAt) return edge.labelAt;
  const pts = edge.points;
  if (edge.labelSegment !== undefined && edge.labelSegment < pts.length - 1) {
    const [ax, ay] = pts[edge.labelSegment];
    const [bx, by] = pts[edge.labelSegment + 1];
    return [(ax + bx) / 2, (ay + by) / 2];
  }
  let best: [number, number] = pts[0] ?? [0, 0];
  let bestLen = -1;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len > bestLen) {
      bestLen = len;
      best = [(ax + bx) / 2, (ay + by) / 2];
    }
  }
  return best;
}

// Deterministic scan order: stay put, then ring outward, vertical nudges
// first (labels between rows usually clear by lifting, not sliding).
const CANDIDATES: [number, number][] = [[0, 0]];
for (let ring = 1; ring <= 4; ring += 1) {
  for (const dy of [-ring * 14, ring * 14]) {
    for (const dx of [0, -ring * 24, ring * 24]) CANDIDATES.push([dx, dy]);
  }
  for (const dx of [-ring * 24, ring * 24]) CANDIDATES.push([dx, 0]);
}

export function decollideLabels(edges: LayoutEdge[], nodes: LayoutNode[]): LayoutEdge[] {
  const obstacles: Rect[] = nodes.map((n) => ({ x: n.x, y: n.y, w: n.width, h: n.height }));
  const placed: Rect[] = [];

  return edges.map((edge) => {
    if (!edge.label) return edge;
    const w = edge.label.length * LABEL_CHAR_W + LABEL_PAD_X;
    const [ax, ay] = anchor(edge);
    const base: Rect = { x: ax - w / 2, y: ay - LABEL_H / 2, w, h: LABEL_H };

    if (edge.labelOffset || edge.labelAt) {
      placed.push(base);
      return edge;
    }

    const collides = (r: Rect) =>
      obstacles.some((o) => overlaps(r, o)) || placed.some((p) => overlaps(r, p));

    let fallback: { off: [number, number]; area: number } | null = null;
    for (const [dx, dy] of CANDIDATES) {
      const r: Rect = { ...base, x: base.x + dx, y: base.y + dy };
      if (!collides(r)) {
        placed.push(r);
        return { ...edge, labelOffset: [dx, dy] as [number, number] };
      }
      const area =
        obstacles.reduce((s, o) => s + overlapArea(r, o), 0) +
        placed.reduce((s, p) => s + overlapArea(r, p), 0);
      if (!fallback || area < fallback.area) fallback = { off: [dx, dy], area };
    }

    // Everything collides: keep the least-bad candidate.
    const off = fallback?.off ?? [0, 0];
    placed.push({ ...base, x: base.x + off[0], y: base.y + off[1] });
    return { ...edge, labelOffset: off as [number, number] };
  });
}
