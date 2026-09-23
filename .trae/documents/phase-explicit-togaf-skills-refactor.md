# Plan: Build Phase-Explicit TOGAF Agent Skills (Phases A–H) with Autonomous Web Research & Structurizr DSL

## Summary

Refactor `togaf-agent-skills` (remote: `ybyra-initiative/ybyra-togaf-skill`) from 9 loosely-phase-bundled skills into a strict **14-skill pack**: 4 cross-cutting skills (orchestrator, diagnose, evaluate, deliverable-engine) + **8 explicit TOGAF ADM Phase A–H skills** + 2 modeling-standard skills (c4-model, structurizr-dsl). All `SKILL.md` files get Open Agent Skills frontmatter (`license`, `metadata.togaf_phase`, etc.), the mandatory contribution loop, and phase-specific linter rules/interview prompts targeting individual files under `docs/architecture/phase-[a-h]-*/`. Enforce C4 + Structurizr DSL (`workspace.dsl`) with standalone Mermaid banned. Update `cli.js` (explicit 14-skill list, `--sync-back`), `package.json`, `README.md`. Research is **strict**: all 10 reference URLs must be fetched successfully before any SKILL.md is written.

**User decisions (locked):**

* Legacy `togaf-propose`, `togaf-plan`, `togaf-delivery`, `togaf-deliverable-template` are **deleted** after content is split into the new skills → final tree = exactly 14 dirs.

* Replace `YOUR-USERNAME` with **`ybyra-initiative/ybyra-togaf-skill`** everywhere (npx commands, README, cli.js).

* Research is **strict**: if any of the 10 URLs fails to fetch, halt and report the failure to the user before generating/updating any SKILL.md.

***

## Current State Analysis

Repo root: `README.md`, `cli.js`, `package.json`, `.gitignore`, `skills/` (9 dirs):

| Existing skill                                          | Phase coverage | Fate in refactor                                                                                          |
| ------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `togaf-orchestrator` (+ `references/directory-spec.md`) | pipeline A–H   | **Keep/update** — delegate to 8 phase skills; update directory spec                                       |
| `togaf-diagnose` (+ `references/completeness-rules.md`) | A–D bundled    | **Keep/update** — plain-language discovery + 6 domain gate checks; per-phase output moves to phase skills |
| `togaf-evaluate`                                        | E gap matrix   | **Keep/update** — adversarial critique + Gap Analysis Matrix                                              |
| `togaf-deliverable-template`                            | cross-cutting  | **Rename →** **`togaf-deliverable-engine`**, v2.0.0                                                       |
| `togaf-propose`                                         | D target + E   | **Delete** — content split into phase-d / phase-e                                                         |
| `togaf-plan`                                            | F + G          | **Delete** — content split into phase-f / phase-g (also removes stray `# local edit` line 106)            |
| `togaf-delivery`                                        | H              | **Delete** — content → phase-h                                                                            |
| `c4-model`                                              | standard       | **Keep/update** — remove `[35, 42]` citation residue; reinforce Mermaid ban                               |
| `structurizr-dsl`                                       | standard       | **Keep/update** — `workspace.dsl` single source of truth                                                  |

Key facts from exploration:

* `cli.js` discovers skills **dynamically** (`fs.readdirSync(skills/)`), installs to `./.agents/skills/`, and already implements `--sync-back`/`-s`, `--force`, `--dry-run`, `--update`, `--help`. Source-resolution marker = `skills/togaf-orchestrator/SKILL.md` (kept, so it stays valid).

* No `license` field in any frontmatter; `package.json` has no `license`/`repository` fields.

* The feedback-loop paragraph (`docs/architecture/skill-feedback.md` + `--sync-back`) already exists verbatim in all 9 skills — must be added to the 5 new skills and its npx command updated to the real repo.

* Current frontmatter shape: `name`, `description`, `metadata{version, author, standard}` — no `license`, no `togaf_phase`.

* Output tree defined redundantly in 3 places: `togaf-orchestrator/references/directory-spec.md`, `togaf-diagnose/references/completeness-rules.md`, README §Target Project Directory Layout — all three must converge on the new spec file list (below).

* Mermaid is already banned in 5 files — keep/strengthen, and ensure every new phase skill repeats the ban where diagrams are produced.

***

## Phase 1 — Strict Web Research (gate: all 10 must succeed)

