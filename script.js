/* ───────────────────────────────────────────────────────────────────
   GIBRAN ALCOCER — A profile, in three movements.
   Loader · custom cursor · audio · waveform · reveals.
   ─────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch   = matchMedia('(hover: none)').matches;
  const body    = document.body;

  /* ─────  ELEMENTS  ───── */
  const loader      = document.getElementById('loader');
  const loaderCount = document.getElementById('loaderCount');
  const loaderSub   = document.getElementById('loaderSub');
  const loaderBar   = document.getElementById('loaderBar');

  const cursor      = document.getElementById('cursor');
  const cursorLab   = document.getElementById('cursorLab');

  const film        = document.getElementById('film');
  const filmSrc     = document.getElementById('filmSrc');
  const track       = document.getElementById('track');

  const enterBtn    = document.getElementById('enter');
  const skipLink    = document.getElementById('skip');

  const wave        = document.getElementById('wave');
  const ringProg    = document.getElementById('ringProgress');
  const timeEl      = document.getElementById('time');
  const recDot      = document.getElementById('rec');

  /* ─────  PICK MOBILE VIDEO SOURCE  ───── */
  if (window.innerWidth <= 760 && filmSrc) {
    filmSrc.src = 'media/gibran-720.mp4';
    film.load();
  }

  /* ────────────────────────────────────────────────────────────────
     LOADER — 00 → 99 with rotating sublines, fades to foyer
     ──────────────────────────────────────────────────────────────── */
  const subLines = [
    'preparing the recording',
    'tuning the room',
    'reading the score',
    'press to begin'
  ];

  function setSub(idx){
    if (!loaderSub) return;
    loaderSub.style.opacity = '0';
    setTimeout(() => {
      loaderSub.textContent = subLines[idx];
      loaderSub.style.opacity = '1';
    }, 260);
  }

  function runLoader(){
    return new Promise(resolve => {
      const minDur = 2400;
      const start  = performance.now();
      let prev = -1;
      let subIdx = 0;
      function tick(now){
        const t = (now - start) / minDur;
        const eased = 1 - Math.pow(1 - Math.min(1, t), 2.4);
        const val = Math.floor(eased * 99);
        if (val !== prev){
          prev = val;
          if (loaderCount) loaderCount.innerHTML = `<em>${String(val).padStart(2, '0')}</em>`;
          if (loaderBar)   loaderBar.style.width = `${val}%`;
          if (val >= 25 && subIdx === 0){ subIdx = 1; setSub(1); }
          if (val >= 55 && subIdx === 1){ subIdx = 2; setSub(2); }
          if (val >= 85 && subIdx === 2){ subIdx = 3; setSub(3); }
        }
        if (val < 99) requestAnimationFrame(tick);
        else setTimeout(resolve, 480);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ────────────────────────────────────────────────────────────────
     CUSTOM CURSOR — dot + ring + lerping follow + dynamic label
     ──────────────────────────────────────────────────────────────── */
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;
  function moveCursor(e){ mx = e.clientX; my = e.clientY; }
  if (!touch) window.addEventListener('mousemove', moveCursor);

  function cursorLoop(){
    cx += (mx - cx) * 0.22;
    cy += (my - cy) * 0.22;
    if (cursor) cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(cursorLoop);
  }
  if (!touch && !reduced) requestAnimationFrame(cursorLoop);

  // hover wiring — any interactive element OR data-cursor
  function bindCursor(el){
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hover');
      const lbl = el.dataset.cursor;
      if (lbl){
        cursor.classList.add('has-label');
        cursorLab.textContent = lbl;
      }
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hover', 'has-label');
    });
  }
  document.querySelectorAll('a, button, [data-cursor]').forEach(bindCursor);

  /* ────────────────────────────────────────────────────────────────
     AUDIO — start on user gesture, loops, drives waveform + timer
     ──────────────────────────────────────────────────────────────── */
  let audioCtx, analyser, dataArr;
  const ctxC = wave?.getContext('2d', { alpha:true });
  let dpr = Math.min(2, window.devicePixelRatio || 1);

  function sizeCanvas(){
    if (!wave) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    wave.width  = wave.clientWidth  * dpr;
    wave.height = wave.clientHeight * dpr;
  }
  window.addEventListener('resize', sizeCanvas);

  function setupAudioGraph(){
    if (audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
      const src = audioCtx.createMediaElementSource(track);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      dataArr = new Uint8Array(analyser.fftSize);
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e){
      console.warn('AudioContext unavailable', e);
    }
  }

  function fmt(t){
    if (!isFinite(t)) t = 0;
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(Math.floor(t % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }

  function startListening(){
    if (body.classList.contains('is-listening')) return;
    setupAudioGraph();
    if (audioCtx?.state === 'suspended') audioCtx.resume();
    sizeCanvas();
    track.volume = 0;
    track.currentTime = 0;
    const targetVol = 1.0;
    const fadeStart = performance.now();
    function fade(now){
      const t = Math.min(1, (now - fadeStart) / 1600);
      track.volume = targetVol * t;
      if (t < 1) requestAnimationFrame(fade);
    }
    track.play().then(() => {
      requestAnimationFrame(fade);
      body.classList.add('is-listening');
    }).catch(err => {
      console.warn('audio play blocked', err);
    });
  }

  enterBtn?.addEventListener('click', () => {
    startListening();
    // smoothly scroll to prelude after a beat
    setTimeout(() => {
      document.getElementById('prelude')?.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 720);
  });

  // Spacebar from foyer plays
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !body.classList.contains('is-listening') && body.classList.contains('is-booted')){
      const inFoyer = (window.scrollY < window.innerHeight * 0.5);
      if (inFoyer){
        e.preventDefault();
        startListening();
      }
    }
  });

  /* ────────────────────────────────────────────────────────────────
     READING STATE — body.is-reading once user has scrolled past foyer
     ──────────────────────────────────────────────────────────────── */
  const setReading = () => {
    const passed = window.scrollY > window.innerHeight * 0.6;
    body.classList.toggle('is-reading', passed);
  };
  window.addEventListener('scroll', setReading, { passive:true });

  /* ────────────────────────────────────────────────────────────────
     RENDER LOOP — waveform + ring timer + REC pulse + time text
     ──────────────────────────────────────────────────────────────── */
  function drawWave(){
    if (!ctxC || !wave) return;
    const w = wave.width, h = wave.height;
    ctxC.clearRect(0, 0, w, h);
    if (!analyser || !dataArr) return;
    if (!body.classList.contains('is-listening')) return;

    analyser.getByteTimeDomainData(dataArr);

    ctxC.lineWidth = 1 * dpr;
    ctxC.strokeStyle = 'rgba(242, 235, 224, 0.78)';
    ctxC.shadowColor = 'rgba(242, 235, 224, 0.22)';
    ctxC.shadowBlur = 6 * dpr;
    ctxC.beginPath();

    const slice = w / dataArr.length;
    let x = 0;
    for (let i = 0; i < dataArr.length; i++){
      const v = dataArr[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctxC.moveTo(x, y);
      else         ctxC.lineTo(x, y);
      x += slice;
    }
    ctxC.stroke();
  }

  function rms(){
    if (!analyser || !dataArr) return 0;
    analyser.getByteTimeDomainData(dataArr);
    let sum = 0;
    for (let i = 0; i < dataArr.length; i++){
      const v = (dataArr[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / dataArr.length);
  }

  function frame(){
    drawWave();

    if (track && timeEl){
      const dur = isFinite(track.duration) ? track.duration : 207;
      timeEl.textContent = `${fmt(track.currentTime)} / ${fmt(dur)}`;

      if (ringProg){
        const pct = Math.min(100, (track.currentTime / dur) * 100);
        ringProg.setAttribute('stroke-dashoffset', String(100 - pct));
      }

      if (recDot && body.classList.contains('is-listening')){
        const amp = rms();
        // tie REC dot opacity gently to amplitude so it "breathes" with the music
        recDot.style.opacity = String(0.5 + Math.min(0.5, amp * 4));
      }
    }

    requestAnimationFrame(frame);
  }
  if (!reduced) requestAnimationFrame(frame);

  /* ────────────────────────────────────────────────────────────────
     SCROLL REVEAL — soft fade-in for editorial blocks
     ──────────────────────────────────────────────────────────────── */
  const revealSel = '.prelude__line, .prelude__lab, .movement__head, .movement__body p, .movement__aside, .today__lab, .today__title, .today__line, .works__head, .works__list li, .works__foot, .end__line, .end__mail, .end__marks, .end__imprint';
  const targets = document.querySelectorAll(revealSel);
  targets.forEach(el => el.classList.add('fade-in'));

  if (reduced){
    targets.forEach(el => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          if (e.target.matches('.movement__body p')){
            const i = [...e.target.parentNode.children].indexOf(e.target);
            e.target.style.transitionDelay = (i * 140) + 'ms';
          }
          if (e.target.matches('.works__list li')){
            const i = [...e.target.parentNode.children].indexOf(e.target);
            e.target.style.transitionDelay = (i * 70) + 'ms';
          }
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin:'0px 0px -8% 0px', threshold:0.08 });
    targets.forEach(el => io.observe(el));
  }

  /* ────────────────────────────────────────────────────────────────
     SKIP LINK — scrolls to prelude (does not autoplay)
     ──────────────────────────────────────────────────────────────── */
  skipLink?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('prelude')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  /* ────────────────────────────────────────────────────────────────
     FILM — keep playing silently always
     ──────────────────────────────────────────────────────────────── */
  film?.addEventListener('loadeddata', () => { film.play().catch(()=>{}); }, { once:true });

  /* ────────────────────────────────────────────────────────────────
     BOOT — run loader, then expose foyer
     ──────────────────────────────────────────────────────────────── */
  sizeCanvas();
  // wait for at least one frame so the page can paint, then run loader
  window.addEventListener('load', async () => {
    if (reduced){
      body.classList.add('is-booted');
      return;
    }
    await runLoader();
    body.classList.remove('state-loading');
    body.classList.add('is-booted');
  });

  // safety: even if 'load' is delayed, never stay on loader > 5s
  setTimeout(() => {
    if (!body.classList.contains('is-booted')){
      body.classList.remove('state-loading');
      body.classList.add('is-booted');
    }
  }, 5200);

  /* ────────────────────────────────────────────────────────────────
     CONSOLE MARK
     ──────────────────────────────────────────────────────────────── */
  console.info('%cGibran Alcocer %ca profile, in three movements — Mérida, MMXXVI',
    'font:600 13px Instrument Serif, serif;color:#0A0908;background:#F2EBE0;padding:4px 8px;letter-spacing:0.04em',
    'font:italic 11px Instrument Serif, serif;color:#F2EBE0;background:#0A0908;padding:4px 8px;letter-spacing:0.18em');
})();
