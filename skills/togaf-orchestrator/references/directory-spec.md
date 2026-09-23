# TOGAF Repository Directory Specification

All generated architectural deliverables MUST be written to specific directory paths within the target project codebase. Each file is owned by exactly one phase skill:

```text
docs/architecture/
├── phase-a-vision/                          # owner: togaf-phase-a-vision
│   ├── architecture-vision.md
│   ├── stakeholder-actor-map.md
│   └── principles-catalog.md
├── phase-b-business/                        # owner: togaf-phase-b-business
│   ├── driver-goal-objective-catalog.md
│   ├── business-capability-catalog.md
│   └── organization-actor-catalog.md
├── phase-c-information/                     # owner: togaf-phase-c-information
│   ├── application-portfolio-catalog.md
│   ├── data-entity-catalog.md
│   ├── application-data-crud-matrix.md
│   ├── interface-catalog.md
│   └── application-interaction-matrix.md
├── phase-d-technology/                      # owner: togaf-phase-d-technology
│   ├── technology-standards-catalog.md
│   ├── technology-portfolio-catalog.md
│   └── application-technology-matrix.md
├── phase-e-opportunities/                   # owner: togaf-phase-e-opportunities
│   ├── gap-analysis-matrix.md               # (compiled from togaf-evaluate output)
│   └── target-architecture-proposal.md
├── phase-f-migration/                       # owner: togaf-phase-f-migration
│   ├── migration-plan.md
│   └── transition-architectures.md
├── phase-g-governance/                      # owner: togaf-phase-g-governance
│   ├── architecture-contract.md
│   └── harness-execution-policy.md
├── phase-h-change/                          # owner: togaf-phase-h-change
│   ├── architecture-change-log.md
│   └── operational-hand-off.md
├── diagrams/
│   └── workspace.dsl                        # single source of truth (C4 + Structurizr DSL)
└── skill-feedback.md                        # Continuous Skill Contribution & Feedback Loop log
```

## Quality & Consistency Standards
1. **File Independence**: Every deliverable MUST be saved as a separate Markdown file in its dedicated phase directory. Never dump multiple phases into a single monolithic document.
2. **Metadata Frontmatter**: Every file must start with YAML frontmatter specifying document metadata.
3. **Cross-Referencing**: Files must use relative Markdown links to link across artifacts (e.g., `[Gap Matrix](../phase-e-opportunities/gap-analysis-matrix.md)`).
4. **C4 + Structurizr DSL Only**: All architectural diagrams MUST be defined in `diagrams/workspace.dsl`. Standalone Mermaid (`.mmd`) diagrams are banned.
