# sane-arch — Plan

**Status:** approved (20 grilling decisions, confirmed 2026-09-24)
**Location:** `skills/sane-arch/` (nested package inside `togaf-agent-skills`; root has no workspaces, so nesting is safe)

---

## 1. Why

Archify renders content correctly but optimizes the wrong thing first: it runs a validate → collision-repair → recommend loop (LLM-driven repair capped at 2 non-improving rounds) before the author ever gets to review the *content*. sane-arch inverts this:

- **The LLM authors JSON only** — against the existing archify schemas, unchanged.
- **sane-arch renders whatever it gets** — layout is deterministic (ELK / grid arithmetic), so a collision-free result is *guaranteed by the solver*, never repaired by an AI loop.
- There is no repair loop to wait for. Content validation happens on the JSON itself (ajv + human reading), before and independent of rendering.

Endgame (Q12/Q14): sane-arch eventually **replaces archify entirely**, taking over all four pipeline gates — validate, deliver (commit + SHA-256 receipt), visual-check (headless-Chrome screenshot), human review — phased across three releases (§9).

## 2. Decision record

| # | Decision |
|---|----------|
| Q1 | Lives at `skills/sane-arch/` as its own package (root `package.json` has no workspaces) |
| Q2 | Consumes archify's 5 JSON Schemas **as-is** — no schema changes, no extensions |
| Q3 | LLM authors JSON; sane-arch renders — content-first, zero collision-repair loops |
| Q4 | All five diagram types in v1: architecture, workflow, lifecycle, dataflow, sequence |
| Q5 | Full pack member: added to `cli.js` `EXPECTED_SKILLS`, ships `SKILL.md`, root `npm test` stays green |
| Q6 | Hybrid layout per schema (§5) |
| Q7 | Auto-layout whenever geometry is missing + an explicit re-run button |
| Q8 | TypeScript (UI/app code; `cli.js` entry stays plain ESM — §7) |
| Q9 | `@xyflow/react` + `@statelyai/graph` + `elkjs` (the documented Stately recipe) |
| Q10 | Local server endpoint: Vite middleware, Ctrl+S writes the spec in place |
| Q11 | ~~Read-only viewer~~ — **superseded by Q13** |
| Q12 | Endgame: replace archify |
| Q13 | Drag + persist **is** in v1; the server gains a write endpoint |
| Q14 | Full pipeline takeover — all four gates eventually |
| Q15 | `node skills/sane-arch/cli.js open <spec.json>` boots Vite and prints the URL; `npm run dev` for development |
| Q16→Q20 | Test bar: golden fixtures + Playwright (§8) |
| Q17 | **Architecture-only drags**; workflow/lifecycle/dataflow/sequence are view-only |
| Q18 | Three-phase takeover (§9) |
| Q19 | `disable-model-invocation: true` on sane-arch's `SKILL.md`, matching archify |
| Q20 | Playwright: behavioral DOM assertions **and** opt-in pixel diffs pinned to one platform |

### Reconciliations baked in (approved)

1. **Q19 vs the content-first loop:** the *skill* is user-invoked, but `cli.js validate <spec>` is a plain command any agent can run. Flow: agent authors → runs `validate` → shows the JSON + ajv output for content review → user runs `open` to see the rendering. The author→validate→show-content loop never requires invoking the skill.
2. **Drag ≠ save:** drags mutate local state only; Ctrl+S / the Save button persists. The ajv gate runs before every write; an invalid spec is rejected with the error list (HTTP 422 in dev, exit code 1 in CLI).
3. **v2 export detail deferred:** static export targets a single self-contained HTML file at archify parity; exact template spec belongs to v2 planning.

## 3. Facts this plan is built on

**Schema required-fields (the load-bearing fact for Q6):**

| Type | Positional required fields | Continuous layout needed? |
|---|---|---|
| architecture | none — components require only `id/type/label`; `pos`/`size` optional | **yes → ELK** |
| workflow | nodes: `lane`, `col`; lanes: `fromCol`, `toCol` | no → grid arithmetic |
| lifecycle | states: `lane`, `col` | no → grid arithmetic |
| dataflow | nodes: `stage`, `row` | no → grid arithmetic |
| sequence | messages: `y` (one variant) | no → authored y |

Only architecture has free-form geometry. For 4 of 5 types, position **is authored content** and must never be recomputed away.

**Pack contract (`cli.js`):** `discoverSkills()` exits non-zero on any dir in `skills/` that is missing from `EXPECTED_SKILLS`, any expected dir missing, or any expected dir lacking `SKILL.md`. Adding this directory therefore forces both edits (§6). Root `npm test` = `node cli.js --dry-run` must stay green.

