# TOGAF Repository Directory Specification

All generated architectural deliverables MUST be written to specific directory paths within the target project codebase. Each file is owned by exactly one phase skill.

Diagram ownership follows the archify colocated-spec model: every diagram is a self-contained typed JSON spec (`<view>.<type>.json`) living inside the phase directory next to its owning document, with CLI-generated artifacts beside it (the interactive `.html`, the `.visual-check.1440x900.light.png` embed sidecar, and the evidence receipt). There is no root workspace and no `!include` composition — cross-view consistency comes from locked element IDs, and each document embeds its own PNG plus an interactive HTML link.

```text
docs/architecture/
├── phase-a-vision/                      # owner: togaf-phase-a-vision
│   ├── architecture-vision.md           # embeds: ![System Context](./system-context.architecture.visual-check.1440x900.light.png) + HTML link
│   ├── stakeholder-actor-map.md
│   ├── principles-catalog.md
│   ├── system-context.architecture.json # SPEC (source of truth, authored)
│   ├── system-context.architecture.html # generated via archify deliver
│   ├── system-context.architecture.visual-check.*.png  # generated evidence/embed sidecars
│   └── system-context.architecture.visual-check.json   # evidence receipt
├── phase-b-business/                    # owner: togaf-phase-b-business
│   ├── driver-goal-objective-catalog.md
│   ├── business-capability-catalog.md
│   ├── organization-actor-catalog.md
│   └── <view>.architecture.json + generated .html / .visual-check.* artifacts
├── phase-c-information/                 # owner: togaf-phase-c-information
│   ├── application-portfolio-catalog.md
│   ├── data-entity-catalog.md
│   ├── application-data-crud-matrix.md
│   ├── interface-catalog.md
│   ├── application-interaction-matrix.md
│   └── <view>.dataflow.json (entity/CRUD views) + <view>.sequence.json (interfaces) + generated artifacts
├── phase-d-technology/                  # owner: togaf-phase-d-technology
│   ├── technology-standards-catalog.md
│   ├── technology-portfolio-catalog.md
│   ├── application-technology-matrix.md
│   ├── current-technology-report.md     # Baseline Technology Architecture, Version 1.0
│   ├── future-technology-report.md      # Target Technology Architecture, Version 1.0
│   └── <view>.base.architecture.json + <view>.head.architecture.json (delta pair) + <view>.delta.html + generated artifacts
├── phase-e-opportunities/               # owner: togaf-phase-e-opportunities
│   ├── gap-analysis-matrix.md           # (compiled from togaf-evaluate output)
│   ├── target-architecture-proposal.md
│   └── <view>.architecture.json (target state) / <view>.workflow.json (sequencing) + generated artifacts
├── phase-f-migration/                   # owner: togaf-phase-f-migration
│   ├── migration-plan.md
│   ├── transition-architectures.md
│   └── <view>.lifecycle.json (waves/releases) + <view>.workflow.json (roadmap) + generated artifacts
├── phase-g-governance/                  # owner: togaf-phase-g-governance
│   ├── architecture-contract.md
│   ├── harness-execution-policy.md
│   └── <view>.architecture.json + generated artifacts
├── phase-h-change/                      # owner: togaf-phase-h-change
│   ├── architecture-change-log.md
│   ├── operational-hand-off.md
│   └── <view>.base.architecture.json + <view>.head.architecture.json (change-impact delta pair) + generated artifacts
└── skill-feedback.md                    # Continuous Skill Contribution & Feedback Loop log
```

## Quality & Consistency Standards
1. **File Independence**: Every deliverable MUST be saved as a separate Markdown file in its dedicated phase directory. Never dump multiple phases into a single monolithic document.
2. **Metadata Frontmatter**: Every file must start with YAML frontmatter specifying document metadata.
3. **Cross-Referencing**: Files must use relative Markdown links to link across artifacts (e.g., `[Gap Matrix](../phase-e-opportunities/gap-analysis-matrix.md)`).
4. **C4 + archify Only**: All architectural diagrams MUST be defined as self-contained archify JSON specs colocated with the owning document (each phase owns its `<view>.<type>.json` specs; cross-phase elements are repeated with locked IDs) and rendered via `archify deliver` + `visual-check` (`--quality showcase`), then embedded in the owning document as PNG sidecar + interactive HTML link (`![](./view.type.visual-check.1440x900.light.png)` + `[→ Open interactive diagram](./view.type.html)`). Standalone Mermaid (`.mmd`) diagrams are banned. Authoring policy lives in the `archify-spec` skill; the toolchain is vendored at `.agents/skills/archify/`.
