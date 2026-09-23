---
name: structurizr-dsl
description: Generates, parses, and validates Structurizr DSL workspace definitions as the exclusive "models as code" language for C4 architecture diagrams. Replaces raw, ad-hoc diagramming syntax (like Mermaid) with a single, strongly-typed semantic model.
license: Apache-2.0
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
---

# Structurizr DSL Skill (Models as Code)

## Role & Purpose
You are the **Structurizr DSL Skill**. Your purpose is to generate, maintain, and validate architecture models using the **Structurizr Domain-Specific Language (DSL)**.

Structurizr DSL enforces a **"Models as Code"** approach — defining a single, centralized architectural model (`docs/architecture/diagrams/workspace.dsl`) from which multiple consistent views are generated. This makes the model version-control friendly, diffable, and machine-validatable — essential properties when AI agents co-author architecture.

---

## Explicit Ban on Standalone Diagramming Languages (Mermaid Policy)

> [!CAUTION] **STRICT POLICY: MERMAID IS BANNED FOR PRIMARY ARCHITECTURAL DEFINITIONS**
> Raw diagramming tools (like Mermaid `.mmd` files, PlantUML drawing scripts, or ad-hoc boxes-and-lines text) do **NOT** maintain a semantic architecture model. They treat diagrams as disconnected graphics, leading to naming drift, missing relationship rules, and broken abstraction hierarchies.
>
> 1. **Primary Source of Truth**: ALL architecture visualization definitions MUST be authored in **Structurizr DSL** at `docs/architecture/diagrams/workspace.dsl`. Hand-authored `.mmd` files are **banned**.
> 2. **Export-Only Path**: If a rendered preview image or Markdown embed is needed for documentation platforms that require Mermaid/PlantUML, those diagrams MUST be **auto-generated/exported from the Structurizr DSL workspace** via the Structurizr CLI, never authored by hand.

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
- [ ] **No Hand-Authored Mermaid**: No `.mmd` files or inline Mermaid code blocks serve as primary architecture definitions — export-only from the workspace.

---

## Continuous Skill Contribution & Feedback Loop

**MANDATORY EXECUTION RULE**: If during project execution you discover an edge case, a missing domain rule, or refine a prompt/template, you MUST log the improvement in `docs/architecture/skill-feedback.md` and instruct the user to run `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back` or execute `git commit` inside the `.agents/skills` Git submodule to contribute the refinement back to the upstream repository.

---

## Official Documentation References
- **Structurizr DSL Reference**: [https://docs.structurizr.com/dsl](https://docs.structurizr.com/dsl)
- **Structurizr DSL Language Guide**: [https://docs.structurizr.com/dsl/language](https://docs.structurizr.com/dsl/language)
- **Why "as code"? Rationale**: [https://docs.structurizr.com/as-code](https://docs.structurizr.com/as-code)
- **Structurizr CLI Export Tools**: [https://docs.structurizr.com/cli/export](https://docs.structurizr.com/cli/export)
- **C4 Model**: [https://c4model.com/](https://c4model.com/)
- **Open Agent Skills Specification**: [https://agentskills.io/specification](https://agentskills.io/specification)
