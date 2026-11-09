const tabs = [...document.querySelectorAll('[role="tab"]')];
const validTabs = new Set(tabs.map(tab => tab.id.slice(4)));
function activateTab(name, updateUrl = true) {
  if (!validTabs.has(name)) name = 'overview';
  tabs.forEach(tab => {
    const selected = tab.id === `tab-${name}`;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('tab', name);
    history.replaceState(null, '', url);
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab.id.slice(4)));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activateTab(tabs[next].id.slice(4));
    tabs[next].focus();
  });
});
activateTab(new URL(location.href).searchParams.get('tab'), false);
window.addEventListener('popstate', () => activateTab(new URL(location.href).searchParams.get('tab'), false));

// The door position follows native scrolling in both directions.
const entrance = document.querySelector('.entrance');
const reveal = entrance.querySelector('.page-reveal');
const skipIntro = entrance.querySelector('.intro-skip');
const seedVideo = entrance.querySelector('video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let entranceFrame = 0;
function renderEntrance() {
  entranceFrame = 0;
  const range = entrance.offsetHeight - window.innerHeight;
  const progress = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, -entrance.getBoundingClientRect().top / Math.max(1, range)));
  const door = Math.max(0, Math.min(1, (progress - .025) / .20));
  const travel = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (progress - .25) / .60));
  const arrival = Math.max(0, Math.min(1, (travel - .65) / .35));
  entrance.style.setProperty('--travel', travel);
  // Spring turns to autumn while the seed walks to the destination.
  const seasonLinear = Math.max(0, Math.min(1, (travel - .08) / .8));
  entrance.style.setProperty('--season', seasonLinear * seasonLinear * (3 - 2 * seasonLinear));
  document.body.classList.toggle('seed-on-path', travel > .02 && entrance.getBoundingClientRect().bottom >= window.innerHeight - 2);
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
  updateGuide(progress);
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
  window.scrollTo({ top: entrance.offsetTop + entrance.offsetHeight - window.innerHeight, behavior: 'instant' });
  renderEntrance();
  const link = reveal.querySelector('a');
  if (link) link.focus({ preventScroll: true });
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
  tech: ['기술 이야기 · 현재 가상 사례', '안정적인 아침 뒤에는 어떤 고민이 있을까?', '이 탭은 아직 예시야. 실제 기술 성과로 검증된 내용은 아니야.'],
  closing: ['이제 너의 아침으로', '내일의 첫 행동, 같이 시작해볼까?', '링아웃 만나보기에서 실제 서비스를 확인할 수 있어.']
};
let guideMessageKey = '';
let manualPosition = null;
let idleReturnTimer;
let portalTimer;
let dragState = null;
let entrancePhase = 'center';
let entrancePortalTimer;
function updateGuide(progress) {
  const pageHasMoved = progress > .26;
  if (!pageHasMoved && !reducedMotion.matches) {
    clearTimeout(entrancePortalTimer);
    if (entrancePhase !== 'center') {
      clearTimeout(idleReturnTimer);
      clearTimeout(portalTimer);
      portal.classList.remove('is-visible');
      guide.classList.remove('entrance-sink', 'entrance-emerge', 'portal-out', 'portal-in');
    }
    entrancePhase = 'center';
    manualPosition = null;
    dragState = null;
    guide.style.setProperty('--drag-x', '0px');
    guide.style.setProperty('--drag-y', '0px');
  } else if (entrancePhase === 'center') {
    if (reducedMotion.matches) entrancePhase = 'docked';
    else beginEntrancePortal();
  }
  const dock = entrancePhase === 'docked' ? 1 : 0;
  const mobile = window.innerWidth <= 760;
  const initialWidth = Math.min(360, window.innerWidth - 32);
  const dockWidth = mobile ? 150 : 216;
  const width = initialWidth + (dockWidth - initialWidth) * dock;
  const targetY = window.innerHeight - (mobile ? 132 : 176);
  guide.style.setProperty('--guide-x', `${window.innerWidth / 2 + (window.innerWidth - dockWidth / 2 - (mobile ? 12 : 24) - window.innerWidth / 2) * dock}px`);
  guide.style.setProperty('--guide-y', `${window.innerHeight / 2 + (targetY - window.innerHeight / 2) * dock}px`);
  guide.style.setProperty('--guide-width', `${width}px`);
  guide.style.setProperty('--seed-size', `${(mobile ? 210 : 245) + ((mobile ? 88 : 126) - (mobile ? 210 : 245)) * dock}px`);
  guide.style.setProperty('--speech-size', `${(mobile ? 26 : 29) + ((mobile ? 14 : 15) - (mobile ? 26 : 29)) * dock}px`);
  guide.classList.toggle('is-docked', dock === 1);
  dragHandle.disabled = dock !== 1;
  document.body.classList.toggle('guide-active', dock >= .8);
  let key = dock === 0 && !reducedMotion.matches ? 'intro' : 'hero';
  if (key !== 'intro') {
    const anchor = window.innerHeight * .6;
    for (const [selector, name] of [['.journey','journey'], ['.story', 'story'], ['.closing','closing']]) {
      if (document.querySelector(selector).getBoundingClientRect().top <= anchor) key = name;
    }
    if (key === 'story') key = document.querySelector('[role="tab"][aria-selected="true"]').id.slice(4);
  }
  if (key !== guideMessageKey) {
    guideMessageKey = key;
    const [label, title, body] = guideMessages[key];
    speechLabel.textContent = label;
    speechTitle.textContent = title;
    speechBody.textContent = body;
    const storyNote = document.querySelector('.story .inline-guide-copy');
    if (storyNote && ['overview', 'hypotheses', 'tech'].includes(key)) storyNote.textContent = `${title} ${body}`;
  }
  window.updateResearchGuide?.(key, dock);
}
document.querySelector('.tabs').addEventListener('click', queueEntrance);
document.querySelector('.tabs').addEventListener('keydown', queueEntrance);
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
for (const selector of ['.hero-copy','.journey','.story','.closing']) {
  const note = document.createElement('p');
  note.className = 'inline-guide-copy';
  const key = {'.hero-copy':'hero','.journey':'journey','.story':'overview','.closing':'closing'}[selector];
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
function beginEntrancePortal() {
  entrancePhase = 'departing';
  positionEntrancePortal();
  portal.classList.add('is-visible');
  guide.classList.add('entrance-sink');
  entrancePortalTimer = setTimeout(() => {
    entrancePhase = 'docked';
    guide.classList.remove('entrance-sink');
    renderEntrance();
    positionEntrancePortal();
    guide.classList.add('entrance-emerge');
    entrancePortalTimer = setTimeout(() => {
      guide.classList.remove('entrance-emerge');
      portal.classList.remove('is-visible');
    }, 850);
  }, 760);
}
renderEntrance();
