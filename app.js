const storyNav = document.querySelector('.story-nav');
const chapterLinks = [...storyNav.querySelectorAll('a')];
const chapters = chapterLinks.map(link => document.getElementById(link.hash.slice(1)));
let selectedChapter = chapters[0];
let activeChapter = 'overview';
document.body.dataset.chapter = activeChapter;
const chapterOffsets = new Map();

function showChapter(chapter) {
  if (chapter !== selectedChapter) {
    chapterOffsets.set(selectedChapter, Math.max(0, window.scrollY - entrance.offsetHeight));
    selectedChapter = chapter;
    activeChapter = chapter.id.slice('panel-'.length);
    document.body.dataset.chapter = activeChapter;
    entrance.hidden = chapter !== chapters[0];
    chapters.forEach((panel, index) => {
      const selected = panel === chapter;
      panel.hidden = !selected;
      if (selected) chapterLinks[index].setAttribute('aria-current', 'location');
      else chapterLinks[index].removeAttribute('aria-current');
    });
    storyNav.dispatchEvent(new Event('chapterchange'));
  }
  const top = entrance.offsetHeight + (chapterOffsets.get(chapter) ?? 0);
  window.scrollTo({ top, behavior: 'instant' });
  queueEntrance();
}

function chapterFromUrl() {
  const url = new URL(location.href);
  const id = url.hash && url.hash !== '#story'
    ? url.hash.slice(1)
    : `panel-${url.searchParams.get('tab') ?? 'overview'}`;
  return chapters.find(chapter => chapter.id === id);
}

function openChapterLink(event, chapter) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (location.hash !== `#${chapter.id}`) {
    const url = new URL(location.href);
    url.searchParams.delete('tab');
    url.hash = chapter.id;
    history.pushState(null, '', url);
  }
  if (chapter !== selectedChapter || entrance.getBoundingClientRect().bottom > 0) {
    showChapter(chapter);
  }
}

chapterLinks.forEach((link, index) => {
  link.addEventListener('click', event => openChapterLink(event, chapters[index]));
});
document.querySelectorAll('a[data-open-chapter]').forEach(link => {
  const chapter = chapters.find(panel => `#${panel.id}` === link.hash);
  if (chapter) link.addEventListener('click', event => openChapterLink(event, chapter));
});
document.querySelector('.skip').addEventListener('click', event => {
  openChapterLink(event, chapters[0]);
  if (event.defaultPrevented) chapters[0].focus({ preventScroll: true });
});
window.addEventListener('popstate', () => {
  const chapter = chapterFromUrl();
  if (chapter && chapter !== selectedChapter) showChapter(chapter);
});