**`@statelyai/graph` (fact-checked):** plain-JSON graph IR; `createGraph` → `getElkLayout` (elkjs optional peer) → `toXYFlow`/`fromXYFlow` lossless round-trip with React Flow v12 (extras ride under the reserved `__statelyai` key in `data`); compound coords are parent-relative (ELK is the only engine emitting them — maps 1:1 to React Flow); ports map to handles (`fromSide`/`toSide`); edge labels are measured rects; two-pass DOM measure (`useNodesInitialized` + `node.measured`, `DEFAULT_NODE_SIZE` 100×50); `genLayoutTransition` tweens; `getPatches` diff gives free undo/redo; web-worker layout available.

**Archify gates being replaced (Q14):** G1 validate (ajv) → G2 deliver (atomic commit + SHA-256 receipt) → G3 visual-check (headless Chrome screenshot) → G4 human review. Collision detection there is deterministic (`rectsOverlap`); only repair is LLM-driven — the loop sane-arch deletes.

## 4. Package layout

```
skills/sane-arch/
├── PLAN.md              ← this file
├── SKILL.md             ← 19th pack skill, disable-model-invocation: true (Q19)
├── package.json         ← private, type: module, own deps (nested pkg)
├── tsconfig.json
├── cli.js               ← plain ESM launcher: `open`, `validate` subcommands (Q15)
├── vite.config.ts       ← middleware plugin: GET/PUT /api/spec
├── src/
│   ├── main.tsx
│   ├── App.tsx          ← toolbar (type badge, re-run layout, Save) + canvas
│   ├── layout/
│   │   ├── index.ts     ← pickLayout(spec) → dispatch per diagram_type
│   │   ├── elk.ts       ← architecture: @statelyai/graph + elkjs
│   │   ├── grid.ts      ← workflow/lifecycle/dataflow: deterministic arithmetic
│   │   ├── sequence.ts  ← participants as columns, authored y scaled
│   │   └── routing.ts   ← edge routing (§5 note)
│   ├── schema/
│   │   └── validate.ts  ← ajv against skills/archify/schemas/*.json (Q2)
│   ├── graph/
│   │   ├── toGraph.ts   ← spec JSON → stately graph IR
│   │   └── toFlow.ts    ← IR → xyflow nodes/edges (toXYFlow)
│   └── save.ts          ← Ctrl+S / button → PUT; 422 on invalid
├── fixtures/            ← one example spec per type (from archify examples)
└── tests/
    ├── layout.test.ts   ← vitest golden geometry snapshots
    └── e2e/             ← Playwright: behavioral + opt-in pixel diffs
```

Deps: `react`, `react-dom`, `@xyflow/react`, `@statelyai/graph`, `elkjs`, `vite`, `ajv`, `typescript`; dev: `vitest`, `@playwright/test`.

## 5. Layout engine (Q6)

`pickLayout(spec)` dispatches on `diagram_type`:

- **architecture → ELK.** All components have `pos` → render as authored. Any component missing geometry → run full ELK layout (authored positions are overridden; the user drags to adjust and persists — Q13/Q17). Explicit re-run button forces full ELK (Q7). Via `getElkLayout`; parent-relative output feeds `toXYFlow` unchanged.
- **workflow / lifecycle → grid arithmetic.** Lane index → y band (stacked in declaration order, band height from label metrics); `col` → x slot; `lane.fromCol/toCol` bound each band's horizontal extent. Pure function of the JSON — reload always yields identical geometry.
- **dataflow → grid arithmetic.** `stage` → x band (array order); `row` → y slot.
- **sequence → authored y.** Participants → equally spaced columns; messages sorted by `y` → scaled pixel rows; the no-`y` variant stacks in declaration order with uniform spacing. Lifelines are vertical rules; arrows span participant columns.

> **Implementation note (refinement of "ELK edge routing everywhere"):** elkjs cannot route edges while holding nodes fixed — its layout modes reposition nodes. For the four deterministic types, edge paths are computed directly from the same grid math (orthogonal L-routes through lane/stage gaps), which is deterministic and collision-free by construction. ELK edge routing applies where ELK owns node placement: architecture. This preserves the intent of Q6 (solver-guaranteed edge placement, no repair loops); flag if you disagree.

**Drag mapping (Q17):** only architecture nodes are draggable. Dragging writes back `pos` (and `size` if resized) into the spec's components. The other four types have no drag handles at all.

