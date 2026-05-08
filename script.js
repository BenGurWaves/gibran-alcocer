/* ─────────────────────────────────────────────────────────────
   GIBRAN ALCOCER — EL AIRE
   La Cuerda (the string), el martillo (the cursor hammer),
   resonance reveal, surtitle changer, ghost-idea hover.
   ───────────────────────────────────────────────────────────── */

(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch   = matchMedia('(hover: none)').matches;

  /* ─── BOOT ─── */
  document.body.classList.add('is-ready');

  /* ─── RESONANCE REVEAL ─── */
  const revealTargets = [
    '.masthead__rubric', '.masthead__title', '.masthead__caption', '.escucha',
    '.aire__text', '.aire__attr', '.aire__caption',
    '.ideas__head', '.idea', '.ideas__foot',
    '.atlas__lab', '.atlas__city', '.atlas__co', '.atlas__line', '.atlas__line-of-life',
    '.colofon__intro', '.colofon__mail', '.colofon__marks', '.colofon__seal', '.colofon__imprint'
  ];
  const targets = document.querySelectorAll(revealTargets.join(','));
  targets.forEach(el => el.classList.add('fade-in'));

  if (reduced) {
    targets.forEach(el => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // small per-element stagger when grouped (e.g. ideas grid)
          const i = +(e.target.dataset.fadeI || 0);
          e.target.style.transitionDelay = (i * 18) + 'ms';
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    // assign stagger order to ideas grid
    document.querySelectorAll('.idea').forEach((el, i) => {
      el.dataset.fadeI = (i % 12).toString();
    });

    targets.forEach(el => io.observe(el));
  }

  /* ─── SURTITLE CHANGER (the opera-house chyron) ─── */
  const surtitleEl    = document.getElementById('surtitle');
  const surtitleInner = surtitleEl.querySelector('.surtitle__inner');
  const scenes = [...document.querySelectorAll('.scene')];

  function setSurtitle(text) {
    if (surtitleInner.textContent === text) return;
    surtitleEl.classList.add('is-swap');
    setTimeout(() => {
      surtitleInner.textContent = text;
      surtitleEl.classList.remove('is-swap');
    }, 450);
  }

  const sio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const t = e.target.dataset.surtitle;
        if (t) setSurtitle(t);
      }
    });
  }, { threshold: [0.4, 0.6], rootMargin: '-20% 0px -20% 0px' });

  scenes.forEach(s => sio.observe(s));

  /* ─── LA CUERDA (the string) — physically simulated wave ─── */
  const cuerda     = document.getElementById('cuerda');
  const cuerdaPath = document.getElementById('cuerdaPath');
  const N          = 180;
  const seg        = new Float32Array(N);
  const vel        = new Float32Array(N);

  // physics — finely tuned so the line settles into stillness within ~2s
  const SPRING   = 0.018;
  const COUPLING = 0.30;
  const DAMPING  = 0.985;

  let stringY    = window.innerHeight * 0.62;
  let mouseX     = -1000;
  let mouseY     = -1000;
  let lastMx     = mouseX;
  let lastMy     = mouseY;
  let mouseSpeed = 0;

  let lastScrollY    = window.scrollY;
  let scrollVelocity = 0;

  function setSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    cuerda.setAttribute('viewBox', `0 0 ${w} ${h}`);
    cuerda.setAttribute('width', w);
    cuerda.setAttribute('height', h);
    stringY = h * 0.62;
  }
  setSize();
  window.addEventListener('resize', setSize);

  if (!touch) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  } else {
    window.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) { mouseX = t.clientX; mouseY = t.clientY; }
    }, { passive: true });
  }

  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollVelocity = scrollVelocity * 0.7 + dy * 0.3;
  }, { passive: true });

  const martillo = document.getElementById('martillo');

  function physicsStep() {
    // wave equation per segment: spring to rest + coupling to neighbours
    for (let i = 1; i < N - 1; i++) {
      const force = -SPRING * seg[i] + COUPLING * (seg[i-1] + seg[i+1] - 2 * seg[i]);
      vel[i] = (vel[i] + force) * DAMPING;
    }
    for (let i = 0; i < N; i++) seg[i] += vel[i];
    seg[0] = seg[N - 1] = 0;

    // mouse speed (pre-injection)
    const mvx = mouseX - lastMx, mvy = mouseY - lastMy;
    lastMx = mouseX; lastMy = mouseY;
    mouseSpeed = Math.hypot(mvx, mvy);

    // hammer struck the string?
    if (mouseX > 0 && Math.abs(mouseY - stringY) < 90) {
      const idx = Math.max(1, Math.min(N - 2, Math.floor((mouseX / window.innerWidth) * N)));
      // only inject if the cursor is actually moving — a still hammer is silent
      if (mouseSpeed > 0.3) {
        const strength = (mouseY - stringY) * 0.08 + mvy * 0.6;
        seg[idx] += strength;
        // small sympathetic neighbours for richer harmonic
        seg[idx - 1] += strength * 0.42;
        seg[idx + 1] += strength * 0.42;
      }
    }

    // scroll velocity disturbs the string ambient
    if (Math.abs(scrollVelocity) > 0.5) {
      const idx = (Math.floor(N * 0.5 + Math.sin(performance.now() * 0.002) * N * 0.3)) | 0;
      seg[idx] += scrollVelocity * 0.012;
      scrollVelocity *= 0.92;
    }
  }

  function renderString() {
    let d = `M 0 ${stringY.toFixed(1)}`;
    for (let i = 1; i < N; i++) {
      const x = (i / (N - 1)) * window.innerWidth;
      const y = stringY + seg[i];
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    cuerdaPath.setAttribute('d', d);
  }

  function renderHammer() {
    if (touch) return;
    martillo.style.transform = `translate(${mouseX - 17}px, ${mouseY - 0.8}px)`;
  }

  function loop() {
    physicsStep();
    renderString();
    renderHammer();
    requestAnimationFrame(loop);
  }
  if (!reduced) requestAnimationFrame(loop);
  else renderString();

  /* ─── HAMMER OPACITY OVER LINKS ─── */
  if (!touch) {
    document.querySelectorAll('a, button, .idea').forEach(el => {
      el.addEventListener('mouseenter', () => martillo.style.opacity = '0.55');
      el.addEventListener('mouseleave', () => martillo.style.opacity = '0.92');
    });
  }

  /* ─── PRE-DELIVERY MARK ─── */
  console.info('%cGibran Alcocer · El Aire %c— Idea XIX, MMXXVI', 'font:600 13px Cormorant;color:#0A0908;background:#E8DEC9;padding:4px 8px', 'font:300 italic 11px Cormorant;color:#C9A36B;padding-left:6px');
})();
