---
name: togaf-agentic-governance
description: Implements Enterprise Architecture 4.0 (EA 4.0) runtime governance for AI agents, establishing the Governance Spine, Runtime Control Plane (Policy Engine, Protocol Engine, Effects Gateway), Proof Ledgers, and 7 Governing Primitives to govern authorized judgment under uncertainty.
license: Apache-2.0
metadata:
  author: R42 Architecture / Ybyra Initiative
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  ea_paradigm: "EA 4.0 - Enterprise Agency Governance"
---

# TOGAF Agentic Governance Skill (EA 4.0 Integration)

## Purpose & Architectural Stance
Standard TOGAF ADM (Phases A–D) establishes the foundational structural stack—business capability maps, application portfolios, data entity catalogs, and technology standards. However, traditional design-time governance (Phases E–H Architecture Review Boards) was designed for **deterministic execution** (human-written, pre-scripted software).

When deploying autonomous AI agents that exercise **authorized judgment under uncertainty**, static compliance standards fail because agents make real-time decisions in milliseconds. 

**Enterprise Architecture 4.0 (EA 4.0)** introduces an **Agentic Control Layer** that locks directly on top of TOGAF Phase D:
- **TOGAF (Phases A–D)**: Governs enterprise architecture (the deterministic execution base).
- **Agentic Governance (EA 4.0)**: Governs enterprise agency (authorized judgment in motion).

---

## The 3 Runtime Primitives of the Agentic Control Layer

### 1. The Governance Spine
Governance collapses from an external, periodic oversight activity directly into the **executable runtime infrastructure**. Every decision signal emitted by an autonomous agent is intercepted by the Governance Spine before creating real-world effects.

### 2. The Runtime Control Plane
The intercepted decision signal is routed into the Runtime Control Plane and evaluated by three active engines:
- **Policy Engine**: Validates decision intent against business constraints and enforces **context admissibility** (restricting which variables and contextual data an agent is legally authorized to evaluate to prevent scope hallucination).
- **Protocol Engine**: Locks the action into valid state pathways and enforces agent-to-agent contract protocols.
- **Effects Gateway**: Measures the scale of real-world impact (financial, operational, security) before releasing the action to the external environment.

### 3. Proof Ledgers
To ensure complete reconstructibility and legal auditability, as an action leaves the Effects Gateway, an identical immutable **passport** is simultaneously forged and deposited into an audit and replay ledger.
- **Core Rule**: *"One event, one passport, one producer of record."*
- **Passport Payload**: Captures the exact context, policy evaluation, authority state, and model reasoning trace, projecting a replayable history of the agent's logic.

---

## The 7 Governing Primitives of Enterprise Agency

When configuring agent execution harnesses or writing Phase G implementation policies, agents are bounded by seven constitutional primitives:
1. **Intent**: The explicit business goal or task objective.
2. **Authority**: The hard boundary of permissions and authorization delegated to the agent.
3. **Policy**: Standing business and regulatory rules restricting decisions.
4. **Scope**: Enclosed functional and domain boundaries.
5. **Meaning**: Shared semantic schemas and context admissibility criteria.
6. **Proof**: Replayable evidence captured in the Proof Ledger.
7. **Effects**: Quantitative impact thresholds evaluated at the Effects Gateway.

---

## Target Output Artifacts (`docs/architecture/phase-g-governance/`)

When this skill is executed during Phase G governance setup, it generates:
1. `docs/architecture/phase-g-governance/agentic-control-plane-spec.md` (Specifications for Policy Engine, Protocol Engine, and Effects Gateway)
2. `docs/architecture/phase-g-governance/proof-ledger-schema.md` (Passport schema, event IDs, and replay audit policies)
3. `docs/architecture/phase-g-governance/governing-primitives-matrix.md` (Mapping of 7 primitives across all deployed AI agent roles)

---

## Operating Workflow for the Agent

1. **Ingest Phase D Technology & Baseline Stack**: Verify application portfolio, API boundaries, and runtime environments defined in `docs/architecture/phase-d-technology/`.
2. **Define Context Admissibility Rules**: Interrogate stakeholder on permissible input variables and state variables for each AI agent role.
3. **Configure Control Plane Impact Thresholds**: Establish dollar limits, API write permissions, and automated escalation triggers for the Effects Gateway.
4. **Emit Proof Ledger Passport Spec**: Define the JSON schema for runtime event passports deposited into the immutable audit ledger.
5. **Write Deliverable Files**: Write the 3 target Markdown files into `docs/architecture/phase-g-governance/` and update `docs/architecture/phase-g-governance/harness-execution-policy.md`.

---

## Continuous Skill Contribution & Feedback Loop
If during project execution you discover an edge case, a missing domain rule, or refine an agentic governance policy, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back upstream.
