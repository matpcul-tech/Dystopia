// Assemble the offline folder Capacitor copies into the iOS and Android apps.
// GitHub Pages keeps serving the repo root. This script does not edit it.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const www = join(root, 'www');

const files = [
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'game.js',
  'humans.js',
  'signup.js',
  'cinematics.js',
  'commercial.js',
  'season-pass.js',
  'return-loop.js',
  'portraits.js',
  'feel.js',
  'voices.js',
  'sky.jpg',
  'book1-cover.jpg',
];

const dirs = [
  'vendor',
  'icons',
  'models',
  'media/shorts',
];

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const file of files) {
  cpSync(join(root, file), join(www, file));
}
for (const dir of dirs) {
  cpSync(join(root, dir), join(www, dir), { recursive: true });
}
cpSync(join(root, 'native/native-shell.js'), join(www, 'native-shell.js'));

const indexPath = join(www, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const tag = '<script src="native-shell.js"></script>';
if (!html.includes(tag)) {
  html = html.replace('</head>', `  ${tag}\n</head>`);
  writeFileSync(indexPath, html);
}

console.log('offline bundle written to www/');
