/**
 * Architecture layout (PLAN §5): ELK (@statelyai/graph + elkjs) whenever
 * geometry is missing or a re-run is forced; authored positions render as-is.
 * ELK owns both node placement and edge routing here — the solver guarantee
 * for this type. Authored connections keep their `via` waypoints (content the
 * author routed deliberately).
 */
import { getElkLayout } from '@statelyai/graph/layout/elk';
import type {
  ArchitectureConnection,
  ArchitectureSpec,
  LayoutBand,
  LayoutEdge,
  LayoutMode,
  LayoutNode,
  LayoutResult,
  Rect,
  Side,
} from './index.ts';
import { computeBounds } from './index.ts';
import { estimateSize, toGraph } from '../graph/toGraph.ts';
import { anchor, simplify, type Point } from './routing.ts';

const MARGIN = 48;
const STUB = 30;
const ELK_SPACING = { node: 72, layer: 82 } as const;

export async function layoutArchitecture(
  spec: ArchitectureSpec,
  force: boolean,
): Promise<LayoutResult> {
  const components = spec.components ?? [];
  const connections = spec.connections ?? [];
  const allPos = components.length > 0 && components.every((c) => Array.isArray(c.pos));

  let nodes: LayoutNode[];
  let routes: Map<string, Point[]>;
  let labelAt: Map<string, [number, number]>;
  let mode: LayoutMode;

  if (allPos && !force) {
    mode = 'authored';
    nodes = components.map((c) => {
      const size = c.size
        ? { width: c.size[0], height: c.size[1] }
        : estimateSize(c.label, c.sublabel);
      return {
        id: c.id,
        x: c.pos?.[0] ?? 0,
        y: c.pos?.[1] ?? 0,
        width: size.width,
        height: size.height,
      };
    });
    routes = routeAuthored(connections, nodes);
    labelAt = new Map();
  } else {
    mode = 'elk';
    const graph = toGraph(spec);
    const visual = await getElkLayout(graph, {
      // Top-down: vertical reads better in web pages (page scroll is vertical)
      // and keeps funnels/flows narrow instead of stretching across the viewport.
      direction: 'down',
      algorithm: 'layered',
      spacing: { node: ELK_SPACING.node, layer: ELK_SPACING.layer },
    });

    // Pad the origin; ELK's own coordinates carry no authored meaning.
    const minX = Math.min(...visual.nodes.map((n) => n.x));
    const minY = Math.min(...visual.nodes.map((n) => n.y));
    const dx = MARGIN - (Number.isFinite(minX) ? minX : 0);
    const dy = MARGIN - (Number.isFinite(minY) ? minY : 0);
    nodes = visual.nodes.map((n) => ({
      id: n.id,
      x: n.x + dx,
      y: n.y + dy,
      width: n.width,
      height: n.height,
    }));

    const rectOf = new Map(nodes.map((n) => [n.id, n as Rect]));
    routes = new Map();
    labelAt = new Map();
    for (const e of visual.edges) {
      const pts = (e.points ?? []).map((p) => [p.x + dx, p.y + dy] as Point);
      if (pts.length >= 2) {
        routes.set(e.id, simplify(pts));
      } else {
        const s = rectOf.get(e.sourceId);
        const t = rectOf.get(e.targetId);
        if (s && t) routes.set(e.id, straight(s, t));
      }
      if (e.width > 0 && e.height > 0) {
        labelAt.set(e.id, [e.x + e.width / 2 + dx, e.y + e.height / 2 + dy]);
      }
    }
  }

  const rectOf = new Map(nodes.map((n) => [n.id, n as Rect]));
  const edges: LayoutEdge[] = [];
  connections.forEach((conn, i) => {
    const id = conn.id ?? `${conn.from}->${conn.to}#${i}`;
    const points = routes.get(id);
    if (!points) return; // connection references a missing component
    edges.push({
      id,
      from: conn.from,
      to: conn.to,
      points,
      label: conn.label,
      labelAt: labelAt.get(id),
      labelOffset:
        conn.labelDx !== undefined || conn.labelDy !== undefined
          ? [conn.labelDx ?? 0, conn.labelDy ?? 0]
          : undefined,
      labelSegment: conn.labelSegment,
      dashed: conn.variant === 'dashed' || conn.variant === 'security',
      width: conn.width,
      variant: conn.variant,
    });
  });

  // Boundaries wrap their components (authored or laid out).
  const bands: LayoutBand[] = [];
  (spec.boundaries ?? []).forEach((b, i) => {
    const rects = b.wraps.map((id) => rectOf.get(id)).filter((r): r is Rect => r !== undefined);
    if (rects.length === 0) return;
    const pad = b.pad ?? 24;
    const x = Math.min(...rects.map((r) => r.x)) - pad;
    const y = Math.min(...rects.map((r) => r.y)) - pad;
    const right = Math.max(...rects.map((r) => r.x + r.width)) + pad;
    const bottom = Math.max(...rects.map((r) => r.y + r.height)) + pad;
    bands.push({
      id: b.id ?? `boundary-${i}`,
      kind: b.kind,
      label: b.label,
      x,
      y,
      width: right - x,
      height: bottom - y,
    });
  });

  const bounds = computeBounds(nodes, bands, edges, MARGIN);
  return {
    diagramType: 'architecture',
    mode,
    width: bounds.width,
    height: bounds.height,
    nodes,
    bands,
    edges,
  };
}

