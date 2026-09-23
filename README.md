# TOGAF Agent Skills

[Open Agent Skills Spec](https://agentskills.io/specification)-compliant package of **16 specialized Agent Skills** managing enterprise architecture analysis across **TOGAF ADM Phases A through H**, using the **C4 model + Structurizr DSL** as the exclusive architecture modeling standard. All deliverables follow a **Docs-as-Code** philosophy — plain-text Markdown and a single `workspace.dsl` model colocated inside your project's Git repository.

## Included Skills

### Cross-Cutting Pipeline Skills

| Skill | Purpose |
|---|---|
| `togaf-orchestrator` | Master Pipeline Orchestrator: execution lifecycle, directory boundaries, phase governance gates |
| `togaf-diagnose` | Plain-language stakeholder discovery across Phases A–D, enforcing 6 completeness gate checks before delegating baseline files to phase skills |
| `togaf-evaluate` | Adversarial critique agent: grilling protocol, data provenance audits, Gap Analysis Matrix findings |
| `togaf-propose` | Pipeline stage after `togaf-evaluate`: groups gaps into Work Packages, formulates Transition Architectures, runs the co-design loop; delegates proposal files to phase D/E skills |
| `togaf-plan` | Pipeline stage after `togaf-propose`: cost/risk assessment, Architecture Contracts, harness uniformization; delegates plan files to phase F/G skills |
| `togaf-deliverable-engine` | Writing quality enforcement against the TOGAF Content Metamodel (Catalogs, Matrices, Diagrams) — linter Rules 1–4 + template composers |

### Explicit TOGAF ADM Phase Skills (A–H)

| Skill | ADM Phase | Target Output Files (`docs/architecture/phase-*/`) |
|---|---|---|
| `togaf-phase-a-vision` | Phase A — Architecture Vision | `architecture-vision.md`, `stakeholder-actor-map.md`, `principles-catalog.md` |
| `togaf-phase-b-business` | Phase B — Business Architecture | `driver-goal-objective-catalog.md`, `business-capability-catalog.md`, `organization-actor-catalog.md` |
| `togaf-phase-c-information` | Phase C — Information Systems Architecture | `application-portfolio-catalog.md`, `data-entity-catalog.md`, `application-data-crud-matrix.md`, `interface-catalog.md`, `application-interaction-matrix.md` |
| `togaf-phase-d-technology` | Phase D — Technology Architecture | `technology-standards-catalog.md`, `technology-portfolio-catalog.md`, `application-technology-matrix.md` |
| `togaf-phase-e-opportunities` | Phase E — Opportunities and Solutions | `gap-analysis-matrix.md`, `target-architecture-proposal.md` |
| `togaf-phase-f-migration` | Phase F — Migration Planning | `migration-plan.md`, `transition-architectures.md` |
| `togaf-phase-g-governance` | Phase G — Implementation Governance | `architecture-contract.md`, `harness-execution-policy.md` |
| `togaf-phase-h-change` | Phase H — Architecture Change Management | `architecture-change-log.md`, `operational-hand-off.md` |

### Modeling Standard Skills

| Skill | Purpose |
|---|---|
| `c4-model` | C4 abstraction framework enforcement (System Context, Container, Component, Code), hierarchy rules, tech/protocol annotations |
| `structurizr-dsl` | Generation & validation of `workspace.dsl` — the single source of truth for all architectural views |

## Skill Surfacing: Surfaced vs. Private Skills

When you import this pack, **only 6 of the 16 skills appear in your agent's skill list**:

**Surfaced (model-invocable):** `togaf-orchestrator`, `togaf-diagnose`, `togaf-evaluate`, `togaf-propose`, `togaf-plan`, `togaf-deliverable-engine`

**Private (10):** the 8 `togaf-phase-*` skills plus `c4-model` and `structurizr-dsl`. Each carries this frontmatter flag:

```yaml
disable-model-invocation: true
```

This is a [Claude Code](https://code.claude.com/docs/en/skills) extension to the [Open Agent Skills Specification](https://agentskills.io/specification) (other spec-compliant clients simply ignore the unknown field). It removes the skill from the model's invocable list so your skill menu stays small — the pipeline skills load the private ones **explicitly, by reading their `SKILL.md` file path** (e.g., `.agents/skills/togaf-phase-a-vision/SKILL.md`), and the human user can still invoke them manually with `/togaf-phase-a-vision` if desired.

To harden this on the consumer side (e.g., in `.claude/settings.json`), you can additionally turn skills off entirely:

```json
{ "skillOverrides": { "togaf-phase-*": "off", "c4-model": "off", "structurizr-dsl": "off" } }
```

## Modeling Standard: C4 + Structurizr DSL (Mermaid Banned)

All architectural diagrams in this package are defined as **code** using the [C4 model](https://c4model.com) abstractions expressed in [Structurizr DSL](https://docs.structurizr.com/dsl). A single `docs/architecture/diagrams/workspace.dsl` file is the **single source of truth** — a semantic model from which every view (System Context, Container, Component, Deployment) is generated, keeping naming, relationships, and abstraction levels consistent.

**Why standalone Mermaid is banned**: Standalone Mermaid/PlantUML/ad-hoc boxes-and-lines syntax (`.mmd` files) treats diagrams as disconnected graphics. They hold no semantic model, so element names drift between diagrams, relationship rules are unenforced, and C4 abstraction levels get mixed. A "models as code" paradigm fixes this: the DSL workspace *is* the architecture, and any diagram is just a view of it ([Why Models as Code?](https://docs.structurizr.com/as-code)). Mermaid/PlantUML output is permitted only as an **auto-generated export** from the Structurizr workspace via the Structurizr CLI — never hand-authored.

## Installation

### One-Line Install (npx)

```bash
npx github:ybyra-initiative/ybyra-togaf-skill
```

This copies all 16 skills into `./.agents/skills/` in your project.

### Git Submodule Workflow (Recommended for Private Repos)

```bash
git submodule add git@github.com:ybyra-initiative/ybyra-togaf-skill.git .agents/skills
git submodule update --init --recursive
```

With a submodule, updates come from `git pull` inside `.agents/skills` — no npx round-trip needed.

### Update Existing Skills

```bash
npx github:ybyra-initiative/ybyra-togaf-skill --update
npx github:ybyra-initiative/ybyra-togaf-skill --update --force   # overwrite local collisions
```

## CLI Reference

| Command / Flag | Description |
|---|---|
| *(default)*, `--update` | Install / sync skills from the repo into `./.agents/skills/` (validated against the canonical 16-skill pack) |
| `--sync-back`, `-s` | Copy modified skills from `./.agents/skills/` back into the repo clone, show diff summary, and print PR staging instructions |
| `--force`, `-f` | Bypass collision checks and overwrite |
| `--dry-run` | Validate paths and skill pack structure without writing files |
| `--help`, `-h` | Show help |

## How to Contribute Back

Both the skill instructions and this tooling bake in a **Continuous Skill Contribution & Feedback Loop**: whenever an agent running a TOGAF skill discovers an edge case, a missing domain rule, or refines a prompt/template, it must log the improvement in `docs/architecture/skill-feedback.md` and prompt you to contribute it back upstream.

**Option A — Edit inside the Git submodule:**

```bash
cd .agents/skills
git checkout -b feat/skill-refinement
git commit -am "refine: skill improvements from field usage"
git push origin feat/skill-refinement
```

**Option B — Sync back with the CLI:**

```bash
npx github:ybyra-initiative/ybyra-togaf-skill --sync-back
```

This copies your local `.agents/skills` edits into the upstream repo clone, prints a `git diff` summary, and gives you the exact `git add` / `git commit` / `git push` steps to open a Pull Request.

## Target Project Directory Layout

```text
docs/architecture/
├── phase-a-vision/
│   ├── architecture-vision.md
│   ├── stakeholder-actor-map.md
│   └── principles-catalog.md
├── phase-b-business/
│   ├── driver-goal-objective-catalog.md
│   ├── business-capability-catalog.md
│   └── organization-actor-catalog.md
├── phase-c-information/
│   ├── application-portfolio-catalog.md
│   ├── data-entity-catalog.md
│   ├── application-data-crud-matrix.md
│   ├── interface-catalog.md
│   └── application-interaction-matrix.md
├── phase-d-technology/
│   ├── technology-standards-catalog.md
│   ├── technology-portfolio-catalog.md
│   └── application-technology-matrix.md
├── phase-e-opportunities/
│   ├── gap-analysis-matrix.md
│   └── target-architecture-proposal.md
├── phase-f-migration/
│   ├── migration-plan.md
│   └── transition-architectures.md
├── phase-g-governance/
│   ├── architecture-contract.md
│   └── harness-execution-policy.md
├── phase-h-change/
│   ├── architecture-change-log.md
│   └── operational-hand-off.md
├── diagrams/
│   └── workspace.dsl            # Single source of truth (C4 + Structurizr DSL)
└── skill-feedback.md            # Continuous Skill Contribution & Feedback Loop log
```

## Development

- `npm test` runs `node cli.js --dry-run` (validates the 16-skill pack structure and install paths).

## References & Industry Standards

- [Open Agent Skills Specification](https://agentskills.io/specification) · [Agent Skill Folder Structure](https://aiquinta.ai/blog/agent-skill-folder-structure-scripts-resources-assets/) · [Agent Package Manager (APM)](https://thomasthornton.cloud/packaging-github-copilot-agents-and-skills-with-agent-package-manager/)
- [The Open Group TOGAF Standard](https://www.opengroup.org/togaf) · [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) · [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/)
- [Graham Berrisford — Information & Data Architecture (CRUD/SoR)](http://grahamberrisford.com/AM%201%20Methods/6PRODUCTSandTECHNIQUES/DataAndInformation/AM%20Information-Data%20architecture.htm) · [Solutions for Business — ADM Interface Catalogs](https://sol4biz.at/software-architecture/architecture-development-method/)
- [C4 Model](https://c4model.com) · [Structurizr DSL Specification](https://docs.structurizr.com/dsl) · [Why Models as Code?](https://docs.structurizr.com/as-code)
- [Markdown Architectural Decision Records (MADR)](https://adr.github.io/madr/)
- [Backstage TechDocs](https://backstage.io/docs/features/techdocs/) · [Docusaurus](https://docusaurus.io/docs)
- [Visual Paradigm Implementation Governance Model](https://circle.visual-paradigm.com/)
