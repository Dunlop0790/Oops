// Concatenates the shared simulation with the browser client (client/app.js)
// and emits the same shared code as an ES module for the server (server/core.mjs).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SHARED_FILES = ['config.js', 'sim.js', 'ai.js'];
const CLIENT_FILES = ['render-terrain.js', 'render-entities.js', 'net.js', 'app.js'];

const readAll = (folder, files) => files.map((file) => readFileSync(join(ROOT, 'src', folder, file), 'utf8')).join('\n');
const sharedSource = readAll('shared', SHARED_FILES);
const clientSource = readAll('client', CLIENT_FILES);

mkdirSync(join(ROOT, 'docs'), { recursive: true });
mkdirSync(join(ROOT, 'server'), { recursive: true });

writeFileSync(join(ROOT, 'docs', 'app.js'), `'use strict';\n${sharedSource}\n${clientSource}`);
copyFileSync(join(ROOT, 'src', 'client', 'index.html'), join(ROOT, 'docs', 'index.html'));

const topLevelNames = [...sharedSource.matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((match) => match[1]);
const uniqueNames = [...new Set(topLevelNames)];
writeFileSync(join(ROOT, 'server', 'core.mjs'), `${sharedSource}\nexport { ${uniqueNames.join(', ')} };\n`);

console.log(`Built docs/app.js and server/core.mjs (${uniqueNames.length} shared exports).`);
