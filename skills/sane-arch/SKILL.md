---
name: sane-arch
description: Content-first viewer, validator, and PNG exporter for archify JSON diagram specs. The model authors JSON only (against the unchanged archify schemas); sane-arch renders all five diagram types with deterministic layout — ELK for architecture, grid arithmetic for workflow/lifecycle/dataflow, authored columns and y for sequence — plus a post-layout edge-label de-collision pass, so node and label geometry is solver-guaranteed rather than repaired by an AI loop; only content-level authoring collisions (redundant groups, oversized tags) remain, which the authoring rules and visual review catch. Use when validating, reviewing, exporting, or interactively adjusting an archify spec (architecture, workflow, sequence, dataflow, lifecycle), when the user wants to see a spec rendered in a browser, or to generate the PNG embedded in a deliverable.
license: MIT
disable-model-invocation: true
metadata:
  version: "1.1"
  author: tt-a1i
---

# sane-arch

Content-first diagram tooling: **the model authors JSON, sane-arch renders it.** There is no collision-repair loop to wait for — content validation happens on the JSON itself (ajv + human reading), before and independent of rendering.

Layout guarantees are scoped honestly: node geometry is collision-free by construction (ELK/grid solver), and a deterministic post-layout de-collision pass (`src/layout/decollide.ts`, wired into `toFlow`) separates edge labels from nodes and each other — authored `labelAt`/`labelOffset` still win. What the solver cannot catch is **content** authored against the rules below; those are caught by `validate` plus a visual review, never by spending tokens on geometric repair.

## Authoring contract

The specs are plain archify JSON validated against `.agents/skills/archify/schemas/*.json` **as-is — no schema changes, no extensions.** Two rules decide where position comes from:

- **Architecture `pos` is optional.** Components require only `id`, `type`, `label`. Omit `pos` (or any `pos`) and sane-arch runs a full ELK layout automatically; the explicit **Re-run layout** button forces one even when every `pos` exists. Authored positions render as-is and are draggable; a drag writes `pos` back into the local spec and persists only on save.
- **`lane` / `col` / `stage` / `row` / `y` are content, not layout output.** For workflow, lifecycle, dataflow, and sequence these fields *are* the diagram — the model authors them deliberately (lane band, column slot, stage band, row slot, message row). Layout is a pure function of them: a reload always yields identical geometry, and these four types are view-only (no drag handles).

## Authoring rules (content collisions the validator cannot catch)

Layout is deterministic, so these fail the same way every render — fix them at authoring time:

1. **Lanes beat groups.** Do not add `groups` when lanes already carry the same semantics — lanes plus a card is enough; a redundant `groups` label paints over node boxes.
2. **Keep `tag` short (≤ ~18 chars).** Long tag strings overlap node sublabels — fold the phrase into the `sublabel` and widen the node (`width`) instead.
3. **After any spec edit, re-run `validate` → `export` → visual check** (`open` or inspect the fresh PNG) before embedding the image in a document.

## Commands

Run from the project root (inside an installed pack the CLI lives at `.agents/skills/sane-arch/`):

```bash
# Agent-runnable content check: ajv against the archify schemas, no server,
# prints the error list, exits 1 on failure. This IS the acceptance gate.
node .agents/skills/sane-arch/cli.js validate <spec.json>

# Agent-runnable PNG render for document embeds: boots the viewer's Vite
# server, renders headless (Playwright chromium) with the e2e settle checks
# (entity count + fitView-in-viewport), writes a tight clipped screenshot.
# Default output: <spec>.png next to the spec, --scale 2.
node .agents/skills/sane-arch/cli.js export <spec.json> [--out <f.png>] [--scale <n>] [--port <n>]

# User-invoked viewer: boots Vite, prints http://localhost:<port>/ and the
# session's spec path. --port <n> picks the port (for scripts/tests).
node .agents/skills/sane-arch/cli.js open <spec.json> [--port <n>]
```

Typical flow: the agent authors the spec → runs `validate` → runs `export` and embeds the PNG per the embed contract → shows the JSON and the ajv output for content review → the user runs `open` to review the rendering. The author → validate → export loop never requires invoking this skill, and never involves repairing geometry.

## Install (first use)

This directory is its own nested package (the repo root has no workspaces):

```bash
cd .agents/skills/sane-arch && npm install
```

A full React app cannot ship dependency-free. `export` and the optional Playwright suite additionally require `npx playwright install chromium` inside this directory. During development, `npm run dev` inside this directory serves the same app with the same `GET|PUT /api/spec` middleware.

## Saving

Drags mutate local state only; **Ctrl/Cmd+S or the Save button persists** the spec in place. The ajv gate runs server-side before every write: an invalid spec is rejected with the error list (HTTP 422 in the viewer, exit code 1 in the CLI) and the file is left untouched. The session is exactly one file, fixed at boot by the CLI — the middleware exposes only `GET /api/spec` and `PUT /api/spec`, with no arbitrary-path endpoint.

## Layout per diagram type (deterministic)

| Type | Positioning | Edge routing |
|---|---|---|
| architecture | authored `pos`, or ELK (`@statelyai/graph` + `elkjs`) when geometry is missing / re-run forced | ELK when it owns placement; authored `via` waypoints kept as content |
| workflow / lifecycle | lane index → y band, `col` → x slot (pure grid arithmetic) | orthogonal routes through the node-free lane/column gaps |
| dataflow | `stage` → x band, `row` → y slot | orthogonal routes through the stage/row gaps |
| sequence | participants as equally-spaced columns, authored message `y` | straight lifeline arrows, authored ordering preserved |
