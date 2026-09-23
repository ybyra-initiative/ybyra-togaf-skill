#!/usr/bin/env node
/**
 * togaf-agent-skills — zero-dependency CLI installer & contribution sync tool.
 *
 * Usage:
 *   npx github:ybyra-initiative/ybyra-togaf-skill              Install / pull skills
 *   npx github:ybyra-initiative/ybyra-togaf-skill --update      Re-sync skills
 *   npx github:ybyra-initiative/ybyra-togaf-skill --sync-back   Contribute local edits back upstream
 *   Options: --force/-f (overwrite), --dry-run (validate only)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const C = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

const args = process.argv.slice(2);
const flags = {
  force: args.includes("--force") || args.includes("-f"),
  dryRun: args.includes("--dry-run"),
  syncBack: args.includes("--sync-back") || args.includes("-s"),
  update: args.includes("--update"),
  help: args.includes("--help") || args.includes("-h"),
};

const icon = {
  ok: `${C.green}[✓]${C.reset}`,
  warn: `${C.yellow}[!]${C.reset}`,
  info: `${C.cyan}[i]${C.reset}`,
  up: `${C.cyan}[↑]${C.reset}`,
  err: `${C.red}[x]${C.reset}`,
};

function usage() {
  console.log(`
${C.bold}togaf-agent-skills${C.reset} — TOGAF ADM Agent Skills installer & contribution tool

${C.bold}Usage${C.reset}
  npx github:ybyra-initiative/ybyra-togaf-skill [mode] [options]

${C.bold}Modes${C.reset}
  (default) / --update   Install or re-sync skills into ./.agents/skills/
  --sync-back, -s        Copy local ./.agents/skills edits back to this repo clone

${C.bold}Options${C.reset}
  --force, -f            Overwrite existing files without prompting
  --dry-run              Validate paths and show plan without writing
  --help, -h             Show this help
`);
}

/** Resolve the repository root: prefer the directory containing this script (works under npx cache), fall back to cwd. */
function resolveSource() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [scriptDir, process.cwd(), process.env.npm_package_root || ""];
  for (const c of candidates) {
    if (!c) continue;
    const p = path.join(c, "skills");
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "togaf-orchestrator", "SKILL.md"))) return c;
  }
  console.error(`${icon.err} Could not locate skills/ source directory. Run from the repository clone.`);
  process.exit(1);
}

/** Canonical pack: 4 cross-cutting + 8 TOGAF ADM phase skills + 2 modeling standards. */
const EXPECTED_SKILLS = [
  "togaf-orchestrator",
  "togaf-diagnose",
  "togaf-evaluate",
  "togaf-deliverable-engine",
  "togaf-phase-a-vision",
  "togaf-phase-b-business",
  "togaf-phase-c-information",
  "togaf-phase-d-technology",
  "togaf-phase-e-opportunities",
  "togaf-phase-f-migration",
  "togaf-phase-g-governance",
  "togaf-phase-h-change",
  "c4-model",
  "structurizr-dsl",
];

const SOURCE_ROOT = resolveSource();
const SKILLS_SRC = path.join(SOURCE_ROOT, "skills");

/** Discover skills dynamically, then validate the pack against EXPECTED_SKILLS. */
function discoverSkills() {
  const found = fs
    .readdirSync(SKILLS_SRC)
    .filter((d) => fs.statSync(path.join(SKILLS_SRC, d)).isDirectory());

  const missing = EXPECTED_SKILLS.filter((n) => !found.includes(n));
  const unexpected = found.filter((n) => !EXPECTED_SKILLS.includes(n));
  const broken = EXPECTED_SKILLS.filter(
    (n) => found.includes(n) && !fs.existsSync(path.join(SKILLS_SRC, n, "SKILL.md"))
  );

  const problems = [];
  if (missing.length) problems.push(`Missing expected skill dir(s): ${missing.join(", ")}`);
  if (unexpected.length) problems.push(`Unexpected skill dir(s): ${unexpected.join(", ")}`);
  if (broken.length) problems.push(`Skill(s) missing SKILL.md: ${broken.join(", ")}`);
  if (problems.length) {
    for (const p of problems) console.error(`${icon.err} ${p}`);
    console.error(`\n${icon.err} Skill pack validation failed — expected exactly ${EXPECTED_SKILLS.length} skills.`);
    process.exit(1);
  }
  // Install & sync-back iterate in canonical order.
  return EXPECTED_SKILLS;
}

const SKILL_NAMES = discoverSkills();

function copyDirRecursive(src, dest, { force, dryRun }, results) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      if (!dryRun) fs.mkdirSync(d, { recursive: true });
      copyDirRecursive(s, d, { force, dryRun }, results);
    } else {
      if (fs.existsSync(d) && !force) {
        const same = fs.readFileSync(s, "utf8") === fs.readFileSync(d, "utf8");
        if (same) {
          results.unchanged.push(d);
          continue;
        }
        results.skipped.push(d);
        continue;
      }
      if (!dryRun) {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
      }
      results.synced.push(d);
    }
  }
}

