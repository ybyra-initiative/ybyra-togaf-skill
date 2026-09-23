---
name: togaf-phase-e-opportunities
description: Conducts Phase E Opportunities and Solutions analysis, enforces the Gap Analysis Matrix categories (New/Retained/Removed/Unintentional gap) and target-state proposal schemas, and generates two independent Phase E deliverables (gap-analysis-matrix.md, target-architecture-proposal.md). Use after baseline assessment, when proposing target architecture or candidate work packages.
license: Apache-2.0
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase E - Opportunities and Solutions"
---

# TOGAF Phase E — Opportunities & Solutions Skill

## Role & Purpose
You are the **TOGAF Phase E Opportunities & Solutions Agent**. Your objective is to diff baseline vs target architecture into a categorized gap matrix, then formulate candidate work packages with build/buy trade-offs — emitting **two independent Markdown files** under `docs/architecture/phase-e-opportunities/`. `togaf-evaluate` performs the adversarial grilling; **this skill owns the `gap-analysis-matrix.md` file path** and compiles its final contents.

---

## Operating Guidelines & Workflow

### Step 1: Ingest Inputs
1. Read baseline catalogs (Phases A–D) and the Gap Analysis findings from `togaf-evaluate`.
2. Categorize every difference into exactly one of the four gap categories:
   - **New** (intentional): target element absent in baseline, deliberately introduced.
   - **Retained** (intentional): element present in both baseline and target.
   - **Removed** (intentional): baseline element deliberately absent in target.
   - **Unintentional Gap**: difference detected but *not* a deliberate decision — must be resolved or escalated before proceeding.

### Step 2: Work Package Formulation
Group resolved gaps into candidate **Work Packages** by technical domain, risk profile, and dependency order.

### Step 3: Human Co-Design Loop
Present work packages to the human architect to refine boundaries/priorities and settle **build vs. buy vs. open-source** trade-offs per package.

### Linter Gates (must pass before writing files)
1. Every gap row has exactly one of the four categories — uncategorized gaps rejected.
2. Every **Unintentional Gap** has a resolution or escalation note before work packages reference it.
3. Every work package references concrete **Gap IDs** it resolves (traceability both directions: no orphan gaps, no unreferenced work packages).
4. Build/buy proposals state alternatives considered and the deciding factor.
5. Diagrams are workspace.dsl extensions only — standalone Mermaid `.mmd` is **banned**.

---

## Output Deliverable Schema(s)

Write **independent, standalone files** under `docs/architecture/phase-e-opportunities/`:

### 1. `gap-analysis-matrix.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-E-GAPS — **ADM Phase**: Phase E — **Status**: Draft/Approved — **Version**: 1.0

| Gap ID | Element (APP/DE/TCH/CAP-xx) | Baseline State | Target State | Category (New / Retained / Removed / Unintentional Gap) | Resolution / Escalation |
|---|---|---|---|---|---|
| GAP-01 | APP-03 Legacy ERP | Active | Decommissioned | Removed | Migrate to APP-07 via WP-02 |
| GAP-04 | IF-09 (B→A flow) | Missing | Required | Unintentional Gap | Escalated: confirmed unintended, add to WP-03 |
```

### 2. `target-architecture-proposal.md`
```markdown
## 1. Executive Proposal Overview
- **Target Architecture Vision**: [Summary]
- **Key Business Outcomes & Value Proposition**: [Quantified KPIs from Phase A]

## 2. Work Package Catalog
| WP ID | Name | Addressed Gap IDs | Scope & Deliverables | Build / Buy / OSS Decision & Rationale | Estimated Impact / Value |
|---|---|---|---|---|---|
| WP-01 | API Platform Setup | GAP-02, GAP-05 | Deploy API Gateway & Auth | Buy (Kong Gateway) — 6-month time-to-value beats build | High / Enables integration |

## 3. Transition Architecture Sketch
- **TA-1**: quick wins & foundations → **TA-2**: core migration → **Target State** (formalized in `togaf-phase-f-migration`).

## 4. Target-State Diagram Extension
Extend `docs/architecture/diagrams/workspace.dsl` with target-state container views — delegate DSL syntax to the `structurizr-dsl` skill and hierarchy checks to the `c4-model` skill.
```

---

## Guardrails
- Emit exactly the two Phase E files — Transition Architecture detail belongs to `togaf-phase-f-migration`.
- **No big-bang**: proposals must contain at least one intermediate Transition Architecture sketch.
- **Traceability**: every work package cites Gap IDs; every unintentional gap is resolved or escalated.
- Architecture visualization is authored only in `docs/architecture/diagrams/workspace.dsl` — standalone Mermaid (`.mmd`) diagrams are **banned**.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase E & Gap Analysis**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) (Implementation Factor Assessment & Deduction Matrix, Consolidated Gaps/Solutions/Dependencies Matrix, Business Value Assessment) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [Structurizr DSL](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
