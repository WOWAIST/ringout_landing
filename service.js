const servicePanel=document.querySelector('#panel-overview');
const serviceSteps=[
  {label:'내일의 계획',title:'시간과 목적지를 함께 정해요.',body:'알람 시간, 목표 지점, 제한 시간을 내일의 계획에 맞게 설정해요.',image:'ringout-mockup-alarm-setting.png',alt:'RingOut 알람 시간과 목표 지점 설정 화면',seed:'먼저 내일 아침 어디로 갈지 정해보자. 시간과 목적지가 하나의 약속이 되는 거야.'},
  {label:'아침의 시작',title:'알람을 끄면, 다음 행동이 시작돼요.',body:'울림을 멈추는 데서 끝나지 않도록. 알람을 끈 뒤에는 목표 지점으로 이동하는 미션이 이어져요.',image:'ringout-mockup-alarm-screen.png',alt:'RingOut 알람이 울리는 화면',seed:'눈을 떴다면 이제 출발할 차례! 알람을 끄는 순간부터 도착 미션으로 이어져.'},
  {label:'목표 지점으로',title:'계획했던 장소로 움직여요.',body:'지도에서 목표 지점을 확인하고, 설정한 시간 안에 도착하는 첫 행동을 시작해요.',image:'ringout-mockup-destination-in-progress.png',alt:'RingOut 목적지까지 이동 중인 지도 화면',seed:'여기가 오늘의 목적지야. 지도와 남은 시간을 보면서 첫 행동을 이어가봐.'},
  {label:'함께하는 실천',title:'서로의 출발과 도착을 확인해요.',body:'같은 목표를 가진 모임에서 누가 출발하고 도착했는지 살펴봐요. 함께 실천하는 경험을 만들어요.',image:'ringout-group-activity.png',alt:'RingOut 모임 멤버의 이동과 도착 활동 화면',seed:'혼자만의 약속을 함께하는 실천으로. 모임에서는 서로의 출발과 도착을 볼 수 있어.'},
  {label:'하루의 기록',title:'알람부터 도착까지 돌아봐요.',body:'알람이 울린 횟수와 시간, 목적지에 도착한 시각을 하루의 활동 내역에서 확인해요.',image:'ringout-records-daily.png',alt:'RingOut 하루 알람 활동 및 도착 기록 화면',seed:'오늘의 첫 행동이 기록으로 남았네. 알람이 울린 순간부터 도착까지 돌아볼 수 있어.'},
  {label:'쌓이는 아침',title:'한 달의 실천을 한눈에 봐요.',body:'활동한 날짜를 달력으로 살펴보며 지난 아침의 기록을 확인해요.',image:'ringout-records-calendar.png',alt:'RingOut 월별 활동 기록 달력 화면',seed:'이렇게 하루하루 쌓인 아침을 달력에서 확인할 수 있어. 다음에는 우리의 검증 이야기도 볼까?'}
];
let serviceIndex=0;
let serviceExplaining=false;
const section=document.createElement('section');section.className='app-experience';section.setAttribute('aria-label','앱 화면으로 보는 링아웃');
section.innerHTML=`<div class="experience-copy"><h3>오늘 밤의 계획이<br>내일 아침의 첫 행동으로.</h3><p class="experience-lead">실제 앱 화면을 따라 링아웃의 하루를 만나보세요.</p><div class="service-steps" role="group" aria-label="서비스 이용 단계"></div></div><div class="app-showcase"><div class="showcase-top"><span class="service-progress">01 / 06</span><span>RINGOUT APP</span></div><div class="phone-view"><img src="" alt="" width="420" height="840"></div><div class="screen-caption" aria-live="polite"><h4></h4><p></p></div><div class="screen-navigation"><button type="button" class="screen-prev" aria-label="이전 앱 화면">←</button><div class="screen-dots" aria-hidden="true"></div><button type="button" class="screen-next" aria-label="다음 앱 화면">→</button></div></div>`;
servicePanel.querySelector('#service-experience-slot').append(section);
const buttons=section.querySelector('.service-steps');
serviceSteps.forEach((step,index)=>{
 const button=document.createElement('button');button.type='button';button.innerHTML=`<span>${String(index+1).padStart(2,'0')}</span>${step.label}<i aria-hidden="true">↗</i>`;
 button.addEventListener('click',()=>setServiceStep(index));buttons.append(button);
 const dot=document.createElement('i');section.querySelector('.screen-dots').append(dot);
});
const serviceGuideNext=document.createElement('button');serviceGuideNext.className='guide-tour-next';serviceGuideNext.type='button';serviceGuideNext.textContent='다음 앱 화면 →';serviceGuideNext.hidden=true;guide.append(serviceGuideNext);
serviceGuideNext.addEventListener('click',()=>setServiceStep((serviceIndex+1)%serviceSteps.length));
const spotlight=document.createElement('div');spotlight.className='spotlight-window';spotlight.setAttribute('aria-hidden','true');spotlight.hidden=true;document.body.append(spotlight);
const lightExit=document.createElement('button');lightExit.className='spotlight-exit';lightExit.type='button';lightExit.textContent='조명 끄기 · Esc';lightExit.hidden=true;document.body.append(lightExit);
let researchLightPaused=false;
function stopSpotlight(){serviceExplaining=false;researchLightPaused=true;serviceGuideNext.hidden=true;spotlight.hidden=true;lightExit.hidden=true;guide.classList.remove('spotlight-guide');queueEntrance();}
lightExit.addEventListener('click',stopSpotlight);
document.addEventListener('keydown',event=>{if(event.key==='Escape')stopSpotlight();});
let serviceFocusTarget=null;
function startSeedExplanation(){
 if(!guide.classList.contains('is-docked'))return;
 if(activeChapter==='overview'){
  if(serviceExplaining){stopSpotlight();return;}
  serviceExplaining=true;
  const phone=section.querySelector('.phone-view');
  const movie=document.querySelector('.instagram-frame');
  const candidates=[phone,movie].filter(Boolean);
  serviceFocusTarget=candidates.reduce((best,node)=>{
   const rect=node.getBoundingClientRect();
   const dist=Math.abs(rect.top+rect.height/2-innerHeight/2);
   const br=best.getBoundingClientRect();
   return dist<Math.abs(br.top+br.height/2-innerHeight/2)?node:best;
  },phone);
  guide.classList.remove('is-collapsed');guideToggle.textContent='설명 접기';guideToggle.setAttribute('aria-expanded','true');
  serviceFocusTarget.scrollIntoView({behavior:motionPreference.matches?'instant':'smooth',block:'center'});queueEntrance();
 }else if(activeChapter==='hypotheses'){
  if(!spotlight.hidden){clearTour();stopSpotlight();return;}
  let index=0,distance=Infinity;
  focusPoints.forEach((node,i)=>{const rect=node.getBoundingClientRect();const d=Math.abs(rect.top+rect.height/2-innerHeight/2);if(d<distance){index=i;distance=d;}});
  tourStep=index-1;next.click();researchLightPaused=false;queueEntrance();
 }
}
let seedPress=null;
let seedWasDragged=false;
dragHandle.addEventListener('pointerdown',event=>{seedPress={x:event.clientX,y:event.clientY};seedWasDragged=false;},{capture:true});
dragHandle.addEventListener('pointermove',event=>{if(seedPress&&Math.hypot(event.clientX-seedPress.x,event.clientY-seedPress.y)>8)seedWasDragged=true;},{capture:true});
dragHandle.addEventListener('pointercancel',()=>{seedPress=null;seedWasDragged=true;});
dragHandle.addEventListener('click',event=>{if(seedWasDragged){event.preventDefault();return;}startSeedExplanation();});
dragHandle.setAttribute('aria-label','씨앗이 설명 듣기. 클릭하면 현재 화면을 설명합니다. 드래그로 이동할 수 있습니다.');
function setServiceStep(index){
 serviceIndex=index;const step=serviceSteps[index];
 [...buttons.children].forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===index));});
 const img=section.querySelector('img');img.src=`./assets/${step.image}`;img.alt=step.alt;
 section.querySelector('.screen-caption h4').textContent=step.title;section.querySelector('.screen-caption p').textContent=step.body;
 section.querySelector('.service-progress').textContent=`${String(index+1).padStart(2,'0')} / 06`;
 [...section.querySelector('.screen-dots').children].forEach((dot,i)=>dot.classList.toggle('active',i===index));
 section.querySelector('.screen-prev').disabled=index===0;section.querySelector('.screen-next').disabled=index===serviceSteps.length-1;
 if(!motionPreference.matches)img.animate([{opacity:.2,transform:'translateY(12px) rotateY(-6deg)'},{opacity:1,transform:'none'}],{duration:420,easing:'ease-out'});
 queueEntrance();
}
section.querySelector('.screen-prev').addEventListener('click',()=>setServiceStep(Math.max(0,serviceIndex-1)));
section.querySelector('.screen-next').addEventListener('click',()=>setServiceStep(Math.min(serviceSteps.length-1,serviceIndex+1)));
storyNav.addEventListener('click',stopSpotlight);
storyNav.addEventListener('chapterchange',stopSpotlight);
document.querySelector('.tour-next').addEventListener('click',()=>{researchLightPaused=false;});
function placeSpotlight(target){
 const rect=target.getBoundingClientRect();
 if(rect.bottom<50||rect.top>innerHeight-50){spotlight.hidden=true;lightExit.hidden=true;guide.classList.remove('spotlight-guide');return;}
 const pad=12;
 // Appear in place instead of sliding in from the last spot.
 if(spotlight.hidden){spotlight.classList.add('is-entering');requestAnimationFrame(()=>requestAnimationFrame(()=>spotlight.classList.remove('is-entering')));}
 spotlight.style.setProperty('--spot-left',`${rect.left-pad}px`);
 spotlight.style.setProperty('--spot-top',`${rect.top-pad}px`);
 spotlight.style.setProperty('--spot-width',`${rect.width+pad*2}px`);
 spotlight.style.setProperty('--spot-height',`${rect.height+pad*2}px`);
 spotlight.style.left=`${rect.left-pad}px`;spotlight.style.top=`${rect.top-pad}px`;
 spotlight.style.width=`${rect.width+pad*2}px`;spotlight.style.height=`${rect.height+pad*2}px`;
 spotlight.style.setProperty('--light-x', `${rect.left+rect.width/2}px`);
 spotlight.style.setProperty('--light-y', `${rect.top+rect.height/2}px`);
 spotlight.style.setProperty('--light-rx', `${rect.width/2+65}px`);
 spotlight.style.setProperty('--light-ry', `${rect.height/2+65}px`);
 spotlight.hidden=false;lightExit.hidden=false;guide.classList.add('spotlight-guide');
 if(!manualPosition&&!dragState){
  const w=guide.getBoundingClientRect().width;
  const chooseLeft=rect.left>w+35;
  const chooseRight=innerWidth-rect.right>w+35;
  const x=chooseLeft?rect.left-w/2-22:chooseRight?rect.right+w/2+22:Math.max(w/2+12,Math.min(innerWidth-w/2-12,rect.left+rect.width/2+(serviceIndex%2===0?-130:130)));
  const y=chooseLeft||chooseRight?Math.max(210,Math.min(innerHeight-170,rect.top+rect.height*.55)):Math.min(innerHeight-160,rect.bottom+170);
  guide.style.setProperty('--guide-x',`${x}px`);guide.style.setProperty('--guide-y',`${y}px`);
 }
}
const previousResearchGuide=window.updateResearchGuide;
window.updateResearchGuide=(key,dock)=>{
 previousResearchGuide?.(key,dock);
 if(dock!==1){spotlight.hidden=true;lightExit.hidden=true;serviceGuideNext.hidden=true;return;}
 if(key==='overview'&&serviceExplaining){
  const step=serviceSteps[serviceIndex];speechLabel.textContent=`앱으로 만나는 링아웃 · ${serviceIndex+1}/6`;speechTitle.textContent=step.title;speechBody.textContent=step.seed;
  guide.classList.add('research-speaking');serviceGuideNext.hidden=false;
  if(serviceFocusTarget?.classList.contains('instagram-frame')){
   speechTitle.textContent='링아웃을 영상으로 만나보자.';speechBody.textContent='재생 버튼을 누르면 인스타그램에 올린 소개 영상을 볼 수 있어.';serviceGuideNext.hidden=true;
  }
  placeSpotlight(serviceFocusTarget||section.querySelector('.phone-view'));return;
 }
 serviceGuideNext.hidden=true;
 if(key==='hypotheses'&&tourStep>=0&&!researchLightPaused){placeSpotlight(focusPoints[tourStep]);return;}
 spotlight.hidden=true;lightExit.hidden=true;guide.classList.remove('spotlight-guide');
 if(key==='overview'){
  guide.classList.add('seed-inviting','research-speaking');
  speechLabel.textContent='씨앗이의 화면 안내';speechTitle.textContent='나를 누르면 설명을 들을 수 있어.';speechBody.textContent='지금 보고 있는 화면을 함께 살펴보자. 드래그하면 나를 옮길 수도 있어.';
 }else{guide.classList.remove('seed-inviting');}
};
setServiceStep(0);

