// makefun-frontend-01 entry program (Node 22, standard library only).
//
// The entry is the static frontend in this repository's app/ folder plus the
// three screenshots in screenshots/. This program hands both in: it copies
// them into the grader's output directory and writes dossier.json there,
// using buildDossier from the vendored make.fun library. The vendored file
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it — the
// scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run locally the same way the grader runs it, with MAKEFUN_OUTPUT_DIR
// standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(source)) {
    const from = join(source, name);
    const to = join(target, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else cpSync(from, to);
  }
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
  if (existsSync(join(repoRoot, 'screenshots'))) {
    copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  }
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return dossier.length;
}

const dossierBytes = handIn();
console.log(`handed in app/ + screenshots/ to ${outDir}; dossier.json is ${dossierBytes} bytes`);