// The door position follows native scrolling in both directions.
const entrance = document.querySelector('.entrance');
const entranceStage = entrance.querySelector('.entrance-stage');
const reveal = entrance.querySelector('.page-reveal');
const skipIntro = entrance.querySelector('.intro-skip');
const seedVideo = entrance.querySelector('video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const takeoffProgress = .91;
const arrivalRunway = Number(getComputedStyle(entrance).getPropertyValue('--arrival-runway'));
let entranceFrame = 0;

function renderEntrance() {
  entranceFrame = 0;
  const entranceBounds = entrance.getBoundingClientRect();
  const skipAnimation = entrance.hidden || reducedMotion.matches;
  // Reserve the extra scroll distance for the destination before takeoff.
  const range = entranceBounds.height - window.innerHeight - entranceStage.getBoundingClientRect().height * arrivalRunway;
  const progress = skipAnimation ? 1 : Math.max(0, Math.min(1, -entranceBounds.top / Math.max(1, range)));
  const takeoff = window.innerHeight + Math.max(0, range) * (1 - takeoffProgress);
  const flight = skipAnimation ? 0 : Math.max(0, Math.min(1, 1 - entranceBounds.bottom / takeoff));
  const door = Math.max(0, Math.min(1, (progress - .025) / .20));
  const travel = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (progress - .25) / .60));
  const arrival = Math.max(0, Math.min(1, (travel - .65) / .35));
  entrance.style.setProperty('--travel', travel);
  entrance.style.setProperty('--seed-flight', flight);
  // Spring turns to autumn while the seed walks to the destination.
  const seasonLinear = Math.max(0, Math.min(1, (travel - .08) / .8));
  entrance.style.setProperty('--season', seasonLinear * seasonLinear * (3 - 2 * seasonLinear));
  document.body.classList.toggle('seed-on-path', travel > .02 && entranceBounds.bottom >= window.innerHeight - 2);
  document.body.classList.toggle('seed-arrived', travel >= .94);
  entrance.style.setProperty('--arrival', arrival);
  entrance.style.setProperty('--arrival-y', `${(1-arrival)*65}px`);
  entrance.querySelectorAll('.forest-tree').forEach(tree => {
    const depth = Number(tree.dataset.depth);
    const x = Number(tree.dataset.x);
    const spread = 1 + travel * (2.8 + depth * .8);
    tree.style.transform = `translateX(calc(-50% + ${x * spread}vw)) translateY(${travel * (80 + depth * 55)}px) scale(${(.55 + depth * .25) * (1 + travel * 2.7)}) rotateZ(${Math.sin(travel * 2) * (x < 0 ? -1 : 1)}deg)`;
    tree.style.opacity = Math.max(0, Math.min(1, (.78-travel) * 6));
  });
  entrance.style.setProperty('--door-progress', door);
  entrance.style.setProperty('--intro-opacity', Math.max(0, 1 - progress / .3));
  entrance.style.setProperty('--intro-y', `${-progress * 100}px`);
  entrance.style.setProperty('--reveal-scale', .94 + .06 * door);
  const open = door >= 1 || reducedMotion.matches;
  entrance.classList.toggle('is-open', open);
  reveal.inert = !open;
  skipIntro.disabled = open;
  updateGuide(progress, flight, entranceBounds.bottom <= 0);
  updateSeedFlight(flight);
  if (typeof updateStoryScenes === 'function') updateStoryScenes();
  if (reducedMotion.matches || document.hidden) seedVideo.pause();
  else if (seedVideo.paused) seedVideo.play().catch(() => {});
}
function queueEntrance() {
  if (!entranceFrame) entranceFrame = requestAnimationFrame(renderEntrance);
}
window.addEventListener('scroll', queueEntrance, { passive: true });
window.addEventListener('resize', queueEntrance);
reducedMotion.addEventListener('change', queueEntrance);
skipIntro.addEventListener('click', () => {
  showChapter(chapters[0]);
  chapters[0].focus({ preventScroll: true });
});
seedVideo.addEventListener('error', () => { seedVideo.hidden = true; });
// Keep the same character above the doors and outside the sticky clipping area.
const guide = document.querySelector('.intro-character');
const speechTitle = guide.querySelector('.speech h2');
const speechBody = guide.querySelector('.speech p');
const speechLabel = guide.querySelector('.speech-label');
document.body.append(guide);
const guideToggle = document.createElement('button');
guideToggle.type = 'button';
guideToggle.className = 'guide-toggle';
guideToggle.textContent = '설명 접기';
guideToggle.setAttribute('aria-expanded', 'true');
guideToggle.addEventListener('click', () => {
  const collapsed = guide.classList.toggle('is-collapsed');
  guideToggle.textContent = collapsed ? '설명 보기' : '설명 접기';
  guideToggle.setAttribute('aria-expanded', String(!collapsed));
});
guide.append(guideToggle);
const guideMessages = {
  intro: ['안녕, 난 링아웃의 작은 씨앗!', '우리 같이 움직여볼까?'],
  hero: ['링아웃을 소개할게', '알람을 끄는 것에서, 실제로 움직이는 것으로.', '목표 지점에 도착하는 아침을 만들어봐.'],
  journey: ['이렇게 시작하면 돼', '목표를 정하고, 출발하고, 도착!', '오늘 밤의 계획을 내일의 첫 행동으로 이어봐.'],
  overview: ['우리가 시작한 질문', '눈을 떴는데, 왜 아직 침대일까?', '링아웃이 기상 이후의 행동에 집중한 이유야.'],
  hypotheses: ['데이터로 확인한 이야기', '최초 알람 울림의 70%가 오전이었어.', '모임 결과는 아직 초기 관측이야. 한계도 같이 살펴봐!'],
  metaverse: ['링아웃 월드', '나를 누르면 링아웃 월드로 데려다줄게!', '새 창에서 광장이 열려. 드래그하면 나를 옮길 수도 있어.'],
  tech: ['기술적 도전', '안정적인 아침 뒤에는 어떤 고민이 있을까?', '가상 사례와 실제 iOS 알람 복구 사례를 함께 살펴봐.'],
  closing: ['이제 너의 아침으로', '내일의 첫 행동, 같이 시작해볼까?', '링아웃 만나보기에서 실제 서비스를 확인할 수 있어.']
};
let guideMessageKey = '';
let manualPosition = null;
let idleReturnTimer;
let portalTimer;
let dragState = null;
let entrancePhase = 'center';
function updateGuide(progress, flight, landed) {
  if (!landed && entrancePhase === 'docked') {
    clearTimeout(idleReturnTimer);
    clearTimeout(portalTimer);
    portal.classList.remove('is-visible');
    guide.classList.remove('portal-out', 'portal-in');
    manualPosition = null;
    dragState = null;
    dragHandle.classList.remove('is-dragging');
    guide.style.setProperty('--drag-x', '0px');
    guide.style.setProperty('--drag-y', '0px');
  }
  entrancePhase = landed ? 'docked' : flight > 0 ? 'flying' : 'center';
  const dock = landed ? 1 : 0;
  const dockLayout = landed || flight > 0 ? 1 : 0;
  const awaitingLanding = !landed && (progress > .26 || reducedMotion.matches);
  guide.classList.toggle('is-awaiting-landing', awaitingLanding);
  guide.inert = awaitingLanding;
  const mobile = window.innerWidth <= 760;
  const initialWidth = Math.min(360, window.innerWidth - 32);
  const dockWidth = mobile ? 150 : 216;
  const width = initialWidth + (dockWidth - initialWidth) * dockLayout;
  const targetY = window.innerHeight - (mobile ? 132 : 176);
  guide.style.setProperty('--guide-x', `${window.innerWidth / 2 + (window.innerWidth - dockWidth / 2 - (mobile ? 12 : 24) - window.innerWidth / 2) * dockLayout}px`);
  guide.style.setProperty('--guide-y', `${window.innerHeight / 2 + (targetY - window.innerHeight / 2) * dockLayout}px`);
  guide.style.setProperty('--guide-width', `${width}px`);
  guide.style.setProperty('--seed-size', `${(mobile ? 210 : 245) + ((mobile ? 88 : 126) - (mobile ? 210 : 245)) * dockLayout}px`);
  guide.style.setProperty('--speech-size', `${(mobile ? 26 : 29) + ((mobile ? 14 : 15) - (mobile ? 26 : 29)) * dockLayout}px`);
  guide.classList.toggle('is-docked', dockLayout === 1);
  dragHandle.disabled = dock !== 1;
  document.body.classList.toggle('guide-active', dock >= .8);
  let key = dockLayout === 0 ? 'intro' : 'hero';
  if (key !== 'intro') {
    const anchor = window.innerHeight * .6;
    for (const [selector, name] of [['.story', activeChapter], ['.closing','closing']]) {
      const section = document.querySelector(selector);
      // 숨겨진 구역(메타버스 탭의 하단 마무리)은 안내 문구 전환에 쓰지 않는다.
      if (section.getClientRects().length && section.getBoundingClientRect().top <= anchor) key = name;
    }
  }
  if (key !== guideMessageKey) {
    guideMessageKey = key;
    const [label, title, body] = guideMessages[key];
    speechLabel.textContent = label;
    speechTitle.textContent = title;
    speechBody.textContent = body;
    const storyNote = document.querySelector('.story .inline-guide-copy');
    if (storyNote && ['overview', 'metaverse', 'hypotheses', 'tech'].includes(key)) storyNote.textContent = `${title} ${body}`;
  }
  window.updateResearchGuide?.(key, dock);
}
function updateSeedFlight(progress) {
  flyingSeed.hidden = progress <= 0 || progress >= 1;
  if (flyingSeed.hidden) return;

  const launch = window.getSeedLaunchBox?.() ?? {
    x: innerWidth * .4,
    y: innerHeight * .68,
    size: innerHeight * .27,
  };
  const landing = seedVideo.getBoundingClientRect();
  const endX = landing.left + landing.width / 2;
  const endY = landing.top + landing.height / 2;
  const arc = Math.sin(Math.PI * progress);
  const x = launch.x + (endX - launch.x) * progress;
  const y = launch.y + (endY - launch.y) * progress - Math.min(220, innerHeight * .28) * arc;
  const size = launch.size + (landing.width - launch.size) * progress + launch.size * .6 * arc;

  flyingSeed.style.left = `${x}px`;
  flyingSeed.style.top = `${y}px`;
  flyingSeed.style.width = `${size}px`;
  flyingSeed.style.rotate = `${(launch.rotation ?? 0) * (1 - progress) + 12 * arc}deg`;
}
window.addEventListener('popstate', queueEntrance);
document.addEventListener('visibilitychange', queueEntrance);
// Drag the guide as one group: character, bubble, and controls.
const dragHandle = document.createElement('button');
dragHandle.type = 'button';
dragHandle.className = 'seed-drag-handle';
dragHandle.setAttribute('aria-label', '씨앗 캐릭터 이동. 방향키로 이동, Home 키로 제자리로 돌아가기');
seedVideo.replaceWith(dragHandle);
dragHandle.append(seedVideo);
const dragHint = document.createElement('span');
dragHint.className = 'drag-hint';
dragHint.textContent = '나를 누르면 설명해줄게!';
guide.append(dragHint);
const portal = document.createElement('div');
portal.className = 'seed-portal';
portal.setAttribute('aria-hidden', 'true');
document.body.append(portal);
const flyingSeed = new Image();
flyingSeed.src = './assets/seed-front-original.png';
flyingSeed.alt = '';
flyingSeed.className = 'seed-flight';
flyingSeed.hidden = true;
document.body.append(flyingSeed);
for (const [selector, key] of [['.hero-copy', 'hero'], ['.story', 'overview'], ['.closing', 'closing']]) {
  const note = document.createElement('p');
  note.className = 'inline-guide-copy';
  note.textContent = `${guideMessages[key][1]} ${guideMessages[key][2]}`;
  document.querySelector(selector).append(note);
}
function resetCharacter() {
  clearTimeout(idleReturnTimer);
  if (!manualPosition) return;
  if (reducedMotion.matches) {
    manualPosition = null;
    guide.style.setProperty('--drag-x', '0px'); guide.style.setProperty('--drag-y', '0px');
    return;
  }
  positionEntrancePortal();
  portal.classList.add('is-visible');
  guide.classList.add('portal-out');
  portalTimer = setTimeout(() => {
    manualPosition = null;
    guide.style.setProperty('--drag-x', '0px'); guide.style.setProperty('--drag-y', '0px');
    positionEntrancePortal();
    guide.classList.remove('portal-out');
    guide.classList.add('portal-in');
    portalTimer = setTimeout(() => {
      guide.classList.remove('portal-in');
      portal.classList.remove('is-visible');
    }, 850);
  }, 760);
}
function scheduleReturn() {
  clearTimeout(idleReturnTimer);
  idleReturnTimer = setTimeout(resetCharacter, 10000);
}
function moveCharacter(dx, dy) {
  const rect = guide.getBoundingClientRect();
  const current = manualPosition || { x: 0, y: 0 };
  const x = current.x + Math.max(8 - rect.left, Math.min(dx, innerWidth - rect.right - 8));
  const y = current.y + Math.max(8 - rect.top, Math.min(dy, innerHeight - rect.bottom - 8));
  manualPosition = { x, y };
  guide.style.setProperty('--drag-x', `${x}px`);
  guide.style.setProperty('--drag-y', `${y}px`);
}
dragHandle.addEventListener('pointerdown', event => {
  if (!guide.classList.contains('is-docked') || event.button !== 0) return;
  clearTimeout(idleReturnTimer);
  clearTimeout(portalTimer);
  portal.classList.remove('is-visible');
  guide.classList.remove('portal-out', 'portal-in');
  dragState = { x: event.clientX, y: event.clientY };
  dragHandle.setPointerCapture(event.pointerId);
  dragHandle.classList.add('is-dragging');
});
dragHandle.addEventListener('pointermove', event => {
  if (!dragState) return;
  moveCharacter(event.clientX - dragState.x, event.clientY - dragState.y);
  dragState = { x: event.clientX, y: event.clientY };
});
function finishDrag() {
  if (!dragState) return;
  dragState = null;
  dragHandle.classList.remove('is-dragging');
  scheduleReturn();
}
dragHandle.addEventListener('pointerup', finishDrag);
dragHandle.addEventListener('pointercancel', finishDrag);
dragHandle.addEventListener('lostpointercapture', finishDrag);
dragHandle.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-20,0], ArrowRight:[20,0], ArrowUp:[0,-20], ArrowDown:[0,20] };
  if (event.key === 'Home') { event.preventDefault(); resetCharacter(); }
  if (moves[event.key] && guide.classList.contains('is-docked')) {
    event.preventDefault(); moveCharacter(...moves[event.key]); scheduleReturn();
  }
});
window.addEventListener('resize', () => {
  if (manualPosition) { manualPosition = null; guide.style.setProperty('--drag-x', '0px'); guide.style.setProperty('--drag-y', '0px'); }
});
function positionEntrancePortal() {
  const rect = seedVideo.getBoundingClientRect();
  portal.style.left = `${rect.left + rect.width / 2}px`;
  const mouthY = rect.top + rect.height / 2;
  portal.style.top = `${mouthY}px`;
  portal.style.width = `${Math.max(112, rect.width * .82)}px`;
  const group = guide.getBoundingClientRect();
  guide.style.setProperty('--portal-cut', `${Math.max(0, group.bottom - mouthY)}px`);
  guide.style.setProperty('--sink-distance', `${rect.height + 24}px`);
}

renderEntrance();

if (location.hash || new URL(location.href).searchParams.has('tab')) {
  const chapter = chapterFromUrl();
  if (chapter) showChapter(chapter);
}
