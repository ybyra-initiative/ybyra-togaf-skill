import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useNodesInitialized,
  useReactFlow,
  type EdgeProps,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import {
  BAND_NODE,
  ENTITY_NODE,
  SPEC_EDGE,
  toFlow,
  type BandFlowNode,
  type EntityFlowNode,
  type FlowEdge,
  type FlowNode,
  type SpecEdgeData,
} from './graph/toFlow.ts';
import { pickLayout, type LayoutBand, type LayoutResult, type Spec } from './layout/index.ts';
import { saveSpec } from './save.ts';

/* ------------------------------ node/edge views --------------------------- */

function EntityNode({ data, selected }: NodeProps<EntityFlowNode>) {
  const item = data.item;
  const type = typeof item.type === 'string' ? item.type : '';
  const tag = typeof item.tag === 'string' ? item.tag : undefined;
  const sublabel = typeof item.sublabel === 'string' ? item.sublabel : undefined;
  return (
    <div
      className={`entity entity--${type} ${selected ? 'is-selected' : ''}`}
      data-testid="entity-node"
      data-entity-id={String(item.id ?? '')}
      data-entity-type={type}
    >
      {tag ? <span className="entity__tag">{tag}</span> : null}
      <span className="entity__label">{String(item.label ?? '')}</span>
      {sublabel ? <span className="entity__sublabel">{sublabel}</span> : null}
      {/* Hidden default handles: React Flow refuses to mount edges on nodes
          without them (we draw our own polylines, so positions are moot). */}
      <Handle type="source" position={Position.Right} className="entity-handle" isConnectable={false} />
      <Handle type="target" position={Position.Left} className="entity-handle" isConnectable={false} />
    </div>
  );
}

function bandClass(band: LayoutBand): string {
  return `band band--${band.kind}${band.variant === 'exception' ? ' band--exception' : ''}`;
}

function BandNode({ data }: NodeProps<BandFlowNode>) {
  const { band } = data;
  return (
    <div className={bandClass(band)} data-testid="band-node" data-band-kind={band.kind}>
      {band.label ? <span className="band__label">{band.label}</span> : null}
    </div>
  );
}

function labelAnchor(points: [number, number][], edge: SpecEdgeData['edge']): [number, number] {
  if (edge.labelAt) return edge.labelAt;
  let best: [number, number] = points[0] ?? [0, 0];
  if (edge.labelSegment !== undefined && edge.labelSegment < points.length - 1) {
    const a = points[edge.labelSegment];
    const b = points[edge.labelSegment + 1];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len > bestLen) {
      bestLen = len;
      best = [(ax + bx) / 2, (ay + by) / 2];
    }
  }
  return best;
}