Fetch and extract schema content from:

1. `https://coe.qualiware.com/resources/togaf/9-1/part4-contentframework/architectural-artifacts/` — Phase A–H artifact catalogs/matrices field schemas
2. `http://grahamberrisford.com/AM%201%20Methods/6PRODUCTSandTECHNIQUES/DataAndInformation/AM%20Information-Data%20architecture.htm` — data entities, SoR ownership, CRUD matrix rules (plain HTTP — WebFetch upgrades to HTTPS; if it fails, report)
3. `https://sol4biz.at/software-architecture/architecture-development-method/` — Phase C interface catalogs, application interaction matrices
4. `https://e-serkom-ng.co.id/assets/uploads/skema/benchmark/e68f6-togaf-9.1-book-pocket-guide-g117.pdf` — TOGAF pocket guide (PDF — fetch via WebFetch; if it fails, report)
5. `https://c4model.com/` — C4 abstraction levels
6. `https://docs.structurizr.com/dsl` — DSL syntax reference
7. `https://docs.structurizr.com/as-code` — models-as-code rationale
8. `https://agentskills.io/specification` — Open Agent Skills frontmatter spec (authoritative for field names/order)
9. `https://aiquinta.ai/blog/agent-skill-folder-structure-scripts-resources-assets/` — skill folder structure
10. `https://thomasthornton.cloud/packaging-github-copilot-agents-and-skills-with-agent-package-manager/` — APM/distribution

**Rule**: extract exact attribute fields, matrix headers, lifecycle states, linter rules. If ANY URL fails → stop, report the failure to the user, and do not write any SKILL.md (strict mode chosen by user).

***

## Phase 2 — Target Skill Pack (`skills/`, 14 dirs)

```text
skills/
├── togaf-orchestrator/            (updated)
├── togaf-diagnose/                (updated; references/completeness-rules.md kept)
├── togaf-evaluate/                (updated)
├── togaf-deliverable-engine/      (renamed from togaf-deliverable-template; references/ none)
├── togaf-phase-a-vision/          (new)
├── togaf-phase-b-business/        (new)
├── togaf-phase-c-information/     (new)
├── togaf-phase-d-technology/      (new)
├── togaf-phase-e-opportunities/   (new)
├── togaf-phase-f-migration/       (new)
├── togaf-phase-g-governance/      (new)
├── togaf-phase-h-change/          (new)
├── c4-model/                      (updated)
└── structurizr-dsl/               (updated)
```

Delete after content split: `skills/togaf-propose/`, `skills/togaf-plan/`, `skills/togaf-delivery/`, `skills/togaf-deliverable-template/`.

### 2.1 Universal SKILL.md contract (all 14)

Frontmatter (field set per spec §4.1, confirmed against agentskills.io in Phase 1):

```yaml
---
name: <directory-name>
description: <phase/skill-specific, trigger-oriented>
license: Apache-2.0
metadata:
  author: R42 Architecture
  version: "2.0.0"
  standard: "open-agent-skills-v1"
  togaf_phase: "Phase C - Information Systems Architecture"   # phase skills only (A–H)
---
```

Mandatory body sections (all 14):

1. `## Role & Purpose`
2. `## Operating Guidelines & Workflow` (interview prompts + linter gates for phase skills)
3. `## Output Deliverable Schema(s)` — exact target files + table column headers
4. `## Guardrails` (incl. **C4 + Structurizr DSL only; standalone Mermaid** **`.mmd`** **banned** wherever diagrams are produced)
5. `## Continuous Skill Contribution & Feedback Loop` — verbatim block from existing skills, with npx command updated to `npx github:ybyra-initiative/ybyra-togaf-skill --sync-back`
6. `## References & Standards` — include the relevant research URLs actually used

### 2.2 Per-phase target output files & schemas (spec §3 — authoritative)

Each phase skill instructs the agent to write **independent Markdown files** under `docs/architecture/phase-[a-h]-*/`:

* **Phase A** `phase-a-vision/`: `architecture-vision.md` (problem, sponsor, quantified business KPIs, hard constraints), `stakeholder-actor-map.md` (Power/Interest grid, decision authority, concerns), `principles-catalog.md` (Name, Statement, Rationale, Implications)

