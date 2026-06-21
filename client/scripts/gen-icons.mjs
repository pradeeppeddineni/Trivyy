import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const svg = readFileSync(join(pub, 'icon.svg'));

const targets = [
  { size: 192, file: 'pwa-192x192.png' },
  { size: 512, file: 'pwa-512x512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

for (const t of targets) {
  await sharp(svg).resize(t.size, t.size).png().toFile(join(pub, t.file));
  console.log('wrote', t.file);
}
