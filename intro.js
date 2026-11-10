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
