---
name: archify-spec
description: TOGAF authoring policy for archify — the exclusive "models as code" language for architecture visualization in TOGAF deliverables. Generates, validates, and delivers typed archify JSON specs colocated with each document, enforcing the Mermaid ban, the phase-to-diagram-type router, the colocated artifact layout, and the validate → deliver → visual-check acceptance contract.
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

Archify enforces a **"Models as Code"** approach — each view is a small, typed, self-contained JSON spec validated against a JSON Schema, rendered deterministically (no layout engine decisions at authoring time) into a self-contained interactive HTML artifact, with screenshot sidecars as machine-generated evidence. This makes the model version-control friendly, diffable, and machine-validatable — essential properties when AI agents co-author architecture — while keeping each document's diagrams owned by and rendered inside that document.

**The vendored toolchain is the authority.** It ships inside this pack at `.agents/skills/archify/` (schemas, examples, CLI, renderer, checkers). Before authoring, read `.agents/skills/archify/SKILL.md`, the matching schema in `.agents/skills/archify/schemas/`, and one matching example in `.agents/skills/archify/examples/`. This skill carries only the TOGAF policy layer on top: which diagram type to use, where artifacts live, who owns them, and what acceptance means.

---

## Explicit Ban on Standalone Diagramming Languages (Mermaid Policy)

> [!CAUTION] **STRICT POLICY: MERMAID IS BANNED FOR PRIMARY ARCHITECTURAL DEFINITIONS**
> Raw diagramming tools (like Mermaid `.mmd` files, PlantUML drawing scripts, or ad-hoc boxes-and-lines text) do **NOT** maintain a semantic architecture model. They treat diagrams as disconnected graphics, leading to naming drift, missing relationship rules, and broken abstraction hierarchies.
>
> 1. **Primary Source of Truth**: ALL architecture visualization definitions MUST be authored as **archify JSON specs** colocated with the owning document (`docs/architecture/phase-<x>/<view>.<type>.json`). Hand-authored `.mmd` files are **banned**.
> 2. **Render-Only Path**: The `.html` artifact and every `.visual-check.*.png` sidecar MUST be **auto-generated from the spec** via the archify CLI (`deliver` + `visual-check`), never authored or edited by hand — then embedded in the owning Markdown document as a PNG embed plus a relative HTML link (see *Markdown Embed Contract*).

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
├── system-context.architecture.html                       # delivered interactive artifact
├── system-context.architecture.visual-check.1440x900.light.png   # embed sidecar
├── system-context.architecture.visual-check.*.png         # remaining evidence sidecars
├── system-context.architecture.visual-check.json          # evidence receipt
└── system-context.architecture.visual-check.html          # contact sheet
```

1. **Each spec is self-contained.** There is no root workspace and no `!include` composition — one view, one JSON file, one HTML artifact. Cross-view consistency comes from stable identifiers, not file inclusion.
2. **Same element, same identity.** When one real-world element appears in multiple specs, its `id`, `label`, and `type` MUST be identical in every spec. The `.base.` spec of a delta pair is canonical; the `.head.` spec reuses its IDs.
3. **Fragment ownership survives the migration.** A phase skill may edit only its own phase directory's specs and artifacts — never another phase's files. Cross-phase elements (people, core systems) are repeated with locked IDs, never redefined with different IDs.
4. **Artifacts are generated, never edited.** The delivered `.html` and all `.visual-check.*` sidecars are CLI output. A passing final validation freezes the candidate — regenerate artifacts only by re-running the CLI; never hand-edit them.
5. **Code traceability when claims are made.** If the spec asserts repository evidence (`sources[]` paths or `meta.repository`), author and validate from the project root so paths resolve against the real repository.

---

## Acceptance Contract (validate → deliver → visual-check)

Run from the project root. `showcase` is the only acceptance profile for this pack (`meta.quality_profile: "showcase"`, ≤ 12 primary nodes).

```bash
# 1) Validate after every candidate edit — 9 artifact checks, 0 errors, 0 warnings
node .agents/skills/archify/bin/archify.mjs validate <type> docs/architecture/phase-<x>/<view>.<type>.json --quality showcase --json

