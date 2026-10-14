#!/usr/bin/env node
// Build: bundle the extension with the package version injected as
// `__EXTENSION_VERSION__`, so the shipped User-Agent always carries the
// tagged release version (see src/extension-version.ts).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = String(pkg.version ?? 'dev');

execFileSync(
  'npx',
  [
    'esbuild',
    'src/extension.ts',
    '--bundle',
    '--outfile=dist/extension.cjs',
    '--external:vscode',
    '--format=cjs',
    '--platform=node',
    `--define:__EXTENSION_VERSION__=${JSON.stringify(version)}`,
  ],
  { cwd: root, stdio: 'inherit' }
);