// Wheel/trackpad and touch gestures advance one explanation at a time.
let spotlightScrollAmount=0;
let spotlightScrollUntil=0;
let spotlightLastWheel=0;
function advanceSpotlight(direction){
 if(serviceExplaining&&activeChapter==='overview'){
  if(serviceFocusTarget?.classList.contains('instagram-frame')){stopSpotlight();return;}
  const index=serviceIndex+direction;
  if(index<0||index>=serviceSteps.length){stopSpotlight();return;}
  setServiceStep(index);return;
 }
 if(tourStep>=0&&!researchLightPaused&&activeChapter==='hypotheses'){
  const index=tourStep+direction;
  if(index<0||index>=focusPoints.length){clearTour();stopSpotlight();return;}
  tourStep=index;
  focusPoints.forEach((el,i)=>el.classList.toggle('tour-focus',i===index));
  focusPoints[index].scrollIntoView({behavior:'instant',block:'center'});
  status.textContent=`${index+1} / ${focusPoints.length}`;
  next.textContent=index===focusPoints.length-1?'처음부터 다시 보기':'다음 포인트 →';
  guideNext.textContent=next.textContent;
  queueEntrance();
 }
}
function spotlightWheel(event){
 if(spotlight.hidden||event.ctrlKey||Math.abs(event.deltaY)<Math.abs(event.deltaX))return;
 if(event.target.closest('iframe,video,input,textarea,select'))return;
 event.preventDefault();
 const now=performance.now();
 if(now<spotlightScrollUntil)return;
 if(now-spotlightLastWheel>220)spotlightScrollAmount=0;
 spotlightLastWheel=now;
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
 spotlightScrollAmount+=delta;
 if(Math.abs(spotlightScrollAmount)>=65){
  advanceSpotlight(Math.sign(spotlightScrollAmount));
  spotlightScrollAmount=0;spotlightScrollUntil=now+950;
 }
}
window.addEventListener('wheel',spotlightWheel,{passive:false});
let lightTouch=null;
window.addEventListener('touchstart',event=>{
 if(spotlight.hidden||event.target.closest('.intro-character,button,a,iframe')){lightTouch=null;return;}
 lightTouch={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
window.addEventListener('touchmove',event=>{
 if(!lightTouch||spotlight.hidden)return;
 const dy=lightTouch.y-event.touches[0].clientY;
 const dx=lightTouch.x-event.touches[0].clientX;
 if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8)event.preventDefault();
 if(Math.abs(dy)>65&&performance.now()>spotlightScrollUntil){
  advanceSpotlight(Math.sign(dy));spotlightScrollUntil=performance.now()+950;lightTouch=null;
 }
},{passive:false});
window.addEventListener('touchend',()=>{lightTouch=null;},{passive:true});
const lightHint=document.createElement('div');lightHint.className='spotlight-scroll-hint';lightHint.textContent='↓ 다음 설명 · ↑ 이전 설명';lightHint.hidden=true;document.body.append(lightHint);
const currentLightGuide=window.updateResearchGuide;
window.updateResearchGuide=(key,dock)=>{currentLightGuide?.(key,dock);lightHint.hidden=spotlight.hidden;};
new MutationObserver(()=>{lightHint.hidden=spotlight.hidden;}).observe(spotlight,{attributes:true,attributeFilter:['hidden']});

const film=document.createElement('section');film.className='service-film';film.setAttribute('aria-label','링아웃 소개 영상');
film.innerHTML='<div class="film-copy"><h3>내일 아침 운동을<br>시작하고 싶다면</h3><ol class="story-usage-steps" data-story-reveal="1"><li>운동하러 갈 장소를 목적지로 정합니다.</li><li>출발을 준비할 시간과 반복 알람 간격을 설정합니다.</li><li>알람이 울리면 준비를 마치고 목적지로 이동합니다.</li><li>목적지에 도착하면 도착을 확인하고 알람을 종료합니다.</li></ol><p>운동뿐 아니라 도서관에서 공부를 시작하거나 정해진 장소로 이동해야 할 때도 활용할 수 있습니다.</p><a href="https://www.instagram.com/p/De8mG10Pd_j/" target="_blank" rel="noopener noreferrer">인스타그램에서 보기 ↗</a></div><div class="instagram-frame" data-story-reveal="2"><iframe src="https://www.instagram.com/p/De8mG10Pd_j/embed/" title="링아웃 인스타그램 소개 영상" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><p>영상이 보이지 않으면 <a href="https://www.instagram.com/p/De8mG10Pd_j/" target="_blank" rel="noopener noreferrer">인스타그램에서 열어보세요 ↗</a></p></div>';
servicePanel.querySelector('#service-film-slot').append(film);

// Speech bubble: fade new text in and ease the bubble to its new height.
(()=>{
 const speech=guide.querySelector('.speech');
 const readSpeech=()=>`${speechLabel.textContent}|${speechTitle.textContent}|${speechBody.textContent}`;
 let lastText=readSpeech();
 let lastHeight=speech.offsetHeight;
 let heightAnimation;
 new MutationObserver(()=>{
  const text=readSpeech();
  if(text===lastText)return;
  lastText=text;
  const visible=speech.offsetParent!==null;
  const nextHeight=speech.offsetHeight;
  if(visible&&!motionPreference.matches){
   for(const el of [speechLabel,speechTitle,speechBody]) el.animate([{opacity:0,filter:'blur(3px)',translate:'0 5px'},{opacity:1,filter:'blur(0)',translate:'0 0'}],{duration:420,delay:el===speechLabel?0:el===speechTitle?50:100,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
   if(lastHeight&&Math.abs(nextHeight-lastHeight)>2){
    heightAnimation?.cancel();
    heightAnimation=speech.animate([{height:`${lastHeight}px`},{height:`${nextHeight}px`}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
   }
  }
  lastHeight=nextHeight;
 }).observe(speech,{subtree:true,childList:true,characterData:true});
 new ResizeObserver(()=>{if(!heightAnimation||heightAnimation.playState!=='running')lastHeight=speech.offsetHeight;}).observe(speech);
})();
