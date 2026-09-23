# TOGAF Repository Directory Specification

All generated architectural deliverables MUST be written to specific directory paths within the target project codebase. Each file is owned by exactly one phase skill.

Diagram ownership follows the Structurizr composition model: a root workspace at `docs/architecture/workspace.dsl` contains only `!include` lines; every phase directory owns a `model.dsl` (elements it introduces) and a `views.dsl` (its named views), and embeds its exported SVGs directly inside its Markdown documents.

```text
docs/architecture/
├── workspace.dsl                        # ROOT: single model{} + views{} of !include lines ONLY (owner: structurizr-dsl composition rules)
├── shared/
│   └── model.dsl                        # cross-phase elements (people, core systems) — defined exactly ONCE
├── phase-a-vision/                      # owner: togaf-phase-a-vision
│   ├── architecture-vision.md           # embeds: ![System Context](./system-context.svg)
│   ├── stakeholder-actor-map.md
│   ├── principles-catalog.md
│   ├── model.dsl                        # elements this phase introduces (bare statements)
│   ├── views.dsl                        # this phase's named views (bare statements)
│   └── system-context.svg               # exported view, committed, embedded in the owning .md
├── phase-b-business/                    # owner: togaf-phase-b-business
│   ├── driver-goal-objective-catalog.md
│   ├── business-capability-catalog.md
│   ├── organization-actor-catalog.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg                            # exported views embedded in the owning .md files
├── phase-c-information/                 # owner: togaf-phase-c-information
│   ├── application-portfolio-catalog.md
│   ├── data-entity-catalog.md
│   ├── application-data-crud-matrix.md
│   ├── interface-catalog.md
│   ├── application-interaction-matrix.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg
├── phase-d-technology/                  # owner: togaf-phase-d-technology
│   ├── technology-standards-catalog.md
│   ├── technology-portfolio-catalog.md
│   ├── application-technology-matrix.md
│   ├── current-technology-report.md     # Baseline Technology Architecture, Version 1.0
│   ├── future-technology-report.md      # Target Technology Architecture, Version 1.0
│   ├── model.dsl
│   ├── views.dsl                        # the five Phase D viewpoints as named views
│   └── *.svg
├── phase-e-opportunities/               # owner: togaf-phase-e-opportunities
│   ├── gap-analysis-matrix.md           # (compiled from togaf-evaluate output)
│   ├── target-architecture-proposal.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg
├── phase-f-migration/                   # owner: togaf-phase-f-migration
│   ├── migration-plan.md
│   ├── transition-architectures.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg
├── phase-g-governance/                  # owner: togaf-phase-g-governance
│   ├── architecture-contract.md
│   ├── harness-execution-policy.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg
├── phase-h-change/                      # owner: togaf-phase-h-change
│   ├── architecture-change-log.md
│   ├── operational-hand-off.md
│   ├── model.dsl
│   ├── views.dsl
│   └── *.svg
└── skill-feedback.md                    # Continuous Skill Contribution & Feedback Loop log
```

## Quality & Consistency Standards
1. **File Independence**: Every deliverable MUST be saved as a separate Markdown file in its dedicated phase directory. Never dump multiple phases into a single monolithic document.
2. **Metadata Frontmatter**: Every file must start with YAML frontmatter specifying document metadata.
3. **Cross-Referencing**: Files must use relative Markdown links to link across artifacts (e.g., `[Gap Matrix](../phase-e-opportunities/gap-analysis-matrix.md)`).
4. **C4 + Structurizr DSL Only**: All architectural diagrams MUST be defined in Structurizr DSL fragments composed by `docs/architecture/workspace.dsl` (each phase owns its `model.dsl` + `views.dsl`; cross-phase elements live in `shared/model.dsl`) and rendered as exported SVGs embedded in the owning document (`![](./view.svg)`). Standalone Mermaid (`.mmd`) diagrams are banned.
