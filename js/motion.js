// Shared motion for both pages. Runs only in the browser and stores nothing beyond this visit.
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const fine = root.classList.contains('fine');

  // count numbers up when a result appears
  window.countUp = function(scope){
    (scope || document).querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      const t0 = performance.now(), D = 1100;
      (function f(now){ const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(f); })(t0);
    });
  };

  // page curtain: lift on arrival, drop before leaving for the other page
  if (root.classList.contains('arriving')) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('arrived'); root.classList.remove('arriving');
      setTimeout(() => root.classList.remove('arrived'), 1000);
    }));
  }
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('leaving', 'arriving', 'arrived'); });
  if (!reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$/.test(url.pathname) || url.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem('pvp-curtain', '1'); } catch (err) {}
      root.classList.add('leaving');
      setTimeout(() => { location.href = a.href; }, 760);
    });
  }

  // aurora follows the mouse a little
  const au = document.querySelector('.aurora');
  if (au && fine && !reduce) {
    addEventListener('pointermove', e => {
      au.style.setProperty('--ax', (e.clientX / innerWidth - .5).toFixed(3));
      au.style.setProperty('--ay', (e.clientY / innerHeight - .5).toFixed(3));
    }, { passive: true });
  }

  // cursor shows a word over anything marked with data-cursor
  const cur = document.getElementById('cur');
  if (cur && fine && !reduce) {
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { cur.dataset.label = t.dataset.cursor; cur.classList.add('label'); }
      else cur.classList.remove('label');
    });
  }

  // phone menu: stagger the links
  document.querySelectorAll('#links > a').forEach((a, i) => a.style.setProperty('--n', i));

  // phone action bar: appears after the first screen, hides near the end
  const bar = document.querySelector('.mbar');
  if (bar) {
    const hides = [...document.querySelectorAll('[data-mbar-hide]')];
    let hidden = false;
    const io = new IntersectionObserver(es => { es.forEach(en => { en.target._vis = en.isIntersecting; }); hidden = hides.some(h => h._vis); upd(); }, { threshold: .15 });
    hides.forEach(h => io.observe(h));
    const upd = () => bar.classList.toggle('on', scrollY > innerHeight * .6 && !hidden);
    addEventListener('scroll', upd, { passive: true }); upd();
    // chapter buttons highlight the chapter on screen
    const chips = [...bar.querySelectorAll('a[href^="#"]')];
    if (chips.length) {
      const io2 = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) chips.forEach(c => c.classList.toggle('now', c.getAttribute('href') === '#' + en.target.id));
      }), { rootMargin: '-45% 0px -50% 0px' });
      chips.forEach(c => { const s = document.querySelector(c.getAttribute('href')); if (s) io2.observe(s); });
    }
  }

  // reveal anything marked data-reveal
  const rv = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => rv.observe(el));

  // a short buzz on Android when you make a choice in the exercises
  if (navigator.vibrate && !reduce) {
    document.addEventListener('click', e => { if (e.target.closest('.mini,.opt,.pcard,.sup .mini,.case-btn,.gm-step')) navigator.vibrate(8); });
  }
})();
