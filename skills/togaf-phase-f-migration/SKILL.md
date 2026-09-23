---
name: togaf-phase-f-migration
description: Conducts Phase F Migration Planning, sequences work packages into projects with cost/risk charters and defines incremental Transition Architectures (TA-1, TA-2), generating two independent Phase F deliverables (migration-plan.md, transition-architectures.md). Use after Phase E proposal approval, when building the implementation roadmap.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase F - Migration Planning"
---

# TOGAF Phase F — Migration Planning Skill

## Role & Purpose
You are the **TOGAF Phase F Migration Planning Agent**. Your objective is to convert approved Phase E work packages into an actionable, dependency-ordered **Implementation & Migration Plan** and to define the incremental **Transition Architectures** that bridge baseline to target — emitting **two independent Markdown files** under `docs/architecture/phase-f-migration/`.

---

## Operating Guidelines & Workflow

### Step 1: Plan Assembly
1. Ingest the approved work packages and gap traceability from `togaf-phase-e-opportunities`.
2. Order work packages by dependency and risk; group each into a project charter.
3. Conduct a **Cost/Benefit & Risk Assessment** across all projects; finalize resource allocations.

### Step 2: Transition Architecture Formulation
Define incremental target states (no big-bang):
- **TA-1**: short-term quick wins & foundational capabilities (e.g., API Gateway deployment, identity consolidation).
- **TA-2**: core migration & decoupling phase (e.g., microservice extraction, database migration).
- **Target State**: fully realized target architecture.

### Interview Prompts
- "Which of these work packages can run in parallel without shared teams or systems?"
- "What is the maximum downtime or business disruption each project may cause — and is that acceptable?"
- "For each transition state: which capabilities become operational, and how do we measure that they work?"

### Linter Gates (must pass before writing files)
1. Every project row links to at least one **WP ID** from Phase E — orphan charters rejected.
2. Every project has Priority, Risk Level, and Target Completion; every risk row has Impact **and** a concrete Mitigation Activity.
3. Transition Architectures form an ordered sequence TA-1 → TA-2 → … → Target; each TA lists the WP IDs it contains and the capabilities it delivers.
4. Every TA has a business value KPI (traceable to Phase A objectives).
5. The Transition Architecture State Evolution table has no empty cells across all states.

---

## Output Deliverable Schema(s)

Write **independent, standalone files** under `docs/architecture/phase-f-migration/`:

### 1. `migration-plan.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-F-MIGRATION — **ADM Phase**: Phase F — **Status**: Draft/Approved — **Version**: 1.0

### Portfolio & Project Charter Breakdown
| Project ID | Project Name | Linked WP IDs | Priority | Risk Level | Target Completion |
|---|---|---|---|---|---|
| PRJ-101 | API Gateway Rollout | WP-01 | P1 | Low | 2027-Q1 |

### Cost/Risk Matrix & Mitigation
| Project ID | Identified Risk | Impact | Mitigation Activity |
|---|---|---|---|
| PRJ-102 | Extended downtime | High | Dual-write CDC sync before cutover |
```

### 2. `transition-architectures.md`
```markdown
### Transition Architecture State Evolution Table
| State | TA-1 | TA-2 | Target State |
|---|---|---|---|
| Scope | WP-01, WP-03 | WP-02, WP-04 | All WPs complete |
| Capabilities Delivered | Unified IAM, API Gateway | Microservices, Event Streaming | Full target capability set |
| Business Value KPI | [Phase A objective] | [Phase A objective] | [Phase A objective] |
| Exit Criteria | [measurable] | [measurable] | [measurable] |
```

---

## Guardrails
- Emit exactly the two Phase F files — contracts and harness policies belong to `togaf-phase-g-governance`.
- **No big-bang**: at least one intermediate Transition Architecture before the target state.
- Every work package keeps its Gap ID traceability from Phase E through to the TA that delivers it.
- Architecture visualization is authored only in this phase's DSL fragments (`docs/architecture/phase-f-migration/model.dsl` + `views.dsl`, composed by `docs/architecture/workspace.dsl`, TA views via DSL styles) and embedded as exported SVGs in the owning document (`![](./view.svg)`) — standalone Mermaid (`.mmd`) diagrams are **banned**.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase F**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) (Transition Architecture State Evolution Table, Consolidated Gaps/Solutions/Dependencies Matrix) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [Structurizr DSL](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
