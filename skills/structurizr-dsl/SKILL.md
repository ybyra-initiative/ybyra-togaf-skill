---
name: structurizr-dsl
description: Generates, parses, and validates Structurizr DSL workspace definitions as the exclusive "models as code" language for C4 architecture diagrams. Replaces raw, ad-hoc diagramming syntax (like Mermaid) with a single, strongly-typed semantic model.
license: Apache-2.0
disable-model-invocation: true
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
---

# Structurizr DSL Skill (Models as Code)

## Role & Purpose
You are the **Structurizr DSL Skill**. Your purpose is to generate, maintain, and validate architecture models using the **Structurizr Domain-Specific Language (DSL)**.

Structurizr DSL enforces a **"Models as Code"** approach — defining a single, centralized architectural model rooted at `docs/architecture/workspace.dsl`, composed from colocated per-phase fragments via `!include`, from which multiple consistent views are generated. This makes the model version-control friendly, diffable, and machine-validatable — essential properties when AI agents co-author architecture — while keeping each document's diagrams owned by and rendered inside that document.

---

## Explicit Ban on Standalone Diagramming Languages (Mermaid Policy)

> [!CAUTION] **STRICT POLICY: MERMAID IS BANNED FOR PRIMARY ARCHITECTURAL DEFINITIONS**
> Raw diagramming tools (like Mermaid `.mmd` files, PlantUML drawing scripts, or ad-hoc boxes-and-lines text) do **NOT** maintain a semantic architecture model. They treat diagrams as disconnected graphics, leading to naming drift, missing relationship rules, and broken abstraction hierarchies.
>
> 1. **Primary Source of Truth**: ALL architecture visualization definitions MUST be authored in **Structurizr DSL** — root workspace at `docs/architecture/workspace.dsl`, composed from per-phase fragments (`model.dsl` + `views.dsl`) colocated with each document's directory. Each document's views live in the `views.dsl` sitting next to it. Hand-authored `.mmd` files are **banned**.
> 2. **Export-Only Path**: If a rendered preview image or Markdown embed is needed, those diagrams MUST be **auto-generated/exported from the Structurizr DSL workspace** via the Structurizr `export` command, never authored by hand — then embedded in the owning Markdown document as `![](./view.svg)`.

---

## Structurizr DSL Anatomy & Workspace Syntax

A valid Structurizr DSL file (`workspace.dsl`) consists of a single `workspace` block containing `model`, `views`, and optional `styles`:

```structurizr
workspace "R42 Architecture" "Central architectural model for the enterprise" {

    model {
        # 1. Actors / People
        user = person "Mentee" "A student or practitioner searching for architectural guidance." "User"

        # 2. Software Systems & Containers
        r42System = softwareSystem "R42 Mentoring Platform" "Private RAG-enabled knowledge base and opinion feed." {
            webApp = container "Web / PWA Client" "Delivers search UX and content reader." "React 18 / TypeScript" "Client"
            ragEngine = container "Local RAG Vector Search Engine" "Executes client-side vector and full-text search." "SQLite + sqlite-vec" "Engine"
            gitRepo = container "Markdown Knowledge Source" "Git repository housing curated markdown notes." "Git / Markdown" "Storage"
        }

        # 3. External Systems
        llmProvider = softwareSystem "LLM API Service" "Third-party BYOK inference service." "External"

        # 4. Relationships (Source -> Target -> Description -> Protocol)
        user -> webApp "Queries opinions and reads articles" "HTTPS"
        webApp -> ragEngine "Executes vector search" "SQLite C-API / IPC"
        ragEngine -> gitRepo "Reads raw markdown source files" "File I/O"
        webApp -> llmProvider "Sends prompt context for synthesis (BYOK)" "HTTPS / REST"
    }

    views {
        # System Context View (Level 1)
        systemContext r42System "SystemContext" {
            include *
            autolayout lr
        }

        # Container View (Level 2)
        container r42System "Containers" {
            include *
            autolayout tb
        }

        # Styling & Themes
        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
        }
    }
}
```

---

## Workspace Composition with `!include`

Real projects MUST NOT accumulate one monolithic file. The root workspace contains only `!include` lines; all statements live in fragments colocated with the documents that own them:

```text
docs/architecture/
├── workspace.dsl                        # ROOT: single model{} + views{} of !include lines ONLY
├── shared/
│   └── model.dsl                        # cross-phase elements (people, core systems) — defined ONCE
├── phase-a-vision/
│   ├── architecture-vision.md           # embeds: ![System Context](./system-context.svg)
│   ├── model.dsl                        # elements this phase introduces (bare statements)
│   ├── views.dsl                        # this phase's named views (bare statements)
│   └── system-context.svg               # exported view, committed, embedded in the .md
└── phase-b-business/                    # same pattern: model.dsl, views.dsl, *.svg
```

```structurizr
workspace "Enterprise Architecture" "Composed from per-phase fragments via !include" {
    model {
        !include shared/model.dsl
        !include phase-a-vision/model.dsl
        !include phase-b-business/model.dsl
        # ...one line per phase, added as phases run
    }
    views {
        !include phase-a-vision/views.dsl
        !include phase-b-business/views.dsl
        # ...one line per phase
    }
}
```

