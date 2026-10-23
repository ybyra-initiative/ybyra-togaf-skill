/**
 * Orthogonal edge routing for the grid types (PLAN §5 implementation note).
 *
 * elkjs cannot route edges while holding nodes fixed, so the four
 * deterministic types compute their edge paths here — straight from the same
 * grid math. All travel happens through node-free channels (the gaps between
 * columns/bands), which makes the routes collision-free by construction:
 * a solver guarantee, not a repair loop.
 */
import type { Rect, Side } from './index.ts';

export type Point = [number, number];

export interface GridTopology {
  /** Left edge of each column cell. */
  colX: number[];
  /** Width of each column cell (max node width in that column). */
  colW: number[];
  /** Top edge of each band (lane / row) cell. */
  bandY: number[];
  /** Height of each band cell. */
  bandH: number[];
  /** Horizontal gap between column cells. */
  colGap: number;
  /** Vertical gap between band cells. */
  bandGap: number;
  /** Occupied cells as `${col}:${band}` — used to detour around blockers. */
  occupied: ReadonlySet<string>;
}

export interface GridEndpoint {
  rect: Rect;
  col: number;
  band: number;
  /** Authored side override (left/right honored; top/bottom fall back). */
  side?: Side;
}

export function anchor(rect: Rect, side: Side): Point {
  switch (side) {
    case 'left':
      return [rect.x, rect.y + rect.height / 2];
    case 'right':
      return [rect.x + rect.width, rect.y + rect.height / 2];
    case 'top':
      return [rect.x + rect.width / 2, rect.y];
    case 'bottom':
      return [rect.x + rect.width / 2, rect.y + rect.height];
  }
}

/**
 * Route one edge through the grid channels.
 * Deterministic: a pure function of the two rects and the topology.
 */
export function routeGridEdge(src: GridEndpoint, tgt: GridEndpoint, topo: GridTopology): Point[] {
  const s = src.rect;
  const t = tgt.rect;
  const sCy = s.y + s.height / 2;
  const tCy = t.y + t.height / 2;
  const sCx = s.x + s.width / 2;
  const tCx = t.x + t.width / 2;
  const sc = src.col;
  const tc = tgt.col;
  const sb = src.band;
  const tb = tgt.band;

  const rightChan = (c: number): number => topo.colX[c] + topo.colW[c] + topo.colGap / 2;
  const leftChan = (c: number): number => topo.colX[c] - topo.colGap / 2;
  const belowChan = (b: number): number => topo.bandY[b] + topo.bandH[b] + topo.bandGap / 2;
  const aboveChan = (b: number): number => topo.bandY[b] - topo.bandGap / 2;

  // Same cell → little loop out and back so the arrow still reads.
  if (sc === tc && sb === tb) {
    const exit: Point = anchor(s, 'right');
    const v = rightChan(sc);
    const loopY = s.y + s.height + topo.bandGap / 2;
    return simplify([exit, [v, sCy], [v, loopY], [sCx, loopY], anchor(t, 'bottom')]);
  }

  const colDir = tc > sc ? 1 : tc < sc ? -1 : 0;
  const exitSide: Side =
    src.side === 'left' || src.side === 'right'
      ? src.side
      : colDir > 0
        ? 'right'
        : colDir < 0
          ? 'left'
          : tb > sb
            ? 'bottom'
            : 'top';

  if (exitSide === 'left' || exitSide === 'right') {
    const v0 = exitSide === 'right' ? rightChan(sc) : leftChan(sc);
    const e0 = anchor(s, exitSide);
    const pts: Point[] = [e0, [v0, sCy]];

    // Same band with a clear run → finish right there.
    if (sb === tb && colsFreeBetween(sc, tc, sb, topo)) {
      if (Math.abs(sCy - tCy) > 0.5) pts.push([v0, tCy]);
      const entry: Side =
        tgt.side === 'left' || tgt.side === 'right'
          ? tgt.side
          : exitSide === 'right'
            ? 'left'
            : 'right';
      pts.push(anchor(t, entry));
      return simplify(pts);
    }

    // Detour through the horizontal channel between the bands, then down a
    // vertical channel beside the target.
    const h =
      tb > sb
        ? belowChan(sb)
        : tb < sb
          ? aboveChan(sb)
          : sb + 1 < topo.bandY.length
            ? belowChan(sb)
            : aboveChan(sb);
    pts.push([v0, h]);

    const entry: Side =
      tgt.side === 'left' || tgt.side === 'right' ? tgt.side : v0 < tCx ? 'left' : 'right';
    const v1 = entry === 'left' ? leftChan(tc) : rightChan(tc);
    pts.push([v1, h], [v1, tCy], anchor(t, entry));
    return simplify(pts);
  }

  // Vertical exit (same column, different band).
  const e0 = anchor(s, exitSide);
  const h0 = exitSide === 'bottom' ? belowChan(sb) : aboveChan(sb);
  const pts: Point[] = [e0, [sCx, h0]];

  if (colDir === 0) {
    if (bandsFreeBetween(sb, tb, sc, topo)) {
      pts.push(anchor(t, exitSide === 'bottom' ? 'top' : 'bottom'));
      return simplify(pts);
    }
    // A node blocks the direct drop — bypass through the column's right gap.
    const v = rightChan(sc);
    const h1 = tb > sb ? aboveChan(tb) : belowChan(tb);
    pts.push([v, h0], [v, h1], [tCx, h1], anchor(t, tb > sb ? 'top' : 'bottom'));
    return simplify(pts);
  }

  // Vertical exit but the target is in another column: join the channel run.
  const v0 = exitSide === 'bottom' ? rightChan(sc) : leftChan(sc);
  const entry: Side = v0 < tCx ? 'left' : 'right';
  const v1 = entry === 'left' ? leftChan(tc) : rightChan(tc);
  pts.push([v0, h0], [v0, belowChan(Math.max(sb, tb))], [v1, belowChan(Math.max(sb, tb))], [
    v1,
    tCy,
  ], anchor(t, entry));
  return simplify(pts);
}

function colsFreeBetween(sc: number, tc: number, band: number, topo: GridTopology): boolean {
  const lo = Math.min(sc, tc);
  const hi = Math.max(sc, tc);
  for (let c = lo + 1; c < hi; c += 1) {
    if (topo.occupied.has(`${c}:${band}`)) return false;
  }
  return true;
}

function bandsFreeBetween(sb: number, tb: number, col: number, topo: GridTopology): boolean {
  const lo = Math.min(sb, tb);
  const hi = Math.max(sb, tb);
  for (let b = lo + 1; b < hi; b += 1) {
    if (topo.occupied.has(`${col}:${b}`)) return false;
  }
  return true;
}

/** Drop duplicate and collinear intermediate points. */
export function simplify(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[0] - p[0]) < 0.5 && Math.abs(last[1] - p[1]) < 0.5) continue;
    out.push(p);
  }
  let i = 1;
  while (i < out.length - 1) {
    const [ax, ay] = out[i - 1];
    const [bx, by] = out[i];
    const [cx, cy] = out[i + 1];
    const collinear = (bx - ax) * (cy - ay) === (by - ay) * (cx - ax);
    const axisAligned =
      (Math.abs(bx - ax) < 0.5 && Math.abs(cx - bx) < 0.5) ||
      (Math.abs(by - ay) < 0.5 && Math.abs(cy - by) < 0.5);
    if (collinear && axisAligned) out.splice(i, 1);
    else i += 1;
  }
  return out;
}
