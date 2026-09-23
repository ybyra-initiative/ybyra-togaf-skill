# Research: Embedding diagrams inside Markdown phase documents (VS Code previewable)

Research notes — 2026-09-23. Research-only task: no existing repo files were modified; this is the only new file.

**Problem context:** the repo mandates all diagrams live in one central `docs/architecture/diagrams/workspace.dsl` (Structurizr DSL, single source of truth), and hand-authored Mermaid (`.mmd` / inline `mermaid`) is banned as a primary definition — only auto-generated/exported from the DSL workspace. The uniform central `diagrams/` directory causes drift and is hard to maintain. The goal: diagrams co-located *inside* each TOGAF phase document and visible/previewable from Markdown in VS Code.

---

## RQ1 — Does Structurizr DSL support file splitting (`!include`)?

**Yes.** The DSL has first-class `!include` support.

- The `!include` keyword "can be used to include one or more files, to provide some degree of modularity, and to reuse definition fragments between workspaces." — https://docs.structurizr.com/dsl/includes
- Syntax: `!include <file|directory|url>` where:
  - *file* = a path relative to the parent DSL file — it must be "within the same directory as the parent file, or… a subdirectory of it" (example: `!include people.dsl`, `!include model/people.dsl`). — https://docs.structurizr.com/dsl/includes
  - *directory* = a local directory of DSL files (same subtree restriction; example: `!include model`). — https://docs.structurizr.com/dsl/includes
  - *url* = an HTTPS URL to a single DSL file (example: `!include https://example.com/model/people.dsl`). — https://docs.structurizr.com/dsl/includes
