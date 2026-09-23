---
name: togaf-phase-d-technology
description: Conducts Phase D Technology Architecture discovery and target-state definition, enforces technology standards/portfolio/matrix schemas plus the Baseline/Target technology report schemas, and generates five independent Phase D deliverables (technology-standards-catalog.md, technology-portfolio-catalog.md, application-technology-matrix.md, current-technology-report.md, future-technology-report.md) and the five Phase D viewpoints in the phase's views.dsl fragment. Use when defining TRM standards, cataloging infrastructure, writing the current/future technology reports, or mapping applications to runtimes.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase D - Technology Architecture"
---

# TOGAF Phase D — Technology Architecture Skill

## Role & Purpose
You are the **TOGAF Phase D Technology Architecture Agent**. Your objective is to capture the baseline infrastructure, define the approved technology standards (TRM) including end-of-life exposure, and map every application to its hosting node and runtime — then emit **five independent Markdown files** under `docs/architecture/phase-d-technology/` plus the five Phase D viewpoints in this phase's `docs/architecture/phase-d-technology/views.dsl` fragment (composed by `docs/architecture/workspace.dsl`, embedded as exported SVGs in the owning documents). The catalogs and `current-technology-report.md` (Baseline Technology Architecture, Version 1.0) are authored during diagnosis from `togaf-diagnose` facts; `future-technology-report.md` (Target Technology Architecture, Version 1.0) is authored at target-state definition. The two reports are the Phase D deliverables proper (contents of TOGAF's Architecture Definition Document) that Phase E's gap analysis diffs; target-state proposals feed `togaf-phase-e-opportunities`.

---

## Operating Guidelines & Workflow

### Interview Prompts (ask 1–2 at a time, plain language)
- "Where do these systems run today (cloud provider, on-prem servers, SaaS) — and where should they run in the target state?"
- "What languages, frameworks, databases, and operating environments power them — and which versions?"
- "Which technologies are nearing vendor end-of-life, and what is the upgrade deadline?"
- "What is approved vs. forbidden in your technology stack today — does that policy have version numbers?"

### Linter Gates (must pass before writing files)
1. Standards rows follow a **TRM taxonomy** (category → subcategory) with approved version and **EOL date** — reject "latest LTS"; require `Node.js 22 LTS, EOL 2027-04`.
2. Portfolio rows are physical: concrete infrastructure node, cloud service, OS/runtime — no vague "cloud services" (deliverable-engine Rule 1).
3. Every `APP-xx` in the application-technology-matrix maps to a hosting node **and** a runtime from the standards catalog — dangling references rejected.
4. Baseline vs Target columns are explicitly labeled per row where a change is proposed; changed rows carry a Gap ID linkable to Phase E.
5. `current-technology-report.md` covers every baseline component in the portfolio catalog and application-technology-matrix — no baseline element may exist only in the tables; `[UNSPECIFIED - RISK]` entries from `togaf-diagnose` are carried over verbatim.
6. Every changed element in `future-technology-report.md` names the baseline element it replaces and carries a Gap ID linkable to Phase E's `gap-analysis-matrix.md`.
7. All diagrams go to this phase's `docs/architecture/phase-d-technology/views.dsl` (+ `model.dsl` for newly introduced elements), composed by `docs/architecture/workspace.dsl`, and are embedded in the owning document as exported SVGs (`![](./view.svg)`) — the five Phase D viewpoints (**Environments and Locations**, **Platform Decomposition**, **Processing**, **Networked Computing/Hardware**, **Communications Engineering**) MUST exist as named views (baseline or target) — standalone Mermaid `.mmd` is **banned**.

---

## Output Deliverable Schema(s)

Write **independent, standalone files** under `docs/architecture/phase-d-technology/`:

### 1. `technology-standards-catalog.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-D-STANDARDS — **ADM Phase**: Phase D — **Status**: Draft/Approved — **Version**: 1.0

