import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '..');
const source = resolve(workspaceRoot, '../../backend/pocketbase/pb_data/seed.json');
const destination = resolve(workspaceRoot, 'src/assets/seed.json');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