## 6. Pack integration (Q5)

1. `cli.js` — add `"sane-arch"` to `EXPECTED_SKILLS` (after `"archify-spec"`).
2. `SKILL.md` — front-matter `name: sane-arch`, `disable-model-invocation: true` (Q19); body documents:
   - the authoring contract: architecture `pos` optional; `lane/col/stage/row/y` are **content, not layout output** — the model authors them deliberately;
   - commands: `node skills/sane-arch/cli.js validate <spec>` (agent-runnable, reconciliation 1), `... open <spec>` (user-invoked);
   - install-on-first-use: nested package needs `npm install` inside `skills/sane-arch/` (documented in SKILL.md; a full React app cannot ship dependency-free).
3. `README.md` — add sane-arch to the skill table.
4. Acceptance: `npm test` (root dry-run) green with the 19-dir pack.

## 7. Server & entrypoint (Q10, Q13, Q15)

`cli.js` is **plain ESM JavaScript** so `node skills/sane-arch/cli.js open f.json` works with no build step; Vite compiles the TS/React app on the fly.

- **`open <spec>`** — resolves the spec to an absolute path, boots Vite (`createServer` from the Vite Node API) with a middleware plugin, prints `http://localhost:<port>`.
- **`validate <spec>`** — ajv check against `skills/archify/schemas/*.json`; prints errors; exit 1 on failure. No server.
- **Session = one file.** The spec path is fixed at boot by the CLI; middleware exposes only:
  - `GET /api/spec` → the JSON
  - `PUT /api/spec` → ajv-validate, then write in place; 422 + error list if invalid.
  No arbitrary-path endpoint exists (no traversal surface).
- **Dev:** `npm run dev` inside the dir (Vite with the same middleware).

## 8. Testing (Q16, Q20)

- **`tsc --noEmit`** — typecheck gate.
- **Golden fixtures (vitest):** the five fixture specs through `pickLayout` → snapshot resulting geometry as JSON. elkjs is pinned in `package.json` precisely so ELK output stays stable across installs; grid/sequence layouts are pure functions and trivially stable.
- **Playwright:**
  - *Behavioral (always on):* per fixture — every node present; bounds within viewport; pairwise non-overlap for the architecture fixture post-layout (the old `rectsOverlap` bar, now asserted once instead of looped).
  - *Pixel diffs (opt-in):* screenshot baselines behind an env flag, pinned to one platform (this machine / a single CI image).
- **Root `npm test`** (`node cli.js --dry-run`) must stay green — Q5.

## 9. Phasing (Q18)

| Phase | Scope |
|---|---|
| **v1** | Viewer + hybrid layout + architecture drag/persist + ajv validate + Save-in-place + fixtures/Playwright + pack membership. *(This plan.)* |
| **v2** | Static export: single self-contained HTML (inline JS/CSS, pan/zoom, no server) at archify parity; screenshot visual-check — headless Chrome captures evidence PNGs colocated with the owning doc. |
| **v3** | Deliver gate (atomic commit + SHA-256 receipt) and human-review flow; repoint `archify-spec` skill's `validate → deliver → visual-check` contract at sane-arch commands; decommission archify from the pipeline. |

The Mermaid ban and Docs-as-Code conventions in `archify-spec` are untouched until v3 rewrites that contract.

## 10. Definition of done (v1)

- [ ] `skills/sane-arch/` package installs and runs: `open`, `validate` subcommands work as specified
- [ ] All five fixture types render via the hybrid engine; architecture layout collision-free by solver
- [ ] Architecture drags persist through Ctrl+S; ajv blocks invalid writes; other four types are view-only
- [ ] Golden geometry snapshots + Playwright behavioral suite pass; opt-in pixel diffs pass on the pinned platform
- [ ] `EXPECTED_SKILLS` updated, `SKILL.md` ships with `disable-model-invocation: true`, root `npm test` green
- [ ] `tsc --noEmit` clean

## 11. Risks / open items

- **Distribution weight:** the nested package needs `npm install`; acceptable for a repo-local tool, revisit if the pack is ever distributed prebuilt (option: commit a `dist/` later).
- **ELK determinism:** pinned `elkjs` version guards golden snapshots; upgrades require regenerating them deliberately.
- **Sequence no-`y` variant:** declaration-order stacking assumes authors order messages meaningfully; if not, v2 may want an optional auto-order heuristic.
- **Pixel-diff flakiness:** mitigated by opt-in + platform pinning (Q20); behavioral assertions are the real gate.
