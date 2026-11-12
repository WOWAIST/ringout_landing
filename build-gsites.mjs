// 구글 사이트 '삽입 > 코드 삽입'에 붙여 넣을 단일 HTML을 만든다.
// CSS·JS는 문서 안에 넣고, 이미지·영상·폰트·Three.js는 공개 GitHub 저장소를 jsDelivr로 불러온다.
// 사용: npm run build:gsites  (자산 주소를 바꾸려면 ASSET_BASE=https://.../ npm run build:gsites)
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const REPO = 'WOWAIST/ringout_landing';
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();

let base = process.env.ASSET_BASE;
if (!base) {
  const sha = git('rev-parse HEAD');
  const pushed = git(`branch -r --contains ${sha}`);
  if (!pushed) console.warn(`경고: ${sha.slice(0, 7)} 커밋이 원격 저장소에 없습니다. 푸시해야 CDN에서 자산을 불러올 수 있습니다.`);
  const dirtyAssets = git('status --porcelain -- assets');
  if (dirtyAssets) console.warn('경고: 커밋하지 않은 assets 변경이 있습니다. 커밋·푸시 후 다시 빌드하세요.\n' + dirtyAssets);
  base = `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/`;
}
if (!base.endsWith('/')) base += '/';

const absolutize = (text) => text.replaceAll('./assets/', `${base}assets/`).replaceAll('./favicon.svg', `${base}favicon.svg`);
const safeScript = (code) => code.replace(/<\/script/gi, '<\\/script');
const read = (file) => readFile(file, 'utf8');

// 섹션 포함은 build.mjs와 같은 규칙을 따른다.
// 구글 사이트 삽입본에는 서비스 이야기와 메타버스만 넣는다. 가설 검증·기술적 도전 본문과 탭 버튼은 뺀다.
// effects.js가 #panel-hypotheses를 찾으므로 그 자리에는 숨긴 빈 패널만 남긴다.
const EXCLUDED_SECTIONS = {
  'sections/hypothesis-validation.html': '<section class="story-chapter" id="panel-hypotheses" hidden aria-hidden="true"><div class="panel-intro"></div></section>',
  'sections/technical-challenges.html': '',
};
let html = await read('index.html');
for (const [marker, file] of [...html.matchAll(/<!-- include: (sections\/[a-z-]+\.html) -->/g)]) {
  const section = file in EXCLUDED_SECTIONS ? EXCLUDED_SECTIONS[file] : (await read(file)).trimEnd();
  html = html.replace(marker, () => section);
}
// 구글 사이트 삽입본은 탭 전환 없이 한 페이지로 이어 붙인다: 서비스 이야기 → 메타버스.
// 탭 버튼은 서비스 이야기 하나만 남겨 숨기고, 메타버스 패널은 처음부터 보이게 한다.
// ‘메타버스로 이동’ 버튼은 같은 페이지의 메타버스 위치로 스크롤한다.
const navBefore = html;
html = html.replace(/\n<a id="chapter-(?:metaverse|hypotheses|tech)" [^\n]*<\/a>/g, '');
html = html.replace('<nav class="story-nav"', '<nav class="story-nav" hidden');
html = html.replace('<section class="story-chapter" id="panel-metaverse" aria-labelledby="chapter-metaverse" tabindex="-1" hidden>', '<section class="story-chapter" id="panel-metaverse" aria-labelledby="world-intro-title" tabindex="-1">');
html = html.replaceAll(' data-open-chapter', '');
if (html === navBefore || /chapter-(?:metaverse|hypotheses|tech)/.test(html) || /id="panel-metaverse"[^>]*hidden/.test(html) || html.includes('data-open-chapter')) throw new Error('한 페이지 구성 실패: index.html·섹션 구조를 확인하세요.');
const alarmFlow = (await read('assets/ringout-alarm-flow.svg')).trim();
html = html.replace('<!-- include: assets/ringout-alarm-flow.svg -->', () => alarmFlow);

// 외부 CSS·JS 연결을 제거하고 문서 안에 넣는다.
// 한 페이지 구성에 맞춘 보정: 탭 줄 높이 제거, 씨앗이 무대에서 페이지가 끝나도록 하단 마무리·푸터 숨김.
const combinedCss = `html{--story-nav-height:0px}.story-nav[hidden]{display:none}
#panel-metaverse{padding-top:0;border-top:1px solid var(--line);margin-top:24px}
:is(.closing,footer,.story>.inline-guide-copy){display:none}.story{padding-bottom:0}
html{scroll-behavior:smooth}`;
const styles = [await read('styles.css'), await read('theme.css'), combinedCss].map(absolutize).join('\n');
html = html.replace(/<link rel="stylesheet" href="\.\/[a-z]+\.css">/g, '');
html = html.replace(/<script (?:type="module" )?src="\.\/[a-z0-9]+\.js"(?: defer)?><\/script>/g, '');
html = html.replace('</head>', () => `<style>\n${styles}\n</style></head>`);

// defer 스크립트와 같은 순서로 본문 끝에서 실행한다.
const classic = [];
for (const file of ['app.js', 'effects.js', 'service.js', 'intro.js']) classic.push(`<script>\n${safeScript(absolutize(await read(file)))}\n</script>`);
const forest = absolutize(await read('forest3d.js'));
classic.push(`<script type="module">\n${safeScript(forest)}\n</script>`);
html = html.replace('</body>', () => `${classic.join('\n')}\n</body>`);
html = absolutize(html);

const leftovers = [...html.matchAll(/["'(]\.\/(?!\/)[^"')]+/g)].map((m) => m[0]);
if (leftovers.length) console.warn('경고: 상대 경로가 남아 있습니다:', [...new Set(leftovers)]);

await mkdir('dist', { recursive: true });
await writeFile('dist/google-sites-embed.html', html);
// 구글 사이트와 비슷한 sandbox iframe 안에서 확인하는 미리보기 페이지
await writeFile('dist/gsites-preview.html', `<!doctype html><meta charset="utf-8"><title>Google Sites 삽입 미리보기</title>
<body style="margin:0;background:#eee;font-family:sans-serif"><p style="padding:12px">구글 사이트 삽입 미리보기 (iframe 높이 900px)</p>
<iframe src="google-sites-embed.html" style="width:100%;height:900px;border:0" sandbox="allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox"></iframe></body>\n`);
console.log(`dist/google-sites-embed.html 생성 (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)\n자산 주소: ${base}`);
