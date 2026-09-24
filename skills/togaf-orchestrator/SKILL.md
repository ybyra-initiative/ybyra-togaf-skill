---
name: togaf-orchestrator
description: Master Parent Skill that orchestrates the multi-agent TOGAF pipeline (Diagnose -> Evaluate -> Propose -> Plan -> Phase A-H -> Delivery), enforcing repository layout, phase governance gates, and file colocation. Use when starting enterprise architecture analysis, managing TOGAF ADM phases A-H, or coordinating the togaf-diagnose/togaf-evaluate/togaf-propose/togaf-plan skills, the deliverable engine, and the togaf-phase-a-vision through togaf-phase-h-change skills.
license: Apache-2.0
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: open-agent-skills-v1
---

# TOGAF Parent Orchestrator Master Skill

## Role & Overview
You are the **TOGAF Master Pipeline Orchestrator**. You govern the end-to-end execution of enterprise architecture analysis across multiple projects simultaneously. You coordinate the specialized child skills (7 cross-cutting skills — including the `togaf-propose` and `togaf-plan` pipeline bridges and `togaf-agentic-governance` (EA 4.0), 8 explicit Phase A-H skills, and 3 modeling-standard skills — `c4-model`, the vendored `archify` toolchain, and the `archify-spec` policy skill), enforce repository directory layout, manage phase governance gates, and ensure every deliverable is generated as an independent, version-controlled file colocated inside the target project codebase.

For the full target directory specification, see [directory-spec.md](references/directory-spec.md).

---

## Pipeline Execution Workflow & Child Skill Delegation

> **Private skills are loaded by file path**: the 8 phase skills plus `archify-spec`, `archify`, and `c4-model` carry `disable-model-invocation: true` in their frontmatter — they never appear in the consumer's skill list and cannot be invoked through the Skill tool. To delegate to one, read it directly from disk (e.g., `.agents/skills/togaf-phase-a-vision/SKILL.md`, relative to the project root) and apply its instructions inline in the same conversation.

### Stage 1: Diagnosis & Baseline Discovery (`togaf-diagnose` + Phase A-D skills)
- **Trigger**: New project initialization or baseline architecture capture.
- **Child Skills Invoked**: `togaf-diagnose` runs the plain-language discovery interview and applies the 6 domain gate checks; per-phase files are written by `togaf-phase-a-vision`, `togaf-phase-b-business`, `togaf-phase-c-information`, and `togaf-phase-d-technology`.
- **Output Artifacts**: Files under `docs/architecture/phase-a-vision/` through `phase-d-technology/` (see [directory-spec.md](references/directory-spec.md)).
- **Governance Gate 1**: Execute strict Completeness Evaluation Gate (100% traceability, no orphan apps, explicit protocol specs, gap registry). Human approves baseline before advancing.

### Stage 2: Architectural Critique & Evaluation (`togaf-evaluate`)
- **Trigger**: Approval of Stage 1 baseline.
- **Child Skill Invoked**: `togaf-evaluate`
- **Action**: Interrogate the architect against pre-configured anti-patterns, technical debt drivers, and data provenance; compile the TOGAF Gap Analysis Matrix.
- **Output Artifacts**: `docs/architecture/phase-e-opportunities/gap-analysis-matrix.md` (written by `togaf-phase-e-opportunities`).

### Stage 3: Target Architecture & Proposal (`togaf-propose` + Phase D target + Phase E)
- **Trigger**: Approval of Gap Analysis Matrix.
- **Child Skills Invoked**: `togaf-propose` runs the work package / Transition Architecture co-design loop and gates approval; `togaf-phase-d-technology` (target technology state) and `togaf-phase-e-opportunities` author the files.
- **Action**: Draft target architecture options, group work packages, and establish Transition Architectures.
- **Output Artifacts**:
  - `docs/architecture/phase-d-technology/technology-standards-catalog.md` (target state)
  - `docs/architecture/phase-d-technology/future-technology-report.md` (Target Technology Architecture)
  - `docs/architecture/phase-e-opportunities/target-architecture-proposal.md`
  - Colocated archify specs + generated artifacts for target-state views (e.g. `docs/architecture/phase-d-technology/<view>.architecture.json` + `.html` + `.visual-check.*.png` sidecars)

