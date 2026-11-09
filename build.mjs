import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/assets', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'forest3d.js']) await copyFile(file, `dist/${file}`);
await copyFile('assets/smiling-seed-transparent.webm', 'dist/assets/smiling-seed-transparent.webm');
for (const name of ['sunleaf', 'pine', 'oak']) await copyFile(`assets/garden-${name}.png`, `dist/assets/garden-${name}.png`);
await copyFile('assets/three.module.js', 'dist/assets/three.module.js');
for (const name of ['seed-back-v1.png', 'seed-front-original.png']) await copyFile(`assets/${name}`, `dist/assets/${name}`);
console.log('Static site built in dist/');
