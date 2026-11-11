const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const researchPanel = document.querySelector('#panel-hypotheses');
const metrics = [...researchPanel.querySelectorAll('.metrics > div')];
const experiments = [...researchPanel.querySelectorAll('.experiments > article')];
const focusPoints = [...metrics, ...experiments];
const focusCopy = [
  ['관측의 크기부터 볼까?', '367명 아닌, 최초 알람 울림 367건이야.', '같은 사용자의 반복 사용이 포함될 수 있어.'],
  ['오전 사용 패턴', '오전 발생은 70.0%. 사전 기준 50%를 넘었어.', '사용 시간대는 확인했지만 기상·출근 목적까지 확인된 건 아니야.'],
  ['더 자세히 들여다보면', '전체 울림의 46.3%가 오전 6–8시에 모였어.', '오전 사용 경험을 우선 살펴볼 근거가 생겼어.'],
  ['첫 번째 실험의 배움', '오전에 주로 울린다는 가설은 기준을 충족했어.', '어떻게 측정했는지 펼쳐보면 재울림을 제외한 조건도 볼 수 있어.'],
  ['높은 숫자보다 중요한 것', '64.7%와 28.6%, 아직은 초기 관측이야.', '미참여 관측은 7건뿐이어서 모임의 인과 효과를 단정할 수 없어.']
];
focusPoints.forEach((element, index) => {
  element.dataset.focusIndex = index;
  element.id ||= `research-focus-${index}`;
});
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('has-entered');
    revealObserver.unobserve(entry.target);
  }
}, {threshold:.12});
document.querySelectorAll('.principles article,.statement,.closing').forEach((el,index) => {
  el.classList.add('reveal-item');
  el.style.setProperty('--reveal-delay', `${Math.min(index%3,2)*65}ms`);
  revealObserver.observe(el);
});
let tourStep = -1;
const tour = document.createElement('div');
tour.className = 'research-tour';
tour.innerHTML = '<div><span class="tour-eyebrow">WITH SEED</span><p>숫자 뒤의 이야기를 함께 볼까요?</p></div><button type="button" class="tour-next">씨앗이와 핵심 보기 <span aria-hidden="true">↗</span></button><button type="button" class="tour-end" hidden>안내 끝내기</button><span class="tour-status" aria-live="polite"></span>';
researchPanel.querySelector('.panel-intro').after(tour);
const next = tour.querySelector('.tour-next');
const end = tour.querySelector('.tour-end');
const status = tour.querySelector('.tour-status');
const guideNext = document.createElement('button');
guideNext.type='button';guideNext.className='guide-tour-next';guideNext.textContent='다음 포인트 →';guideNext.hidden=true;
guideNext.addEventListener('click',()=>next.click());guide.append(guideNext);
function clearTour() {
  tourStep=-1;guideNext.hidden=true;
  focusPoints.forEach(el => el.classList.remove('tour-focus'));
  next.innerHTML='씨앗이와 핵심 보기 <span aria-hidden="true">↗</span>';
  end.hidden=true;status.textContent='';
  guide.classList.remove('research-speaking');
  queueEntrance();
}
next.addEventListener('click', () => {
  tourStep=(tourStep+1)%focusPoints.length;
  focusPoints.forEach((el,index)=>el.classList.toggle('tour-focus',index===tourStep));
  const target=focusPoints[tourStep];
  target.scrollIntoView({ behavior: 'instant', block: 'center' });
  next.textContent=tourStep===focusPoints.length-1?'처음부터 다시 보기':'다음 포인트 →';
  end.hidden=false;guideNext.hidden=false;guideNext.textContent=tourStep===focusPoints.length-1?'처음부터 다시 보기':'다음 포인트 →';
  status.textContent=`${tourStep+1} / ${focusPoints.length}`;
  guide.classList.remove('is-collapsed');
  guideToggle.textContent='설명 접기';guideToggle.setAttribute('aria-expanded','true');
  manualPosition=null;
  guide.style.setProperty('--drag-x','0px');guide.style.setProperty('--drag-y','0px');
  queueEntrance();
});
end.addEventListener('click',clearTour);
storyNav.addEventListener('click', clearTour);
storyNav.addEventListener('chapterchange', clearTour);
window.updateResearchGuide = (key,dock) => {
  if (dock!==1 || key!=='hypotheses') {
    guide.classList.remove('research-speaking');
    guideNext.hidden=true;
    return;
  }
  let active=tourStep;
  if(active<0){
    let distance=Infinity;
    focusPoints.forEach((el,index)=>{
      const r=el.getBoundingClientRect();
      if(r.bottom>innerHeight*.18&&r.top<innerHeight*.82){
        const d=Math.abs((r.top+r.bottom)/2-innerHeight*.46);
        if(d<distance){distance=d;active=index;}
      }
    });
  }
  if(active<0){guide.classList.remove('research-speaking');return;}
  guide.classList.add('research-speaking');
  const [label,title,body]=focusCopy[active];
  speechLabel.textContent=label;speechTitle.textContent=title;speechBody.textContent=body;
  const note=researchPanel.closest('.story').querySelector('.inline-guide-copy');
  if(note)note.textContent=`${title} ${body}`;
  if(!manualPosition&&!dragState){
    const rect=focusPoints[active].getBoundingClientRect();
    // Use outer margins when there is room; otherwise stay below the focused data.
    const width=guide.getBoundingClientRect().width;
    const storyRect=document.querySelector('.story').getBoundingClientRect();
    const rightRoom=innerWidth-storyRect.right;
    const x=rightRoom>width+24?storyRect.right+width/2+16:innerWidth-width/2-20;
    const y=Math.max(210,Math.min(innerHeight-170,rect.bottom+175));
    guide.style.setProperty('--guide-x',`${x}px`);
    guide.style.setProperty('--guide-y',`${y}px`);
  }
};
queueEntrance();


