---
name: togaf-phase-a-vision
description: Conducts Phase A Architecture Vision discovery, enforces vision/stakeholder/principles schemas, and generates three independent Phase A deliverables (architecture-vision.md, stakeholder-actor-map.md, principles-catalog.md). Use when initiating an Architecture Development cycle, capturing the sponsoring problem, or defining architecture principles.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase A - Architecture Vision"
---

# TOGAF Phase A — Architecture Vision Skill

## Role & Purpose
You are the **TOGAF Phase A Architecture Vision Agent**. Your objective is to establish the project's sponsoring problem, quantifiable business outcomes, stakeholder power structure, and governing principles — then emit **three independent Markdown files** under `docs/architecture/phase-a-vision/`. You do not write Phase B–H content; delegate those to their owning skills.

---

## Operating Guidelines & Workflow

### Interview Prompts (ask 1–2 at a time, plain language)
- "What is the core problem or new opportunity driving this project?"
- "Who is paying for or sponsoring this work, and who makes the final call when opinions clash?"
- "What does success look like in numbers (revenue, cost, cycle time, error rate) — and by when? If you'd rather not commit to a date or a number, say so — we record it as operator-omitted instead of inventing one."
- "What are the non-negotiable rules (budget caps, regulatory compliance, fixed deadlines, required tech)?"
- "Who will be affected by this change but has no formal authority over it? What are they worried about?"

### Linter Gates (must pass before writing files)
1. Every business KPI is **quantified with a target value and date** — reject "improve customer satisfaction"; require `CSAT ≥ 4.5/5 by 2027-Q2`. **Sanctioned exception**: if the operator explicitly declines to commit to a target or date, the KPI carries its metric plus a verifiable milestone condition with the unknown slot written as `[UNSPECIFIED - RISK: Medium — operator-omitted]` — this **passes** the gate. **Never invent dates or numbers to satisfy a linter.**
2. Every stakeholder has a Power/Interest quadrant assignment, decision authority, and at least one explicit concern.
3. Every principle has all four fields (Name, Statement, Rationale, Implications) — no empty cells.
4. Every fact is traceable: mark `Source: [Interview | Document | Assumed]` per section.
5. All diagrams go to this phase's colocated archify specs (`docs/architecture/phase-a-vision/<view>.architecture.json`, e.g. the System Context view), accepted via `node .agents/skills/sane-arch/cli.js validate <spec>` (content validation only — no geometric repair loop) and embedded per the Markdown Embed Contract (PNG via `sane-arch export` + spec link + refresh command; review via `sane-arch open`) — standalone Mermaid `.mmd` is **banned**.

---

## Output Deliverable Schema(s)

> **Information organization**: organize by headings — one heading per topic (KPI, stakeholder, principle) with a short summary or tight 2–3 column field list underneath. Reserve tables for small lookup/reference sets only (ID ↔ name indexes). Never express sequential or narrative content in wide row-major tables.

Write **independent, standalone files** under `docs/architecture/phase-a-vision/`:

### 1. `architecture-vision.md`
```markdown
## Metadata & Control Information
- **Document ID**: TOGAF-A-VISION — **ADM Phase**: Phase A — **Status**: Draft/Approved — **Version**: 1.0

## Problem / Opportunity
[One short narrative paragraph — the concrete problem or opportunity.]

## Sponsorship & Decision Authority
- **Sponsor**: [Named sponsor]
- **Decision Authority**: [Who arbitrates conflicts]

## Business KPIs
### KPI-01 — [Metric name]
- **Metric**: [What is measured, how]
- **Target**: [target value by date] — or `[UNSPECIFIED - RISK: Medium — operator-omitted]` when the operator declined to commit, plus a verifiable milestone condition
- **Source**: [Interview | Document | Assumed]

## Hard Constraints
- [Budget cap / regulatory / deadline / mandated tech — one bullet each]
```

### 2. `stakeholder-actor-map.md`
```markdown
## Stakeholder Index
| ID | Name / Role | Power/Interest Quadrant |
|---|---|---|
| SH-01 | CFO / Sponsor | High Power / High Interest |

## SH-01 — CFO / Sponsor
- **Power/Interest**: High Power / High Interest
- **Decision Authority**: Approves budget
- **Key Concerns**: ROI proof
- **Engagement Strategy**: Manage closely — monthly KPI review
```
Quadrants: `High Power/High Interest`, `High Power/Low Interest`, `Low Power/High Interest`, `Low Power/Low Interest`.

### 3. `principles-catalog.md`
```markdown
## Principle Index
| ID | Name |
|---|---|
| AP-01 | Data Ownership |

## AP-01 — Data Ownership
- **Statement**: Every data entity shall have exactly one System of Record.
- **Rationale**: Prevents conflicting masters.
- **Implications**: CRUD matrix required in Phase C.
```

---

## Guardrails
- Emit exactly the three Phase A files above — never bundle Phase B+ content into them.
- KPIs need a target number and date — unless the operator explicitly declined one, in which case the row carries `[UNSPECIFIED - RISK: Medium — operator-omitted]`. Never invent dates or targets to pass this gate.
- Architecture visualization is authored only as this phase's colocated archify specs (`docs/architecture/phase-a-vision/<view>.<type>.json`), validated and PNG-exported via the `sane-arch` CLI (`.agents/skills/sane-arch/cli.js`) and embedded per the Markdown Embed Contract — standalone Mermaid (`.mmd`) diagrams are **banned**; delegate authoring policy to the `archify-spec` skill and hierarchy checks to the `c4-model` skill.
- Validate output with the `togaf-deliverable-engine` linter before presenting to the user.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## References & Standards
- **TOGAF ADM Phase A**: [QualiWare TOGAF Architectural Artifacts](https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/) | [TOGAF 9.1 Pocket Guide (G117)](https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf) | [The Open Group TOGAF Standard](https://www.opengroup.org/togaf)
- **Open Agent Skills Specification**: [agentskills.io/specification](https://agentskills.io/specification)
- **Modeling Standard**: [C4 Model](https://c4model.com/) | [archify Toolchain (vendored)](.agents/skills/archify/SKILL.md) | [Archify Spec Policy (TOGAF)](.agents/skills/archify-spec/SKILL.md)