**Hard rules:**
1. **`!include` cannot escape upward.** A relative include path may only point to the same directory as the parent file or a subdirectory of it — never a parent or sibling directory. This is why the root sits at `docs/architecture/workspace.dsl`, a common ancestor of every fragment.
2. **Every identifier is defined exactly once.** Structurizr rejects duplicate identifiers, so elements shared across phases live in `shared/model.dsl` and are never redefined in a phase fragment.
3. **Fragments contain bare statements only** — no `workspace`, `model`, or `views` wrappers. `model.dsl` fragments hold element/relationship statements (inlined into the root's `model {}` block); `views.dsl` fragments hold view statements (inlined into the root's `views {}` block). This is why each phase gets two fragment files: content is inlined into the block that includes it.
4. **Fragment ownership**: a phase skill may edit only its own `model.dsl` / `views.dsl`, and only add its own include lines to the root workspace. Never redefine or delete another phase's identifiers.

---

## Rendering & Embedding

- **Export** views from the composed workspace with the Structurizr `export` command:
  `export -workspace docs/architecture/workspace.dsl -format svg -output docs/architecture/` — see https://docs.structurizr.com/export. Validate structure with `-format json`.
- **Embed** each exported SVG in the Markdown document that owns it: `![System Context](./system-context.svg)` (SVG colocated with the `.md`). This renders natively in VS Code's Markdown preview and on GitHub — no extension or plugin required. Exported SVGs are committed to the repository (Docs-as-Code) and MUST be regenerated after any DSL edit — never hand-edited.
- **Interactive preview**: the `local` command (successor to the discontinued Lite tooling) serves the workspace locally — https://docs.structurizr.com/local.
- **VS Code authoring preview**: recommend `vimpelcom.c4-varp` (live DSL webview preview with `!include` support) plus `ciarant.vscode-structurizr` (syntax highlighting). Avoid `systemticks.c4-dsl-extension` — it uploads the model to the public kroki.io service.

---

## Core Structurizr DSL Elements Reference

| Block Keyword | Syntax Example | C4 Level / Purpose |
|---|---|---|
| `person` | `p = person "<Name>" "<Description>" "<Tag>"` | Level 1 User/Actor |
| `softwareSystem` | `s = softwareSystem "<Name>" "<Description>" "<Tag>"` | Level 1 System Boundary |
| `container` | `c = container "<Name>" "<Description>" "<Tech Stack>" "<Tag>"` | Level 2 Deployable Unit |
| `component` | `cmp = component "<Name>" "<Description>" "<Tech Stack>" "<Tag>"` | Level 3 Code Component |
| `deploymentNode` | `dn = deploymentNode "<Name>" "<Description>" "<Technology>"` | Deployment Topology |
| `relationship` | `source -> target "<Description>" "<Protocol>"` | Interaction Link |

---

## Validation & Quality Checklist

Before finalizing any `workspace.dsl` output:
- [ ] **No Floating Elements**: Every container is defined inside a `softwareSystem` block.
- [ ] **Explicit Technology**: Every `container` and `component` explicitly declares its technology string.
- [ ] **Labeled Relationships**: Every relationship line includes both an action description and a transport protocol.
- [ ] **Model Consistency**: Verify that changing an element name in the `model` block automatically updates across all defined views.
- [ ] **Fragment Ownership**: The root workspace contains only downward `!include` lines; each fragment holds bare statements; no identifier is defined in more than one file; no phase touches another phase's fragment.
- [ ] **SVGs Regenerated**: After any DSL edit, re-run the `export` command and refresh the embedded SVGs — embedded images are export-only output, never hand-edited.
- [ ] **No Hand-Authored Mermaid**: No `.mmd` files or inline Mermaid code blocks serve as primary architecture definitions — export-only from the workspace.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## Official Documentation References
- **Structurizr DSL Reference**: [https://docs.structurizr.com/dsl](https://docs.structurizr.com/dsl)
- **Structurizr DSL Language Guide**: [https://docs.structurizr.com/dsl/language](https://docs.structurizr.com/dsl/language)
- **Why "as code"? Rationale**: [https://docs.structurizr.com/as-code](https://docs.structurizr.com/as-code)
- **Structurizr Export Command**: [https://docs.structurizr.com/export](https://docs.structurizr.com/export)
- **Structurizr Commands Overview**: [https://docs.structurizr.com/commands](https://docs.structurizr.com/commands)
- **`!include` Directive**: [https://docs.structurizr.com/dsl/includes](https://docs.structurizr.com/dsl/includes)
- **Structurizr `local` Command (interactive preview)**: [https://docs.structurizr.com/local](https://docs.structurizr.com/local)
- **C4 Model**: [https://c4model.com/](https://c4model.com/)
- **Open Agent Skills Specification**: [https://agentskills.io/specification](https://agentskills.io/specification)
