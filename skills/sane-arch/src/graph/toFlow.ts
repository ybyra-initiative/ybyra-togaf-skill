/**
 * LayoutResult → @xyflow/react nodes/edges (PLAN §4).
 *
 * Every layout entity becomes a React Flow node; edge geometry rides along in
 * `data` (the renderer draws the polyline itself, so points stay exact).
 * Stacking: bands < edges < entities — React Flow's node/edge layers share a
 * stacking context, so `zIndex` orders across them.
 */
import type { Edge, Node } from '@xyflow/react';
import type {
  ArchitectureSpec,
  DataflowSpec,
  DiagramType,
  LayoutBand,
  LayoutEdge,
  LayoutResult,
  LifecycleSpec,
  SequenceSpec,
  Spec,
  WorkflowSpec,
} from '../layout/index.ts';
import { decollideLabels } from '../layout/decollide.ts';

export const ENTITY_NODE = 'entity';
export const BAND_NODE = 'band';
export const SPEC_EDGE = 'spec';

export type EntityNodeData = {
  kind: 'entity';
  diagramType: DiagramType;
  item: Record<string, unknown>;
};

export type BandNodeData = {
  kind: 'band';
  band: LayoutBand;
};

export type SpecEdgeData = {
  kind: 'edge';
  edge: LayoutEdge;
};

export type EntityFlowNode = Node<EntityNodeData, typeof ENTITY_NODE>;
export type BandFlowNode = Node<BandNodeData, typeof BAND_NODE>;
export type FlowNode = EntityFlowNode | BandFlowNode;
export type FlowEdge = Edge<SpecEdgeData, typeof SPEC_EDGE>;

/** z-index ladder shared by nodes and edges (one stacking context). */
export const Z = {
  region: -6,
  segment: -5,
  band: -4,
  lifeline: -3,
  chrome: -2,
  activation: -1,
  edge: 1,
  entity: 2,
} as const;

function specItems(spec: Spec): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  const add = (items: readonly { id: string }[] | undefined): void => {
    for (const item of items ?? []) map.set(item.id, item as unknown as Record<string, unknown>);
  };
  switch (spec.diagram_type) {
    case 'architecture':
      add((spec as ArchitectureSpec).components);
      break;
    case 'workflow':
      add((spec as WorkflowSpec).nodes);
      break;
    case 'lifecycle':
      add((spec as LifecycleSpec).states);
      break;
    case 'dataflow':
      add((spec as DataflowSpec).nodes);
      break;
    case 'sequence':
      add((spec as SequenceSpec).participants);
      break;
  }
  return map;
}

function bandZ(band: LayoutBand): number {
  switch (band.kind) {
    case 'region':
    case 'security-group':
      return Z.region;
    case 'segment':
      return Z.segment;
    case 'lane':
    case 'stage':
      return Z.band;
    case 'lifeline':
      return Z.lifeline;
    case 'phase':
    case 'group':
      return Z.chrome;
    case 'activation':
      return Z.activation;
  }
}

export function toFlow(
  layout: LayoutResult,
  spec: Spec,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const items = specItems(spec);
  const draggable = layout.diagramType === 'architecture';

  const bands: BandFlowNode[] = layout.bands.map((band) => ({
    id: `band:${band.id}`,
    type: BAND_NODE,
    position: { x: band.x, y: band.y },
    data: { kind: 'band', band },
    style: { width: band.width, height: band.height },
    zIndex: bandZ(band),
    draggable: false,
    selectable: false,
    deletable: false,
    focusable: false,
  }));

  const entities: EntityFlowNode[] = layout.nodes.map((node) => ({
    id: node.id,
    type: ENTITY_NODE,
    position: { x: node.x, y: node.y },
    data: {
      kind: 'entity',
      diagramType: layout.diagramType,
      item: items.get(node.id) ?? { id: node.id, label: node.id },
    },
    style: { width: node.width, height: node.height },
    zIndex: Z.entity,
    draggable,
    deletable: false,
  }));

  const edges: FlowEdge[] = decollideLabels(layout.edges, layout.nodes).map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: SPEC_EDGE,
    data: { kind: 'edge', edge },
    zIndex: Z.edge,
    deletable: false,
    focusable: false,
  }));

  return { nodes: [...bands, ...entities], edges };
}