# 2) Deliver — final acceptance; atomic write, SHA-256 receipt
node .agents/skills/archify/bin/archify.mjs deliver <type> docs/architecture/phase-<x>/<view>.<type>.json docs/architecture/phase-<x>/<view>.<type>.html --quality showcase --json

# 3) Visual evidence — ONLY after deliver exits 0; writes 4 PNG sidecars + receipt
node .agents/skills/archify/bin/archify.mjs visual-check docs/architecture/phase-<x>/<view>.<type>.html --json
```

For a delta pair, compare instead of single-type deliver:

```bash
node .agents/skills/archify/bin/archify.mjs compare architecture <view>.base.architecture.json <view>.head.architecture.json docs/architecture/phase-<x>/<view>.delta.html --quality showcase --json
```

Rules:
- **A non-zero exit can never be described as success.** A showcase pass must report all 9 artifact checks with 0 composition errors and 0 warnings; a 4-check receipt is basic validation, never acceptance.
- Never run `visual-check` after a failed `deliver` — that path still holds the previous trusted artifact, and the check would measure stale output.
- `visual-check` exit 2 means Chrome/Chromium was unavailable (`browser_evidence: skipped`). Report it truthfully and re-run in a browser-capable context; if no PNG sidecar exists, do not embed a broken image link.
- `visual_check: passed` requires actually inspecting the rendered artifact — never claim it from a green validation receipt alone.

---

## Markdown Embed Contract

Embed the PNG sidecar and link the interactive artifact — both render natively in VS Code's Markdown preview and on GitHub, no extension or plugin required:

```markdown
![System Context](./system-context.architecture.visual-check.1440x900.light.png)
[→ Open interactive diagram](./system-context.architecture.html)
[Spec](./system-context.architecture.json) · [Evidence](./system-context.architecture.visual-check.json)
```

- The PNG (`1440x900`, light theme) is the canonical static embed; the HTML is the canonical interactive surface (dark/light themes, guided views, search).
- All paths are relative and colocated with the owning `.md`. After any spec edit, re-run `deliver` + `visual-check` so the embedded PNG and HTML always match the current spec — embedded images are generated output, never hand-edited.

---

## C4 Mapping

Delegate abstraction-level validation to the `c4-model` skill. Quick mapping: C4 Level 1 (people, external systems, system boundaries) → `architecture` components + `region` boundaries; Level 2 (containers) → component `type` (`frontend|backend|database|cloud|security|messagebus|external`) with technology in `sublabel`; Level 3 (components) and deployment topology → `cards` or a dedicated focused view. Every `connection` carries a labeled purpose (and protocol where applicable) — relationships are first-class, never implicit.

---

## Validation & Quality Checklist

Before finalizing any spec:
- [ ] **Showcase pass**: `validate` reports all 9 artifact checks, 0 errors, 0 warnings (`--quality showcase`).
- [ ] **Exact profile field**: `meta.quality_profile` spelled exactly `"showcase"`; ≤ 12 primary nodes.
- [ ] **Explicit types**: every component declares a valid `type`; technology/sublabel concrete — no vague placeholders.
- [ ] **Labeled relationships**: every connection includes a purpose label; protocols named for interfaces.
- [ ] **Consistent identity**: shared elements keep identical `id`/`label`/`type` across specs; delta `.head.` reuses `.base.` IDs.
- [ ] **Evidence current**: `deliver` and `visual-check` re-run (exit 0) after the last spec edit; embedded PNG/HTML/receipt match the current spec SHA-256.
- [ ] **Ownership respected**: only this phase's directory was touched; no other phase's specs or artifacts edited.
- [ ] **No Hand-Authored Mermaid**: no `.mmd` files or inline Mermaid code blocks serve as primary architecture definitions — render-only from the JSON spec.
- [ ] **No hand-edited artifacts**: `.html` and `.visual-check.*` files are byte-for-byte CLI output.

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
