/**
 * Deterministic grid-arithmetic layouts for workflow / lifecycle / dataflow
 * (PLAN §5). Lane index → y band, col → x slot, stage → x band, row → y slot.
 * Pure functions of the JSON: a reload always yields identical geometry.
 */
import type {
  DataflowFlow,
  DataflowSpec,
  GridEntity,
  Lane,
  LayoutBand,
  LayoutEdge,
  LayoutNode,
  LayoutResult,
  LifecycleSpec,
  LifecycleTransition,
  WorkflowEdge,
  WorkflowGroup,
  WorkflowPhase,
  WorkflowSpec,
} from './index.ts';
import { computeBounds } from './index.ts';
import { routeGridEdge, type GridTopology, type Point } from './routing.ts';

const MARGIN = 48;
const GUTTER = 168; // lane-label column
const COL_GAP = 64;
const LANE_GAP = 44;
const NODE_PAD_V = 18;
const MIN_LANE_H = 84;
const PHASE_H = 34;
const PHASE_GAP = 18;
const GROUP_PAD = 8;

// dataflow
const STAGE_GAP = 64;
const STAGE_PAD = 16;
const STAGE_HEADER_H = 46;
const ROW_GAP = 36;
const MIN_ROW_H = 76;

const WORKFLOW_CFG = { defaultW: 132, defaultH: 64 };
const LIFECYCLE_CFG = { defaultW: 124, defaultH: 56 };

interface GridCfg {
  defaultW: number;
  defaultH: number;
}

/* --------------------------- lane-based (wf/life) ------------------------ */

interface LaneGridInput<T extends GridEntity> {
  lanes: Lane[];
  items: T[];
  /** item → lane id */
  laneOf: (item: T) => string;
  /** item → column index */
  colOf: (item: T) => number;
  phases: WorkflowPhase[];
  groups: WorkflowGroup[];
  cfg: GridCfg;
}

interface LaneGrid {
  nodes: LayoutNode[];
  bands: LayoutBand[];
  topology: GridTopology;
  contentRight: number;
  contentBottom: number;
}

function buildLaneGrid<T extends GridEntity>(input: LaneGridInput<T>): LaneGrid {
  const { lanes, items, cfg } = input;
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));
  const indexOf = (laneId: string): number => Math.max(0, laneIndex.get(laneId) ?? 0);

  let maxCol = 0;
  for (const item of items) maxCol = Math.max(maxCol, input.colOf(item));
  for (const p of input.phases) maxCol = Math.max(maxCol, p.toCol);
  for (const g of input.groups) maxCol = Math.max(maxCol, g.toCol);

  const colW: number[] = [];
  const colX: number[] = [];
  for (let c = 0; c <= maxCol; c += 1) {
    colW[c] = cfg.defaultW;
    for (const item of items) if (input.colOf(item) === c) colW[c] = Math.max(colW[c], item.width ?? cfg.defaultW);
  }
  let x = MARGIN + GUTTER;
  for (let c = 0; c <= maxCol; c += 1) {
    colX[c] = x;
    x += colW[c] + COL_GAP;
  }
  const contentRight = maxCol >= 0 ? colX[maxCol] + colW[maxCol] : MARGIN + GUTTER;

  // Band heights must contain every node plus its authored yOffset.
  const laneNeed = lanes.map(() => cfg.defaultH + 2 * NODE_PAD_V);
  for (const item of items) {
    const li = indexOf(input.laneOf(item));
    const need = (item.height ?? cfg.defaultH) + 2 * Math.abs(item.yOffset ?? 0) + 2 * NODE_PAD_V;
    laneNeed[li] = Math.max(laneNeed[li], need, MIN_LANE_H);
  }
  const laneH = laneNeed;
  const laneY: number[] = [];
  let y = MARGIN + (input.phases.length > 0 ? PHASE_H + PHASE_GAP : 0);
  for (let l = 0; l < lanes.length; l += 1) {
    laneY[l] = y;
    y += laneH[l] + LANE_GAP;
  }

  const occupied = new Set<string>();
  const nodes: LayoutNode[] = items.map((item) => {
    const li = indexOf(input.laneOf(item));
    const c = input.colOf(item);
    const w = item.width ?? cfg.defaultW;
    const h = item.height ?? cfg.defaultH;
    occupied.add(`${c}:${li}`);
    return {
      id: item.id,
      x: colX[c] ?? MARGIN + GUTTER,
      y: laneY[li] + (laneH[li] - h) / 2 + (item.yOffset ?? 0),
      width: w,
      height: h,
    };
  });

  const bands: LayoutBand[] = [];
  for (const g of input.groups) {
    const li = indexOf(g.lane);
    bands.push({
      id: g.id,
      kind: 'group',
      label: g.label,
      x: colX[g.fromCol] ?? MARGIN + GUTTER,
      y: laneY[li] + GROUP_PAD,
      width: (colX[g.toCol] ?? contentRight) + (colW[g.toCol] ?? 0) - (colX[g.fromCol] ?? MARGIN + GUTTER),
      height: laneH[li] - 2 * GROUP_PAD,
    });
  }
  lanes.forEach((lane, l) => {
    bands.push({
      id: lane.id,
      kind: 'lane',
      label: lane.label,
      variant: lane.variant,
      x: MARGIN,
      y: laneY[l],
      width: contentRight - MARGIN,
      height: laneH[l],
    });
  });
  input.phases.forEach((p) => {
    bands.push({
      id: p.id,
      kind: 'phase',
      label: p.label,
      x: colX[p.fromCol] ?? MARGIN + GUTTER,
      y: MARGIN,
      width: (colX[p.toCol] ?? contentRight) + (colW[p.toCol] ?? 0) - (colX[p.fromCol] ?? MARGIN + GUTTER),
      height: PHASE_H,
    });
  });

  const topology: GridTopology = {
    colX,
    colW,
    bandY: laneY,
    bandH: laneH,
    colGap: COL_GAP,
    bandGap: LANE_GAP,
    occupied,
  };
  const contentBottom =
    lanes.length > 0 ? laneY[lanes.length - 1] + laneH[lanes.length - 1] : MARGIN;
  return { nodes, bands, topology, contentRight, contentBottom };
}