/** Authored routing: `via` waypoints are content; otherwise an L-stub. */
function routeAuthored(
  connections: ArchitectureConnection[],
  nodes: LayoutNode[],
): Map<string, Point[]> {
  const rectOf = new Map(nodes.map((n) => [n.id, n as Rect]));
  const routes = new Map<string, Point[]>();
  connections.forEach((conn, i) => {
    const id = conn.id ?? `${conn.from}->${conn.to}#${i}`;
    const s = rectOf.get(conn.from);
    const t = rectOf.get(conn.to);
    if (!s || !t) return;
    const via = conn.via ?? [];
    const firstTarget: [number, number] = via[0] ?? [t.x + t.width / 2, t.y + t.height / 2];
    const lastSource: [number, number] =
      via[via.length - 1] ?? [s.x + s.width / 2, s.y + s.height / 2];
    const fromSide: Side = conn.fromSide ?? autoSide(s, firstTarget[0], firstTarget[1]);
    const toSide: Side = conn.toSide ?? autoSide(t, lastSource[0], lastSource[1]);
    if (via.length > 0) {
      routes.set(
        id,
        simplify([anchor(s, fromSide), ...via.map((p) => [p[0], p[1]] as Point), anchor(t, toSide)]),
      );
    } else {
      routes.set(id, stubRoute(s, t, fromSide, toSide));
    }
  });
  return routes;
}

function autoSide(rect: Rect, toX: number, toY: number): Side {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dx = toX - cx;
  const dy = toY - cy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function stubRoute(s: Rect, t: Rect, fromSide: Side, toSide: Side): Point[] {
  const e0 = anchor(s, fromSide);
  const e1 = anchor(t, toSide);
  const horizontal = fromSide === 'left' || fromSide === 'right';
  if (horizontal) {
    const dir = fromSide === 'right' ? 1 : -1;
    const stubX = e0[0] + dir * STUB;
    return simplify([e0, [stubX, e0[1]], [stubX, e1[1]], e1]);
  }
  const dir = fromSide === 'bottom' ? 1 : -1;
  const stubY = e0[1] + dir * STUB;
  return simplify([e0, [e0[0], stubY], [e1[0], stubY], e1]);
}

function straight(s: Rect, t: Rect): Point[] {
  return simplify([
    [s.x + s.width / 2, s.y + s.height / 2],
    [t.x + t.width / 2, t.y + t.height / 2],
  ]);
}
