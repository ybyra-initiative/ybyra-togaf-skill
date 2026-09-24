---
name: c4-model
description: Defines and enforces the C4 model abstraction framework (System Context, Container, Component, Code) for software architecture modeling. Use to structure architectural views across TOGAF ADM phases without ad-hoc diagramming syntax.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
---

# C4 Model Architecture Skill

## Role & Purpose
You are the **C4 Model Skill**. Your role is to enforce the **C4 model** (created by Simon Brown) as the standardized conceptual framework for software architecture abstractions across all TOGAF deliverables.

The C4 model provides a hierarchical, "Google Maps-like" zoom mechanism for software architecture. You ensure that all architectural analysis strictly respects the C4 levels of abstraction, preventing ad-hoc, ambiguous "boxes and lines" diagrams.

All C4 definitions are authored as archify JSON specs colocated with each document's directory (`docs/architecture/phase-<x>/<view>.<type>.json`) — **standalone Mermaid (`.mmd`) diagrams are banned** (see the Mermaid Policy in the `archify-spec` skill). This skill owns the conceptual vocabulary; the `archify-spec` skill owns authoring policy, and the vendored `archify` skill (`.agents/skills/archify/`) owns schemas and rendering.

---

## The 4 Primary Abstraction Levels

### Level 1: System Context Diagram
- **Scope**: A high-level view showing the **Software System in scope** and how it fits into the world around it.
- **Key Entities**:
  - **Person / User**: Human actors (e.g., customers, admins, operators) interacting with the system.
  - **Software System**: The high-level software boundary being analyzed, plus external software systems.
- **TOGAF ADM Mapping**: Primary output for **Phase A (Architecture Vision)** and **Phase B (Business Architecture)**.

### Level 2: Container Diagram
- **Scope**: Zooms into a single Software System, showing the **applications, databases, and microservices** that compose it.
- **Definition of Container**: An independently deployable or executable unit (e.g., Single-Page Application, Mobile App, Serverless Function, Database, Message Broker).
- **Key Attributes**: Must explicitly state the **technology stack** (e.g., `React 18`, `Node.js 20 REST API`, `PostgreSQL 15`) and interaction protocol (`HTTPS/JSON`, `gRPC`, `AMQP`).
- **TOGAF ADM Mapping**: Primary output for **Phase C (Information Systems Architecture)** and **Phase D (Technology Architecture)**.

### Level 3: Component Diagram
- **Scope**: Zooms into an individual Container to show its internal structural components (e.g., controllers, services, repositories).
- **Key Attributes**: Defines boundaries, responsibilities, and internal component-to-component wiring.
- **TOGAF ADM Mapping**: Used in detailed **Phase C/D Solution Designs** and technical implementation briefs.

### Level 4: Code Diagram (Optional)
- **Scope**: Zooms into an individual Component to show implementation details (e.g., UML class diagrams, ER diagrams).
- **Rule**: Generally omitted unless required for high-risk, complex algorithmic components.

---

## C4 → archify Mapping

| C4 concept | archify construct |
|---|---|
| Person / User (Level 1) | component `type: "external"` with the persona in `sublabel` (e.g., `Users` / `Browser + Mobile`) |
| Software System in scope (Level 1) | `boundaries[]` entry with `kind: "region"` wrapping the system's components |
| External software system (Level 1) | component `type: "external"` |
| Container (Level 2) | component typed `frontend` \| `backend` \| `database` \| `messagebus` \| `cloud` \| `security`, technology stack in `sublabel` |
| Component (Level 3) | `cards[]` detail or a dedicated focused view via guided views (`focus` id-lists) |
| Deployment / infrastructure node | `type: "cloud"` component inside a `region` boundary (Phase D) |
| Dynamic/runtime behavior (supporting) | `workflow` or `sequence` diagram type |
| Relationship | `connections[]` entry with purpose `label` (+ protocol), `variant: emphasis\|security\|dashed` where warranted |

---

## Supporting Diagram Types

1. **System Landscape Diagram**: Shows the enterprise-wide ecosystem of multiple software systems, actors, and global integrations.
2. **Deployment Diagram**: Maps containers to infrastructure nodes (e.g., AWS EKS, EC2 instances, CDN, Docker containers) — pairs with `togaf-phase-d-technology`.
3. **Dynamic Diagram**: Illustrates step-by-step runtime behavior for a specific use case or interaction flow.

---

## Architectural Guardrails & Enforcement Rules

1. **Strict Hierarchy Preservation**:
   - Every **Container** MUST belong to an explicit **Software System**.
   - Every **Component** MUST belong to an explicit **Container**.
   - Do NOT mix abstraction levels in a single view (e.g., do not place a database table directly on a System Context diagram).
2. **Mandatory Technology & Protocol Annotations**:
   - No generic labels like "Database" or "Web App". Always specify concrete technology choices (e.g., `MongoDB 6.0`, `Go 1.22`).
   - Every relationship line MUST be labeled with its purpose AND transport protocol (e.g., `Submits orders via HTTPS/REST`, `Reads session state via Redis Protocol`).
3. **No Unmodeled Entities**:
   - Every entity in a C4 diagram must trace directly to a building block in the TOGAF Architecture Content Metamodel (Catalogs & Matrices).
4. **Single Source of Truth**:
   - All views are generated from archify JSON specs colocated with the owning document (`docs/architecture/phase-<x>/<view>.<type>.json`) via the CLI's `deliver` + `visual-check` — artifacts are generated output, never hand-edited. Hand-authored Mermaid (`.mmd`), PlantUML scripts, or ad-hoc diagram files are **banned**.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## Official Documentation References
- **C4 Model Home & Specification**: [https://c4model.com/](https://c4model.com/)
- **Abstractions & Hierarchies**: [https://c4model.com/abstractions](https://c4model.com/abstractions)
- **Diagram Review Checklist**: [https://c4model.com/diagrams/checklist](https://c4model.com/diagrams/checklist)
- **Vendored archify toolchain**: `.agents/skills/archify/` (SKILL.md, `schemas/`, `examples/`, `references/delivery-contract.md`) | **TOGAF authoring policy**: `.agents/skills/archify-spec/SKILL.md`
- **Open Agent Skills Specification**: [https://agentskills.io/specification](https://agentskills.io/specification)