function routeGridEdges(
  entities: { id: string; col: number; band: number }[],
  relations: readonly (WorkflowEdge | LifecycleTransition | DataflowFlow)[],
  nodes: LayoutNode[],
  topology: GridTopology,
): LayoutEdge[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const rectOf = new Map(nodes.map((n) => [n.id, n]));
  const edges: LayoutEdge[] = [];
  relations.forEach((rel, i) => {
    const s = byId.get(rel.from);
    const t = byId.get(rel.to);
    const sr = rectOf.get(rel.from);
    const tr = rectOf.get(rel.to);
    if (!s || !t || !sr || !tr) return;
    const points: Point[] = routeGridEdge(
      { rect: sr, col: s.col, band: s.band, side: rel.fromSide },
      { rect: tr, col: t.col, band: t.band, side: rel.toSide },
      topology,
    );
    const role = (rel as { role?: string }).role;
    edges.push({
      id: rel.id ?? `${rel.from}->${rel.to}#${i}`,
      from: rel.from,
      to: rel.to,
      points,
      label: rel.label,
      labelOffset: rel.labelDx !== undefined || rel.labelDy !== undefined
        ? [rel.labelDx ?? 0, rel.labelDy ?? 0]
        : undefined,
      labelSegment: rel.labelSegment,
      dashed:
        rel.variant === 'dashed' ||
        rel.variant === 'security' ||
        role === 'async' ||
        role === 'error',
      width: rel.width,
      variant: rel.variant,
    });
  });
  return edges;
}

function finish(
  diagramType: LayoutResult['diagramType'],
  nodes: LayoutNode[],
  bands: LayoutBand[],
  edges: LayoutEdge[],
): LayoutResult {
  const bounds = computeBounds(nodes, bands, edges, MARGIN);
  return { diagramType, mode: 'grid', width: bounds.width, height: bounds.height, nodes, bands, edges };
}

/* -------------------------------- workflow -------------------------------- */

export function layoutWorkflow(spec: WorkflowSpec): LayoutResult {
  const phases = spec.phases ?? [];
  const groups = spec.groups ?? [];
  const grid = buildLaneGrid({
    lanes: spec.lanes,
    items: spec.nodes,
    laneOf: (item) => item.lane,
    colOf: (item) => item.col,
    phases,
    groups,
    cfg: WORKFLOW_CFG,
  });
  const entities = spec.nodes.map((n) => ({ id: n.id, col: n.col, band: laneBand(spec.lanes, n.lane) }));
  const edges = routeGridEdges(entities, spec.edges, grid.nodes, grid.topology);
  return finish('workflow', grid.nodes, grid.bands, edges);
}

