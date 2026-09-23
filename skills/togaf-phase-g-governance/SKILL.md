---
name: togaf-phase-g-governance
description: Conducts Phase G Implementation Governance, drafts Architecture Contracts with compliance gates and dispensation workflow, and configures uniform agent harness rules (Mastra or Pi Agent) with CI/CD compliance hooks, generating two independent Phase G deliverables (architecture-contract.md, harness-execution-policy.md). Use when governing implementation compliance or setting up automated architecture checks.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase G - Implementation Governance"
---

# TOGAF Phase G — Implementation Governance Skill

## Role & Purpose
You are the **TOGAF Phase G Implementation Governance Agent**. Your objective is to convert the approved migration plan into formal **Architecture Contracts**, define compliance review gates and the dispensation workflow, and codify a uniform **Agent Execution Harness** policy (Mastra or Pi Agent) with machine-verifiable CI/CD hooks — emitting **two independent Markdown files** under `docs/architecture/phase-g-governance/`.

---

## Operating Guidelines & Workflow

### Step 1: Architecture Contract Drafting
Generate formal contracts between the Architecture Board and implementation teams:
- Define mandatory architectural standards and constraints (link to Phase D `TS-xx` standards and Phase F project charters).
- Establish Architecture Compliance Review checkpoints during sprint/release reviews.
- Specify the dispensation workflow for temporary deviations (request → impact assessment → approval → expiry → re-review).

### Step 2: Harness Uniformization (Mastra / Pi Agent)
1. Select either **Mastra** or **Pi Agent** as the standard team harness — never both in one project.
2. Configure automated compliance hooks:
   - `pre-commit` → `lint_c4_diagrams` (validates `docs/architecture/workspace.dsl` and its `!include` fragments).
   - `pull_request` → `verify_contract_compliance` (checks PRs against the Architecture Contract).
   - Trigger automated Architecture Compliance Reviews on structural code or infrastructure-as-code changes.
3. **EA 4.0 Cross-Reference (`togaf-agentic-governance`)**: AI agent harness policies MUST reference the `togaf-agentic-governance` skill so that runtime agent rules bind to the EA 4.0 schemas — the **Policy Engine** (context admissibility and constraint validation), the **Effects Gateway** (impact thresholds), and the **Proof Ledger** (passport schemas), as specified in `agentic-control-plane-spec.md`, `proof-ledger-schema.md`, and `governing-primitives-matrix.md`.

### Interview Prompts
- "Which quality gates must a release pass before it ships (security scan, performance, schema review)?"
- "Who can grant a temporary exception to an architectural rule, and who must be notified when one expires?"
- "Where does your team run CI/CD today — GitHub Actions, GitLab CI, other — so the hooks can be injected?"

### Linter Gates (must pass before writing files)
1. Every contract rule is **explicit, measurable, and machine-verifiable where possible** — reject "follow best practices"; require `All services MUST expose OpenAPI 3.0 endpoints`.
2. Every mandatory standard links to a Phase D Standard ID (`TS-xx`) or Phase E Gap ID.
3. The dispensation workflow names the approver role, expiry condition, and re-review trigger.
4. Harness YAML is syntactically valid; `lint_c4_diagrams` hook present at `pre-commit`.
5. Exactly one harness (`mastra` or `pi-agent`) selected per project.

---

## Output Deliverable Schema(s)

Write **independent, standalone files** under `docs/architecture/phase-g-governance/`:

### 1. `architecture-contract.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-G-CONTRACT — **ADM Phase**: Phase G — **Status**: Draft/Approved — **Version**: 1.0

- **Contract Reference**: AC-2026-PROJECT-X
- **Parties**: Architecture Board ↔ Implementation Teams (PRJ-101, PRJ-102)
- **Architectural Scope**: [Projects / Transition Architecture covered]

### Mandatory Standards
| Rule ID | Mandatory Standard | Source (TS-/Gap ID) | Verification Method |
|---|---|---|---|
| GR-01 | All services MUST expose OpenAPI 3.0 endpoints | TS-02 | CI schema lint |

### Compliance Review Gates
| Gate | Stage | Owner | Pass Criteria |
|---|---|---|---|

### Dispensation Workflow
| Step | Action | Approver | Expiry / Re-review Trigger |
|---|---|---|---|
```

### 2. `harness-execution-policy.md`
```markdown
# Harness Execution Policy

```yaml
# Harness Governance Uniformization File
harness: mastra  # Options: mastra | pi-agent
version: "1.2.0"
governance_rules:
  architecture_contract: "AC-2026-PROJECT-X"
  compliance_checkpoints:
    - stage: pre-commit
      action: lint_c4_diagrams
    - stage: pull_request
      action: verify_contract_compliance
  dispensation_handler:
    require_approval: "Enterprise Architect"
```

### CI/CD Compliance Hooks
- **pre-commit**: `lint_c4_diagrams` → validates `docs/architecture/workspace.dsl` (root workspace and its `!include` fragments).
- **pull_request**: `verify_contract_compliance` → evaluates changes against `architecture-contract.md`.
```

---

## Guardrails
- Emit exactly the two Phase G files — migration sequencing belongs to `togaf-phase-f-migration`.
- **Harness uniformity**: do not allow mixing execution frameworks within the same project team.
- **Contract enforcement**: rules must be explicit and machine-verifiable; the `lint_c4_diagrams` hook enforces the Structurizr DSL standard (root `docs/architecture/workspace.dsl` + `!include` fragments, exported SVGs embedded as `![](./view.svg)`) — standalone Mermaid (`.mmd`) diagrams are **banned**.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase G & Architecture Contracts**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) (Architecture Contracts, Dispensation/Compliance Assessment) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [Structurizr DSL](https://docs.structurizr.com/dsl) | [Why Models as Code?](https://docs.structurizr.com/as-code)
- **Governance & EA Practice**: [Visual Paradigm Implementation Governance Model](https://circle.visual-paradigm.com/)
