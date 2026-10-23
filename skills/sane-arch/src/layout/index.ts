/**
 * Layout engine entry point (PLAN §5).
 *
 * `pickLayout(spec)` dispatches per diagram_type:
 * - architecture → ELK (@statelyai/graph + elkjs) when geometry is missing or
 *   a re-run is forced; authored positions are rendered as-is otherwise.
 * - workflow / lifecycle / dataflow → deterministic grid arithmetic.
 * - sequence → participants as columns, authored message y.
 *
 * For the four deterministic types, lane/col/stage/row/y are *authored
 * content* — the layout is a pure function of the JSON, so a reload always
 * yields identical geometry.
 */
import { layoutArchitecture } from './elk.ts';
import { layoutDataflow, layoutLifecycle, layoutWorkflow } from './grid.ts';
import { layoutSequence } from './sequence.ts';

export type DiagramType = 'architecture' | 'workflow' | 'lifecycle' | 'dataflow' | 'sequence';
export type Side = 'top' | 'right' | 'bottom' | 'left';

/* ---------------------------------- spec --------------------------------- */
/* Minimal shapes the layout engine reads off each archify schema (Q2: the
 * schemas themselves are consumed as-is; ajv is the authority on validity). */

export interface SpecMeta {
  title?: string;
  [key: string]: unknown;
}

export interface ArchitectureComponent {
  id: string;
  type: string;
  label: string;
  pos?: [number, number];
  size?: [number, number];
  row?: number;
  col?: number;
  sublabel?: string;
  tag?: string;
  brand?: string;
}

export interface ArchitectureConnection {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: string;
  fromSide?: Side;
  toSide?: Side;
  route?: string;
  via?: [number, number][];
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  width?: number;
}

export interface ArchitectureBoundary {
  id?: string;
  kind: 'region' | 'security-group';
  label?: string;
  wraps: string[];
  pad?: number;
}

export interface ArchitectureSpec {
  schema_version: 1;
  diagram_type: 'architecture';
  meta: SpecMeta;
  components: ArchitectureComponent[];
  boundaries?: ArchitectureBoundary[];
  connections?: ArchitectureConnection[];
}

export interface Lane {
  id: string;
  label: string;
  variant?: 'normal' | 'exception';
}

export interface GridEntity {
  id: string;
  label: string;
  sublabel?: string;
  tag?: string;
  width?: number;
  height?: number;
  yOffset?: number;
}

export interface WorkflowNode extends GridEntity {
  lane: string;
  col: number;
  type?: string;
}

export interface WorkflowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: string;
  role?: string;
  fromSide?: Side;
  toSide?: Side;
  width?: number;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
}

export interface WorkflowPhase {
  id: string;
  label: string;
  fromCol: number;
  toCol: number;
}

export interface WorkflowGroup {
  id: string;
  label: string;
  lane: string;
  fromCol: number;
  toCol: number;
}

export interface WorkflowSpec {
  schema_version: 1 | 2;
  diagram_type: 'workflow';
  meta: SpecMeta;
  lanes: Lane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  phases?: WorkflowPhase[];
  groups?: WorkflowGroup[];
}

export interface LifecycleState extends GridEntity {
  type: string;
  lane: string;
  col: number;
}

export interface LifecycleTransition {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: string;
  fromSide?: Side;
  toSide?: Side;
  width?: number;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
}

export interface LifecycleSpec {
  schema_version: 1;
  diagram_type: 'lifecycle';
  meta: SpecMeta;
  lanes: Lane[];
  states: LifecycleState[];
  transitions: LifecycleTransition[];
}

export interface DataflowStage {
  label: string;
}

export interface DataflowNode extends GridEntity {
  type: string;
  stage: number;
  row: number;
}

export interface DataflowFlow {
  id?: string;
  from: string;
  to: string;
  label: string;
  variant?: string;
  fromSide?: Side;
  toSide?: Side;
  width?: number;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
}

export interface DataflowSpec {
  schema_version: 1;
  diagram_type: 'dataflow';
  meta: SpecMeta;
  stages: DataflowStage[];
  nodes: DataflowNode[];
  flows: DataflowFlow[];
}

export interface SequenceParticipant {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
  brand?: string;
}