/* -------------------------------- lifecycle ------------------------------- */

export function layoutLifecycle(spec: LifecycleSpec): LayoutResult {
  const grid = buildLaneGrid({
    lanes: spec.lanes,
    items: spec.states,
    laneOf: (item) => item.lane,
    colOf: (item) => item.col,
    phases: [],
    groups: [],
    cfg: LIFECYCLE_CFG,
  });
  const entities = spec.states.map((s) => ({
    id: s.id,
    col: s.col,
    band: laneBand(spec.lanes, s.lane),
  }));
  const edges = routeGridEdges(entities, spec.transitions, grid.nodes, grid.topology);
  return finish('lifecycle', grid.nodes, grid.bands, edges);
}

function laneBand(lanes: Lane[], laneId: string): number {
  const i = lanes.findIndex((l) => l.id === laneId);
  return Math.max(0, i);
}

/* -------------------------------- dataflow -------------------------------- */

export function layoutDataflow(spec: DataflowSpec): LayoutResult {
  const stageCount = spec.stages.length;
  const stageW: number[] = [];
  const stageX: number[] = [];
  for (let s = 0; s < stageCount; s += 1) {
    stageW[s] = 0;
    for (const n of spec.nodes) if (n.stage === s) stageW[s] = Math.max(stageW[s], n.width ?? WORKFLOW_CFG.defaultW);
    stageW[s] = Math.max(stageW[s], WORKFLOW_CFG.defaultW);
  }
  let x = MARGIN;
  for (let s = 0; s < stageCount; s += 1) {
    stageX[s] = x + STAGE_PAD;
    x += stageW[s] + STAGE_PAD * 2 + STAGE_GAP;
  }

  let maxRow = 0;
  for (const n of spec.nodes) maxRow = Math.max(maxRow, n.row);
  const rowH: number[] = [];
  const rowY: number[] = [];
  for (let r = 0; r <= maxRow; r += 1) {
    let need = WORKFLOW_CFG.defaultH + 2 * NODE_PAD_V;
    for (const n of spec.nodes) {
      if (n.row !== r) continue;
      need = Math.max(
        need,
        (n.height ?? WORKFLOW_CFG.defaultH) + 2 * Math.abs(n.yOffset ?? 0) + 2 * NODE_PAD_V,
      );
    }
    rowH[r] = Math.max(need, MIN_ROW_H);
    rowY[r] = r === 0 ? MARGIN + STAGE_HEADER_H + 16 : rowY[r - 1] + rowH[r - 1] + ROW_GAP;
  }

  const occupied = new Set<string>();
  const nodes: LayoutNode[] = spec.nodes.map((n) => {
    const w = n.width ?? WORKFLOW_CFG.defaultW;
    const h = n.height ?? WORKFLOW_CFG.defaultH;
    occupied.add(`${n.stage}:${n.row}`);
    return {
      id: n.id,
      x: stageX[n.stage] ?? MARGIN + STAGE_PAD,
      y: rowY[n.row] + (rowH[n.row] - h) / 2 + (n.yOffset ?? 0),
      width: w,
      height: h,
    };
  });

  const rowsBottom = maxRow >= 0 ? rowY[maxRow] + rowH[maxRow] : MARGIN + STAGE_HEADER_H;
  const bands: LayoutBand[] = spec.stages.map((stage, s) => ({
    id: `stage-${s}`,
    kind: 'stage' as const,
    label: stage.label,
    x: stageX[s] - STAGE_PAD,
    y: MARGIN,
    width: stageW[s] + STAGE_PAD * 2,
    height: rowsBottom - MARGIN + NODE_PAD_V,
  }));

  const topology: GridTopology = {
    colX: stageX,
    colW: stageW,
    bandY: rowY,
    bandH: rowH,
    colGap: STAGE_GAP + STAGE_PAD * 2,
    bandGap: ROW_GAP,
    occupied,
  };
  const entities = spec.nodes.map((n) => ({ id: n.id, col: n.stage, band: n.row }));
  const edges = routeGridEdges(entities, spec.flows, nodes, topology);
  return finish('dataflow', nodes, bands, edges);
}
