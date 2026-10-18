/**
 * Content quality gate.
 *
 *   node scripts/validate-content.ts            # report everything, exit 0 unless the schema fails
 *   node scripts/validate-content.ts --strict   # also exit 1 on editorial errors (used by the deploy workflow)
 *
 * Runs on plain Node (type stripping), so it needs no bundler and can be wired
 * into any CI. Imports use explicit `.ts` extensions for that reason.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { styleText } from 'node:util';
import { z } from 'zod';
import { auditContent, hasBlockingIssues, type ContentIssue } from '../src/domain/audit.ts';
import { catalogSchema } from '../src/domain/schema/catalog.schema.ts';
import { siteConfigSchema } from '../src/domain/schema/site-config.schema.ts';

const strict = process.argv.includes('--strict');
const root = resolve(import.meta.dirname, '..');

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
}

function parseOrExit<T>(label: string, schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  console.error(styleText('red', `✖ ${label} failed schema validation`));
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

function printIssue(issue: ContentIssue): void {
  const tag =
    issue.severity === 'error' ? styleText('red', 'error  ') : styleText('yellow', 'warning');
  console.log(`  ${tag} ${styleText('dim', issue.path)}  ${issue.message}`);
}

const catalog = parseOrExit(
  'content/catalog.json',
  catalogSchema,
  readJson('content/catalog.json'),
);
const config = parseOrExit(
  'content/site.config.json',
  siteConfigSchema,
  readJson('content/site.config.json'),
);

console.log(styleText('green', '✔ Schemas valid'));

const issues = auditContent(catalog, config);
if (issues.length === 0) {
  console.log(styleText('green', '✔ No editorial findings'));
  process.exit(0);
}

console.log(`\n${issues.length} editorial finding(s):`);
issues.forEach(printIssue);

if (strict && hasBlockingIssues(issues)) {
  console.error(
    `\n${styleText('red', '✖ Blocking errors present.')} Fix them in content/ before deploying.`,
  );
  process.exit(1);
}

console.log(
  strict
    ? `\n${styleText('green', '✔ No blocking errors')}`
    : `\n${styleText('dim', 'Run with --strict to fail on errors (the deploy workflow does).')}`,
);