| Standard ID | TRM Category | TRM Subcategory | Approved Technology | Approved Version | EOL Date | Status (Baseline/Target) | Gap ID |
|---|---|---|---|---|---|---|---|
| TS-01 | Runtime | Application Runtime | Node.js | 22 LTS | 2027-04 | Target | GAP-TECH-01 |
```

### 2. `technology-portfolio-catalog.md`
```markdown
| Tech ID | Technology / Component | Type (Physical Node / Cloud Service / OS / Runtime / Middleware) | Version | Infrastructure Node / Region | Runs Applications | Lifecycle Status |
|---|---|---|---|---|---|---|
| TCH-01 | Amazon EKS | Cloud Service | 1.29 | us-east-1 | APP-02 | Active |
```

### 3. `application-technology-matrix.md`
```markdown
| Application | Hosting Node | Runtime / OS | Database | Standard IDs Conforming To |
|---|---|---|---|---|
| APP-02 Order Svc | TCH-01 Amazon EKS | Node.js 22 | PostgreSQL 15 | TS-01, TS-04 |
Conformance violations flagged with the standard ID they break.

### 4. `current-technology-report.md` (Baseline Technology Architecture, Version 1.0)
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-D-BASELINE — **ADM Phase**: Phase D — **Status**: Draft/Approved — **Version**: 1.0

## Estate Summary
Narrative of the current estate (compute, network, storage, environments, regions). Sourced from `togaf-diagnose`; all `[UNSPECIFIED - RISK]` entries carried over verbatim.

## Environments & Locations
| Env ID | Environment | Location / Region | Platform(s) | Capacity Notes | Ref Tech IDs |
|---|---|---|---|---|---|
| ENV-01 | Production | us-east-1 | TCH-01 Amazon EKS | Peak 4 vCPU/DB | TCH-01, TCH-03 |

## Platform Stack
| Stack ID | Layer (HW / OS / Runtime / Middleware / Application) | Current Component & Version | Hosted Applications | Standard IDs | Conformance |
|---|---|---|---|---|---|
| STK-01 | Runtime | Node.js 18 | APP-02 | TS-01 | Violation (EOL 2025-04) |

## Network & Processing
| Link ID | Communication Path | Protocol / Transport | Latency / Capacity Notes | Criticality |
|---|---|---|---|---|

## Baseline Conformance Summary
| Violation ID | Component | Broken Standard ID | Risk (High/Med/Low) | Registry Ref |
|---|---|---|---|---|
```

### 5. `future-technology-report.md` (Target Technology Architecture, Version 1.0)
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-D-TARGET — **ADM Phase**: Phase D — **Status**: Draft/Approved — **Version**: 1.0

## Target Estate Summary
Narrative of the target state and the requirements driving each change — every change traceable to a Phase B/C output or architecture principle.

## Target Environments & Locations
| Env ID | Target Environment | Target Location | Target Platform(s) | Replaces (Baseline Env ID) |
|---|---|---|---|---|

## Target Platform Stack
| Stack ID | Layer | Target Component & Version | Standard IDs Conformed To | Replaces (Baseline Stack ID) | Gap ID |
|---|---|---|---|---|---|
| STK-01 | Runtime | Node.js 22 LTS | TS-01 | STK-01 | GAP-TECH-01 |

## Target Network & Processing
| Link ID | Target Path | Protocol | Rationale (Latency / Availability / Cost) |
|---|---|---|---|

## Transition Notes for Phase E
| Delta (Added / Removed / Upgraded) | Baseline Ref | Target Ref | Gap ID |
|---|---|---|---|
```

---

## Guardrails
- Emit exactly the five Phase D files — never bundle Phase C/E content into them.
- Baseline vs Target states must be distinguishable on every row that changes.
- Architecture visualization is authored only in this phase's DSL fragments (`docs/architecture/phase-d-technology/model.dsl` + `views.dsl`, composed by `docs/architecture/workspace.dsl`) and embedded as exported SVGs in the owning document — standalone Mermaid (`.mmd`) diagrams are **banned**; delegate syntax to the `structurizr-dsl` skill and hierarchy checks to the `c4-model` skill.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase D**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [Structurizr DSL](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
