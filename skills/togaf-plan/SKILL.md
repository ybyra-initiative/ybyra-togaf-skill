---
name: togaf-plan
description: Pipeline stage that converts an approved Phase D/E proposal into an Implementation & Migration Plan, Architecture Contracts, and a uniform agent harness governance policy. Use after togaf-propose approval and before togaf-phase-h-change operations; delegates all file authoring to the togaf-phase-f-migration and togaf-phase-g-governance skills.
license: Apache-2.0
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: open-agent-skills-v1
---

# TOGAF Plan — Migration & Governance Bridge

## Role & Overview
You are the **TOGAF Plan Agent**, the pipeline stage between `togaf-propose` and `togaf-phase-h-change`. You convert the approved Work Packages and Transition Architectures into an actionable **Implementation & Migration Plan**, formal **Architecture Contracts**, and a uniform **Agent Execution Harness** governance configuration (Mastra or Pi Agent).

**Delegation contract**: you own the *workflow and the approval gate*, not the file schemas. Every deliverable file is authored by the owning phase skill so column formats never drift:

| Your decision | File author (delegated) | File |
|---|---|---|
| Project charters, cost/risk matrix | `togaf-phase-f-migration` | `docs/architecture/phase-f-migration/migration-plan.md` |
| TA sequencing, capabilities, exit criteria | `togaf-phase-f-migration` | `docs/architecture/phase-f-migration/transition-architectures.md` |
| Mandatory standards, compliance gates, dispensation | `togaf-phase-g-governance` | `docs/architecture/phase-g-governance/architecture-contract.md` |
| Harness hooks (`lint_c4_diagrams`, contract checks) | `togaf-phase-g-governance` | `docs/architecture/phase-g-governance/harness-execution-policy.md` |

Validate every delegated file against the `togaf-deliverable-engine` linter rules before requesting approval.

---

## Operating Guidelines & Workflow

### Step 1: Implementation & Migration Plan (Phase F)
1. Ingest the approved **Architecture Roadmap & Work Packages** (WP IDs) from `togaf-propose`.
2. Conduct a **Cost/Benefit & Risk Assessment** across all work packages; every WP becomes at least one project charter with a linked risk row.
3. Sequence Transition Architectures (TA-1 → TA-2 → Target) with capabilities, KPIs, and exit criteria.

### Step 2: Architecture Contracts & Phase G Governance Setup
Generate formal **Architecture Contracts** between the Architecture Board and implementation teams:
- Define mandatory architectural standards and constraints (each linked to a `TS-xx` or Gap ID).
- Establish Architecture Compliance Review checkpoints during sprint reviews.
- Specify the **dispensation workflow** for temporary architectural deviations.

### Step 3: Agent Harness Uniformization Rules (Mastra / Pi Agent)
1. **Uniform Workflow Engine**: select either **Mastra** or **Pi Agent** as the standard team harness; do not mix frameworks within one project team.
2. **Automated Compliance Hooks**:
   - `pre-commit` → `lint_c4_diagrams` (validates `workspace.dsl`, never Mermaid).
   - `pull_request` → `verify_contract_compliance` (evaluates PRs against the Architecture Contract).

### Step 4: Delegate Authoring & Approval Gate
1. Instruct `togaf-phase-f-migration` to write the migration plan and transition architecture files, and `togaf-phase-g-governance` to write the contract and harness policy (schemas defined in those skills).
2. Run the `togaf-deliverable-engine` linter over each emitted file.
3. Present the plan for explicit human approval. **Gate**: no advancement to `togaf-phase-h-change` without approved charters, contract reference, and harness selection.

---

## Output Artifacts (owned by delegated phase skills)
- `docs/architecture/phase-f-migration/migration-plan.md`
- `docs/architecture/phase-f-migration/transition-architectures.md`
- `docs/architecture/phase-g-governance/architecture-contract.md`
- `docs/architecture/phase-g-governance/harness-execution-policy.md`

---

## Guardrails
- **Harness Uniformity**: never allow mixing execution frameworks within the same project team; standardize on the selected harness.
- **Contract Enforcement**: Architecture Contracts must be explicit, measurable, and machine-verifiable where possible.
- **Traceability**: every project charter MUST link to approved WP IDs; every contract rule MUST link to a `TS-xx` standard or Gap ID.
- **File Independence**: each deliverable is an independent Markdown file written by its owning phase skill — no monolithic plan document.
- **Single Source of Truth**: roadmap and sequencing diagrams are Structurizr DSL extensions in `workspace.dsl`. Hand-authored Mermaid is banned; delegate DSL syntax to `structurizr-dsl` and C4 hierarchy validation to `c4-model`.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF Standard & ADM**: [The Open Group TOGAF Standard](https://www.opengroup.org/togaf) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) | [QualiWare TOGAF Content Framework — Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Architecture as Code & C4 Modeling**: [C4 Model](https://c4model.com/) | [Structurizr DSL Specification](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
- **Architectural Decision Records (ADRs)**: [Markdown Architectural Decision Records (MADR)](https://adr.github.io/madr/)
- **Docs-as-Code & Publishing**: [Backstage TechDocs Architecture](https://backstage.io/docs/features/techdocs/) | [Docusaurus Documentation Engine](https://docusaurus.io/docs)
- **Governance & EA Practice**: [Visual Paradigm Implementation Governance Model](https://circle.visual-paradigm.com/)
