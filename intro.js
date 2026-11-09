// "내일 아침 미리 맞춰보기": a small planner that previews a RingOut mission.
// Places and travel times are example data, not measured values.
(() => {
  const panel = document.querySelector('#panel-overview');
  if (!panel) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const times = ['06:00', '06:30', '07:00', '07:30'];
  const places = [
    { id: 'park', name: '동네 공원', purpose: '아침 산책', move: '도보', minutes: 8 },
    { id: 'gym', name: '헬스장', purpose: '운동', move: '도보', minutes: 12 },
    { id: 'library', name: '학교 도서관', purpose: '공부', move: '도보', minutes: 18 },
    { id: 'cafe', name: '회사 앞 카페', purpose: '출근 준비', move: '대중교통', minutes: 25 }
  ];
  const limits = [10, 15, 20, 30];
  const state = { time: '07:00', place: 'gym', limit: 15 };

  const radio = (group, value, label, sub = '') =>
    `<label class="plan-choice"><input type="radio" name="plan-${group}" value="${value}"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span></label>`;

  const planner = document.createElement('section');
  planner.className = 'morning-planner';
  planner.setAttribute('aria-labelledby', 'planner-title');
  planner.innerHTML = `
    <div class="planner-head">
      <p class="experience-eyebrow">TRY TOMORROW MORNING</p>
      <h3 id="planner-title">내일 아침, 미리 맞춰볼까요?</h3>
      <p>알람 시각과 목적지를 고르면 링아웃 미션이 어떻게 이어지는지 보여드려요.</p>
    </div>
    <div class="planner-body">
      <form class="planner-form" onsubmit="return false">
        <fieldset><legend>알람 시각</legend><div class="plan-chips">${times.map(t => radio('time', t, t)).join('')}</div></fieldset>
        <fieldset><legend>목적지 <span class="plan-sample">예시</span></legend><div class="plan-tiles">${places.map(p => radio('place', p.id, p.name, `${p.purpose} · ${p.move} ${p.minutes}분`)).join('')}</div></fieldset>
        <fieldset><legend>도착 제한 시간</legend><div class="plan-chips">${limits.map(l => radio('limit', l, `${l}분`)).join('')}</div></fieldset>
      </form>
      <div class="plan-result" aria-live="polite">
        <div class="plan-summary">
          <span class="plan-summary-label">내일의 미션</span>
          <strong data-out="summary"></strong>
        </div>
        <div class="plan-track" aria-hidden="true">
          <i class="plan-track-fill"></i>
          <i class="plan-track-deadline"><span>제한</span></i>
          <i class="plan-track-seed"></i>
        </div>
        <ol class="plan-timeline">
          <li><time data-out="ring"></time><span>알람이 울려요</span></li>
          <li><time data-out="start"></time><span>알람을 끄면 이동 미션 시작</span></li>
          <li><time data-out="arrive"></time><span data-out="arriveText"></span></li>
          <li class="is-deadline"><time data-out="deadline"></time><span>도착 제한 시간</span></li>
        </ol>
        <div class="plan-status" data-tone="ok">
          <p data-out="status"></p>
          <button type="button" class="plan-widen" hidden></button>
        </div>
        <a class="plan-cta" href="https://www.ringout.my/" target="_blank" rel="noopener noreferrer">링아웃에서 설정하기 <span aria-hidden="true">↗</span></a>
        <p class="plan-note">장소와 이동 시간은 이해를 돕기 위한 예시예요.</p>
      </div>
    </div>`;
  panel.prepend(planner);

  const out = name => planner.querySelector(`[data-out="${name}"]`);
  const toMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  // Changed values slide up into place so the new value is noticed.
  function setText(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    if (!reduceMotion.matches) el.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' });
  }

  function render() {
    const place = places.find(p => p.id === state.place);
    const ring = toMinutes(state.time);
    const start = ring + 1;
    const arrive = start + place.minutes;
    const deadline = ring + state.limit;
    const slack = deadline - arrive;

    setText(out('summary'), `${state.time} 알람 · ${place.name}까지 ${state.limit}분 안에`);
    setText(out('ring'), fmt(ring));
    setText(out('start'), fmt(start));
    setText(out('arrive'), fmt(arrive));
    setText(out('arriveText'), `${place.name} 도착 예정 (${place.move} ${place.minutes}분)`);
    setText(out('deadline'), fmt(deadline));

    // Track: 0 = alarm, right edge = the later of arrival or deadline.
    const span = Math.max(arrive, deadline) - ring + 2;
    planner.style.setProperty('--arrive', `${((arrive - ring) / span) * 100}%`);
    planner.style.setProperty('--deadline', `${((deadline - ring) / span) * 100}%`);

    const statusBox = planner.querySelector('.plan-status');
    const widen = planner.querySelector('.plan-widen');
    let tone = 'ok';
    let message = `${slack}분 여유 있게 도착할 수 있어요.`;
    if (slack < 0) {
      tone = 'late';
      message = `제한 시간보다 ${-slack}분 늦어요. 제한 시간을 늘리거나 가까운 곳을 골라보세요.`;
    } else if (slack < 3) {
      tone = 'tight';
      message = slack === 0 ? '딱 맞춰 도착해요. 조금 빠듯할 수 있어요.' : `${slack}분 여유, 조금 빠듯해요.`;
    }
    statusBox.dataset.tone = tone;
    planner.dataset.tone = tone;
    setText(out('status'), message);
    const next = limits.find(l => l - 1 >= place.minutes + 3);
    widen.hidden = tone === 'ok' || !next || next === state.limit;
    if (!widen.hidden) widen.textContent = `제한 시간 ${next}분으로 늘리기`;
    widen.dataset.limit = next || '';

    for (const input of planner.querySelectorAll('input')) {
      const key = input.name.slice(5);
      input.checked = String(state[key]) === input.value;
    }
  }

  planner.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('input[type="radio"]')) return;
    const key = input.name.slice(5);
    state[key] = key === 'limit' ? Number(input.value) : input.value;
    render();
  });
  planner.querySelector('.plan-widen').addEventListener('click', event => {
    state.limit = Number(event.currentTarget.dataset.limit);
    render();
    planner.querySelector(`input[name="plan-limit"][value="${state.limit}"]`)?.focus({ preventScroll: true });
  });
  render();
})();

// Principles open and close smoothly like list rows.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.principle-row').forEach(row => {
    const summary = row.querySelector('summary');
    const body = row.querySelector('.principle-body');
    summary.addEventListener('click', event => {
      if (reduceMotion.matches) return;
      event.preventDefault();
      if (row.open) {
        const closing = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
        closing.onfinish = () => { row.open = false; closing.cancel(); };
      } else {
        row.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' });
      }
    });
  });
})();