- Behavior: "The content of any included files is simply inlined into the parent document, in the order the files are discovered." It is pure textual composition, not separate model scoping. — https://docs.structurizr.com/dsl/includes
- `!include` is listed among the DSL keywords in the official language reference. — https://docs.structurizr.com/dsl/language
- **Key limitation (critical for co-location):** included file paths may not escape the parent file's directory subtree — you cannot `!include` a sibling or parent-directory file. The current workspace location `docs/architecture/diagrams/workspace.dsl` therefore *cannot* include fragments living at `docs/architecture/A-Vision/*.dsl` (outside its subtree). For per-phase fragments to be included, the root workspace must move up to a common ancestor (e.g. `docs/architecture/workspace.dsl` including `A-Vision/architecture-vision.dsl`), or the fragments must sit under the workspace's directory. *(Inference from the documented path restriction above. — https://docs.structurizr.com/dsl/includes)*
- **Verdict:** each Markdown document's phase *can* own a co-located `.dsl` fragment, composed into one workspace via `!include`, provided the root workspace sits at/above the phase directories. Remote HTTPS includes exist but hurt local/offline authoring.

---

## RQ2 — structurizr-cli / export: which formats?

**Tooling transition (important):** the classic `structurizr/cli` is at its **end of life**; its README points to the new unified `commands` tooling (`export`, `local`, `server`). — https://github.com/structurizr/cli and https://docs.structurizr.com/commands

Current `export` command (https://docs.structurizr.com/export):

- Required flags: `-workspace` and `-format` (documented flag is `-format`, not the short `-f`; examples in the docs all use `-format`). — https://docs.structurizr.com/export
- Supported `-format` values: `plantuml` | `plantuml/structurizr` | `plantuml/c4plantuml` | `mermaid` | `websequencediagrams` | `static` | `png` | `svg` | `json` | `theme` | a fully qualified custom exporter class name. — https://docs.structurizr.com/export
- Answers to the specific questions: **`-format mermaid` ✅, `-format plantuml` ✅, `-format json` ✅, `-format svg` ✅ (with a caveat, below).**
- Official command examples:
  - `export -workspace workspace.json -format plantuml -output diagrams` — https://docs.structurizr.com/export
  - `export -workspace workspace.json -format mermaid` — https://docs.structurizr.com/export
  - `export -workspace workspace.dsl -format json` — https://docs.structurizr.com/export
- **SVG/PNG caveat:** SVG and PNG are rendered through a real browser (Microsoft Playwright + headless Chromium, auto-downloaded), e.g. `export -format svg -workspace workspace.json` with optional `-output <dir>`, `-mode light|dark`, `-animation true|false`. Official limitation: "This feature is currently only available by building from source or using the preview version of the Java .war file" — it is **not** available in the prebuilt `structurizr/structurizr` Docker image. — https://docs.structurizr.com/export/png-and-svg
- **Mermaid/C4 fidelity caveat (official quote):** "the export formats do not support all available shapes/features when compared to Structurizr playground, local, and server." — https://docs.structurizr.com/export — i.e. Mermaid export *does* preserve the model/view structure (elements, relationships, view definitions, automatic layout input) but not full visual parity with Structurizr's own renderer; it is generated output, not hand-authored.
- Old (EOL) CLI export docs, kept for reference: https://docs.structurizr.com/cli/export

---

## RQ3 — VS Code Markdown preview options (state verified as of 2026)

### Mermaid: built-in since VS Code 1.121 — no extension needed

- VS Code **1.121** (released 2026-05-20) merged Matt Bierner's extension into VS Code as the built-in "Mermaid Markdown Features" — Mermaid now renders in the Markdown preview, notebook Markdown cells, and chat. — https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks
- Official docs: "VS Code's built-in Markdown preview renders Mermaid diagrams in `mermaid` fenced code blocks." — https://code.visualstudio.com/docs/languages/markdown
- `bierner.markdown-mermaid` (publisher **`bierner`**, Matt Bierner; 5,305,413 installs) is now **deprecated** — the listing states it was merged into VS Code 1.121. It had offered pan/zoom, resizable diagrams, light/dark theme settings, and MDI/Iconify icons; last supported Mermaid 11.12.0. — https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid

### Structurizr `.dsl` extensions (Marketplace search "structurizr" → 12 results)

Search: https://marketplace.visualstudio.com/search?term=structurizr&target=VSCode

| Extension ID (publisher) | Installs | Preview or syntax-only? |
|---|---|---|
| `ciarant.vscode-structurizr` (ciarant) | ~48.8K | **Syntax highlighting only**, no preview — https://marketplace.visualstudio.com/items?itemName=ciarant.vscode-structurizr |
| `systemticks.c4-dsl-extension` (systemticks) | 62,402 | **Preview** — Structurizr DSL language server (requires Java 17+); "Diagram Preview" CodeLens renders via *public web services* (kroki.io or structurizr.com; base64-encoded model sent to a public webservice; off by default, `c4.diagram.structurizr.enabled`); renderer choice plantuml\|structurizr\|mermaid; PlantUML export — https://marketplace.visualstudio.com/items?itemName=systemticks.c4-dsl-extension |
| `vimpelcom.c4-varp` (VimpelCom PJSC) | ~2,057 | **Live preview** — Langium-based LSP with an in-editor preview webview (JointJS+Dagre), CodeLens "Show As Structurizr Diagram", auto-refresh on save, SVG/DrawIO export; claims full Structurizr DSL incl. `!include` of files/directories/remote URLs — https://marketplace.visualstudio.com/items?itemName=vimpelcom.c4-varp |
| `nicobit.c4archtect` (NicoBit) | 613 | Visual/bidirectional editing (canvas ↔ DSL), exports Mermaid/PlantUML/Draw.io/SVG/PNG; very small install base — https://marketplace.visualstudio.com/items?itemName=nicobit.c4archtect |
| `PKochubey.c4-assist-dsl` | 304 | Highlighting/autocomplete/validation/formatting — **no preview** — https://marketplace.visualstudio.com/items?itemName=PKochubey.c4-assist-dsl |
| `parnicky.structurizr-dsl` | 14 | Diagnostics — **no preview** — https://marketplace.visualstudio.com/items?itemName=parnicky.structurizr-dsl |
| `jpantsjoha.c4x` | 1,627 | Renders fenced `c4x` blocks in Markdown with instant preview — but uses its **own C4X DSL** (Mermaid-inspired), not Structurizr DSL — https://marketplace.visualstudio.com/items?itemName=jpantsjoha.c4x |
| `gfrsoftware.structurizr-dsl-abacus-extension` / `Elsevier.abacus-structurizr-dsl-extension` | 1.4K / 2.5K | Abacus EA repo integration + highlighting (can push to a local Structurizr Lite) — https://marketplace.visualstudio.com/items?itemName=gfrsoftware.structurizr-dsl-abacus-extension |
| `pomdtr.markdown-kroki` | 50.1K | Kroki diagram support inside the built-in Markdown preview — https://marketplace.visualstudio.com/items?itemName=pomdtr.markdown-kroki |

### PlantUML

- `jebbs.plantuml` (jebbs) — 3,701,513 installs. Alt+D live preview with auto-update, zoom/pan, multi-page; `@startuml` integration in Markdown; local rendering (Java + Graphviz) or a PlantUML server (recommended; supports `!include` via POST); supported files `*.wsd,*.pu,*.puml,*.plantuml,*.iuml`; export png/svg/txt. — https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml

**Bottom line (RQ3):** no extension is required for Mermaid in Markdown preview as of VS Code 1.121. **No extension renders Structurizr `.dsl` inside the Markdown preview** — DSL preview extensions exist only for `.dsl` files themselves, and the two credible ones are `systemticks.c4-dsl-extension` (Java 17+, sends the model to a public rendering service) and `vimpelcom.c4-varp` (local webview, but ~2K installs).

---

## RQ4 — Official Structurizr guidance on getting diagrams into documentation

- Official guidance centers on **exporting** diagrams (PlantUML/Mermaid text, PNG/SVG images, static HTML site, JSON) rather than live-embedding views inside Markdown files. — https://docs.structurizr.com/export
- The official "embed diagrams in a website" mechanism is the **static site export** (`export -format static ...`), which produces an interactive viewer embedded via `<iframe>` + `structurizr-embed.js` (supports `?diagram=<ViewName>`, zoom, tooltips, perspectives, animation, etc.); documentation and ADRs are stripped from the workspace. — https://docs.structurizr.com/export/static-site — This targets web pages: VS Code's Markdown preview applies its own security restrictions to active content, so the scripted iframe is not a Markdown-preview solution. — https://code.visualstudio.com/docs/languages/markdown#_markdown-preview-security
- **Structurizr Lite** (official Docker image) gives local WYSIWYG preview: `docker pull structurizr/lite`, `docker run -it --rm -p 8080:8080 -v PATH:/usr/local/structurizr structurizr/lite`, then browse http://localhost:8080 with a `workspace.dsl`. — https://docs.structurizr.com/lite/quickstart
  - **But Lite is EOL:** the quickstart carries the banner "Structurizr Lite will not receive any further updates - please migrate to local." — https://docs.structurizr.com/lite/quickstart and https://docs.structurizr.com/local
  - Successor: the free, open-source **`local`** command (localhost-only; discovers `workspace.dsl`/`workspace.json`; supports multi-workspace mode). — https://docs.structurizr.com/local
- Lite workflow detail relevant to co-located fragments: manual layout is saved into `workspace.json` (the DSL holds no layout), then pushed via CLI. — https://docs.structurizr.com/lite/workflow
- **No official Structurizr doc describes embedding live views *inside Markdown files*** — the official paths are (a) exported artifacts or (b) interactive HTML via local/server/static-site.

---

## RQ5 — Markdown-image embedding path: SVG export → `![](./view.svg)` in VS Code preview

- Per-view SVG export exists: `export -format svg -workspace <path>` with `-output`, `-mode light|dark`, `-animation true|false`, rendered by headless Chromium; currently requires building from source or the preview `.war` (not in the prebuilt Docker image). — https://docs.structurizr.com/export/png-and-svg
- VS Code's built-in Markdown preview renders local images referenced with standard Markdown image syntax; paths starting with `./` (or no prefix) resolve relative to the current file, with path IntelliSense, drag-and-drop, and a "Markdown: Insert Image from Workspace" command. — https://code.visualstudio.com/docs/languages/markdown
- SVG specifically: the official VS Code Developer Community tracker contains active bug reports about *how* SVGs render in Markdown (e.g. "SVG in markdown does not render `<use>` elements", Jan 2026) — i.e. SVGs **do render natively** in the built-in Markdown preview, with edge cases around `<use>` references. — https://developercommunity.visualstudio.com/t/11025098 — (The docs page documents image embedding generally but does not enumerate preview image formats; this official Microsoft tracker entry is the strongest direct evidence that SVG-in-Markdown-preview works.)
- Therefore `![view](./architecture-vision-system-context.svg)` renders in the built-in preview with **zero extensions**. Drift caveat: the SVG is a build artifact of the DSL and must be regenerated when the model changes; VS Code's link validation (`markdown.validate.enabled`) can at least flag missing/broken image paths. — https://code.visualstudio.com/docs/languages/markdown

---

## Options matrix

| # | Approach | VS Code preview fidelity | Drift risk | Tooling burden | Fits "no hand-authored mermaid" policy |
|---|---|---|---|---|---|
| **A** | Co-located `.dsl` fragment per phase + root workspace via `!include` + per-view **SVG** exported beside each doc, embedded `![](./view.svg)` | **High** — crisp static vector image, zero extensions, works in the built-in preview | **Low–med** — SVGs are generated artifacts; drift only if export isn't re-run (mitigate: regen script / CI check) | **Med** — SVG export needs Playwright/headless Chromium + build-from-source/preview `.war` | ✅ DSL stays the single source; images are pure exports |
| **B** | Same fragment/workspace layout; **auto-generated Mermaid** fenced blocks injected into each `.md` | **Good** — native rendering since VS Code 1.121, no extension; but reduced fidelity vs Structurizr's renderer (official caveat) | **Med** — generated code inside docs churns and invites accidental manual edits | **Low** — plain `export -format mermaid`, no browser/Java | ✅ only if the policy explicitly allows *generated* (never hand-edited) Mermaid |
| **C** | Per-view **PNG** export embedded as `![](./view.png)` | Good — static, no vector zoom; larger binary files | Same as A | Same as A (same Playwright renderer) | ✅ exports only |
| **D** | Live `.dsl` preview extension (`vimpelcom.c4-varp`, `systemticks.c4-dsl-extension`) while editing fragments | N/A for Markdown — previews `.dsl` files, not `.md` | None (always live) | **High** — Java 17+ and/or sending the base64 model to public kroki.io/structurizr.com; both extensions have small/immature install bases | ✅ — companion to a fragment workflow, not a docs solution |
| **E** | Structurizr `static` site export + `<iframe>` embed in docs | Poor in VS Code preview (scripted iframe is a web feature; preview security restricts active content) | Med | Med | ✅ but not Markdown-native |
| **F** | `export -format plantuml/c4plantuml` + `jebbs.plantuml` preview | Good for `.puml` files / `@startuml` blocks via the extension (3.7M installs, well maintained) — but Markdown preview depends on the extension, not built-in support | Med | Med — Java/Graphviz or a PlantUML server | ✅ generated PlantUML only; a second text-artifact format to review |

---

## Recommended approaches (2–3)

1. **Option A (+ C as a fallback format) — recommended primary.** Move the workspace root to a common ancestor (e.g. `docs/architecture/workspace.dsl`), give each phase doc a co-located `.dsl` fragment composed via `!include`, export each view to SVG (PNG fallback) beside the phase doc, and embed with `![](./view-name.svg)`. Highest fidelity, zero VS Code extensions, and the DSL remains the single source of truth — images are explicitly *generated* artifacts, fully compatible with the "no hand-authored mermaid" policy. Main cost: the SVG renderer's tooling requirement (Playwright; build-from-source/preview `.war`) — pin this in a regeneration script/CI step.
2. **Option B — lightweight complement or fallback.** Auto-injected Mermaid blocks give extension-free, diffable, text-only previews (native since VS Code 1.121 — https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks). Accept the official fidelity caveat (https://docs.structurizr.com/export) and tighten the policy wording to "Mermaid is allowed **only** when generated by `export -format mermaid`".
3. **Option D — editing-time companion (optional).** For live feedback while authoring fragments, recommend one DSL preview extension: `vimpelcom.c4-varp` (local webview, `!include` support) or `systemticks.c4-dsl-extension` (Java 17+ required; note the model is sent base64 to a *public* rendering service — a privacy consideration). Avoid `ciarant.vscode-structurizr` for preview purposes (highlighting only).

**Cross-cutting tooling note for the skills:** the repo's guidance should plan a migration off the EOL `structurizr/cli` (https://github.com/structurizr/cli) and EOL Structurizr Lite (https://docs.structurizr.com/lite/quickstart) toward the new `export` / `local` commands (https://docs.structurizr.com/commands, https://docs.structurizr.com/local).
