# TOGAF Diagnose — Explicit Domain Completeness Rules

Before declaring Phase A-D diagnosis complete, you **MUST** evaluate your collected facts against the following **Explicit Domain Completeness Rules**. If any rule is unsatisfied, you must ask targeted follow-up questions to resolve the gap.

## Explicit Completeness Criteria Checklist (6 Domain Gate Checks)

1. **Goal-to-Constraint Traceability**: Every identified business driver must have at least one explicit success metric and be associated with at least one hard constraint (budget, timeline, regulatory, or technical).
2. **Actor-to-Capability Mapping**: Every listed business function/capability must have at least one designated owner/role (internal team or external user type).
3. **Application-to-Data Ownership Matrix**: Every application in the portfolio must have explicitly named data entities it owns (CREATE/WRITE) and data entities it consumes (READ). No "orphaned" applications without data context.
4. **Integration Protocol Precision**: Every system integration boundary must specify the data transport mechanism (e.g., synchronous HTTP/REST, asynchronous Kafka/RabbitMQ, batch CSV/SFTP, or manual entry). Generic "connected to" is NOT allowed.
5. **Hosting & Stack Disambiguation**: Every application component must have a defined deployment target (e.g., AWS ECS, Kubernetes on-prem, Vercel, SaaS) and core runtime stack (e.g., Node.js 20, Postgres 15, Python 3.12).
6. **Explicit Gap/Unspecified Registry**: For any detail the user explicitly states is unknown or unmapped, you must log it as an explicit `[UNSPECIFIED - RISK]` item with an assigned impact rating (High/Medium/Low) rather than leaving blank fields or omitting the component.

## Phase-Specific File Mapping (Owning Skill = Writer)

1. **`docs/architecture/phase-a-vision/`** — owner: `togaf-phase-a-vision`
   - `architecture-vision.md` (Problem statement, sponsor, quantified business KPIs, hard constraints, success criteria)
   - `stakeholder-actor-map.md` (Power/Interest grid, decision authority, concerns)
   - `principles-catalog.md` (Name, Statement, Rationale, Implications)
2. **`docs/architecture/phase-b-business/`** — owner: `togaf-phase-b-business`
   - `driver-goal-objective-catalog.md` (Business Drivers → Goals → SMART Objectives)
   - `business-capability-catalog.md` (2-level `CAP-xx` hierarchy, maturity 1–5, strategic heatmaps)
   - `organization-actor-catalog.md` (Business units, roles, RACI matrix)
3. **`docs/architecture/phase-c-information/`** — owner: `togaf-phase-c-information`
   - `application-portfolio-catalog.md` (Logical vs Physical apps, Criticality Tier 1–3, Lifecycle status, System Owners, Hosting Target)
   - `data-entity-catalog.md` (Domain entities, Data Classification Public/Confidential/PII, System of Record write owners, Persistence tech)
   - `application-data-crud-matrix.md` (Application × Data Entity Create/Read/Update/Delete)
   - `interface-catalog.md` (Endpoint IDs, REST/Kafka/SFTP/gRPC patterns, Latency SLAs, Auth protocols)
   - `application-interaction-matrix.md` (Source App → Target App interactions)
4. **`docs/architecture/phase-d-technology/`** — owner: `togaf-phase-d-technology`
   - `technology-standards-catalog.md` (TRM taxonomy, approved versions, EOL dates)
   - `technology-portfolio-catalog.md` (Physical infrastructure nodes, cloud services, OS/runtimes)
   - `application-technology-matrix.md` (Application → Hosting Node & Runtime mapping)
   - `current-technology-report.md` (Baseline Technology Architecture narrative — authored during diagnosis)
   - `future-technology-report.md` (Target Technology Architecture narrative — authored at target-state definition, not part of the diagnosis gate)
5. **`docs/architecture/phase-a-vision/` diagram spec** — owner: `archify-spec` / `c4-model` delegation (colocated spec, no root workspace)
   - `system-context.architecture.json` (baseline C4 System Context view — source of truth; cross-phase baseline elements repeated with locked IDs)
   - `system-context.architecture.html` + `system-context.architecture.visual-check.*.png` + evidence receipt (generated via `archify deliver` + `visual-check`; PNG embedded in the owning document; standalone Mermaid banned)