// Reuse the page's scroll frame so the fixed scene follows scroll in both directions.
const scrollScenes = [...document.querySelectorAll('[data-scroll-steps]')].map(sequence => ({
  sequence,
  stage: sequence.firstElementChild,
  steps: Number(sequence.dataset.scrollSteps),
}));
const sceneMotion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 480px)');
const storyEntries = [...document.querySelectorAll('[data-story-enter]')];

function updateStoryScenes() {
  const navHeight = storyNav.offsetHeight;
  for (const { sequence, stage, steps } of scrollScenes) {
    if (sequence.closest('.story-chapter').hidden) continue;
    if (!sceneMotion.matches || (sequence.hasAttribute('data-scroll-fit') && stage.firstElementChild.offsetHeight + 24 > innerHeight - navHeight)) {
      delete sequence.dataset.step;
      continue;
    }
    sequence.dataset.step ??= '0';
    const bounds = sequence.getBoundingClientRect();
    const travel = bounds.height - stage.offsetHeight;
    const progress = (navHeight - bounds.top) / Math.max(1, travel);
    const step = String(Math.max(0, Math.min(steps - 1, Math.floor(progress * steps))));
    if (sequence.dataset.step !== step) sequence.dataset.step = step;
    for (const element of stage.querySelectorAll('[data-story-reveal]')) {
      element.toggleAttribute('data-story-pending', Number(step) < Number(element.dataset.storyReveal));
    }
  }
  for (const entry of storyEntries) {
    if (entry.closest('.story-chapter').hidden) continue;
    const isExperience = entry.classList.contains('story-experience-entry');
    const ready = isExperience
      ? entry.previousElementSibling.dataset.step !== undefined
      : entry.dataset.step !== undefined;
    if (!ready) {
      entry.style.removeProperty('--story-entry-opacity');
      entry.removeAttribute('data-story-entry');
      continue;
    }
    entry.setAttribute('data-story-entry', '');
    const distance = navHeight - entry.getBoundingClientRect().top;
    const fadeDistance = 120;
    const fadeProgress = distance / fadeDistance + (isExperience ? 1 : 0);
    const opacity = Math.max(0, Math.min(1, fadeProgress));
    entry.style.setProperty('--story-entry-opacity', opacity);
  }
}
sceneMotion.addEventListener('change', queueEntrance);
