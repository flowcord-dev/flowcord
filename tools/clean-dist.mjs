// Removes a package's dist/ directory before a fresh build.
// Used by the dual-package build so stale output (e.g. from an earlier
// single-output build) never lingers in the published tree.

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist');
rmSync(dir, { recursive: true, force: true });