* **Phase B** `phase-b-business/`: `driver-goal-objective-catalog.md` (Drivers → Goals → SMART Objectives), `business-capability-catalog.md` (2-level `CAP-xx`, maturity 1–5, strategic heatmaps), `organization-actor-catalog.md` (business units, roles, RACI matrix)

* **Phase C** `phase-c-information/`: `application-portfolio-catalog.md` (Logical vs Physical, Criticality Tier 1–3, Lifecycle, System Owner, Hosting Target), `data-entity-catalog.md` (domains, Public/Confidential/PII, SoR write owner, persistence tech), `application-data-crud-matrix.md` (App × Entity C/R/U/D), `interface-catalog.md` (endpoint IDs, REST/Kafka/SFTP/gRPC, latency SLAs, auth protocols), `application-interaction-matrix.md` (Source App → Target App)

* **Phase D** `phase-d-technology/`: `technology-standards-catalog.md` (TRM taxonomy, approved versions, EOL dates), `technology-portfolio-catalog.md` (physical nodes, cloud services, OS/runtimes), `application-technology-matrix.md` (App → Hosting Node & Runtime)

* **Phase E** `phase-e-opportunities/`: `gap-analysis-matrix.md` (New / Retained / Removed / Unintentional-gap categories), `target-architecture-proposal.md` (target state, work-package candidates, build/buy trade-offs)

* **Phase F** `phase-f-migration/`: `migration-plan.md` (work package sequence, cost/risk matrix, charters), `transition-architectures.md` (TA-1, TA-2 → target)

* **Phase G** `phase-g-governance/`: `architecture-contract.md` (mandatory standards, compliance gates, dispensation workflow), `harness-execution-policy.md` (Mastra/Pi Agent harness rules, CI/CD compliance hooks)

* **Phase H** `phase-h-change/`: `architecture-change-log.md` (triage: Simplification / Incremental / Re-Architecting), `operational-hand-off.md` (post-deployment audit, TechDocs hand-off, new Request for Architecture Work)

* **Central model**: `docs/architecture/diagrams/workspace.dsl` — single source of truth; standalone Mermaid banned.

### 2.3 Content sourcing per new skill (from legacy skills + research)

| New skill                | Content source                                                                                                                                                        | Research links to apply                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| phase-a                  | `togaf-diagnose` Phase A interview + new principles/stakeholder content                                                                                               | QualiWare, TOGAF pocket guide                                              |
| phase-b                  | `togaf-diagnose` Phase B interview + new driver/capability/RACI content                                                                                               | QualiWare, pocket guide                                                    |
| phase-c                  | `togaf-diagnose` Phase C interview + completeness rule 3–4 + new CRUD/interface schemas                                                                               | QualiWare, grahamberrisford (CRUD/SoR), sol4biz (interfaces), pocket guide |
| phase-d                  | `togaf-diagnose` Phase D baseline + `togaf-propose` target-state tech parts                                                                                           | QualiWare, pocket guide                                                    |
| phase-e                  | `togaf-evaluate` gap categories + `togaf-propose` proposal/work-package/TA content                                                                                    | QualiWare, pocket guide                                                    |
| phase-f                  | `togaf-plan` migration plan/charter/risk-matrix content                                                                                                               | QualiWare, pocket guide                                                    |
| phase-g                  | `togaf-plan` architecture contract/dispensation + harness (Mastra/Pi) YAML with `lint_c4_diagrams` hook                                                               | QualiWare, pocket guide                                                    |
| phase-h                  | `togaf-delivery` change triage/hand-off content                                                                                                                       | QualiWare, pocket guide                                                    |
| togaf-deliverable-engine | `togaf-deliverable-template` verbatim structure, renamed, v2.0.0; keeps Rules 1–4 linter + template composers                                                         | agentskills.io spec                                                        |
| togaf-orchestrator       | update Stage 1–5 delegation to the 8 phase skills; rewrite `references/directory-spec.md` to the full new file list (§2.2)                                            | agentskills.io, folder-structure blog                                      |
| togaf-diagnose           | keep 6 gate checks in `references/completeness-rules.md`; change Step 3 to delegate per-phase output to phase skills; update Phase-Specific File Mapping to §2.2 list | QualiWare                                                                  |
| togaf-evaluate           | keep grilling protocol + gap matrix; cross-ref phase-e owns `gap-analysis-matrix.md` file path                                                                        | QualiWare                                                                  |
| c4-model                 | keep 4 levels ↔ TOGAF mapping; strip `[35, 42]` citation residue; add explicit Mermaid ban                                                                            | c4model.com                                                                |
| structurizr-dsl          | keep DSL anatomy/checklist; strengthen ban: all architecture visualization = `workspace.dsl` only                                                                     | structurizr.com/dsl, /as-code                                              |

