---
name: archify-spec
description: TOGAF authoring policy for archify — the exclusive "models as code" language for architecture visualization in TOGAF deliverables. Authors typed archify JSON specs colocated with each document, enforcing the Mermaid ban, the phase-to-diagram-type router, the colocated artifact layout, and the sane-arch acceptance contract (validate → export → embed, reviewed via sane-arch open).
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "3.0.0"
  standard: "open-agent-skills-v1"
  modeling_standard: "archify"
---

# Archify Spec Skill (TOGAF Models-as-Code Policy)

## Role & Purpose

You are the **Archify Spec Skill**. Your purpose is to author and accept architecture visualization for TOGAF deliverables as **typed archify JSON specifications** — the exclusive "models as code" language of this pack.

Archify enforces a **"Models as Code"** approach — each view is a small, typed, self-contained JSON spec validated against a JSON Schema, rendered deterministically (layout is the renderer's job, never authored geometry) into an exported PNG embed with the spec as machine-readable source. This makes the model version-control friendly, diffable, and machine-validatable — essential properties when AI agents co-author architecture — while keeping each document's diagrams owned by and rendered inside that document.

**The vendored toolchain is the authority.** It ships inside this pack at `.agents/skills/archify/` (schemas, examples, CLI, renderer, checkers), and acceptance/rendering run through the `sane-arch` CLI at `.agents/skills/sane-arch/cli.js`. Before authoring, read `.agents/skills/archify/SKILL.md`, the matching schema in `.agents/skills/archify/schemas/`, and one matching example in `.agents/skills/archify/examples/`. This skill carries only the TOGAF policy layer on top: which diagram type to use, where artifacts live, who owns them, and what acceptance means.

---

## Explicit Ban on Standalone Diagramming Languages (Mermaid Policy)

> [!CAUTION] **STRICT POLICY: MERMAID IS BANNED FOR PRIMARY ARCHITECTURAL DEFINITIONS**
> Raw diagramming tools (like Mermaid `.mmd` files, PlantUML drawing scripts, or ad-hoc boxes-and-lines text) do **NOT** maintain a semantic architecture model. They treat diagrams as disconnected graphics, leading to naming drift, missing relationship rules, and broken abstraction hierarchies.
>
> 1. **Primary Source of Truth**: ALL architecture visualization definitions MUST be authored as **archify JSON specs** colocated with the owning document (`docs/architecture/phase-<x>/<view>.<type>.json`). Hand-authored `.mmd` files are **banned**.
> 2. **Render-Only Path**: The embedded PNG MUST be **auto-generated from the spec** via `node .agents/skills/sane-arch/cli.js export <spec> --out <view>.<type>.png`, never authored or edited by hand — then embedded in the owning Markdown document as PNG + spec link + refresh command (see *Markdown Embed Contract*).

---

## Diagram-Type Router

Choose the spec type from the deliverable being produced:

| Deliverable | archify type | Notes |
|---|---|---|
| Phase A Vision / Phase B Business context, System Context views | `architecture` | people, external systems, boundaries |
| Diagnose baseline diagram | `architecture` | baseline System Context |
| Phase C Information — entity/data views, CRUD & lifecycle of data | `dataflow` | data stores, movements, ownership |
| Phase D Technology — baseline vs target platform views | `architecture` **delta pair** | `<view>.base.architecture.json` + `<view>.head.architecture.json`, compared with `archify compare` |
| Phase H — change impact (baseline vs changed state) | `architecture` **delta pair** | same `.base.` / `.head.` naming |
| Phase E sequencing / transition plans, Plan roadmap & sequencing diagrams | `workflow` | stages, gates, hand-offs |
| Phase F Migration waves, release/migration lifecycles | `lifecycle` | ordered states and transitions |
| Interface contracts (any phase, interface catalog views) | `sequence` | actors, messages, protocols |
| Propose target-state structural views | `architecture` | target-state containers/platforms |

Guided views (up to 5, `focus` id-lists) replace the old workspace/`!include` machinery for showing multiple focuses of the same model — use them before authoring a second spec of the same type.

---

## Colocated Layout & Ownership

Each document's diagrams live **next to it** — never in a separate uniform place. A phase directory looks like:

```text
docs/architecture/phase-a-vision/
├── architecture-vision.md                                 # owning document
├── system-context.architecture.json                       # SPEC (source of truth)
└── system-context.architecture.png                        # embed (CLI export output)
```

1. **Each spec is self-contained.** There is no root workspace and no `!include` composition — one view, one JSON file, one PNG embed. Cross-view consistency comes from stable identifiers, not file inclusion.
2. **Same element, same identity.** When one real-world element appears in multiple specs, its `id`, `label`, and `type` MUST be identical in every spec. The `.base.` spec of a delta pair is canonical; the `.head.` spec reuses its IDs.
3. **Fragment ownership survives the migration.** A phase skill may edit only its own phase directory's specs and artifacts — never another phase's files. Cross-phase elements (people, core systems) are repeated with locked IDs, never redefined with different IDs.
4. **Artifacts are generated, never edited.** The embedded `.png` is CLI export output. After any spec edit, re-run `validate` and `export`; never hand-edit generated artifacts.
5. **Code traceability when claims are made.** If the spec asserts repository evidence (`sources[]` paths or `meta.repository`), author and validate from the project root so paths resolve against the real repository.

---

## Acceptance Contract (validate → export → embed)

Run from the project root. Acceptance is **content validation only** (ajv against the archify schemas) — never a geometric repair loop. The renderer's deterministic layout (ELK/grid + label de-collision) owns geometry, so there is no `validate → deliver → visual-check` showcase acceptance loop to spend tokens repairing label overlaps.

```bash
# 1) Acceptance — ajv content validation after every edit; exit 1 on failure
node .agents/skills/sane-arch/cli.js validate docs/architecture/phase-<x>/<view>.<type>.json

# 2) Export the embed PNG — headless render with settle checks, tight clip
node .agents/skills/sane-arch/cli.js export docs/architecture/phase-<x>/<view>.<type>.json --out docs/architecture/phase-<x>/<view>.<type>.png

# 3) User review — the human runs this to inspect the rendering interactively
node .agents/skills/sane-arch/cli.js open docs/architecture/phase-<x>/<view>.<type>.json
```

For a delta pair, validate and export each side (`.base.` and `.head.`) — the diff view is composed from the two exported PNGs or reviewed side by side.

Rules:
- **A non-zero exit can never be described as success.** `validate` must report 0 errors before export and embed.
- `export` requires Playwright chromium (`npx playwright install chromium` in `.agents/skills/sane-arch/`); if it cannot render, report it truthfully — never embed a stale or broken image link.
- After any spec edit, re-run `validate` → `export` so the embedded PNG always matches the current spec.
- Authoring rules that the validator cannot catch (content collisions): **lanes beat groups** — do not add `groups` when lanes carry the same semantics; **keep `tag` ≤ ~18 chars** or fold it into the `sublabel` and widen the node (`width`).

---

## Markdown Embed Contract

The standard embed block is **PNG + source-spec link + refresh command** — it renders natively in VS Code's Markdown preview and on GitHub, no extension or plugin required, and tells any reader exactly how to regenerate it:

```markdown
![System Context](./system-context.architecture.png)
Source spec: [system-context.architecture.json](./system-context.architecture.json)
Refresh: `node .agents/skills/sane-arch/cli.js export docs/architecture/phase-a-vision/system-context.architecture.json --out docs/architecture/phase-a-vision/system-context.architecture.png`
```

- The PNG is the canonical static embed (default `export` output: `<spec>.png` next to the spec, `--scale 2`); interactive review is via `node .agents/skills/sane-arch/cli.js open <spec>`.
- All paths are relative and colocated with the owning `.md`. After any spec edit, re-run `validate` → `export` so the embedded PNG always matches the current spec — embedded images are generated output, never hand-edited.
- This block is the standard **§3 (Architecture Diagrams) pattern in every phase deliverable template** — same three lines: image, spec link, refresh command.

---

## C4 Mapping

Delegate abstraction-level validation to the `c4-model` skill. Quick mapping: C4 Level 1 (people, external systems, system boundaries) → `architecture` components + `region` boundaries; Level 2 (containers) → component `type` (`frontend|backend|database|cloud|security|messagebus|external`) with technology in `sublabel`; Level 3 (components) and deployment topology → `cards` or a dedicated focused view. Every `connection` carries a labeled purpose (and protocol where applicable) — relationships are first-class, never implicit.

---

## Validation & Quality Checklist

Before finalizing any spec:
- [ ] **Content pass**: `node .agents/skills/sane-arch/cli.js validate <spec>` reports 0 errors.
- [ ] **Content authoring rules**: no redundant `groups` where lanes carry the semantics; every `tag` ≤ ~18 chars (longer → fold into `sublabel`, widen `width`).
- [ ] **Exact profile field**: `meta.quality_profile` spelled exactly `"showcase"`; ≤ 12 primary nodes.
- [ ] **Explicit types**: every component declares a valid `type`; technology/sublabel concrete — no vague placeholders.
- [ ] **Labeled relationships**: every connection includes a purpose label; protocols named for interfaces.
- [ ] **Consistent identity**: shared elements keep identical `id`/`label`/`type` across specs; delta `.head.` reuses `.base.` IDs.
- [ ] **Evidence current**: `export` re-run after the last spec edit; the embedded PNG matches the current spec.
- [ ] **Visual review done**: the rendered PNG (or `sane-arch open`) was actually inspected — never claim a visual pass from a green `validate` alone.
- [ ] **Ownership respected**: only this phase's directory was touched; no other phase's specs or artifacts edited.
- [ ] **No Hand-Authored Mermaid**: no `.mmd` files or inline Mermaid code blocks serve as primary architecture definitions — render-only from the JSON spec.
- [ ] **No hand-edited artifacts**: the embedded `.png` is byte-for-byte CLI export output.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## Official Documentation References
- **Vendored archify skill**: `.agents/skills/archify/SKILL.md` (fast authoring path)
- **Schemas**: `.agents/skills/archify/schemas/` (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle` + `common.schema.json`)
- **Examples**: `.agents/skills/archify/examples/` (including `checkout-platform.base/head.architecture.json` delta pair)
- **Delivery contract**: `.agents/skills/archify/references/delivery-contract.md`
- **Delta tooling**: `.agents/skills/archify/delta/architecture-delta.mjs`
- **C4 Model**: [https://c4model.com/](https://c4model.com/)
- **Open Agent Skills Specification**: [https://agentskills.io/specification](https://agentskills.io/specification)
