import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist/assets', { recursive: true });
for (const file of [ 'styles.css', 'app.js', 'favicon.svg', 'forest3d.js', 'theme.css', 'effects.js', 'service.js', 'intro.js']) await copyFile(file, `dist/${file}`);
await copyFile('assets/smiling-seed-transparent.webm', 'dist/assets/smiling-seed-transparent.webm');
for (const name of ['sunleaf', 'pine', 'oak']) await copyFile(`assets/garden-${name}.png`, `dist/assets/garden-${name}.png`);
await copyFile('assets/three.module.js', 'dist/assets/three.module.js');
for (const name of ['seed-back-v1.png', 'seed-front-original.png']) await copyFile(`assets/${name}`, `dist/assets/${name}`);
await copyFile('assets/PretendardVariable.woff2', 'dist/assets/PretendardVariable.woff2');
await copyFile('assets/Pretendard-LICENSE.txt', 'dist/assets/Pretendard-LICENSE.txt');
for (const name of ['ringout-mockup-alarm-setting.png','ringout-mockup-alarm-screen.png','ringout-mockup-destination-in-progress.png','ringout-group-activity.png','ringout-records-daily.png','ringout-records-calendar.png','ringout-homepage.png','hoi-origin-comic.png','ringout-alarm-flow.svg','arti-caricature.png','hoi-caricature.png']) await copyFile(`assets/${name}`, `dist/assets/${name}`);
console.log('Static site built in dist/');

const template = await readFile('index.html', 'utf8');
const includes = [...template.matchAll(/<!-- include: (sections\/[a-z-]+\.html) -->/g)];
const sections = new Map(await Promise.all(includes.map(async ([, file]) => [file, (await readFile(file, 'utf8')).trimEnd()])));
let html = template;
for (const [marker, file] of includes) html = html.replace(marker, () => sections.get(file));
await writeFile('dist/index.html', html);