Cross-reference rule (orchestrator quality standard): files independent, YAML frontmatter on generated deliverables, relative cross-links, diagrams only via `workspace.dsl`.

***

## Phase 3 — Refactor `cli.js`, `package.json`, `README.md`

### 3.1 `cli.js`

* Add `const EXPECTED_SKILLS = [ ...14 names... ]` (spec §5.1). Use it to:

  * validate the dynamic directory scan: after `readdirSync`, compare sets — if any expected skill is missing a dir or `SKILL.md`, or unexpected extra dirs exist, print a clear error and `process.exit(1)` (makes `npm test` / `--dry-run` a real verification).

  * iterate install & sync-back in the canonical EXPECTED order.

* Keep `--sync-back`/`-s` behavior (already implemented); it now naturally covers the 14 skills — ensure it only syncs names in `EXPECTED_SKILLS`.

* Keep `resolveSource()` marker `skills/togaf-orchestrator/SKILL.md` (still exists).

* Replace `YOUR-USERNAME/togaf-agent-skills` with `ybyra-initiative/ybyra-togaf-skill` in the header comment and `usage()`.

### 3.2 `package.json`

* Add `"license": "Apache-2.0"` and `"repository": { "type": "git", "url": "git+https://github.com/ybyra-initiative/ybyra-togaf-skill.git" }`.

* Keep name `togaf-agent-skills`, bin, `test` script as-is.

### 3.3 `README.md`

* Rewrite "Included Skills" table → 14 skills with the explicit **Phase A–H directory structure** (spec §5.2.1), showing skill dir → target `docs/architecture/phase-*` outputs.

* Keep/strengthen "Modeling Standard: C4 + Structurizr DSL (Mermaid Banned)" section (§5.2.2).

* Replace all `YOUR-USERNAME` occurrences: install `npx github:ybyra-initiative/ybyra-togaf-skill`, submodule `git submodule add git@github.com:ybyra-initiative/ybyra-togaf-skill.git .agents/skills` (§5.2.3).

* Update CLI reference (flags already correct), contribution loop, and "Target Project Directory Layout" tree → exact §2.2 file list.

***

## Phase 4 — Verification

1. `node cli.js --dry-run` (== `npm test`) → exit 0, reports **14 skills**, no collisions.
2. Directory check: exactly 14 dirs under `skills/`, each contains `SKILL.md`; legacy 4 dirs absent.
3. Frontmatter check: node one-liner parses YAML block of every SKILL.md → has `name`, `description`, `license: Apache-2.0`, `metadata.version`, and `metadata.togaf_phase` for the 8 phase skills.
4. `Grep "YOUR-USERNAME"` across repo → 0 hits. `Grep "togaf-propose|togaf-plan|togaf-delivery|togaf-deliverable-template"` (stale references) → 0 hits outside git history.
5. `Grep "Mermaid|\.mmd"` → only appears in ban/deprecation context; every phase skill + c4-model + structurizr-dsl + deliverable-engine contain the ban.
6. Feedback-loop section present in all 14 skills with the real npx command.
7. `README.md` tree == `directory-spec.md` tree == `completeness-rules.md` mapping == §2.2.
8. Commit: `git add` the changed files (skills/, cli.js, package.json, README.md, plan-adjacent none) and commit with a conventional message (spec execution step 4: "Stage and commit the refactored skill repository"). No push unless asked.

## Assumptions & Decisions

* `metadata.version` for new/renamed skills = `"2.0.0"` (per spec example); untouched-modernized skills (c4-model, structurizr-dsl, orchestrator, diagnose, evaluate) also bumped to `"2.0.0"` for pack consistency.

* Keep `metadata.standard: "open-agent-skills-v1"` alongside spec-required fields (additive, no conflict — confirm field naming against agentskills.io in Phase 1; adjust if the live spec dictates different keys).

* Apache-2.0 license is declared in frontmatter/package.json only; no LICENSE file created (not requested).

* Strict research gate: failures halt execution and are reported to the user (chosen explicitly).

* No push to origin; commit only.