function copySkillDirBack(src, dest, { dryRun }, results) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      if (!dryRun) fs.mkdirSync(d, { recursive: true });
      copySkillDirBack(s, d, { dryRun }, results);
    } else {
      const sContent = fs.existsSync(s) ? fs.readFileSync(s, "utf8") : "";
      const dContent = fs.existsSync(d) ? fs.readFileSync(d, "utf8") : "";
      if (sContent !== dContent) {
        if (!dryRun) {
          fs.mkdirSync(path.dirname(d), { recursive: true });
          fs.copyFileSync(s, d);
        }
        results.staged.push(d);
      } else {
        results.unchanged.push(d);
      }
    }
  }
}

function gitDiffSummary(file) {
  try {
    return execSync(`git -C "${SOURCE_ROOT}" diff --stat -- "${path.relative(SOURCE_ROOT, file)}"`, {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function install() {
  const dest = path.join(process.cwd(), ".agents", "skills");
  const results = { synced: [], skipped: [], unchanged: [] };
  console.log(`\n${C.bold}TOGAF Agent Skills Installer${C.reset} ${C.dim}(dry-run: ${flags.dryRun})${C.reset}\n`);
  for (const name of SKILL_NAMES) {
    const src = path.join(SKILLS_SRC, name);
    const dst = path.join(dest, name);
    const before = { synced: results.synced.length, skipped: results.skipped.length };
    copyDirRecursive(src, dst, { force: flags.force, dryRun: flags.dryRun }, results);
    const added = results.synced.length - before.synced;
    const skipped = results.skipped.length - before.skipped;
    if (skipped > 0) {
      console.log(`${icon.warn} Collisions in ${C.bold}${name}${C.reset} (${skipped} file(s)). Use --force to overwrite.`);
    } else if (added > 0 || flags.force) {
      console.log(`${icon.ok} Synced ${C.bold}${name}${C.reset}${flags.dryRun ? C.dim + " (dry-run)" + C.reset : ""}`);
    } else {
      console.log(`${icon.info} Up-to-date ${C.bold}${name}${C.reset}`);
    }
  }
  console.log(`\n${C.dim}Synced: ${results.synced.length} | Collisions: ${results.skipped.length} | Unchanged: ${results.unchanged.length}${C.reset}`);
  if (results.skipped.length > 0 && !flags.dryRun) {
    console.log(`${icon.warn} Some files were not overwritten. Re-run with ${C.bold}--force${C.reset} to overwrite.`);
  }
  console.log(`\n${icon.info} Skills installed to ${C.cyan}${path.relative(process.cwd(), dest)}${C.reset}. See README.md for the contribution loop.\n`);
}

function syncBack() {
  const local = path.join(process.cwd(), ".agents", "skills");
  if (!fs.existsSync(local)) {
    console.error(`${icon.err} No ${C.bold}.agents/skills${C.reset} directory found in the current project. Nothing to sync back.`);
    process.exit(1);
  }
  const results = { staged: [], unchanged: [] };
  console.log(`\n${C.bold}Sync-Back: Contribution Mode${C.reset} ${C.dim}(dry-run: ${flags.dryRun})${C.reset}\n`);
  for (const name of SKILL_NAMES) {
    const src = path.join(local, name);
    if (!fs.existsSync(src)) continue;
    const before = results.staged.length;
    copySkillDirBack(src, path.join(SKILLS_SRC, name), { dryRun: flags.dryRun }, results);
    if (results.staged.length > before) {
      console.log(`${icon.up} Staged contribution for ${C.bold}${name}${C.reset}`);
    }
  }
  if (results.staged.length === 0) {
    console.log(`${icon.info} No local modifications detected — upstream skills are already up to date.\n`);
    return;
  }
  for (const f of results.staged) {
    const summary = gitDiffSummary(f);
    if (summary) console.log(`${C.dim}${summary}${C.reset}`);
  }
  console.log(`\n${icon.info} Copied ${results.staged.length} modified file(s) into the upstream repo clone.`);
  if (flags.dryRun) {
    console.log(`${C.dim}Dry run — no files written.${C.reset}\n`);
    return;
  }
  console.log(`
${C.bold}Next steps to open a Pull Request:${C.reset}
  1. ${C.cyan}cd ${SOURCE_ROOT}${C.reset}
  2. ${C.cyan}git diff${C.reset}                       ${C.dim}# review changes${C.reset}
  3. ${C.cyan}git checkout -b feat/skill-refinement${C.reset}
  4. ${C.cyan}git add skills/ && git commit -m "refine: skill improvements from field usage"${C.reset}
  5. ${C.cyan}git push origin feat/skill-refinement${C.reset} and open a PR on GitHub.

${C.dim}Reminder: per skill instructions, log refinements in docs/architecture/skill-feedback.md of your project.${C.reset}\n`);
}

if (flags.help) {
  usage();
} else if (flags.syncBack) {
  syncBack();
} else {
  install();
}
