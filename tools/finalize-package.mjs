// Finalizes a dual-published package build.
//
// The package is compiled twice by tsc: CommonJS into dist/cjs and ESM into
// dist/esm. This script does the two things tsc cannot:
//
//   1. Drops a package.json "type" marker into each output folder so Node and
//      TypeScript treat dist/cjs as CommonJS and dist/esm as ESM regardless of
//      the root package.json. This is what makes core's discord.js type
//      references resolve under the same condition (import vs require) that the
//      consumer used, fixing the "separate declarations of '_parse'" clash.
//   2. Rewrites extensionless relative specifiers in the ESM output to include
//      explicit .js / /index.js extensions, which Node ESM and NodeNext type
//      resolution require. Sources stay extensionless so the existing CJS build,
//      jest, and tsx are untouched.
//
// Usage: node tools/finalize-package.mjs <packageDir>

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const packageDir = resolve(process.argv[2] ?? '.');
const cjsDir = join(packageDir, 'dist', 'cjs');
const esmDir = join(packageDir, 'dist', 'esm');

const KNOWN_EXTENSIONS = ['.js', '.mjs', '.cjs', '.json', '.node'];

function writeTypeMarker(dir, type) {
  if (!existsSync(dir)) {
    throw new Error(`Expected build output at ${dir} but it does not exist.`);
  }
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`);
}

function resolveSpecifier(fileDir, spec) {
  // Leave bare specifiers (packages) and already-extensioned paths alone.
  if (!spec.startsWith('.')) return spec;
  if (KNOWN_EXTENSIONS.some((ext) => spec.endsWith(ext))) return spec;

  const target = resolve(fileDir, spec);
  if (existsSync(target) && statSync(target).isDirectory()) {
    return `${spec}/index.js`;
  }
  return `${spec}.js`;
}

function rewriteSpecifiers(filePath, contents) {
  const fileDir = dirname(filePath);
  const patterns = [
    /(\bfrom\s*)(["'])(\.[^"']*)\2/g, // import/export ... from '...'
    /(\bimport\s*\(\s*)(["'])(\.[^"']*)\2/g, // dynamic import('...') and import('...').Type in d.ts
    /(\bimport\s+)(["'])(\.[^"']*)\2/g, // side-effect import '...'
  ];

  let result = contents;
  for (const pattern of patterns) {
    result = result.replace(pattern, (_match, prefix, quote, spec) => {
      return `${prefix}${quote}${resolveSpecifier(fileDir, spec)}${quote}`;
    });
  }
  return result;
}

function rewriteTree(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteTree(fullPath);
      continue;
    }
    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) continue;
    const original = readFileSync(fullPath, 'utf8');
    const rewritten = rewriteSpecifiers(fullPath, original);
    if (rewritten !== original) writeFileSync(fullPath, rewritten);
  }
}

writeTypeMarker(cjsDir, 'commonjs');
writeTypeMarker(esmDir, 'module');
rewriteTree(esmDir);

console.log(`Finalized dual-package output for ${packageDir}`);
