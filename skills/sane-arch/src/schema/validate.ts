import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { ErrorObject, ValidateFunction } from 'ajv';

// ajv ships no ESM entry for dist/2020.js; resolve through createRequire so this
// works both from the Vite config bundle and from Vite's SSR module loader.
const require = createRequire(import.meta.url);
const ajvModule = require('ajv/dist/2020.js') as { default?: new (opts: object) => AjvLike } | (new (opts: object) => AjvLike);
const Ajv2020 = (typeof ajvModule === 'function' ? ajvModule : ajvModule.default) as new (opts: object) => AjvLike;

interface AjvLike {
  addSchema: (schema: unknown) => void;
  getSchema: (id: string) => ValidateFunction | undefined;
}

const DIAGRAM_TYPES = ['architecture', 'workflow', 'lifecycle', 'dataflow', 'sequence'] as const;
export type DiagramType = (typeof DIAGRAM_TYPES)[number];

// Schemas live next door in the archify skill (Q2: consumed as-is, no changes).
// cli.js pins this via SANE_ARCH_SCHEMAS; the fallback assumes cwd is either
// skills/sane-arch (npm run dev / vitest) — resolved relative to cwd either way.
const SCHEMAS_DIR = () =>
  process.env.SANE_ARCH_SCHEMAS ?? path.resolve(process.cwd(), '../archify/schemas');

let cached: { dir: string; validators: Map<DiagramType, ValidateFunction> } | undefined;

function loadValidators(): Map<DiagramType, ValidateFunction> {
  const dir = SCHEMAS_DIR();
  if (cached && cached.dir === dir) return cached.validators;

  const ajv = new Ajv2020({ allErrors: true, strict: false });

  // common.schema.json first: the five type schemas $ref it by relative URI,
  // which ajv resolves against each schema's $id (mirrors archify's
  // scripts/generate-validators.mjs).
  ajv.addSchema(JSON.parse(readFileSync(path.join(dir, 'common.schema.json'), 'utf8')));
  const validators = new Map<DiagramType, ValidateFunction>();
  for (const type of DIAGRAM_TYPES) {
    const schema = JSON.parse(readFileSync(path.join(dir, `${type}.schema.json`), 'utf8'));
    ajv.addSchema(schema);
    const compiled = ajv.getSchema(schema.$id as string);
    if (!compiled) throw new Error(`failed to compile archify schema: ${type}.schema.json`);
    validators.set(type, compiled);
  }
  cached = { dir, validators };
  return validators;
}

function formatError(error: ErrorObject): string {
  const where = error.instancePath === '' ? '(root)' : error.instancePath;
  const missing =
    error.keyword === 'required' && typeof (error.params as { missingProperty?: string }).missingProperty === 'string'
      ? ` '${(error.params as { missingProperty: string }).missingProperty}'`
      : '';
  return `${where}${missing}: ${error.message ?? 'invalid'}`;
}

/**
 * Validate a parsed spec against its archify schema.
 * Returns a list of human-readable errors (empty = valid).
 */
export function validateSpec(spec: unknown): string[] {
  if (typeof spec !== 'object' || spec === null) {
    return ['(root): spec must be a JSON object'];
  }
  const type = (spec as { diagram_type?: unknown }).diagram_type;
  if (typeof type !== 'string' || !(DIAGRAM_TYPES as readonly string[]).includes(type)) {
    return [
      `(root) 'diagram_type': expected one of ${DIAGRAM_TYPES.join(', ')} — got ${JSON.stringify(type)}`,
    ];
  }
  const validators = loadValidators();
  const validate = validators.get(type as DiagramType);
  if (!validate) return [`no schema found for diagram_type '${type}'`];
  if (validate(spec)) return [];
  return (validate.errors ?? []).map(formatError);
}