function SpecEdge({ data, selected }: EdgeProps<FlowEdge>) {
  const edge = (data as SpecEdgeData | undefined)?.edge;
  if (!edge || edge.points.length < 2) return null;
  const pts = edge.points;
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

  // Arrowhead at the tip (last segment direction).
  const [ax, ay] = pts[pts.length - 2];
  const [bx, by] = pts[pts.length - 1];
  const angle = Math.atan2(by - ay, bx - ax);
  const size = 9;
  const spread = 0.45;
  const arrow = [
    [bx, by],
    [bx - size * Math.cos(angle - spread), by - size * Math.sin(angle - spread)],
    [bx - size * Math.cos(angle + spread), by - size * Math.sin(angle + spread)],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');

  const emphasis = edge.variant === 'emphasis' || edge.width !== undefined;
  const security = edge.variant === 'security';
  const stroke = selected
    ? '#2563eb'
    : security
      ? '#dc2626'
      : emphasis
        ? '#0f172a'
        : '#475569';
  const strokeWidth = edge.width ?? (emphasis ? 2.4 : 1.6);

  const label = edge.label;
  const labelPos = label ? labelAnchor(pts, edge) : null;
  const lx = (labelPos?.[0] ?? 0) + (edge.labelOffset?.[0] ?? 0);
  const ly = (labelPos?.[1] ?? 0) + (edge.labelOffset?.[1] ?? 0);
  const labelW = label ? label.length * 6.8 + 14 : 0;

  return (
    <g className={`spec-edge ${edge.dashed ? 'is-dashed' : ''}`} data-testid="spec-edge">
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={edge.dashed ? '7 5' : undefined}
        strokeLinejoin="round"
      />
      <polygon points={arrow} fill={stroke} />
      {label && labelPos ? (
        <g transform={`translate(${lx} ${ly})`}>
          <rect
            x={-labelW / 2}
            y={-11}
            width={labelW}
            height={22}
            rx={6}
            className="spec-edge__label-bg"
          />
          <text className="spec-edge__label" textAnchor="middle" dominantBaseline="middle">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

const nodeTypes = { [ENTITY_NODE]: EntityNode, [BAND_NODE]: BandNode };
const edgeTypes = { [SPEC_EDGE]: SpecEdge };

/* --------------------------------- canvas --------------------------------- */

interface CanvasProps {
  rf: { nodes: FlowNode[]; edges: FlowEdge[] } | null;
  draggable: boolean;
  fitSeq: number;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onNodeDragStop: (node: FlowNode) => void;
}

function Canvas({ rf, draggable, fitSeq, onNodesChange, onNodeDragStop }: CanvasProps) {
  const instance = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  // Armed from the start: fit the very first layout too.
  const pendingFit = useRef(true);

  // Arm a fit whenever the caller asks for one (load / re-run)…
  useEffect(() => {
    pendingFit.current = true;
  }, [fitSeq]);

  // …and perform it once React Flow has measured the nodes (fitting earlier
  // zooms against zero-size bounds). Drag-induced rebuilds don't re-arm, so
  // the viewport stays put.
  useEffect(() => {
    if (!rf || !nodesInitialized || !pendingFit.current) return;
    pendingFit.current = false;
    void instance.fitView({ padding: 0.14, maxZoom: 1.2 });
  }, [rf, nodesInitialized, instance]);

  if (!rf) {
    return (
      <div className="canvas canvas--empty">
        <p className="placeholder">computing layout…</p>
      </div>
    );
  }

  return (
    <div className="canvas" data-testid="canvas">
      <ReactFlow
        nodes={rf.nodes}
        edges={rf.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
        onNodeDragStop={(_event, node) => onNodeDragStop(node as FlowNode)}
        nodesDraggable={draggable}
        nodesConnectable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        minZoom={0.05}
        maxZoom={2}
      >
        <Background color="#cbd5e1" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

/* ---------------------------------- app ----------------------------------- */

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; errors: string[] };

export default function App() {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [rf, setRf] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [force, setForce] = useState(0);
  const [fitSeq, setFitSeq] = useState(0);

  // Load the one spec file this session is bound to.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/spec')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((body: Spec) => {
        if (cancelled) return;
        setSpec(body);
        setFitSeq((n) => n + 1);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Layout whenever the spec (or the force flag) changes.
  useEffect(() => {
    if (!spec) return;
    let cancelled = false;
    setLayoutError(null);
    pickLayout(spec, { force: force > 0 })
      .then((result) => {
        if (cancelled) return;
        setLayout(result);
        // Do not write solver geometry back into the spec: that would re-fire
        // this effect in authored mode and re-route edges with the plain
        // router, so the first paint would differ from "Re-run layout".
        // Geometry enters the spec only via explicit drags (Q17) + Save.
      })
      .catch((err: unknown) => {
        if (!cancelled) setLayoutError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [spec, force]);

  // Rebuild React Flow elements when layout or spec items change.
  useEffect(() => {
    if (!layout || !spec) return;
    setRf(toFlow(layout, spec));
  }, [layout, spec]);

  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setRf((current) =>
      current ? { ...current, nodes: applyNodeChanges(changes, current.nodes) } : current,
    );
  }, []);

  // Q17: architecture-only drags write `pos` back into the local spec.
  const onNodeDragStop = useCallback((node: FlowNode) => {
    setDirty(true);
    setSpec((current) => {
      if (!current || current.diagram_type !== 'architecture') return current;
      const x = Math.round(node.position.x);
      const y = Math.round(node.position.y);
      let changed = false;
      const components = current.components.map((c) => {
        if (c.id !== node.id) return c;
        if (c.pos?.[0] === x && c.pos?.[1] === y) return c;
        changed = true;
        return { ...c, pos: [x, y] as [number, number] };
      });
      return changed ? { ...current, components } : current;
    });
  }, []);

  const doSave = useCallback(async () => {
    if (!spec) return;
    setSave({ kind: 'saving' });
    const result = await saveSpec(spec);
    if (result.ok) {
      setDirty(false);
      setSave({ kind: 'saved' });
    } else {
      setSave({ kind: 'error', errors: result.errors ?? ['unknown error'] });
    }
  }, [spec]);

  // Reconciliation 2: Ctrl+S / Cmd+S persists.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void doSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doSave]);

  const rerunLayout = useCallback(() => {
    setForce((n) => n + 1);
    setFitSeq((n) => n + 1);
  }, []);

  const title = useMemo(() => {
    const t = spec?.meta?.title;
    return typeof t === 'string' && t.length > 0 ? t : 'untitled';
  }, [spec]);

  if (loadError) {
    return (
      <div className="app app--error">
        <p>failed to load /api/spec: {loadError}</p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="app app--loading">
        <p className="placeholder">loading spec…</p>
      </div>
    );
  }

  const isArchitecture = spec.diagram_type === 'architecture';
  const saveLabel =
    save.kind === 'saving' ? 'Saving…' : save.kind === 'saved' ? 'Saved ✓' : 'Save';

  return (
    <ReactFlowProvider>
      <div className="app">
        <header className="toolbar" data-testid="toolbar">
          <div className="toolbar__title">
            <span className="badge" data-testid="type-badge">
              {spec.diagram_type}
            </span>
            <strong className="toolbar__spec-title">{title}</strong>
            {dirty ? (
              <span className="pill pill--dirty" data-testid="dirty-pill">
                unsaved changes
              </span>
            ) : null}
          </div>
          <div className="toolbar__actions">
            <span
              className={`save-status save-status--${save.kind}`}
              data-testid="save-status"
              role="status"
            >
              {save.kind === 'idle' ? '' : saveLabel}
            </span>
            <button
              type="button"
              className="button"
              data-testid="rerun-button"
              disabled={!isArchitecture}
              title={
                isArchitecture
                  ? 'Force a full ELK layout (overrides authored positions)'
                  : 'Layout is deterministic for this diagram type'
              }
              onClick={rerunLayout}
            >
              Re-run layout
            </button>
            <button
              type="button"
              className="button button--primary"
              data-testid="save-button"
              disabled={!dirty || save.kind === 'saving'}
              onClick={() => void doSave()}
            >
              Save
            </button>
          </div>
        </header>

        {save.kind === 'error' ? (
          <div className="banner banner--error" data-testid="save-errors">
            <strong>rejected by schema validation:</strong>
            <ul>
              {save.errors?.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <button type="button" className="button" onClick={() => setSave({ kind: 'idle' })}>
              dismiss
            </button>
          </div>
        ) : null}

        {layoutError ? (
          <div className="banner banner--error" data-testid="layout-errors">
            layout failed: {layoutError}
          </div>
        ) : null}

        <Canvas
          rf={rf}
          draggable={isArchitecture}
          fitSeq={fitSeq}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
        />
      </div>
    </ReactFlowProvider>
  );
}
