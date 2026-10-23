/**
 * Sequence layout (PLAN §5): participants as equally spaced columns, messages
 * sorted by authored `y` and scaled to pixel rows. The no-`y` variant stacks
 * in declaration order with uniform spacing. Lifelines are vertical rules;
 * arrows span participant columns; activations and segments ride as bands.
 */
import type { LayoutBand, LayoutEdge, LayoutNode, LayoutResult, SequenceSpec } from './index.ts';
import { computeBounds } from './index.ts';

const MARGIN = 48;
const BOX_H = 64;
const MIN_COL = 180;
const MAX_COL = 360;
const MIN_MSG_GAP = 22; // tight enough to preserve authored spacing
const NO_Y_START = 160;
const NO_Y_STEP = 96;
const BOTTOM_PAD = 56;
const ACTIVATION_W = 16;
const DEFAULT_MSG_GAP = 96;

export function layoutSequence(spec: SequenceSpec): LayoutResult {
  const participants = spec.participants;

  // Equally spaced columns wide enough for the widest participant head.
  const widest = participants.reduce(
    (max, p) => Math.max(max, p.label.length * 9 + (p.sublabel?.length ?? 0) * 7 + 64),
    MIN_COL,
  );
  const spacing = Math.min(MAX_COL, Math.max(MIN_COL, widest));
  const boxW = spacing - 44;

  const cx = participants.map((_, i) => MARGIN + i * spacing + spacing / 2);
  const centerOf = new Map(participants.map((p, i) => [p.id, cx[i]]));

  const nodes: LayoutNode[] = participants.map((p, i) => ({
    id: p.id,
    x: cx[i] - boxW / 2,
    y: MARGIN,
    width: boxW,
    height: BOX_H,
  }));

  // Authored y → sorted pixel rows; the no-y variant stacks in declaration
  // order. Rows only ever move down enough to keep a legible minimum gap.
  const withY = spec.messages.map((m, i) => ({ m, i, raw: m.y ?? NO_Y_START + i * NO_Y_STEP }));
  const sorted = [...withY].sort((a, b) => a.raw - b.raw || a.i - b.i);
  const yOf = new Map<string, number>();
  let prev = -Infinity;
  for (const entry of sorted) {
    const y = Math.max(entry.raw, prev + MIN_MSG_GAP);
    yOf.set(entry.m.id ?? `${entry.m.from}->${entry.m.to}#${entry.i}`, y);
    prev = y;
  }

  const msgBottom = Math.max(0, ...yOf.values());
  const activationBottom = Math.max(0, ...(spec.activations ?? []).map((a) => a.to));
  const lifelineTop = MARGIN + BOX_H;
  const bottom = Math.max(msgBottom, activationBottom) + BOTTOM_PAD;

  const bands: LayoutBand[] = participants.map((p, i) => ({
    id: `lifeline-${p.id}`,
    kind: 'lifeline' as const,
    x: cx[i] - 1,
    y: lifelineTop,
    width: 2,
    height: Math.max(0, bottom - lifelineTop),
  }));

  // Activation bars: nested bars on the same lifeline step to the right.
  const depthByParticipant = new Map<string, { lastTo: number; depth: number }[]>();
  (spec.activations ?? []).forEach((a, i) => {
    const x0 = centerOf.get(a.participant);
    if (x0 === undefined) return;
    const placed = depthByParticipant.get(a.participant) ?? [];
    let depth = 0;
    for (const bar of placed) {
      if (bar.lastTo >= a.from - 1) depth = Math.max(depth, bar.depth + 1);
    }
    placed.push({ lastTo: a.to, depth });
    depthByParticipant.set(a.participant, placed);
    bands.push({
      id: `activation-${i}`,
      kind: 'activation',
      x: x0 - ACTIVATION_W / 2 + depth * (ACTIVATION_W + 2),
      y: a.from,
      width: ACTIVATION_W,
      height: Math.max(4, a.to - a.from),
    });
  });

  // Time segments are authored y-ranges → faint background bands.
  const contentWidth = participants.length * spacing;
  (spec.segments ?? []).forEach((seg, i) => {
    bands.push({
      id: `segment-${i}`,
      kind: 'segment',
      label: seg.label,
      x: MARGIN,
      y: Math.min(seg.from, seg.to),
      width: contentWidth,
      height: Math.max(4, Math.abs(seg.to - seg.from)),
    });
  });

  const edges: LayoutEdge[] = spec.messages.map((m, i) => {
    const id = m.id ?? `${m.from}->${m.to}#${i}`;
    const y = yOf.get(id) ?? NO_Y_START + i * DEFAULT_MSG_GAP;
    const x0 = centerOf.get(m.from) ?? MARGIN;
    const x1 = centerOf.get(m.to) ?? MARGIN;
    const points: [number, number][] =
      m.from === m.to
        ? [
            [x0, y],
            [x0 + 44, y],
            [x0 + 44, y + 26],
            [x0, y + 26],
          ]
        : [
            [x0, y],
            [x1, y],
          ];
    return {
      id,
      from: m.from,
      to: m.to,
      points,
      label: m.label,
      dashed: m.variant === 'dashed' || m.variant === 'return',
      variant: m.variant,
      width: m.variant === 'emphasis' ? 2.4 : undefined,
    };
  });

  const bounds = computeBounds(nodes, bands, edges, MARGIN);
  return {
    diagramType: 'sequence',
    mode: 'sequence',
    width: bounds.width,
    height: bounds.height,
    nodes,
    bands,
    edges,
  };
}
