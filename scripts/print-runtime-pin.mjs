import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../runtime.upstream.json', import.meta.url), 'utf8'));
console.log(`${data.repository}@${data.commit}`);