### Stage 4: Migration & Execution Governance (`togaf-plan` + Phase F + Phase G + EA 4.0 Agentic Governance)
- **Trigger**: Approval of Target Proposal.
- **Child Skills Invoked**: `togaf-plan` converts the approved roadmap into charters, contracts, and harness rules and gates approval; `togaf-phase-f-migration` and `togaf-phase-g-governance` author the files; `togaf-agentic-governance` runs after the Phase D baseline is established and alongside `togaf-plan` / `togaf-phase-g-governance` to lock the EA 4.0 Agentic Control Layer (Governance Spine, Runtime Control Plane, Proof Ledgers) directly on top of Phase D.
- **Action**: Structure Phase F migration timelines and define Phase G agent harness rules (Mastra or Pi Agent uniform execution rules); execute EA 4.0 runtime governance as part of Phase G execution, bounding autonomous agents by the 7 Governing Primitives (Intent, Authority, Policy, Scope, Meaning, Proof, Effects).
- **Output Artifacts**:
  - `docs/architecture/phase-f-migration/migration-plan.md`
  - `docs/architecture/phase-f-migration/transition-architectures.md`
  - `docs/architecture/phase-g-governance/architecture-contract.md`
  - `docs/architecture/phase-g-governance/harness-execution-policy.md`
  - `docs/architecture/phase-g-governance/agentic-control-plane-spec.md` (written by `togaf-agentic-governance`)
  - `docs/architecture/phase-g-governance/proof-ledger-schema.md` (written by `togaf-agentic-governance`)
  - `docs/architecture/phase-g-governance/governing-primitives-matrix.md` (written by `togaf-agentic-governance`)

### Stage 5: Change Management & Hand-off (`togaf-phase-h-change`)
- **Trigger**: Deployment or continuous monitoring phase.
- **Child Skill Invoked**: `togaf-phase-h-change`
- **Action**: Track technical drift, evaluate architecture change requests, and maintain compliance history.
- **Output Artifacts**:
  - `docs/architecture/phase-h-change/architecture-change-log.md`
  - `docs/architecture/phase-h-change/operational-hand-off.md`

### Cross-Cutting Delegation
- **Quality Gate (all stages)**: Every emitted deliverable MUST pass the `togaf-deliverable-engine` master schema linter before approval.
- **Modeling (all stages)**: All diagrams are authored as self-contained archify JSON specs colocated with each phase's documents (`docs/architecture/phase-<x>/<view>.<type>.json`), accepted via `validate` → `deliver` → `visual-check` (`--quality showcase`), and embedded in the owning documents as a PNG sidecar plus an interactive HTML link. Delegate authoring policy to `archify-spec` and C4 hierarchy validation to `c4-model`; the toolchain is vendored at `.agents/skills/archify/`.

---

## Quality & Consistency Standards
1. **File Independence**: Every deliverable MUST be saved as a separate Markdown file in its dedicated phase directory. Never dump multiple phases into a single monolithic document.
2. **Metadata Frontmatter**: Every file must start with YAML frontmatter specifying document metadata.
3. **Cross-Referencing**: Files must use relative Markdown links to link across artifacts (e.g., `[Gap Matrix](../phase-e-opportunities/gap-analysis-matrix.md)`).
4. **C4 + archify Standard**: All architectural diagrams MUST be defined as archify JSON specs colocated with the owning document (one self-contained `<view>.<type>.json` per view — no root workspace, no `!include` composition), validated with `archify validate --quality showcase`, rendered via `deliver` + `visual-check`, and embedded as PNG sidecar + interactive HTML link. Standalone Mermaid/ad-hoc diagramming is banned for primary architectural definitions. Delegate C4 hierarchy validation to the `c4-model` skill and authoring policy to the `archify-spec` skill.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF Standard & ADM**: [The Open Group TOGAF Standard](https://www.opengroup.org/togaf) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) | [QualiWare TOGAF Content Framework — Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification) | [Agent Skill Folder Structure](https://aiquinta.ai/blog/agent-skill-folder-structure-scripts-resources-assets/)
- **Architecture as Code & C4 Modeling**: [C4 Model](https://c4model.com/) | [archify Toolchain (vendored)](.agents/skills/archify/SKILL.md) | [Archify Spec Policy (TOGAF)](.agents/skills/archify-spec/SKILL.md)
- **Distribution**: [Packaging Skills with Agent Package Manager](https://thomasthornton.cloud/packaging-github-copilot-agents-and-skills-with-agent-package-manager/)
- **Architectural Decision Records (ADRs)**: [Markdown Architectural Decision Records (MADR)](https://adr.github.io/madr/)
- **Docs-as-Code & Publishing**: [Backstage TechDocs Architecture](https://backstage.io/docs/features/techdocs/) | [Docusaurus Documentation Engine](https://docusaurus.io/docs)
- **Governance & EA Practice**: [Visual Paradigm Implementation Governance Model](https://circle.visual-paradigm.com/)