export interface SequenceMessage {
  id?: string;
  from: string;
  to: string;
  y?: number;
  label: string;
  variant?: string;
  note?: string;
}

export interface SequenceSegment {
  from: number;
  to: number;
  label: string;
}

export interface SequenceActivation {
  participant: string;
  from: number;
  to: number;
  type?: string;
}

export interface SequenceSpec {
  schema_version: 1;
  diagram_type: 'sequence';
  meta: SpecMeta;
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  segments?: SequenceSegment[];
  activations?: SequenceActivation[];
}

export type Spec =
  | ArchitectureSpec
  | WorkflowSpec
  | LifecycleSpec
  | DataflowSpec
  | SequenceSpec;

/* --------------------------------- output -------------------------------- */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutNode extends Rect {
  id: string;
}

export type BandKind =
  | 'lane'
  | 'phase'
  | 'group'
  | 'stage'
  | 'region'
  | 'security-group'
  | 'lifeline'
  | 'activation'
  | 'segment';

export interface LayoutBand extends Rect {
  id: string;
  kind: BandKind;
  label?: string;
  variant?: string;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  /** Absolute polyline, tail → head; the last point is the arrow tip. */
  points: [number, number][];
  label?: string;
  /** Explicit label position (center); otherwise the renderer picks the
   *  midpoint of the longest segment. */
  labelAt?: [number, number];
  labelOffset?: [number, number];
  labelSegment?: number;
  dashed?: boolean;
  width?: number;
  variant?: string;
}

export type LayoutMode = 'authored' | 'elk' | 'grid' | 'sequence';

export interface LayoutResult {
  diagramType: DiagramType;
  mode: LayoutMode;
  /** Content bounding box (informational; rendering uses absolute coords). */
  width: number;
  height: number;
  nodes: LayoutNode[];
  bands: LayoutBand[];
  edges: LayoutEdge[];
}

export interface PickLayoutOptions {
  /** Force a full ELK layout for architecture even when all pos exist (Q7). */
  force?: boolean;
}

/* ------------------------------- dispatcher ------------------------------ */

export async function pickLayout(
  spec: Spec,
  options: PickLayoutOptions = {},
): Promise<LayoutResult> {
  const result = await dispatch(spec, options);
  return roundLayout(result);
}

async function dispatch(spec: Spec, options: PickLayoutOptions): Promise<LayoutResult> {
  switch (spec.diagram_type) {
    case 'architecture':
      return layoutArchitecture(spec, options.force ?? false);
    case 'workflow':
      return layoutWorkflow(spec);
    case 'lifecycle':
      return layoutLifecycle(spec);
    case 'dataflow':
      return layoutDataflow(spec);
    case 'sequence':
      return layoutSequence(spec);
    default: {
      const never: never = spec;
      throw new Error(`unsupported diagram_type: ${JSON.stringify(never)}`);
    }
  }
}

/** Round all geometry to 2 decimals so ELK float output stays snapshot-stable. */
export function roundLayout(result: LayoutResult): LayoutResult {
  const r = (n: number): number => Math.round(n * 100) / 100;
  const rect = <T extends Rect>(o: T): T => ({
    ...o,
    x: r(o.x),
    y: r(o.y),
    width: r(o.width),
    height: r(o.height),
  });
  return {
    ...result,
    width: r(result.width),
    height: r(result.height),
    nodes: result.nodes.map((n) => rect(n)),
    bands: result.bands.map((b) => rect(b)),
    edges: result.edges.map((e) => ({
      ...e,
      points: e.points.map(([x, y]) => [r(x), r(y)] as [number, number]),
      labelAt: e.labelAt ? ([r(e.labelAt[0]), r(e.labelAt[1])] as [number, number]) : undefined,
    })),
  };
}

/** Content bounds over nodes, bands and edge points, padded on all sides. */
export function computeBounds(
  nodes: LayoutNode[],
  bands: LayoutBand[],
  edges: LayoutEdge[],
  margin: number,
): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  const grow = (x: number, y: number): void => {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const n of nodes) grow(n.x + n.width, n.y + n.height);
  for (const b of bands) grow(b.x + b.width, b.y + b.height);
  for (const e of edges) for (const [x, y] of e.points) grow(x, y);
  return { width: Math.ceil(maxX + margin), height: Math.ceil(maxY + margin) };
}
