import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const skip = new Set(['vendor', 'node_modules', '.git', 'shots']);
const bad = [];
const dash = /[\u2013\u2014]/;

function walk(dir){
  for (const name of readdirSync(dir)){
    if (skip.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|mjs|css|html|md|json)$/.test(name)){
      const text = readFileSync(p, 'utf8');
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        if (dash.test(line)) bad.push(p + ':' + (i + 1));
      });
    }
  }
}
walk(root);
if (bad.length){
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('no em dashes or en dashes in game text');
