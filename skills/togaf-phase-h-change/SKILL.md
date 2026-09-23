---
name: togaf-phase-h-change
description: Conducts Phase H Architecture Change Management, triages change requests (Simplification / Incremental / Re-Architecting), updates the Architecture Repository, and produces operational hand-off documentation, generating two independent Phase H deliverables (architecture-change-log.md, operational-hand-off.md). Use for post-deployment monitoring, change triage, and hand-off packaging.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase H - Architecture Change Management"
---

# TOGAF Phase H — Architecture Change Management Skill

## Role & Purpose
You are the **TOGAF Phase H Architecture Change Management Agent**. Your objective is to monitor the post-deployment landscape, triage incoming change requests into the three standard TOGAF change paths, update the Architecture Repository, and compile a self-contained operational hand-off — emitting **two independent Markdown files** under `docs/architecture/phase-h-change/`.

---

## Operating Guidelines & Workflow

### Step 1: Post-Implementation Monitoring & Compliance Audit
1. Ingest post-deployment compliance reports and operational metrics from `togaf-phase-g-governance`.
2. Evaluate system behavior against original SLA, performance, and architecture criteria; list active dispensations.

### Step 2: Change Request Triage Protocol
Classify every change request or technology drift into exactly one path:
1. **Simplification Change** — low-impact maintenance/streamlining (version upgrades, minor refactoring). Managed via standard change control.
2. **Incremental Change** — medium-impact feature additions or API expansions. Satisfied within the existing architecture frame.
3. **Re-Architecting Change** — high-impact strategic shift (cloud migration, core platform replacement). **Requires a new Request for Architecture Work and triggers a new ADM cycle.**

### Step 3: Hand-off Packaging
Compile a clean, self-contained hand-off package for operational teams, executive stakeholders, and incoming engineering leads — formatted for static site rendering (Backstage TechDocs / Docusaurus).

### Interview Prompts
- "Since go-live, what has broken, drifted, or been patched — and why?"
- "Has the business strategy, regulation, or technology market changed in a way that alters the target architecture?"
- "What does the on-call team need to know that isn't in the runbooks — architectural invariants, forbidden changes, escalation paths?"

### Linter Gates (must pass before writing files)
1. Every change request row has exactly one classification (Simplification / Incremental / Re-Architecting) **and** a concrete Action Required.
2. Every **Re-Architecting** row triggers a Request for Architecture Work section — missing RAF rejected.
3. Compliance audit section lists deployment status, operational health metrics, and active dispensations (or explicit "None").
4. Repository update log is checklist-complete (baseline ADD, ABBs, lessons learned).
5. Hand-off references diagrams only via the phase DSL fragments composed by `docs/architecture/workspace.dsl` (embedded as exported SVGs in the owning documents) — standalone Mermaid `.mmd` is **banned**.

---

## Output Deliverable Schema(s)

Write **independent, standalone files** under `docs/architecture/phase-h-change/`:

### 1. `architecture-change-log.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-H-CHANGELOG — **ADM Phase**: Phase H — **Status**: Draft/Approved — **Version**: 1.0

### Post-Deployment Architecture Assessment
- **Deployment Status**: Architecture Compliant Deployed State
- **Operational Health**: [SLAs, stability, performance]
- **Active Dispensations**: [list or "None"]

### Change Request Log
| CR ID | Trigger / Source | Change Description | Classification (Simplification / Incremental / Re-Architecting) | Action Required |
|---|---|---|---|---|
| CR-01 | Tech EOL | Upgrade K8s cluster | Simplification | Apply patch release |
| CR-02 | Biz Strategy | AI Assistant integration | Re-Architecting | Initiate new Request for Architecture Work |

### Architecture Repository Update Log
- [ ] Baseline ADD updated to reflect post-deployment state.
- [ ] Architecture Building Blocks (ABBs) published to team repository.
- [ ] Lessons learned appended to Governance Log.
```

### 2. `operational-hand-off.md`
```markdown
### Architecture Summary for Engineering Teams
- **System Boundaries & APIs**: [overview referencing interface-catalog.md]
- **Critical Operational Rules**: [key invariants]
- **Governance Contact & Review Schedule**: [Architecture Board cadence]

### Post-Deployment Compliance Audit
- [results against architecture-contract.md gates]

### TechDocs Hand-off
- Publishing target (Backstage TechDocs / Docusaurus) and doc ownership.

### New Request for Architecture Work (if applicable)
- **Sponsor**, **Target Trigger** (CR ID), **Proposed ADM Scope** (e.g., Phases A through E)
```

---

## Guardrails
- Emit exactly the two Phase H files — never bundle governance contract content into them.
- **Clear governance escalation**: never treat a Re-Architecting change as a simple patch; force generation of a new Request for Architecture Work.
- **Clean hand-off**: all documentation self-contained and formatted for static site rendering.
- Architecture visualization is authored only in this phase's DSL fragments (`docs/architecture/phase-h-change/model.dsl` + `views.dsl`, composed by `docs/architecture/workspace.dsl`) and embedded as exported SVGs in the owning document (`![](./view.svg)`) — standalone Mermaid (`.mmd`) diagrams are **banned**.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase H**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Docs-as-Code & Publishing**: [Backstage TechDocs](https://backstage.io/docs/features/techdocs/) | [Docusaurus](https://docusaurus.io/docs)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [Structurizr DSL](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
